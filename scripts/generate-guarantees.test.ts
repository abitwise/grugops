// generate-guarantees.test.ts — the harness for D-17's generated guarantees render and its
// byte-equality freshness gate (AUTO-05, AUTO-02).
//
// THE ONE PROPERTY THIS FILE EXISTS TO BUY. `docs/GUARANTEES.md` is a PUBLIC document whose entire
// job is to state which safety claims still hold. Its failure mode is silent and asymmetric: a
// render that is SHORT — three of six safety rows — publishes a shorter list of dependencies than
// the registry declares, and the rows most likely to go missing are the ones a lowered floor
// touches. A render that is too long only costs a reader some reading. So every case below is
// written against under-inclusion: the empty-join refusal, the SHORT-join refusal against an
// independently counted denominator, and the byte-equality freshness guard that must red when a
// source moves or when a hand edits the committed document.
//
// THE PROJECT LESSON THIS FILE APPLIES, verbatim from the recorded round: "a vacuity floor catches
// an EMPTY denominator but never a SILENTLY SHORT one — derive the ELEMENT count independently of
// the loop that consumes it." `generate-safety-surface.ts` refuses only an empty union. This render
// refuses both, and the denominator comes from a raw line pass over the registry BYTES that shares
// no loop, no parser and no intermediate with the join.
//
// Fixture cases drive `renderGuarantees(root)` against a hermetic mirror under the OS temp dir.
// Freshness cases drive the COMMITTED scripts/guarantees-freshness.js as a child process against
// the REAL tree, planting and restoring under an afterEach guard — the shape
// scripts/catalog-freshness.test.ts set.
//
// NOT in the e2e lane. Run with:
//   npx vitest run --exclude '**/scripts/e2e/**' scripts/generate-guarantees.test.ts
// Vitest globals:false -> import explicitly.

import { describe, it, expect, afterAll, afterEach } from "vitest";
import { spawnSync } from "node:child_process";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  rmSync,
  existsSync,
  cpSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import {
  REGISTRY_PATH,
  RESIDUAL_PATH,
  RESIDUAL_ADDITIONS_HEADING,
  SAFETY_FLOORS,
  readResidualAdditions,
} from "./audit-model.js";
import {
  BANNER_ALL_DEFAULT,
  CHECKPOINT_DEFAULTS,
  CHECKPOINTS,
  floorEnvVarName,
  renderCheckpointBanner,
  type Checkpoint,
  type Disposition,
} from "./checkpoints.js";
import {
  OUT,
  REGEN_COMMAND,
  GUARANTEES_DATA_SOURCES,
  GUARANTEES_DATA_SOURCE_COUNT,
  GUARANTEES_ENTRY_JS,
  GUARANTEES_AUDIT_SOURCES,
  GUARANTEES_CONFIG_CANDIDATES,
  POINTER_DOCS,
  POINTER_ANCHOR,
  pointerLine,
  declaredSafetyRows,
  declaredDroppedRows,
  citedResidualPaths,
  disclosureFor,
  dropConsistencyRefusals,
  guaranteesJoin,
  renderGuarantees,
  declaredResidualRows,
} from "./generate-guarantees.js";

const ROOT = join(import.meta.dirname, "..");
const GENERATOR_TS = join(ROOT, "scripts", "generate-guarantees.ts");
const FRESHNESS_JS = join(ROOT, "scripts", "guarantees-freshness.js");
const COMMITTED = join(ROOT, OUT);

/**
 * The SOURCE TEXT OF ONE EXPORTED FUNCTION, bounded by its own closing brace.
 *
 * The two "these are two independent passes" cases below are assertions ABOUT SOURCE, and their
 * INPUT is the slice they are handed — which is exactly the axis this project has recorded losing
 * before. They used to slice "from this export to the NEXT one", so inserting any function between
 * them silently widened the region under assertion until an unrelated body's text satisfied (or
 * broke) the predicate. Plan 30-09 inserted three functions there and broke it, which is how the
 * fragility surfaced. Bounding each slice by its own function's closing brace removes the axis.
 */
function functionBody(src: string, name: string): string {
  const at = src.indexOf(`export function ${name}`);
  if (at === -1) throw new Error(`functionBody: no \`export function ${name}\` in the source`);
  const close = src.indexOf("\n}\n", at);
  if (close === -1) throw new Error(`functionBody: \`${name}\` has no column-zero closing brace`);
  return src.slice(at, close + 3);
}

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
  /** D-18. Omitted means `true`. */
  status?: string;
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
      `- status: ${c.status ?? "true"}`,
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

/**
 * A minimal residual register a mirror can render against.
 *
 * PARAMETERISED ON THE REASON, because the property Task 3 buys is that the reason cell DRIVES the
 * published page. A fixture with a fixed reason could not tell a render that quotes the register
 * from one that restates it in its own words.
 */
function residualRegister(reason: string, item = "a fixture residual"): string {
  return [
    "# Residual sizing",
    "",
    RESIDUAL_ADDITIONS_HEADING,
    "",
    "| # | Item | Disposition | Target phase | Reason / owner |",
    "|---|---|---|---|---|",
    `| 9 | ${item} | \`accepted\` | — | ${reason} |`,
    "",
  ].join("\n");
}

const FIXTURE_REASON = "The fixture reason, quoted verbatim by the render.";

/** A mirror root carrying only the registry. No config file → the roster defaults (AUTO-07). */
function mirrorWith(registry: string, config?: string, residual = residualRegister(FIXTURE_REASON)): string {
  const root = freshTmp("grugops-guarantees-");
  mkdirSync(join(root, "docs", "audit"), { recursive: true });
  writeFileSync(join(root, REGISTRY_PATH), registry, "utf8");
  writeFileSync(join(root, RESIDUAL_PATH), residual, "utf8");
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
    // Plan 30-09 (D-18): a lowered floor now OBLIGES every row resting on it to be `dropped`, in
    // both directions, so this fixture marks them rather than leaving the render to refuse. That
    // obligation IS the phase's payoff — the case is updated to satisfy it, never relaxed to skip it.
    const root = mirrorWith(
      renderRegistry(
        SIX_SAFETY.map((c) =>
          c.dependsOn.split(", ").includes("open_pr") ? { ...c, status: "dropped" } : c,
        ),
      ),
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
    // …and the claims that rest on it are marked, not merely listed. `DROPPED` is the D-18 mark a
    // row carries once the registry records the drop; a row left merely `LOWERED` would be the
    // inconsistency `dropConsistencyRefusals` refuses.
    expect(text).toMatch(/C-28-001.*\*\*DROPPED\*\*/);
  });
});

// ────────────────────────────────────────────────────────────────────────────────────────────────
describe("generate-guarantees — the dropped status and the generated disclosure (D-18)", () => {
  /** A mirror whose matrix lowers exactly the named checkpoints. */
  function loweredMirror(claims: readonly ClaimSpec[], lower: Record<string, string>): string {
    return mirrorWith(
      renderRegistry(claims),
      JSON.stringify({ checkpoints: { ...CHECKPOINT_DEFAULTS, ...lower } }),
    );
  }

  it("with NO floor lowered, no row is dropped and the render says so", () => {
    const root = loweredMirror(SIX_SAFETY, {});
    const rows = guaranteesJoin(root);
    expect(rows.filter((r) => r.status === "dropped")).toEqual([]);
    expect(declaredDroppedRows(root)).toEqual([]);
    expect(dropConsistencyRefusals(rows)).toEqual([]);
    const text = renderGuarantees(root);
    expect(text).toContain("all checkpoints at default");
    expect(text).not.toContain("DROPPED");
  });

  it("with ONE floor lowered, EXACTLY the rows resting on it are the ones that must drop", () => {
    // The set is computed here from the FIXTURE's own `depends_on` strings — never from the join —
    // so the assertion has a denominator that does not come out of the loop it is auditing.
    const expected = SIX_SAFETY.filter((c) => c.dependsOn.split(", ").includes("test_integrity"))
      .map((c) => c.id)
      .sort();
    expect(expected.length).toBeGreaterThan(0);

    const root = loweredMirror(SIX_SAFETY, { test_integrity: "notify" });
    const refusals = dropConsistencyRefusals(guaranteesJoin(root));
    // One refusal per row that rests on the lowered floor and is not yet `dropped`, and NOT ONE
    // MORE: a refusal naming a row that does not rest on it would be the mechanism over-reaching.
    expect(refusals.length).toBe(expected.length);
    for (const id of expected) expect(refusals.join("\n")).toContain(id);
    expect(() => renderGuarantees(root)).toThrow(/disagree in \d+ place/);
  });

  it("REFUSES direction 1 — a row `dropped` whose floors all sit at their default", () => {
    const root = loweredMirror(
      SIX_SAFETY.map((c) => (c.id === "C-28-018" ? { ...c, status: "dropped" } : c)),
      {},
    );
    const refusals = dropConsistencyRefusals(guaranteesJoin(root));
    expect(refusals.length).toBe(1);
    expect(refusals[0]).toContain("C-28-018");
    expect(refusals[0]).toContain("sits at its documented");
    expect(() => renderGuarantees(root)).toThrow(/C-28-018/);
  });

  it("REFUSES direction 2 — a lowered floor with a dependent row that is NOT dropped", () => {
    // The mirror image of the case above. One direction alone lets the registry and the matrix
    // drift apart silently, which is the state the whole mechanism exists to make impossible.
    const root = loweredMirror(SIX_SAFETY, { test_integrity: "notify" });
    const refusals = dropConsistencyRefusals(guaranteesJoin(root));
    expect(refusals.length).toBe(1);
    expect(refusals[0]).toContain("C-28-018");
    expect(refusals[0]).toContain("test_integrity");
    // The remedy names the EXACT bytes to write, so the fix is not a hand-written paraphrase.
    expect(refusals[0]).toContain("replace the text at its anchor with EXACTLY");
  });

  it("a CONSISTENT drop renders green, marks the row DROPPED and names the grant", () => {
    const root = loweredMirror(
      SIX_SAFETY.map((c) => (c.id === "C-28-018" ? { ...c, status: "dropped" } : c)),
      { test_integrity: "notify" },
    );
    expect(dropConsistencyRefusals(guaranteesJoin(root))).toEqual([]);
    expect(declaredDroppedRows(root)).toEqual(["C-28-018"]);
    const text = renderGuarantees(root);
    expect(text).toMatch(/C-28-018.*\*\*DROPPED\*\*/);
    expect(text).toContain(floorEnvVarName("test_integrity"));
  });

  it("`disclosureFor` is BYTE-DETERMINISTIC for fixed inputs", () => {
    const root = loweredMirror(
      SIX_SAFETY.map((c) => (c.id === "C-28-018" ? { ...c, status: "dropped" } : c)),
      { test_integrity: "notify" },
    );
    const row = guaranteesJoin(root).find((r) => r.claimId === "C-28-018");
    expect(row).toBeDefined();
    const once = disclosureFor(row!);
    const twice = disclosureFor(row!);
    expect(Buffer.from(once, "utf8").equals(Buffer.from(twice, "utf8"))).toBe(true);
    // It names the claim, the checkpoint, its held value and the authorizing name — the four facts
    // D-18 requires a replacement to carry, so a reader of the public document learns all of them
    // without opening the configuration.
    expect(once).toContain("C-28-018");
    expect(once).toContain("`test_integrity`");
    expect(once).toContain("`notify`");
    expect(once).toContain(floorEnvVarName("test_integrity"));
    // ONE LINE — the anchored extent is a line slice, and one line cannot disagree with itself.
    expect(once.split("\n").length).toBe(1);
  });

  it("`disclosureFor` REFUSES a row whose floors are all held — no retraction of a live claim", () => {
    const root = loweredMirror(SIX_SAFETY, {});
    const row = guaranteesJoin(root)[0];
    expect(() => disclosureFor(row)).toThrow(/none of the floors it rests on is lowered/);
  });

  it("the dropped set is asserted against an INDEPENDENTLY computed one, by MEMBERSHIP", () => {
    // The registry's bytes declare a dropped row inside a place the claim parser does not reach, so
    // the raw pass sees it and the parse does not. A cardinality floor would not have caught this
    // if a real row had simultaneously stopped being dropped; membership does.
    const root = mirrorWith(
      renderRegistry(
        SIX_SAFETY,
        ["## Notes", "", "```", "### C-28-099", "", "- status: dropped", "```", ""].join("\n"),
      ),
      JSON.stringify({ checkpoints: { ...CHECKPOINT_DEFAULTS } }),
    );
    expect(declaredDroppedRows(root)).toEqual(["C-28-099"]);
    expect(guaranteesJoin(root).filter((r) => r.status === "dropped")).toEqual([]);
    expect(() => renderGuarantees(root)).toThrow(/Declared but not joined: \[C-28-099\]/);
  });

  it("a `- status: dropped` line with NO claim heading above it is a NAMED disagreement", () => {
    const root = mirrorWith(
      renderRegistry(SIX_SAFETY).replace("# Registry", "# Registry\n\n- status: dropped\n"),
      JSON.stringify({ checkpoints: { ...CHECKPOINT_DEFAULTS } }),
    );
    // It becomes a sentinel that cannot coincide with any claim id, so it cannot vanish into a
    // count that then agrees by accident.
    expect(declaredDroppedRows(root)).toEqual([
      "(a `- status: dropped` line with no claim heading above it)",
    ]);
    expect(() => renderGuarantees(root)).toThrow(/no claim heading above it/);
  });

  it("the dropped byte pass shares NO parser with the join", () => {
    const src = readFileSync(GENERATOR_TS, "utf8");
    const fn = functionBody(src, "declaredDroppedRows");
    expect(fn.length).toBeGreaterThan(0);
    expect(fn).not.toContain("readRegistry");
    expect(fn).not.toContain("guaranteesJoin");
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

  it("the entry guard delegates to the ONE entrypoint authority (round 4, RA6-1)", () => {
    // This asserted the pathToFileURL spelling until round 4. That spelling is FALSE under a
    // symlinked invocation path — `import.meta.url` is realpath-resolved and `argv[1]` is not — so a
    // generator invoked that way writes nothing and exits 0, the fabricated success this case was
    // written to prevent, through the very idiom it required. Reviewer 6 measured this file as one of
    // three still carrying it after round 3 fixed a fourth. The predicate now lives once.
    const src = readFileSync(GENERATOR_TS, "utf8");
    expect(src).toContain("isEntrypoint(import.meta.url)");
    expect(src).not.toContain("`file://${");
    expect(src).not.toMatch(/import\.meta\.url\s*===/);
  });

  it("the join length assertion does not share a loop with the join", () => {
    // The denominator is produced by a pass that reads the registry's BYTES and never calls the
    // registry parser. Asserted on the source, because the property is "these are two passes",
    // which no single run can report.
    const src = readFileSync(GENERATOR_TS, "utf8");
    const fn = functionBody(src, "declaredSafetyRows");
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
// ────────────────────────────────────────────────────────────────────────────────────────────────
describe("generate-guarantees — the residual register drives the render (AUTO-05)", () => {
  it("a PLANTED change in the register row CHANGES the render — it is quoted, not restated", () => {
    // THE ONE PROPERTY THIS CASE BUYS. A render that happened to contain the same words would pass
    // a "contains the reason" assertion while being a second, independently maintained copy. Two
    // renders differing by exactly the planted bytes can only come from a render that READS the row.
    const registry = renderRegistry(SIX_SAFETY);
    const before = renderGuarantees(mirrorWith(registry, undefined, residualRegister(FIXTURE_REASON)));
    const planted = "A DIFFERENT reason, planted by this case and expected to reach the page.";
    const after = renderGuarantees(mirrorWith(registry, undefined, residualRegister(planted)));

    expect(before).toContain(FIXTURE_REASON);
    expect(before).not.toContain(planted);
    expect(after).toContain(planted);
    expect(after).not.toContain(FIXTURE_REASON);
    expect(after).not.toBe(before);
  });

  it("the ITEM and the DISPOSITION reach the page too, not only the reason", () => {
    const text = renderGuarantees(
      mirrorWith(renderRegistry(SIX_SAFETY), undefined, residualRegister(FIXTURE_REASON, "a planted item name")),
    );
    expect(text).toContain("a planted item name");
    expect(text).toContain("`accepted`");
  });

  it("REFUSES to render when the register carries no additions table", () => {
    // FAIL CLOSED. A page whose job is to name what it does not close must never publish silence
    // where a residual belongs, so an unreadable register is a refusal and not an empty section.
    const root = mirrorWith(renderRegistry(SIX_SAFETY), undefined, "# Residual sizing\n\nnothing here\n");
    expect(() => renderGuarantees(root)).toThrow(/carries no `## Phase 30 additions/);
  });

  it("REFUSES a decorated disposition cell rather than best-effort unwrapping it", () => {
    const decorated = residualRegister(FIXTURE_REASON).replace("| `accepted` |", "| **`accepted`** *(by 30-09)* |");
    const root = mirrorWith(renderRegistry(SIX_SAFETY), undefined, decorated);
    expect(() => renderGuarantees(root)).toThrow(/outside the canonical cell form/);
  });

  it("REFUSES a blank `Reason / owner` — a named gap with nothing said about it", () => {
    const root = mirrorWith(renderRegistry(SIX_SAFETY), undefined, residualRegister("—"));
    expect(() => renderGuarantees(root)).toThrow(/carries no `Reason \/ owner`/);
  });

  it("the LIVE register's rows are all published, and the count is the register's own", () => {
    const rows = readResidualAdditions(ROOT);
    expect(rows.length).toBeGreaterThan(0);
    const text = renderGuarantees(ROOT);
    for (const r of rows) {
      expect(text).toContain(r.item);
      expect(text).toContain(r.reason);
    }
    // DERIVED DENOMINATOR: the number of rendered residual headings comes from the register, never
    // from a literal in this file. A row silently dropped from the render is short against it.
    const rendered = text.split("\n").filter((l) => /^### \d+\. /.test(l));
    expect(rendered.length).toBe(rows.length);
  });

  it("the live register records the settings-file grant vector in the ACCEPTED vocabulary", () => {
    const rows = readResidualAdditions(ROOT);
    const grant = rows.find((r) => r.item.includes("settings-file"));
    expect(grant, "no settings-file grant row in the residual register").toBeDefined();
    // The SAME disposition vocabulary as the pre-existing same-class row 4 of the historical table.
    expect(grant!.disposition).toBe("accepted");
    expect(grant!.reason).toContain("Irreducible");
    expect(grant!.reason).toContain(".claude/settings.json");
    expect(grant!.reason).toContain("permissions.deny");
  });

  it("the WATCH ITEM is recorded with its source tier stated honestly", () => {
    // THE TIER MOVED, AND THAT IS WHY THIS CASE CHANGED (plan 30-11 round 2, `RA2-5`). It used to
    // require the words `ASSUMED` and "not from primary vendor documentation", which were correct
    // while the entry rested on a GitHub issue title. Round 2 read the installed binary directly, so
    // the entry now rests on an observation and asserting the old tier would pin a stale one. What
    // this case asserts is unchanged in kind: the tier is STATED, and the specific claim the
    // observation did not confirm is marked as not confirmed rather than quietly carried.
    const watch = readResidualAdditions(ROOT).find((r) => r.item.includes("scrubbing"));
    expect(watch, "no environment-scrubbing watch item in the residual register").toBeDefined();
    expect(watch!.reason).toContain("CLAUDE_CODE_SUBPROCESS_ENV_SCRUB");
    expect(watch!.reason).toContain("DIRECT OBSERVATION");
    expect(watch!.reason).toContain("NOT confirmed");
    // The withdrawn clause must be gone: it sat inside a sentence beginning "Measured" and nothing
    // measured it.
    expect(watch!.reason).not.toContain("and the existing grants work on this host.");
  });
});

// ────────────────────────────────────────────────────────────────────────────────────────────────
describe("generate-guarantees — the anchored pointer lines (D-17)", () => {
  it("EXACTLY one pointer line per public entry document, counted from the DOCUMENT LIST", () => {
    // The denominator is POINTER_DOCS.length, never the literal 3. A fourth entry document added to
    // the list without its pointer line is short against this number; a document carrying two
    // copies is long against it. Neither is visible to a hand-written count.
    expect(POINTER_DOCS.length).toBeGreaterThan(0);
    let found = 0;
    for (const doc of POINTER_DOCS) {
      const text = readFileSync(join(ROOT, doc), "utf8");
      const want = `${POINTER_ANCHOR}\n${pointerLine(doc)}`;
      const occurrences = text.split(want).length - 1;
      expect(occurrences, `${doc} carries ${occurrences} generated pointer block(s), expected 1`).toBe(1);
      // …and no SECOND anchor without the generated line beneath it.
      expect(text.split(POINTER_ANCHOR).length - 1, `${doc} carries a stray pointer anchor`).toBe(1);
      found += occurrences;
    }
    expect(found).toBe(POINTER_DOCS.length);
  });

  it("each pointer line's LINK TARGET resolves to the committed render", () => {
    for (const doc of POINTER_DOCS) {
      const m = /\]\(([^)]+)\)/.exec(pointerLine(doc));
      expect(m, `no link in the pointer line for ${doc}`).not.toBeNull();
      const resolved = join(ROOT, join(doc, "..", m![1]));
      expect(existsSync(resolved), `${doc}'s pointer target ${m![1]} does not resolve`).toBe(true);
    }
  });

  it("the SUBSTRATE document's addition is ONE line", () => {
    // AGENTS.md is deliberately short and high-signal: a long machine-written context file
    // measurably lowers agent success, and Codex caps it at 32 KiB. One line is what it can afford.
    expect(pointerLine("AGENTS.md").split("\n").length).toBe(1);
    expect(POINTER_DOCS).toContain("AGENTS.md");
  });

  it("the pointer TARGET is computed from the document's own directory, never typed per document", () => {
    expect(pointerLine("README.md")).toContain(`(${OUT})`);
    expect(pointerLine("agent-factory/README.md")).toContain(`(../${OUT})`);
  });
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

// ────────────────────────────────────────────────────────────────────────────────────────────────
describe("guarantees-freshness.js — the byte-equality drift gate", () => {
  let planted: string | null = null;
  let original: Buffer | null = null;
  afterEach(() => {
    if (planted !== null && original !== null) {
      writeFileSync(planted, original);
      planted = null;
      original = null;
    }
  });

  function runFreshness(env: NodeJS.ProcessEnv = {}) {
    const r = spawnSync("node", [FRESHNESS_JS], {
      cwd: ROOT,
      encoding: "utf8",
      env: { ...process.env, ...env },
    });
    return { status: r.status ?? -1, stdout: (r.stdout ?? "") + (r.stderr ?? "") };
  }

  it("exits 0 and reports fresh when the committed document matches a regeneration", () => {
    const r = runFreshness();
    expect(r.status).toBe(0);
    expect(r.stdout.toLowerCase()).toContain("fresh");
  });

  it("exits non-zero on ONE character of planted drift, and names the regeneration command", () => {
    planted = COMMITTED;
    original = readFileSync(COMMITTED);
    writeFileSync(COMMITTED, Buffer.concat([original, Buffer.from("x")]));

    // ── THE HARNESS'S OWN PREMISE, ASSERTED RATHER THAN ASSUMED ────────────────────────────────
    // This project has recorded six instances across four rounds of a verification harness
    // producing a false result because nobody asked whether its premise held. The premise here is
    // "the committed bytes now differ from a fresh regeneration". Prove it in-process, from the
    // same generator the gate mirror-spawns, BEFORE reading the gate's verdict — otherwise a gate
    // that reds for an unrelated reason reads as a passing case.
    expect(readFileSync(COMMITTED, "utf8")).not.toBe(renderGuarantees(ROOT));

    const r = runFreshness();
    expect(r.status).not.toBe(0);
    expect(r.stdout).toContain("STALE:");
    expect(r.stdout).toContain(OUT);
    expect(r.stdout).toContain(REGEN_COMMAND);
  });

  it("FAIL-CLOSED: a generator that cannot run cleanly NEVER reports fresh", () => {
    // Break the generator's own input rather than the generator: a registry with a stray safety-row
    // declaration makes the mirrored regeneration refuse by name, which is the condition the gate
    // must never mistake for an up-to-date document.
    planted = join(ROOT, REGISTRY_PATH);
    original = readFileSync(planted);
    writeFileSync(planted, Buffer.concat([original, Buffer.from("\n- kind: safety\n")]));

    const r = runFreshness();
    expect(r.status).not.toBe(0);
    expect(r.stdout.toLowerCase()).not.toContain("matches a fresh regeneration");
  });

  it("FAIL-CLOSED: an unwritable mirror directory NEVER reports fresh", () => {
    const r = runFreshness({ TMPDIR: join(ROOT, "no-such-tmp-dir-for-guarantees") });
    expect(r.status).not.toBe(0);
    expect(r.stdout.toLowerCase()).not.toContain("matches a fresh regeneration");
    expect(r.stdout).toContain("mirror");
  });

  it("the mirror's COPY SET is derived, not hand-listed, and its data half is count-asserted", () => {
    const src = readFileSync(join(ROOT, "scripts", "guarantees-freshness.ts"), "utf8");
    // The .js half: derived by the ONE import-closure authority, never a cpSync list.
    expect(src).toContain("jsImportClosure");
    // The DATA half: a declared list with a pinned length, so the mirror cannot silently lose an
    // input and then compare against a regeneration that never had the same sources.
    expect(GUARANTEES_DATA_SOURCES.length).toBe(GUARANTEES_DATA_SOURCE_COUNT);
    expect(GUARANTEES_DATA_SOURCES).toContain(REGISTRY_PATH);
    expect(src).toContain("GUARANTEES_DATA_SOURCE_COUNT");
    // And the entry the gate spawns is the generator's own declaration, not a second path literal.
    expect(existsSync(join(ROOT, GUARANTEES_ENTRY_JS))).toBe(true);
    expect(src).toContain("GUARANTEES_ENTRY_JS");
  });

  it("the config-candidate list IS the reader's, and no copy of it survives in this module", () => {
    // WHAT THIS CASE USED TO ASSERT, AND WHY IT WAS REPLACED (plan 30-10, finding B-5). It held a
    // hand-written copy of the two candidate paths against `context-io.ts`'s SOURCE TEXT and called
    // that two-sided. It was one-sided: every path the copy named had to appear in the reader, and
    // nothing asserted the converse — so a candidate ADDED to the reader left the copy a strict
    // subset, and the freshness mirror would copy fewer inputs than the real render reads. A byte
    // comparison between two documents rendered from different sources is a comparison between two
    // different questions.
    //
    // There is no copy left to hold. The reader publishes the list, this module imports it, and the
    // assertion is IDENTITY rather than textual presence — which is the only form a "no second
    // grammar" claim can take.
    expect(GUARANTEES_CONFIG_CANDIDATES.length).toBeGreaterThan(0);
    // …and the union is EXACTLY the two arms, so a third provenance cannot enter unlabelled.
    expect([...GUARANTEES_DATA_SOURCES].sort()).toEqual(
      [...GUARANTEES_AUDIT_SOURCES, ...GUARANTEES_CONFIG_CANDIDATES].sort(),
    );
    // No candidate path is spelled a second time in this module's own source.
    const src = readFileSync(GENERATOR_TS, "utf8");
    const code = src
      .split("\n")
      .filter((l) => !/^\s*(\/\/|\*|\/\*)/.test(l))
      .join("\n");
    for (const c of GUARANTEES_CONFIG_CANDIDATES) {
      expect(code.includes(`"${c}"`), `${c} is spelled as a literal in the generator`).toBe(false);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────────────────────
// PLAN 30-10 (RED-TEAM SURFACE B, ROUND 1) — the render's data-source authority and the bound on
// its count assertion.
// ─────────────────────────────────────────────────────────────────────────────────────────────

const cioMod: typeof import("./context-io.js") = await import(
  pathToFileURL(join(ROOT, "scripts", "context-io.js")).href
);
const auditRegister: typeof import("./check-audit-register.js") = await import(
  pathToFileURL(join(ROOT, "scripts", "check-audit-register.js")).href
);

describe("30-10 B-5 — the config arm is the reader's own list, not a restatement of it", () => {
  it("GUARANTEES_CONFIG_CANDIDATES IS the reader's published relative-path list", () => {
    // Identity, not similarity. The previous shape was a hand-written copy held against the reader's
    // SOURCE TEXT in one direction only — every path the copy named had to appear there, and nothing
    // asserted the converse — so a candidate ADDED to the reader left this list a strict subset and
    // the freshness mirror copying fewer inputs than the real render reads.
    expect(GUARANTEES_CONFIG_CANDIDATES).toBe(cioMod.GOVERNANCE_CONFIG_RELPATHS);
  });

  it("the reader's two views agree: the relative list is the absolute list under an empty base", () => {
    // Non-vacuity plus coherence. Both views come from one array of segments in one function, and
    // this is the assertion that says so rather than trusting the comment that claims it.
    const abs = cioMod.governanceConfigCandidates("");
    expect(abs.length).toBeGreaterThan(1);
    expect(cioMod.GOVERNANCE_CONFIG_RELPATHS.length).toBe(abs.length);
    for (const rel of cioMod.GOVERNANCE_CONFIG_RELPATHS) {
      expect(rel.endsWith("factory.config.json"), `${rel} is not a config candidate`).toBe(true);
    }
    expect(cioMod.GOVERNANCE_CONFIG_RELPATHS[0]).toContain(".grugops");
  });

  it("a candidate added to the READER reaches the mirror's declared inputs, and moves the pin", () => {
    // The direction the deleted restatement was blind to, driven as a fact about the live values:
    // the data-source union IS the audit arm plus the reader's list, so a third candidate lands in
    // GUARANTEES_DATA_SOURCES automatically — and then trips GUARANTEES_DATA_SOURCE_COUNT, which is
    // the freshness gate's own named refusal rather than a silent short mirror.
    expect([...GUARANTEES_DATA_SOURCES].sort()).toEqual(
      [...GUARANTEES_AUDIT_SOURCES, ...cioMod.GOVERNANCE_CONFIG_RELPATHS].sort(),
    );
    const hypothetical = [...GUARANTEES_AUDIT_SOURCES, ...cioMod.GOVERNANCE_CONFIG_RELPATHS, "x/factory.config.json"];
    expect(hypothetical.length).not.toBe(GUARANTEES_DATA_SOURCE_COUNT);
  });
});

describe("30-10 B-6 — the count assertion's BOUND is asserted, not assumed", () => {
  it("both sides of the equality read the SAME registry, so a lost row moves both together", () => {
    // The measurement this case records, run on a hermetic copy before it was written: flipping one
    // `- kind: safety` to `- kind: architecture` took declaredSafetyRows 6 -> 5 AND the join 6 -> 5,
    // the equality held, and renderGuarantees published five of six safety claims. The equality
    // catches a PARSE that drops a row; it cannot catch a REGISTRY that loses one.
    const root = freshTmp("guar-b6-");
    cpSync(join(ROOT, "docs"), join(root, "docs"), { recursive: true });
    cpSync(join(ROOT, "agent-factory"), join(root, "agent-factory"), { recursive: true });
    const reg = join(root, REGISTRY_PATH);
    const text = readFileSync(reg, "utf8");
    const head = text.indexOf("### C-28-038");
    const kindAt = text.indexOf("- kind: safety", head);
    expect(head, "the fixture premise: the registry carries C-28-038").toBeGreaterThan(-1);
    expect(kindAt, "the fixture premise: it is a safety row").toBeGreaterThan(head);
    writeFileSync(
      reg,
      text.slice(0, kindAt) + "- kind: architecture" + text.slice(kindAt + "- kind: safety".length),
    );

    const declared = declaredSafetyRows(root);
    const join6 = guaranteesJoin(root);
    expect(declared).toBe(join6.length); // the equality is SATISFIED …
    expect(declared).toBe(declaredSafetyRows(ROOT) - 1); // … while a row was lost
    expect(() => renderGuarantees(root)).not.toThrow(); // … and the render publishes the short set
  });

  it("the OTHER direction has a named owner, and it agrees with this render on the live tree", () => {
    // CLAIM_KIND_CARDINALITY is the hand-declared per-kind measurement baseline in
    // check-audit-register.ts — legitimate exactly because nothing derives WHICH claims are safety
    // claims. It is the authority that reds on the mutation above. Asserting the agreement here
    // makes the dependency a checked fact rather than a belief about another gate: if that baseline
    // and this render's byte pass ever disagree, one of them is measuring a registry the other is not.
    const safety = auditRegister.CLAIM_KIND_CARDINALITY.find((c) => c.kind === "safety");
    expect(safety, "check-audit-register declares no `safety` cardinality").toBeDefined();
    expect(safety?.count).toBe(declaredSafetyRows(ROOT));
    expect(declaredSafetyRows(ROOT)).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────────────────────
// PLAN 30-10 ROUND 3 — R4-1 (reviewer 4, MEDIUM): the residual section had no denominator.
//
// The render carries TWO independent denominators — `declaredSafetyRows` for the safety join and
// `declaredDroppedRows` for the dropped set, each a raw byte pass sharing no parser with the join.
// The residual section had NEITHER. Its only floor is `body.length === 0` in `readResidualAdditions`
// — a vacuity floor over an EMPTY denominator, which never sees a SILENTLY SHORT one — and the
// harness case that looks like the guard takes its denominator from the same parse that came out
// short, so both sides move together. That is B-6's shape at a site B-6 did not reach.
//
// `readResidualAdditions` locates the additions table with `tableUnder` → `unfencedHeadingIndex`,
// which answers about the FIRST unfenced exact occurrence. A row written under a repeated heading, a
// renderer-identical near-miss, or a `…, continued` heading is silently unpublished from
// `docs/GUARANTEES.md` with the generator exiting 0, freshness reporting fresh and every gate green.
// ─────────────────────────────────────────────────────────────────────────────────────────────

describe("30-10 R4-1 — the residual section has an INDEPENDENT denominator, compared by membership", () => {
  /** A mirror of the audit sources with the residual register mutated. */
  function registerMirror(mutate: (text: string) => string): string {
    const root = freshTmp("r41-");
    cpSync(join(ROOT, "docs"), join(root, "docs"), { recursive: true });
    cpSync(join(ROOT, "agent-factory"), join(root, "agent-factory"), { recursive: true });
    const p = join(root, RESIDUAL_PATH);
    writeFileSync(p, mutate(readFileSync(p, "utf8")));
    return root;
  }

  it("a row under a REPEATED additions heading is refused, not silently unpublished", () => {
    const root = registerMirror(
      (t) =>
        `${t}\n## Phase 30 additions to this register (AUTO-05)\n\n` +
        "| # | Item | Disposition | Target phase | Reason / owner |\n" +
        "|---|---|---|---|---|\n" +
        "| 11 | A residual nobody publishes | `accepted` | — | never shown on the public page. |\n",
    );
    expect(() => renderGuarantees(root)).toThrow(/11|repeated|render/i);
  });

  it("a row under a NEAR-MISS additions heading is refused too", () => {
    const root = registerMirror(
      (t) =>
        `${t}\n##  Phase 30 additions to this register (AUTO-05)\n\n` +
        "| # | Item | Disposition | Target phase | Reason / owner |\n" +
        "|---|---|---|---|---|\n" +
        "| 12 | A residual nobody publishes | `accepted` | — | never shown on the public page. |\n",
    );
    expect(() => renderGuarantees(root)).toThrow(/12|render/i);
  });

  it("a row under a `, continued` heading is refused — the byte pass sees it, the parse does not", () => {
    const root = registerMirror(
      (t) =>
        `${t}\n## Phase 30 additions to this register (AUTO-05), continued\n\n` +
        "| # | Item | Disposition | Target phase | Reason / owner |\n" +
        "|---|---|---|---|---|\n" +
        "| 13 | A residual nobody publishes | `accepted` | — | never shown on the public page. |\n",
    );
    expect(() => renderGuarantees(root)).toThrow(/13/);
  });

  it("R6-5 — a row WITHOUT outer pipes is seen by the byte pass and refused, not dropped by both", () => {
    // R4-1 called `declaredResidualRows` an INDEPENDENT witness: "shares no parser, no loop and no
    // intermediate". True of the heading grammar, false of the ROW grammar — both passes skipped a
    // line unless it `startsWith("|")`. GFM makes the outer pipes OPTIONAL, so a row written without
    // them is a table row to a reader and to GitHub and was invisible to both passes at once. A
    // membership comparison can only fire on an axis the two passes disagree about; on this axis
    // they agreed by being equally blind, and the page published a register short by that row while
    // both denominators said it was complete.
    const root = registerMirror((t) =>
      t.replace(
        "\n\n**Completeness:** 2 rows,",
        "\n11 | a residual nobody publishes | `deferred` | Phase 31 | renders as a table row on " +
          "GitHub and was invisible to both passes.\n\n**Completeness:** 2 rows,",
      ),
    );
    // The BYTE PASS sees it — that is what makes it a witness rather than a second opinion.
    expect(declaredResidualRows(root)).toContain("11");
    // …and the render is REFUSED rather than published short. The canonical row form keeps its outer
    // pipes (D-64's posture: name the canonical spelling and refuse the near-miss); the author is
    // told, instead of the row silently vanishing.
    expect(() => renderGuarantees(root)).toThrow(/11/);
  });

  it("the LIVE register agrees — the byte pass and the parse name the same rows", () => {
    const parsed = readResidualAdditions(ROOT).map((r) => r.num);
    const declared = declaredResidualRows(ROOT);
    expect(parsed.length).toBeGreaterThan(0);
    expect([...declared].sort()).toEqual([...parsed].sort());
  });

  it("the two passes share no parser — the byte pass is a raw line read", () => {
    // The property that makes the equality evidence rather than a tautology, asserted on the source
    // and bounded to the function's own body.
    const src = readFileSync(join(ROOT, "scripts", "generate-guarantees.ts"), "utf8");
    const from = src.indexOf("export function declaredResidualRows(");
    expect(from).toBeGreaterThan(-1);
    const body = src.slice(from, src.indexOf("\n}\n", from));
    expect(body).toContain("readFileSync");
    expect(body).not.toContain("readResidualAdditions");
    expect(body).not.toContain("tableUnder");
  });
});

describe("30-10 R4 observation 1 — a TIGHTENED checkpoint is not a lowered one", () => {
  it("`commit_to_branch: block` is stricter than its default and is NOT published as lowered", () => {
    // `loweredCheckpoints` and `guaranteesJoin` both tested `value !== fallback`, not "strictly more
    // permissive". `commit_to_branch` is the only roster member whose default is not `block`, so
    // TIGHTENING it to `block` published `LOWERED: 1 checkpoint(s) sit below their documented
    // default` and named a grant variable as authorizing it — a false sentence in the one document
    // whose subject is which sentences stopped being true. Over-statement, not permission, and
    // reachable by a legitimate tightening.
    const root = freshTmp("r4o1-");
    cpSync(join(ROOT, "docs"), join(root, "docs"), { recursive: true });
    cpSync(join(ROOT, "agent-factory"), join(root, "agent-factory"), { recursive: true });
    mkdirSync(join(root, ".grugops"), { recursive: true });
    writeFileSync(
      join(root, ".grugops", "factory.config.json"),
      JSON.stringify({ checkpoints: { commit_to_branch: "block" } }),
    );
    const text = renderGuarantees(root);
    expect(text).not.toMatch(/LOWERED/);
    expect(text).not.toContain("GRUGOPS_FLOOR_COMMIT_TO_BRANCH");
    // …and the CONTROL: a genuine lowering still publishes as lowered.
    writeFileSync(
      join(root, ".grugops", "factory.config.json"),
      JSON.stringify({ checkpoints: { protected_branch_merge: "off" } }),
    );
    expect(() => renderGuarantees(root)).toThrow(/dropped|lowered/i);
  });
});

describe("30-10 R6-3 — \"nothing is lowered\" is not \"everything is at its default\"", () => {
  /** A mirror whose only departure from the real tree is the governance config it declares. */
  function configuredMirror(checkpoints: Record<string, string>): string {
    const root = freshTmp("r63-");
    cpSync(join(ROOT, "docs"), join(root, "docs"), { recursive: true });
    cpSync(join(ROOT, "agent-factory"), join(root, "agent-factory"), { recursive: true });
    mkdirSync(join(root, ".grugops"), { recursive: true });
    writeFileSync(
      join(root, ".grugops", "factory.config.json"),
      JSON.stringify({ checkpoints }),
    );
    return root;
  }

  it("a TIGHTENED checkpoint does not publish `all checkpoints at default`", () => {
    // Round 4 observation 1 replaced the render's `!==` with the ordered `isLowered` and did not
    // move the sentence written for the OLD predicate. `commit_to_branch` is the one roster member
    // whose default is not `block`, so declaring it `block` — STRICTER, and a posture a cautious
    // repository would actually adopt — empties `lowered` and lands on the all-default branch. The
    // page then states that every checkpoint sits at its documented default over a tree where one
    // provably does not. Round 3 traded a visible false sentence for an invisible one.
    const text = renderGuarantees(configuredMirror({ commit_to_branch: "block" }));
    expect(text).not.toContain(BANNER_ALL_DEFAULT);
    // …and it is NAMED, not merely omitted — the arm publishes the checkpoint, the value it is held
    // at and the default it sits above.
    expect(text).toContain("commit_to_branch");
    expect(text).toMatch(/sits ABOVE the documented/);
    // …and a tightening is still not a lowering: no LOWERED line, no grant variable named as
    // authorizing something that needs no authorization.
    expect(text).not.toMatch(/LOWERED/);
    expect(text).not.toContain("GRUGOPS_FLOOR_COMMIT_TO_BRANCH");
    // THE DEFAULT ARM, for contrast: the same render with nothing configured DOES publish it.
    expect(renderGuarantees(configuredMirror({}))).toContain(BANNER_ALL_DEFAULT);
  });

  it("the page's at-default claim and `composeBanner` agree on ONE matrix", () => {
    // The property, not a spot check: for any matrix, the page carries the all-default sentence if
    // and only if the guard's banner is the fixed all-default literal. Two documents describing one
    // config cannot be allowed to describe it differently — that disagreement IS the AP-1 shape the
    // banner's own comment says it exists to remove.
    const matrices: Record<string, Disposition>[] = [
      {},
      { commit_to_branch: "block" },
      { commit_to_branch: "notify" },
      { plan_approval: "block" },
    ];
    for (const m of matrices) {
      const full = Object.fromEntries(
        CHECKPOINTS.map((id) => [id, m[id] ?? CHECKPOINT_DEFAULTS[id]]),
      ) as Record<Checkpoint, Disposition>;
      const banner = renderCheckpointBanner(full, {});
      const page = renderGuarantees(configuredMirror(m));
      expect(
        page.includes(BANNER_ALL_DEFAULT),
        `matrix ${JSON.stringify(m)}: page says all-default=${page.includes(
          BANNER_ALL_DEFAULT,
        )}, banner says "${banner}"`,
      ).toBe(banner === BANNER_ALL_DEFAULT);
    }
  });
});

describe("30-11 RA2-4 — a published residual may not name a mechanism that is not in the tree", () => {
  it("the scanner finds PATH-SHAPED spans and ignores prose (round 3, RA4-3 inverted it)", () => {
    // Round 2 accepted a span only under six blessed directory prefixes, so `not/a/path` was ignored
    // for the wrong reason — it is path-SHAPED and must be a claim, then refused for not being
    // tracked. That prefix list is what let `.claude/settings-nonexistent.json` publish.
    const row = "| 9 | x | `accepted` | — | see `hooks/hooks.json`, `install/README.md`, `not/a/path`, `off` |";
    expect(citedResidualPaths(row)).toEqual([
      "hooks/hooks.json",
      "install/README.md",
      "not/a/path",
    ]);
  });

  it("the real register cites paths, and the scan is not vacuous", () => {
    // The MEMBERSHIP decision moved to scripts/check-audit-register.ts in round 3 (`RA4-3`/`RA4-6`):
    // "is this a tracked file" is a question about the repository, and putting it in the render forced
    // the freshness mirror to copy a third of the repo. What stays here is the scan itself.
    const text = readFileSync(join(ROOT, "docs/audit/28-residual-sizing.md"), "utf8");
    const all = text.split("\n").flatMap((l) => citedResidualPaths(l));
    expect(all.length).toBeGreaterThan(0);
  });

  it("a path-shaped span is a claim regardless of its directory; EXTERNAL: opts out", () => {
    // Round 2 gated the scan on six directory names, so `.claude/` — the directory row 9 is ABOUT —
    // was invisible to it. The test is inverted with the code.
    expect(citedResidualPaths("| 9 | x | see `.claude/settings-nonexistent.json` |")).toEqual([
      ".claude/settings-nonexistent.json",
    ]);
    expect(citedResidualPaths("| 9 | x | see `.github/workflows/nope.yml` |")).toEqual([
      ".github/workflows/nope.yml",
    ]);
    expect(citedResidualPaths("| 9 | x | see `package-nope.json` |")).toEqual(["package-nope.json"]);
    expect(citedResidualPaths("| 9 | x | see `EXTERNAL:.claude/settings.json` |")).toEqual([]);
    expect(citedResidualPaths("| 9 | x | prose like `all checkpoints at default` |")).toEqual([]);
  });

  it("the published row no longer states a narrowing measure in the present indicative", () => {
    const page = readFileSync(join(ROOT, "docs/GUARANTEES.md"), "utf8");
    expect(page).not.toContain("The narrowing measure is a `permissions.deny` recommendation");
    expect(page).toContain("neither is in the tree at HEAD");
  });
});

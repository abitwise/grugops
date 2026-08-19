// generate-role-adapters.test.ts — SPAWN-01 oracle for the Claude Code sub-agent adapter generator
// (Vitest harness for scripts/generate-role-adapters.js).
//
// Drives the COMMITTED compiled artifact (never the .ts), because the committed .js is what hosts,
// CI and the adapters freshness gate actually run.
//
// The generator's ROLES_DIR and OUT_DIR are FIXED literals joined to its own repo root (a
// path-traversal mitigation — never argv/env/content-derived), so every case that needs a different
// world MIRROR-SPAWNS: lay out <tmp>/scripts/{generate-role-adapters,kit-model}.js plus
// <tmp>/agent-factory/roles plus <tmp>/.claude/agents, then run the mirrored .js there. The live
// agent-factory/roles and .claude/agents directories are therefore NEVER mutated by this file — the
// live tree is read-only in the shape cases and untouched in the refusal cases.
//
// What is pinned here:
//   (1) DETERMINISM — two runs over one scratch tree are byte-identical, exactly one trailing
//       newline per file, and shuffling the directory read order changes nothing;
//   (2) THIN POINTER — every body names exactly one role file and carries none of that role's
//       section headings (a partial copy is invisible to a byte ceiling alone);
//   (3) RESOLVER (D-06) — the invariant marker, the self-heal variable and the installer's
//       materialization slot are present in all 17;
//   (4) GRANT ARITHMETIC (D-09/D-10) — one coordinator, a 16-name sorted grant, grant ∪ {coordinator}
//       == the generated set, both tiers present, and no other adapter carrying a spawn token;
//   (5) DESCRIPTION DERIVATION (D-12) — editing a role's `## One job` moves the adapter's
//       description, proving derivation rather than a stored string;
//   (6) BUILD-TIME REFUSAL (T-27-29/T-27-32) — six structural misses, each exiting non-zero, naming
//       the offending role file, and leaving the output directory byte-for-byte unchanged.

import { describe, it, expect, afterAll } from "vitest";
import { spawnSync, type SpawnSyncReturns } from "node:child_process";
import {
  mkdtempSync,
  mkdirSync,
  cpSync,
  rmSync,
  readdirSync,
  readFileSync,
  writeFileSync,
  existsSync,
  statSync,
} from "node:fs";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";
// The resolved-preset LINE grammar, imported rather than restated. This file asserts that the
// generator announces its resolution; spelling the marker here would make the assertion a second
// copy of the thing under test, and the copy would go on passing after the generator's own moved.
import { RESOLVED_PRESET_PREFIX, resolvedPresetsIn } from "./model-tiers.js";

const ROOT = join(import.meta.dirname, "..");
const GEN_JS = join(ROOT, "scripts", "generate-role-adapters.js");
const LIVE_ROLES = join(ROOT, "agent-factory", "roles");
const LIVE_AGENTS = join(ROOT, ".claude", "agents");

const tmpDirs: string[] = [];
afterAll(() => {
  for (const d of tmpDirs) rmSync(d, { recursive: true, force: true });
});

function out(r: SpawnSyncReturns<string>): string {
  return `${r.stdout ?? ""}${r.stderr ?? ""}`;
}

// ── The generator's in-repo import closure, DERIVED rather than hand-listed ─────────────────────
// The mirror must carry every `./x.js` the committed generator imports, transitively. That set was
// two hand-written cpSync calls until plan 27-23 moved the frontmatter read onto the shared authority
// (WR-03) and made it three — i.e. it was a set literal in a mirror, of exactly the kind this
// milestone deletes. It is now read out of the committed sources, so a fourth import needs no edit
// here. The walk throws on an unresolvable module and on a zero-length result, so it can never
// silently mirror nothing.
function importClosure(entry: string, seen = new Set<string>()): Set<string> {
  const src = readFileSync(join(ROOT, "scripts", entry), "utf8");
  for (const m of src.matchAll(/from\s+"\.\/([A-Za-z0-9._-]+\.js)"/g)) {
    if (seen.has(m[1])) continue;
    seen.add(m[1]);
    importClosure(m[1], seen);
  }
  return seen;
}
const GEN_MODULES = [...importClosure("generate-role-adapters.js")].sort();

// ── Scratch world ──────────────────────────────────────────────────────────────────────────────
// A mirror carrying the generator, every in-repo module it imports, a roles directory and an empty
// output directory. `roles` selects which live role files to copy; the coordinator role must always
// be among them or the generator refuses (correctly) on coordinator cardinality.
function scratch(roles: string[]): string {
  const m = mkdtempSync(join(tmpdir(), "grugops-adapters-"));
  tmpDirs.push(m);
  mkdirSync(join(m, "scripts"), { recursive: true });
  mkdirSync(join(m, "agent-factory", "roles"), { recursive: true });
  mkdirSync(join(m, ".claude", "agents"), { recursive: true });
  cpSync(GEN_JS, join(m, "scripts", "generate-role-adapters.js"));
  // Not vacuous: the generator imports at least kit-model and frontmatter, so an empty closure means
  // the derivation read the wrong file and every case below would be running a generator that cannot
  // start. Assert it here rather than letting seventeen cases fail with a module-resolution error.
  if (GEN_MODULES.length < 2) {
    throw new Error(
      `the generator's import closure came back as [${GEN_MODULES.join(", ")}] — the derivation is reading the wrong file`,
    );
  }
  for (const mod of GEN_MODULES) {
    cpSync(join(ROOT, "scripts", mod), join(m, "scripts", mod));
  }
  for (const r of roles) {
    cpSync(join(LIVE_ROLES, r), join(m, "agent-factory", "roles", r));
  }
  return m;
}

// A representative scratch corpus: the coordinator, both tiers, and the two roles carrying the
// awkward derived prose (a colon-space inside the description, and a `web` capability token).
const SAMPLE_ROLES = [
  "orchestrator.md",
  "software-engineer.md",
  "qe-e2e.md",
  "agents-md-scribe.md", // description carries `routing matrix: "Need AGENTS.md"`
  "security-nfr.md", // `capabilities: read edit shell web`
  "release-manager.md", // enterprise tier
];

function runIn(m: string): SpawnSyncReturns<string> {
  return spawnSync("node", [join(m, "scripts", "generate-role-adapters.js")], {
    encoding: "utf8",
  });
}

const agentsDir = (m: string): string => join(m, ".claude", "agents");

// A stable fingerprint of an output directory: every filename mapped to its exact bytes.
function snapshot(dir: string): Record<string, string> {
  const snap: Record<string, string> = {};
  for (const f of readdirSync(dir).sort()) {
    snap[f] = readFileSync(join(dir, f), "utf8");
  }
  return snap;
}

// Frontmatter of a generated adapter: the lines between the two `---` fences.
function frontmatter(text: string): string {
  const m = text.match(/^---\n([\s\S]*?)\n---\n/);
  if (!m) throw new Error("generated adapter has no frontmatter fence at byte 0");
  return m[1];
}

function fmValue(text: string, key: string): string | undefined {
  for (const line of frontmatter(text).split("\n")) {
    const kv = line.match(/^([A-Za-z_-]+):\s*(.*)$/);
    if (kv && kv[1] === key) return kv[2];
  }
  return undefined;
}

// The enumerated names inside a `tools: Agent(...)` grant, in the order they appear.
function grantNames(text: string): string[] {
  const tools = fmValue(text, "tools") ?? "";
  const m = tools.match(/\bAgent\(([^)]*)\)/);
  if (!m) return [];
  return m[1].split(",").map((s) => s.trim()).filter((s) => s !== "");
}

// Is the filesystem backing tmpdir() case-sensitive? macOS APFS and Windows NTFS are not, so the
// case-collision fixture cannot even be BUILT there — the two role files collapse into one.
function tmpIsCaseSensitive(): boolean {
  const probe = mkdtempSync(join(tmpdir(), "grugops-case-"));
  tmpDirs.push(probe);
  writeFileSync(join(probe, "a.md"), "x");
  return !existsSync(join(probe, "A.md"));
}
const CASE_SENSITIVE = tmpIsCaseSensitive();

// ── (27-50, IN-04 / D-56 item 8) THE FENCE-STRIPPING FIXTURE, AND ITS PREMISE IS CHECKED ───────
//
// WHAT WAS WRONG. The unterminated-region case built its fixture with
// `lines.filter((l) => !l.startsWith("```"))` — it removed the fence DELIMITER lines and left
// everything that was INSIDE the fences live in a role file whose frontmatter region now runs to
// EOF. The only guard was `expect(noFences.length).toBeLessThan(lines.length)`: "at least one line
// was removed". That is a guard on the fixture having DONE something, never on it having done the
// RIGHT thing. The day a fenced example inside a SAMPLE_ROLES file gains a column-0 `---` or a
// column-0 key line, the case silently begins pinning a DIFFERENT refusal — or a successful parse —
// while staying green, and the sibling case below, which depends on the same fixture in the exactly
// OPPOSITE direction, drifts apart from it without either failing.
//
// THE RULE THIS APPLIES IS THE MODULE'S OWN. `stripFencedBlocks` in scripts/frontmatter.ts toggles
// on `/^```/`, never emits the delimiter line, and drops every line while the toggle is set. This
// helper states the same rule in the fixture's own terms. It is deliberately NOT an import of the
// module under test's neighbour: a fixture built by calling the production stripper would make the
// case's input a function of the code the suite is about, which is the circularity axis this
// repository has already found twice.
//
// THE COUNTS ARE DERIVED AND RETURNED AS DATA, never asserted as remembered literals — the caller
// asserts the properties it needs from them.
interface FenceStrip {
  readonly kept: string[];
  readonly linesRemoved: number;
  readonly blocksRemoved: number;
  /** True when a fence was opened and never closed — the toggle swallowed the tail. */
  readonly unterminatedFence: boolean;
}

function stripFencedBlockLines(lines: readonly string[]): FenceStrip {
  const kept: string[] = [];
  let inside = false;
  let blocksRemoved = 0;
  // (27-53, WR-03) COUNTED AS THE LINES ARE DROPPED, NEVER DERIVED FROM `kept.length`. Deriving it
  // makes `kept.length + linesRemoved === lines.length` an IDENTITY that holds for every
  // implementation, correct or broken — a second assertion that cannot fail, standing beside the
  // one this plan deleted. The counting is what gives the partition assertion something to see, and
  // the proof case measures the difference on a strip that drops an uncounted line.
  let linesRemoved = 0;
  for (const line of lines) {
    if (line.startsWith("```")) {
      if (!inside) blocksRemoved += 1;
      inside = !inside;
      linesRemoved += 1;
      continue; // the delimiter line is never kept
    }
    if (inside) {
      linesRemoved += 1;
      continue; // …and neither is anything between two delimiters
    }
    kept.push(line);
  }
  return {
    kept,
    linesRemoved,
    blocksRemoved,
    unterminatedFence: inside,
  };
}
// ── end stripFencedBlockLines ──────────────────────────────────────────────────────────────────
// (27-60, IN-03) A SECTION RULE IN THIS FILE'S OWN IDIOM THAT IS ALSO A SLICE BOUND. The WR-03
// source pin below reads this function's TEXT — a correct implementation is behaviourally identical
// whether it COUNTS removals or DERIVES them, so only the source tells the two apart. That pin used
// to bound its slice with `indexOf("\n}")`, which assumes no line in the body begins at column 0
// with a closing brace: true today, silently truncating tomorrow, and a truncated body makes the
// pin's POSITIVE assertion fail confusingly rather than informatively.
//
// The nearest pre-existing `// ──` rule sits 76 lines further down and would have swallowed two
// other helpers — including a comment that quotes the forbidden shape verbatim. So this rule is
// ADDED here rather than an existing one repurposed, and the pin ASSERTS it is present before it
// slices, with a message naming it. Moving or deleting this line reds that assertion by name; it is
// not decoration.

// The fixture's PREMISE, stated once and consulted twice — by the case that writes the file, and by
// the case that proves the premise can fire. A premise restated at its proof site proves something
// about the copy.
//
// WHAT IT ASSERTS AND WHY EACH HALF IS LOAD-BEARING:
//   • a fenced block really was removed        — the fixture is not a no-op on a role file that lost
//                                                its fences upstream;
//   • the fences were BALANCED                 — an unterminated fence means the toggle swallowed the
//                                                tail, so the file the case writes is not the file it
//                                                thinks it wrote;
//   • NO delimiter line survives after line 0  — this is the whole point. The case exists to make the
//                                                region genuinely run to EOF with nothing in it the
//                                                module cannot read. A surviving column-0 `---` or
//                                                `...` would close the region or land the case in a
//                                                different refusal.
function assertFenceStripPremise(strip: FenceStrip, where: string): void {
  expect(
    strip.blocksRemoved,
    `${where}: PREMISE — the fixture must really have carried a fenced block`,
  ).toBeGreaterThan(0);
  expect(
    strip.unterminatedFence,
    `${where}: PREMISE — the fences must be balanced, or the strip swallowed the file's tail`,
  ).toBe(false);
  const survivors = strip.kept
    .map((l, i) => [l, i] as const)
    .filter(([l, i]) => i > 0 && (l === "---" || l === "..."));
  expect(
    survivors,
    `${where}: PREMISE — no delimiter line may survive after line 0, or the region does not run to EOF and this case is pinning a different refusal`,
  ).toEqual([]);
}

// (27-53, WR-03 — round 9's own code review) THE STRIP'S OWN PROPERTIES, STATED ONCE AND PROVEN
// ABLE TO FAIL. What stood here before was, in the unterminated-region case:
//
//     expect(stripFencedBlockLines(lines).kept.join("\n")).toBe(strip.kept.join("\n"));
//
// two calls of a PURE function on the same unmutated `readonly string[]`, compared to each other.
// That is `f(x) === f(x)`: it is green for every implementation, correct or catastrophic, and it
// carries no information at all into CI while reading exactly like a check that does. Its stated
// purpose — keeping the two sibling fixtures from drifting apart — was not met either, because the
// sibling case never calls this function. Decoration that reads like a floor is worse than no floor
// (D-56 item 3), so it is deleted and these three properties take its place. Each is proven capable
// of failing against a deliberately broken variant, in the case named for it below.
//
//   • something really was removed  — a fixture the strip no-ops on pins nothing;
//   • kept + removed == input       — the strip PARTITIONS its input: no line lost, none duplicated;
//   • no delimiter line survives    — the operation the whole fixture depends on actually happened.
//
// THE SECOND ONE IS ONLY A REAL ASSERTION BECAUSE `linesRemoved` IS COUNTED AS THE LINES ARE
// DROPPED. Deriving it as `lines.length - kept.length` — the shape this helper shipped with — makes
// the equality an IDENTITY that no implementation can violate, i.e. a second `f(x) === f(x)` in the
// same breath as the first. The counting is pinned on the source in the proof case below, because a
// CORRECT implementation is behaviourally identical either way and only the source tells them apart.
function assertStripPartitionsInput(
  strip: FenceStrip,
  input: readonly string[],
  where: string,
): void {
  expect(
    strip.linesRemoved,
    `${where}: the strip must really have removed lines — a fixture the strip no-ops on pins nothing`,
  ).toBeGreaterThan(0);
  expect(
    strip.kept.length + strip.linesRemoved,
    `${where}: the strip must PARTITION its input — kept plus removed is the input length, so no line is lost and none is duplicated`,
  ).toBe(input.length);
  expect(
    strip.kept.filter((l) => l.startsWith("```")),
    `${where}: no fence delimiter line may survive the strip`,
  ).toEqual([]);
}

// ── Refusal helper: assert non-zero exit, the named role file, and an UNCHANGED output dir ─────
function expectRefusal(m: string, needle: string): void {
  const before = snapshot(agentsDir(m));
  const r = runIn(m);
  expect(r.status).not.toBe(0);
  expect(out(r)).toContain(needle);
  // T-27-32: build everything, then write. A structural miss must leave NOTHING behind.
  expect(snapshot(agentsDir(m))).toEqual(before);
}

// ── (27-53, WR-03) THE SHARED SPLICE THE TWO SIBLING FIXTURES ARE BUILT FROM ───────────────────
// Two cases below — the unterminated-region one and the code-fence-in-region one — depend on the
// SAME operation on the SAME generated file: delete the closing `---` at index 4 of qe-e2e.md, so
// the frontmatter region runs on into the body. One writes the result STRIPPED of its fenced
// blocks; the other writes it RAW. They were joined by a comment saying they were siblings, and by
// a `f(x) === f(x)` comparison that could not check anything, while each rebuilt the splice for
// itself with its own hard-coded index. A pair pinned by prose is not a pair: the day the generator
// emits one more frontmatter line, one case's `lines[4]` assertion fires and the other's fixture
// silently becomes a different document.
//
// So the splice lives here, once, and both cases call it. The index assertion travels with it, so
// there is exactly one place that believes anything about where the closing delimiter is.
function spliceClosingDelimiter(m: string): {
  readonly path: string;
  readonly lines: string[];
} {
  const path = join(m, "agent-factory", "roles", "qe-e2e.md");
  const lines = readFileSync(path, "utf8").split("\n");
  expect(
    lines[4],
    "the closing delimiter must be where BOTH sibling fixtures believe it is",
  ).toBe("---");
  lines.splice(4, 1);
  return { path, lines };
}

describe("generate-role-adapters.js (SPAWN-01 adapter generator)", () => {
  // ── (1) Determinism — the property the freshness gate depends on, asserted directly ──────────
  it("two runs over the same scratch tree are byte-identical", () => {
    const m = scratch(SAMPLE_ROLES);
    expect(runIn(m).status).toBe(0);
    const first = snapshot(agentsDir(m));
    expect(runIn(m).status).toBe(0);
    const second = snapshot(agentsDir(m));
    expect(second).toEqual(first);
    expect(Object.keys(first)).toHaveLength(SAMPLE_ROLES.length);
  });

  it("every generated file ends in exactly one trailing newline", () => {
    const m = scratch(SAMPLE_ROLES);
    expect(runIn(m).status).toBe(0);
    for (const [name, body] of Object.entries(snapshot(agentsDir(m)))) {
      expect(body.endsWith("\n"), `${name} must end with a newline`).toBe(true);
      expect(body.endsWith("\n\n"), `${name} must not end with a blank line`).toBe(false);
    }
  });

  it("directory read order does not change a single output byte (roles are sorted before emit)", () => {
    // Two scratch trees whose role files are CREATED in opposite orders. On the filesystems that
    // return readdir entries in creation order this is the only way to catch a missing sort.
    const forward = scratch([]);
    const reverse = scratch([]);
    for (const r of SAMPLE_ROLES) {
      cpSync(join(LIVE_ROLES, r), join(forward, "agent-factory", "roles", r));
    }
    for (const r of [...SAMPLE_ROLES].reverse()) {
      cpSync(join(LIVE_ROLES, r), join(reverse, "agent-factory", "roles", r));
    }
    expect(runIn(forward).status).toBe(0);
    expect(runIn(reverse).status).toBe(0);
    expect(snapshot(agentsDir(reverse))).toEqual(snapshot(agentsDir(forward)));
  });

  it("the scratch coordinator's grant is emitted in sorted order, whatever order the roles arrive in", () => {
    // The ONLY order-sensitive bytes the generator produces are the coordinator's enumerated grant
    // (every other adapter's content is independent of how many siblings there are and in what
    // order they were read). This case therefore targets the grant sort directly rather than
    // inferring it from whole-directory equality, which would still pass if the grant were emitted
    // in whatever order the role corpus happened to arrive.
    const m = scratch(SAMPLE_ROLES);
    expect(runIn(m).status).toBe(0);
    const granted = grantNames(
      readFileSync(join(agentsDir(m), "grugops-orchestrator.md"), "utf8"),
    );
    expect(granted).toHaveLength(SAMPLE_ROLES.length - 1);
    expect(granted).toEqual([...granted].sort());
    // Not vacuous: the sample corpus is deliberately NOT in sorted order, so an unsorted emission
    // would produce a different sequence.
    expect(SAMPLE_ROLES).not.toEqual([...SAMPLE_ROLES].sort());
  });

  // ── (2) Thin pointer — a copied role body is the failure this contract exists to prevent ────
  it("every adapter names exactly one role file and tells the agent to act as that role", () => {
    const m = scratch(SAMPLE_ROLES);
    expect(runIn(m).status).toBe(0);
    for (const role of SAMPLE_ROLES) {
      const name = `grugops-${role.replace(/\.md$/, "")}`;
      const body = readFileSync(join(agentsDir(m), `${name}.md`), "utf8");
      const refs = body.match(/agent-factory\/roles\/[a-z0-9._-]+\.md/g) ?? [];
      // The coordinator also cites _role-switch-protocol.md in its degraded-tier bullet; the role
      // it is told to BECOME must still be exactly one, and it must be its own.
      expect(refs).toContain(`agent-factory/roles/${role}`);
      expect(new Set(refs.filter((x) => !x.includes("_role-switch-protocol"))).size).toBe(1);
      expect(body).toContain("act as that role");
    }
  });

  it("no adapter carries a section heading copied from its source role", () => {
    const m = scratch(SAMPLE_ROLES);
    expect(runIn(m).status).toBe(0);
    for (const role of SAMPLE_ROLES) {
      const roleText = readFileSync(join(LIVE_ROLES, role), "utf8");
      const headings = (roleText.match(/^## .+$/gm) ?? []).map((h) => h.trim());
      expect(headings.length).toBeGreaterThan(3); // the fixture must actually have headings to miss
      const name = `grugops-${role.replace(/\.md$/, "")}`;
      const body = readFileSync(join(agentsDir(m), `${name}.md`), "utf8");
      for (const h of headings) {
        expect(body, `${name} must not copy "${h}" from ${role}`).not.toContain(h);
      }
    }
  });

  // ── (3) Resolver contract (D-06) — a spawned session holds only its own body ─────────────────
  it("every adapter carries the invariant marker, the self-heal variable and the installer slot", () => {
    const m = scratch(SAMPLE_ROLES);
    expect(runIn(m).status).toBe(0);
    for (const [name, body] of Object.entries(snapshot(agentsDir(m)))) {
      expect(body, `${name} marker`).toContain("If the kit dir is absent, STOP — do not hunt.");
      expect(body, `${name} self-heal`).toContain(
        'KIT="${GRUGOPS_HOME:-$HOME/.grugops}/agent-factory"',
      );
      // install/install.ts MAT_SLOT — the line the installer writes the absolute kit path above.
      expect(body, `${name} materialization slot`).toContain(
        "# 1. (installed) the absolute kit path the installer wrote above this line.",
      );
    }
  });

  // ── (4) Grant arithmetic (D-09/D-10) — asserted against the LIVE committed adapters ──────────
  it("exactly one live adapter carries the coordinator marker and its grant closes over the set", () => {
    const files = readdirSync(LIVE_AGENTS).filter((f) => f.endsWith(".md")).sort();
    const names = files.map((f) => f.replace(/\.md$/, "")).sort();
    const coordinators = files.filter((f) =>
      /^coordinator:\s*true\b/m.test(frontmatter(readFileSync(join(LIVE_AGENTS, f), "utf8"))),
    );
    expect(coordinators).toEqual(["grugops-orchestrator.md"]);

    const coordText = readFileSync(join(LIVE_AGENTS, coordinators[0]), "utf8");
    const granted = grantNames(coordText);
    expect(granted).toHaveLength(names.length - 1);
    expect(granted).toHaveLength(16);
    // grant ∪ {coordinator} == the generated adapter set, with no exception list.
    expect([...granted, "grugops-orchestrator"].sort()).toEqual(names);
    // Sorted emission (the byte-determinism the freshness gate depends on).
    expect(granted).toEqual([...granted].sort());
  });

  it("the grant carries both tiers — capability is not filtered by policy (D-10)", () => {
    const coordText = readFileSync(join(LIVE_AGENTS, "grugops-orchestrator.md"), "utf8");
    const granted = grantNames(coordText);
    // The five enterprise-tier roles, read from the kit rather than hand-listed here.
    const enterprise = readdirSync(LIVE_ROLES)
      .filter((f) => f.endsWith(".md") && !f.startsWith("_"))
      .filter((f) => /^tier:\s*enterprise\b/m.test(readFileSync(join(LIVE_ROLES, f), "utf8")))
      .map((f) => `grugops-${f.replace(/\.md$/, "")}`)
      .sort();
    expect(enterprise).toHaveLength(5);
    for (const e of enterprise) expect(granted).toContain(e);
  });

  it("no non-coordinator adapter carries a spawn token on its tools line (SPAWN-04)", () => {
    for (const f of readdirSync(LIVE_AGENTS).filter((x) => x.endsWith(".md"))) {
      const text = readFileSync(join(LIVE_AGENTS, f), "utf8");
      if (/^coordinator:\s*true\b/m.test(frontmatter(text))) continue;
      const tools = fmValue(text, "tools") ?? "";
      expect(tools, `${f} tools line`).not.toMatch(/\b(Agent|Task)\b/);
      expect(tools.length).toBeGreaterThan(0);
    }
  });

  // ── (5) Description derivation (D-12) — not a stored string ──────────────────────────────────
  it("editing a role's `## One job` first sentence moves the adapter's description", () => {
    const m = scratch(SAMPLE_ROLES);
    expect(runIn(m).status).toBe(0);
    const before = fmValue(
      readFileSync(join(agentsDir(m), "grugops-qe-e2e.md"), "utf8"),
      "description",
    );
    expect(before).toContain("Break the feature");

    const rolePath = join(m, "agent-factory", "roles", "qe-e2e.md");
    const edited = readFileSync(rolePath, "utf8").replace(
      /^## One job\n.*$/m,
      "## One job\nSentinel derivation probe for the adapter description. Second sentence stays out.",
    );
    writeFileSync(rolePath, edited);
    expect(runIn(m).status).toBe(0);
    const after = fmValue(
      readFileSync(join(agentsDir(m), "grugops-qe-e2e.md"), "utf8"),
      "description",
    );
    expect(after).toContain("Sentinel derivation probe for the adapter description.");
    expect(after).not.toContain("Second sentence stays out");
    expect(after).not.toContain("Break the feature");
    // The use-when clause still derives from the untouched `## Activates when` section.
    expect(after).toContain("Use when: Need tests.");
    expect(after).not.toBe(before);
  });

  it("the description is emitted as a double-quoted YAML scalar (the derived prose carries `: `)", () => {
    const text = readFileSync(join(LIVE_AGENTS, "grugops-agents-md-scribe.md"), "utf8");
    const raw = fmValue(text, "description") ?? "";
    // A plain scalar containing a colon-space does not parse; the value must be quoted and its
    // inner quotes escaped.
    expect(raw.startsWith('"')).toBe(true);
    expect(raw.endsWith('"')).toBe(true);
    expect(raw).toContain("Use when: ");
    expect(raw).toContain('\\"Need AGENTS.md\\"');
  });

  // ── (6) Build-time refusal — six structural misses, each fail-closed and naming the role ─────
  it("refuses an empty `capabilities:` value, naming the role file", () => {
    const m = scratch(SAMPLE_ROLES);
    expect(runIn(m).status).toBe(0); // establish a populated output dir first
    const p = join(m, "agent-factory", "roles", "qe-e2e.md");
    writeFileSync(p, readFileSync(p, "utf8").replace(/^capabilities:.*$/m, "capabilities:"));
    expectRefusal(m, "qe-e2e.md: `capabilities:` is absent or empty");
  });

  it("refuses a capability token outside the closed vocabulary, naming the role file", () => {
    const m = scratch(SAMPLE_ROLES);
    expect(runIn(m).status).toBe(0);
    const p = join(m, "agent-factory", "roles", "qe-e2e.md");
    writeFileSync(
      p,
      readFileSync(p, "utf8").replace(/^capabilities:.*$/m, "capabilities: read edit deploy"),
    );
    expectRefusal(m, 'qe-e2e.md: capability token "deploy" is outside the closed vocabulary');
  });

  it("refuses a missing `## One job` section, naming the role file", () => {
    const m = scratch(SAMPLE_ROLES);
    expect(runIn(m).status).toBe(0);
    const p = join(m, "agent-factory", "roles", "qe-e2e.md");
    writeFileSync(p, readFileSync(p, "utf8").replace(/^## One job$/m, "## Purpose"));
    expectRefusal(m, "qe-e2e.md: no `## One job` section");
  });

  it("refuses a missing `## Activates when` section, naming the role file", () => {
    const m = scratch(SAMPLE_ROLES);
    expect(runIn(m).status).toBe(0);
    const p = join(m, "agent-factory", "roles", "qe-e2e.md");
    writeFileSync(p, readFileSync(p, "utf8").replace(/^## Activates when$/m, "## Triggers"));
    expectRefusal(m, "qe-e2e.md: no `## Activates when` section");
  });

  it("refuses a non-ASCII role filename — adapter names are byte-compared", () => {
    const m = scratch(SAMPLE_ROLES);
    expect(runIn(m).status).toBe(0);
    cpSync(
      join(LIVE_ROLES, "qe-e2e.md"),
      join(m, "agent-factory", "roles", "qé-probe.md"),
    );
    expectRefusal(m, "non-ASCII byte in a role filename");
  });

  // The collision fixture requires two role files whose names differ only by case. On a
  // case-insensitive filesystem (macOS APFS, Windows NTFS) the two files collapse into one and the
  // fixture cannot be built at all — which is precisely the platform the guard protects. Skipped
  // rather than faked; it runs for real on case-sensitive CI.
  it.skipIf(!CASE_SENSITIVE)(
    "refuses two roles whose adapter names differ only by case, naming both",
    () => {
      const m = scratch(SAMPLE_ROLES);
      expect(runIn(m).status).toBe(0);
      cpSync(
        join(LIVE_ROLES, "qe-e2e.md"),
        join(m, "agent-factory", "roles", "QE-E2E.md"),
      );
      expectRefusal(m, "collides with the one produced by");
    },
  );

  // ── WR-03 — the three shapes the DELETED local frontmatter grammar got wrong ──────────────────
  // These are RED cases for the deleted duplicate, not restatements of the authority's own oracle:
  // each was measured against the pre-change committed .js on a scratch mirror, and the recorded
  // pre-change behaviour is in the case comment. The first two EMITTED an adapter and exited 0 —
  // the finding expected every divergence to land in a fail-closed branch, and two did not.
  it("refuses `capabilities:` written with NO space after the colon, naming the role file", () => {
    // PRE-CHANGE: the local grammar's `\s*` matched zero whitespace, so `capabilities:read edit shell`
    // read as a mapping entry and the generator emitted `tools: Read, Grep, Glob, Edit, Write, Bash`
    // and exited 0 — a shipped spawn-posture line built from a key the platform does not see. YAML
    // calls a colon with no following space a plain scalar, so `scripts/frontmatter.ts` refuses the
    // line, and the two shapes are now adjacent inputs with opposite verdicts (SPAWN-01 adjacency).
    const m = scratch(SAMPLE_ROLES);
    expect(runIn(m).status).toBe(0);
    const p = join(m, "agent-factory", "roles", "qe-e2e.md");
    const before = readFileSync(p, "utf8");
    // The whitespace-bearing twin must be there to remove, or the plant is a silent no-op.
    expect(before).toContain("capabilities: read edit shell");
    writeFileSync(p, before.replace(/^capabilities: .*$/m, "capabilities:read edit shell"));
    expectRefusal(m, "qe-e2e.md: frontmatter is unreadable");
    expectRefusal(m, "capabilities:read edit shell");
  });

  it("refuses two `capabilities:` keys, naming the count rather than keeping the last", () => {
    // PRE-CHANGE: the local grammar wrote each key into a plain object, so the SECOND occurrence
    // silently overwrote the first — `capabilities: read` followed by `capabilities: shell` shipped
    // `tools: Bash` and exited 0, with the first declaration discarded and nothing said about it.
    // The authority retains every occurrence in document order precisely because discarding one is a
    // bypass, so a count other than exactly one is a refusal here and the count is in the message.
    const m = scratch(SAMPLE_ROLES);
    expect(runIn(m).status).toBe(0);
    const p = join(m, "agent-factory", "roles", "qe-e2e.md");
    writeFileSync(
      p,
      readFileSync(p, "utf8").replace(
        /^capabilities: .*$/m,
        "capabilities: read\ncapabilities: shell",
      ),
    );
    expectRefusal(m, "qe-e2e.md: 2 `capabilities:` keys in one role frontmatter, expected exactly 1");
    // The refusal must NOT be the empty-value finding: last-wins would have produced a perfectly
    // usable single value, so a message about an empty key would mean the duplicate went unnoticed.
    const r = runIn(m);
    expect(out(r)).not.toContain("is absent or empty");
  });

  it("refuses an unterminated frontmatter block as UNREADABLE, not as empty capabilities", () => {
    // PRE-CHANGE: the local grammar's `/^---\n([\s\S]*?)\n---\n/` simply failed to match and it
    // returned an EMPTY map, so the generator reported "`capabilities:` is absent or empty" about a
    // file whose frontmatter could not be read at all. "I cannot read this" and "this declares no
    // capabilities" are different facts and only one of them tells the author what to fix; the
    // authority's `ok: false` arm is branched on explicitly so they stay distinct.
    //
    // (Plan 27-45, D-53 — WR-02) THE FIXTURE NOW REMOVES THE BODY'S CODE FENCES TOO, AND THAT IS A
    // REAL CHANGE IN THE MODULE RATHER THAN A TEST BEING MADE TO PASS. `parseFrontmatter` used to
    // fence-strip the whole document BEFORE locating the region, so this role file's fenced body
    // vanished and the region ran to EOF unterminated. It now locates the region first and REFUSES a
    // code-fence delimiter line found inside it — so leaving the fences in place would exercise the
    // FENCE refusal, not the unterminated one. Both are the failure arm; they are different findings
    // and each gets its own case. This one keeps pinning the UNTERMINATED diagnosis, byte-for-byte as
    // before, by making the region genuinely run to EOF with nothing else in it the module cannot
    // read. The sibling case below pins the fence refusal.
    // (27-50, IN-04 — 27-REVIEW-GAPS-8 § IN-04, round 9 — D-56 item 8) THE FIXTURE NOW REMOVES
    // FENCED BLOCKS WITH THEIR CONTENTS, AND ITS PREMISE IS ASSERTED BEFORE THE FILE IS WRITTEN.
    // The delimiter-only filter left every fenced line live in the region, guarded by nothing more
    // than "at least one line was removed" — see the helper above for the full statement of what
    // that could not see.
    // (27-53, WR-03) THE FIXTURE IS BUILT BY THE SHARED SPLICE, AND THE SIBLING RELATIONSHIP IS
    // ASSERTED RATHER THAN CLAIMED. What used to stand where the two assertions below stand was a
    // comparison of two calls of a pure function on one unmutated array — see the helper's header
    // for why that could not fail and why it did not guard the pair it named.
    const m = scratch(SAMPLE_ROLES);
    expect(runIn(m).status).toBe(0);
    const { path: p, lines } = spliceClosingDelimiter(m);
    const strip = stripFencedBlockLines(lines);
    assertFenceStripPremise(strip, "the unterminated-region fixture");
    assertStripPartitionsInput(strip, lines, "the unterminated-region fixture");
    // THE PAIR, JOINED BY A CONSTRUCTION. The sibling case below writes THIS array raw; asserting
    // that an independently built mirror yields byte-identical splice output is what makes "the
    // same splice of the same source file" a measured property instead of a sentence.
    const siblingMirror = scratch(SAMPLE_ROLES);
    expect(runIn(siblingMirror).status).toBe(0);
    expect(
      spliceClosingDelimiter(siblingMirror).lines,
      "the two sibling fixtures must be the SAME splice of the SAME source file",
    ).toEqual(lines);
    writeFileSync(p, strip.kept.join("\n"));
    expectRefusal(m, "qe-e2e.md: frontmatter is unreadable");
    expectRefusal(m, "is never closed by a `---` delimiter");
    // This case pins the UNTERMINATED diagnosis and NOT the fence one — asserted on the text, so a
    // fixture that silently began exercising the sibling's refusal fails here rather than passing on
    // the shared "is unreadable" prefix.
    const r = runIn(m);
    expect(out(r)).not.toContain("is absent or empty");
    expect(out(r)).not.toContain("carries the code-fence delimiter line");
  });

  it("IN-04 — the fixture's PREMISE is LOAD-BEARING: a fenced example carrying a column-0 delimiter is REFUSED by it (27-50, D-56 item 8)", () => {
    // The day this fires for real, the fixture above would have silently started pinning a different
    // refusal. Constructed here so the premise is proven capable of failing rather than asserted to
    // be, and constructed as the two shapes that actually threaten it.
    const withDelimiterInsideFence = [
      "---",
      "name: x",
      "---",
      "",
      "## Example",
      "```",
      "---",
      "a: b",
      "```",
      "",
      "tail",
    ];
    const strip = stripFencedBlockLines(withDelimiterInsideFence);
    // The block IS removed with its contents, so this premise holds on the STRIPPED text…
    expect(strip.blocksRemoved).toBe(1);
    expect(strip.linesRemoved).toBe(4);
    // …and the surviving line-2 `---` is a real delimiter of the document, which the premise names.
    expect(() =>
      assertFenceStripPremise(strip, "a constructed input"),
    ).toThrow(/no delimiter line may survive after line 0/);

    // The second threat: an UNBALANCED fence. The toggle swallows the tail, so the file written is
    // not the file the case believes it wrote.
    const unbalanced = ["---", "name: x", "```", "body", "more"];
    const open = stripFencedBlockLines(unbalanced);
    expect(open.unterminatedFence).toBe(true);
    expect(() => assertFenceStripPremise(open, "an unbalanced fence")).toThrow(
      /fences must be balanced/,
    );

    // And the third: a file carrying NO fence at all, where the fixture would be a silent no-op.
    const noFence = ["---", "name: x", "---", "body"];
    expect(() =>
      assertFenceStripPremise(stripFencedBlockLines(noFence), "no fence"),
    ).toThrow(/must really have carried a fenced block/);

    // Non-vacuity: the premise is a DISCRIMINATOR, not a refusal of everything. The shape the
    // unterminated-region case actually builds passes it.
    const good = ["---", "name: x", "", "## Example", "```", "prose", "```"];
    assertFenceStripPremise(stripFencedBlockLines(good), "the good shape");
  });

  it("WR-03 — the three replacement assertions are each PROVEN ABLE TO FAIL against a deliberately broken strip (27-53)", () => {
    // The assertion these replaced could not fail for ANY implementation. Replacing it with three
    // that also cannot fail would be the same defect with more words, so each is run against a
    // variant built to violate exactly one of them, and the variants are written as their own loops
    // rather than as mutations of the real result — a failure caused by tampering with the output
    // proves nothing about the implementation.
    const input = ["---", "name: x", "", "## Example", "```", "prose", "```", "tail"];

    // THE CONTROL FIRST: the real strip satisfies all three, so a red below is the variant's doing.
    assertStripPartitionsInput(
      stripFencedBlockLines(input),
      input,
      "the real strip",
    );

    // VARIANT 1 — a silent no-op: it never removes anything.
    const noOp = (lines: readonly string[]): FenceStrip => ({
      kept: [...lines],
      linesRemoved: 0,
      blocksRemoved: 0,
      unterminatedFence: false,
    });
    expect(() =>
      assertStripPartitionsInput(noOp(input), input, "variant 1"),
    ).toThrow(/really have removed lines/);

    // VARIANT 2 — it keeps the fence delimiter lines and accounts for them honestly, so ONLY the
    // survivor assertion may fire. That the partition assertion stays green here is the point: the
    // three properties are independent, not three spellings of one.
    const keepsDelimiters = (lines: readonly string[]): FenceStrip => {
      const kept: string[] = [];
      let inside = false;
      let blocksRemoved = 0;
      let linesRemoved = 0;
      for (const line of lines) {
        if (line.startsWith("```")) {
          if (!inside) blocksRemoved += 1;
          inside = !inside;
          kept.push(line); // the defect: the delimiter line survives
          continue;
        }
        if (inside) {
          linesRemoved += 1;
          continue;
        }
        kept.push(line);
      }
      return { kept, linesRemoved, blocksRemoved, unterminatedFence: inside };
    };
    expect(() =>
      assertStripPartitionsInput(keepsDelimiters(input), input, "variant 2"),
    ).toThrow(/no fence delimiter line may survive/);

    // VARIANT 3 — it drops one extra line after each closing fence and never accounts for it.
    const dropsAnExtraLine = (lines: readonly string[]): FenceStrip => {
      const kept: string[] = [];
      let inside = false;
      let blocksRemoved = 0;
      let linesRemoved = 0;
      let skipNext = false;
      for (const line of lines) {
        if (skipNext) {
          skipNext = false;
          continue; // the defect: dropped, and never counted
        }
        if (line.startsWith("```")) {
          if (!inside) blocksRemoved += 1;
          else skipNext = true;
          inside = !inside;
          linesRemoved += 1;
          continue;
        }
        if (inside) {
          linesRemoved += 1;
          continue;
        }
        kept.push(line);
      }
      return { kept, linesRemoved, blocksRemoved, unterminatedFence: inside };
    };
    expect(() =>
      assertStripPartitionsInput(dropsAnExtraLine(input), input, "variant 3"),
    ).toThrow(/must PARTITION its input/);

    // AND THE REASON VARIANT 3 IS DETECTABLE AT ALL, stated as a measurement rather than trusted.
    // A strip that DERIVES its removal count from `kept.length` satisfies the partition equality
    // identically — for the correct implementation and for the broken one alike. Same defect, same
    // input, derived accounting: the assertion goes green.
    const derivedAccounting = (lines: readonly string[]): FenceStrip => {
      const broken = dropsAnExtraLine(lines);
      return { ...broken, linesRemoved: lines.length - broken.kept.length };
    };
    expect(
      derivedAccounting(input).kept.length +
        derivedAccounting(input).linesRemoved,
      "the derived shape makes the partition equality an IDENTITY — this is why the real strip counts",
    ).toBe(input.length);

    // So the real strip's accounting is pinned ON THE SOURCE. A correct implementation is
    // behaviourally identical under both shapes, so nothing but the source can tell them apart.
    const src = readFileSync(
      join(ROOT, "scripts", "generate-role-adapters.test.ts"),
      "utf8",
    );
    const start = src.indexOf("function stripFencedBlockLines(");
    expect(
      start,
      "PREMISE — the pin must find the function it claims to read",
    ).toBeGreaterThan(0);

    // (27-60, IN-03 (a)) THE SLICE IS BOUNDED BY AN EXPLICIT MARKER, AND THE MARKER IS ASSERTED
    // BEFORE THE SLICE IS USED. The old bound was `indexOf("\n}")` — an assumption that no line in
    // the body begins at column 0 with a closing brace. True today; the day it stops being true the
    // body truncates and the POSITIVE assertion below fails saying "linesRemoved += 1 not found",
    // which sends a reader hunting for a deleted counter that is still there. A missing bound must
    // say it is a missing bound.
    const END_MARKER = "\n// ── end stripFencedBlockLines";
    const end = src.indexOf(END_MARKER, start);
    expect(
      end,
      `PREMISE — the stripFencedBlockLines body must be bounded by its own section rule \`${END_MARKER.trim()}\`; without it this pin does not know where the function ends and every assertion below is about an arbitrary slice`,
    ).toBeGreaterThan(start);
    const body = src.slice(start, end);

    // (27-60, IN-03) …AND THE SLICE IS ASSERTED TO **BE** THE FUNCTION BEFORE ANY NEGATIVE RUNS.
    // The discipline this phase has now applied three times: a `not.toContain` over a slice that is
    // not what it claims to be passes VACUOUSLY, and passing vacuously is indistinguishable from
    // passing correctly. Head, tail and no-overrun, so neither a truncated nor an over-long slice
    // can reach the negative.
    expect(body.startsWith("function stripFencedBlockLines(")).toBe(true);
    expect(
      body,
      "IDENTITY — the slice must reach the function's own return, or it is a prefix of it",
    ).toContain("unterminatedFence: inside,");
    expect(
      body.split("\nfunction ").length - 1,
      "IDENTITY — the slice must not overrun into a following top-level function",
    ).toBe(0);

    // (27-60, IN-03 (b)) THE NEGATIVE RUNS OVER **CODE** ONLY. The claim is about what the function
    // DOES, and a comment explaining why the derived shape is wrong is documentation — exactly the
    // documentation the block above this function carries. A gate that reds on it teaches an author
    // to delete the explanation, which this project records as the worse direction. This is the same
    // comment-versus-code confusion `codeLinesOf` was introduced to solve in frontmatter.test.ts,
    // twinned locally rather than imported, because a test importing another test's helper would
    // make the two files' pins a single point of failure.
    const codeOnly = body
      .split("\n")
      .filter((l) => !l.trimStart().startsWith("//"))
      .join("\n");
    expect(
      codeOnly,
      "stripFencedBlockLines must COUNT removals as it makes them, never derive them from kept.length — deriving turns the partition assertion into a second thing that cannot fail",
    ).not.toContain("lines.length - kept.length");
    expect(codeOnly).toContain("linesRemoved += 1");
    // The strip really is load-bearing: dropping comments must not have dropped the whole body.
    expect(
      codeOnly.length,
      "the comment strip must leave the function's CODE behind — a strip that eats everything makes the negative vacuous",
    ).toBeGreaterThan(200);
  });

  it("refuses a CODE FENCE inside the located frontmatter region as UNREADABLE — the lines are never deleted and a shorter value never reported (27-45, D-53, WR-02)", () => {
    // The discriminating sibling of the case above, and the whole of WR-02 at the aggregator level.
    // Delete the closing delimiter and LEAVE the body's fences in place: the region now runs into the
    // body and meets a column-0 fence. The pre-fix module deleted those lines and every line between
    // them, then reported whatever remained; this module refuses, names the fence line and names its
    // line number IN THE DOCUMENT (not in a stripped text the author cannot see).
    // (27-53, WR-03) BUILT BY THE SAME SHARED SPLICE the sibling above strips — one construction,
    // one place that believes anything about the closing delimiter's index.
    const m = scratch(SAMPLE_ROLES);
    expect(runIn(m).status).toBe(0);
    const { path: p, lines } = spliceClosingDelimiter(m);
    expect(lines.some((l) => l.startsWith("```"))).toBe(true);
    writeFileSync(p, lines.join("\n"));
    expectRefusal(m, "qe-e2e.md: frontmatter is unreadable");
    expectRefusal(m, "carries the code-fence delimiter line");
    expectRefusal(
      m,
      "not a legal node in a top-level block mapping",
    );
    const r = runIn(m);
    // The failure arm, never the silent one: a truncated value is exactly what WR-02 was.
    expect(out(r)).not.toContain("is absent or empty");
  });

  it("refuses a kit with no coordinator role, rather than emitting a grantless adapter set", () => {
    const m = scratch(SAMPLE_ROLES);
    expect(runIn(m).status).toBe(0);
    rmSync(join(m, "agent-factory", "roles", "orchestrator.md"));
    expectRefusal(m, 'expected exactly one role whose basename is "orchestrator.md"');
  });

  // ── (7) THE SECTION-EXTENT UNIFICATION, HELD ON BOTH AXES (plan 29-35, LANG-07 / WR-08) ──────
  //
  // This generator used to bound `## <heading>` with a private `new RegExp` lookahead over the whole
  // document. Plan 29-35 deleted it and asked `unfencedHeadingIndex` + `sectionEndIndex` instead.
  // Live reachability of the old defect over the committed kit was ZERO on both axes on the day of
  // the change (0 fenced level-two heading lines, 0 level-one headings inside a read section's old
  // extent, over 17 roles and 19 workflows), so every generated byte is unchanged — which means
  // nothing in the artifact distinguishes that change from a rename. These two cases are what does.
  //
  // EACH ONE FIRST ESTABLISHES THAT THE PRE-FIX GRAMMAR ANSWERS DIFFERENTLY. The control below is the
  // deleted pattern, reconstructed here and NOWHERE ELSE. Without that, a case asserting the correct
  // answer passes on a fix and on a coincidence alike, and this phase has recorded four rounds of
  // assertions that passed for the wrong reason.

  /**
   * THE HISTORICAL GRAMMAR — A FIXTURE, NOT A LIVE SECOND GRAMMAR.
   *
   * This is the exact pattern plan 29-35 DELETED from this generator. It is declared inside a test
   * file, called only by the two cases below, imported by nothing and exported to nothing. It exists
   * for one purpose: to show that the planted documents DISCRIMINATE — that the shipped path and the
   * grammar it replaced give different answers on them. Reading it as a live second opinion would be
   * the exact defect LANG-07 exists to delete; it is here as evidence that the defect was real.
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

  it("a fenced level-two heading INSIDE the document does not steal the section — the FENCE axis", () => {
    const m = scratch(SAMPLE_ROLES);
    // CONTROL FIRST: the unplanted mirror produces the real description, so any movement below is
    // caused by the plant and not by the mirror.
    expect(runIn(m).status).toBe(0);
    const rolePath = join(m, "agent-factory", "roles", "qe-e2e.md");
    const original = readFileSync(rolePath, "utf8");
    expect(
      fmValue(readFileSync(join(agentsDir(m), "grugops-qe-e2e.md"), "utf8"), "description"),
    ).toBe('"Break the feature with tests and report the gaps. Use when: Need tests."');

    // THE PLANT: the role QUOTES its own `## One job` heading inside a fenced example, above the
    // real section. This is the WR-01 document — a role showing documentation, not declaring a
    // second section.
    const planted = original.replace(
      "# Role: QE/E2E\n",
      "# Role: QE/E2E\n\n```md\n## One job\nThis block is an EXAMPLE, not the section.\n```\n",
    );
    expect(planted, "the plant must really have been applied").not.toBe(original);
    writeFileSync(rolePath, planted);

    // THE DISCRIMINATION, BEFORE THE CLAIM: the deleted grammar matches the FENCED heading first and
    // captures the example, terminating at the real section's own heading.
    expect(
      HISTORICAL_LOOKAHEAD_GRAMMAR(planted, "One job"),
      "the deleted grammar must answer DIFFERENTLY on this document, or the case cannot fail",
    ).toEqual("This block is an EXAMPLE, not the section.\n```\n");

    // THE SHIPPED PATH, asserted as the exact emitted value — a literal, never a containment, because
    // a containment assertion is satisfied by a truncated capture that happens to include the
    // fragment.
    expect(runIn(m).status).toBe(0);
    const description = fmValue(
      readFileSync(join(agentsDir(m), "grugops-qe-e2e.md"), "utf8"),
      "description",
    );
    expect(description).toBe(
      '"Break the feature with tests and report the gaps. Use when: Need tests."',
    );
    // …and it is NOT what the deleted grammar would have shipped, stated as its own literal so the
    // bypass this case closes is on the record rather than merely excluded.
    expect(description).not.toBe(
      '"This block is an EXAMPLE, not the section. Use when: Need tests."',
    );
  });

  it("a level-ONE heading after the section CLOSES it — the LEVEL axis", () => {
    const m = scratch(SAMPLE_ROLES);
    expect(runIn(m).status).toBe(0);
    const rolePath = join(m, "agent-factory", "roles", "qe-e2e.md");
    const original = readFileSync(rolePath, "utf8");

    // THE PLANT: an EMPTY `## One job` followed immediately by a level-ONE heading with content.
    // The deleted terminator named level two only, so a `# ` heading did not close the section and
    // the capture ran on into the next top-level section — byte-for-byte the defect voice-model.ts
    // shipped at exit 0, which cost this phase plans 29-14 and 29-20 one module over.
    const planted = original.replace(
      "## One job\nBreak the feature with tests and report the gaps.\n",
      "## One job\n\n# Appendix\nThis paragraph belongs to the appendix, not to the role's one job.\n",
    );
    expect(planted, "the plant must really have been applied").not.toBe(original);
    writeFileSync(rolePath, planted);

    // THE DISCRIMINATION, BEFORE THE CLAIM: the deleted grammar walks straight past the level-one
    // heading and adopts the appendix, so it reports a NON-EMPTY body and this generator would have
    // exited 0 with `# Appendix` as the routing description.
    expect(
      HISTORICAL_LOOKAHEAD_GRAMMAR(planted, "One job"),
      "the deleted grammar must answer DIFFERENTLY on this document, or the case cannot fail",
    ).toEqual(
      "\n# Appendix\nThis paragraph belongs to the appendix, not to the role's one job.\n",
    );

    // THE SHIPPED PATH sees an EMPTY section, which is what it is, and fails closed by name.
    const r = runIn(m);
    expect(r.status).toBe(1);
    expect(out(r)).toContain(
      "qe-e2e.md: no `## One job` section — refusing to emit an adapter with an empty description",
    );
    // AND THE BYPASS IS NAMED: the description the deleted grammar would have shipped never appears.
    expect(out(r)).not.toContain("# Appendix");
  });

  // ── Live-tree hygiene — this file must never mutate the kit or the committed adapters ────────
  it("the live roles and adapter directories are untouched by this suite", () => {
    // A cheap structural assertion (counts + mtime-independent byte totals) that would trip if any
    // case above had written into the real tree instead of its scratch mirror.
    const roles = readdirSync(LIVE_ROLES).filter((f) => f.endsWith(".md") && !f.startsWith("_"));
    expect(roles).toHaveLength(17);
    const adapters = readdirSync(LIVE_AGENTS).filter((f) => f.endsWith(".md"));
    expect(adapters).toHaveLength(17);
    for (const a of adapters) {
      expect(statSync(join(LIVE_AGENTS, a)).size).toBeGreaterThan(0);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// THE `model:` EMIT (MODEL-01 / MODEL-02, phase 29.1 plan 29.1-01)
//
// The generator used to push the string `model: inherit` as a LITERAL. It now pushes the value
// `scripts/model-tiers.js` resolved for that role. Two facts have to hold at once, and only one of
// them is what a byte comparison against the committed adapters can see:
//
//   (1) THE ZERO-CONFIG BYTES DID NOT MOVE — with nothing configured the resolver answers
//       `inherit`, so the emitted line is the same seven bytes in the same slot. This is MODEL-01,
//       and scripts/adapter-byte-baseline.test.ts decides it against a frozen pre-phase commit.
//   (2) THE EMIT READS THE FIELD RATHER THAN A CONSTANT — which byte-identity CANNOT show, because
//       a generator that ignored the resolver entirely and kept its literal would satisfy (1)
//       perfectly. That is what the SUBSTITUTED-TWIN cases below are for: the mirror carries a
//       model-tiers twin that answers something other than `inherit`, and the emitted bytes have to
//       follow it.
//
// WHY A SUBSTITUTED TWIN RATHER THAN CALLING `render()` DIRECTLY. generate-role-adapters.js is
// top-level script code — importing it WRITES SEVENTEEN FILES and then calls process.exit — so
// `render` cannot be imported by a test at all. The mirror-spawn is the only way to observe its
// output, and it observes the SHIPPED path end to end rather than an exported fragment of it.
// Nothing here touches the live tree: the substitution is written into the scratch mirror's own
// scripts directory, over the copy `scratch()` placed there.
// ═══════════════════════════════════════════════════════════════════════════════════════════════

/**
 * Overwrite the mirror's model-tiers twin with a stub whose resolution the case controls.
 *
 * THE REAL MODULE IS PRESERVED BESIDE IT AND RE-EXPORTED, and the stub overrides only the names it
 * means to control. Writing a whole hand-authored twin — which is what this helper did in plan
 * 29.1-01 — makes the stub a HAND-MAINTAINED COPY of the generator's import surface: the day the
 * generator imports one more name from model-tiers, every substituted-twin case dies at link time
 * with a module-resolution error that says nothing about what actually changed. An `export *` of the
 * preserved copy tracks that surface automatically, and an explicitly exported local name shadows
 * the star export, so the override still wins.
 */
function substituteResolver(m: string, body: string): void {
  const twin = join(m, "scripts", "model-tiers.js");
  const preserved = join(m, "scripts", "model-tiers.real.js");
  cpSync(twin, preserved);
  writeFileSync(twin, `export * from "./model-tiers.real.js";\n${body}`, "utf8");
}

/** A stub that RESOLVES every stem to one alias. */
const resolverAnswering = (alias: string): string =>
  [
    "export function resolveModels(stems) {",
    "  const value = new Map();",
    "  for (const s of [...stems].sort()) value.set(s, " + JSON.stringify(alias) + ");",
    "  return { ok: true, value };",
    "}",
    "",
  ].join("\n");

/** A stub that REFUSES, so the generator's fail-closed posture can be observed. */
const resolverRefusing = (reason: string): string =>
  [
    "export function resolveModels() {",
    "  return { ok: false, reason: " + JSON.stringify(reason) + " };",
    "}",
    "",
  ].join("\n");

/** Every line of the file that IS a top-level `model:` frontmatter key, counted over the whole file. */
const modelLines = (text: string): string[] =>
  text.split("\n").filter((l) => l.startsWith("model: "));

describe("generate-role-adapters.js — the resolved `model:` emit (plan 29.1-01)", () => {
  it("emits EXACTLY ONE `model:` line per adapter, after `tools:` and immediately before the closing fence", () => {
    const m = scratch(SAMPLE_ROLES);
    const r = runIn(m);
    expect(r.status, out(r)).toBe(0);

    const snap = snapshot(agentsDir(m));
    const names = Object.keys(snap);
    // The premise: the run really produced the adapters this case is about to judge.
    expect(names, "the generator wrote nothing, so the slot assertion below would be vacuous").toHaveLength(
      SAMPLE_ROLES.length,
    );

    const findings: string[] = [];
    for (const name of names) {
      const text = snap[name];
      const found = modelLines(text);
      if (found.length !== 1) {
        findings.push(`${name} — ${String(found.length)} \`model:\` line(s), expected exactly 1`);
        continue;
      }
      // THE SLOT, not merely the presence. The byte layout is what MODEL-01 pins, so the line has to
      // sit where the literal sat: last inside the frontmatter, directly beneath `tools:`.
      const fm = frontmatter(text).split("\n");
      if (!fm[fm.length - 1].startsWith("model: ")) {
        findings.push(`${name} — the \`model:\` line is not the last frontmatter line`);
      }
      if (!fm[fm.length - 2].startsWith("tools: ")) {
        findings.push(`${name} — the line above \`model:\` is not \`tools:\``);
      }
    }
    expect(findings, "the emitted `model:` line moved out of the slot the literal occupied").toEqual([]);
  });

  it("ZERO-CONFIG: every emitted adapter carries `model: inherit` — the bytes the literal produced", () => {
    const m = scratch(SAMPLE_ROLES);
    const r = runIn(m);
    expect(r.status, out(r)).toBe(0);

    const snap = snapshot(agentsDir(m));
    expect(Object.keys(snap)).toHaveLength(SAMPLE_ROLES.length);
    for (const [name, text] of Object.entries(snap)) {
      expect(modelLines(text), `${name}`).toEqual(["model: inherit"]);
      expect(fmValue(text, "model"), `${name}`).toBe("inherit");
    }
  });

  it("THE EMIT READS THE RESOLVED FIELD, not a constant — a twin answering `opus` moves the bytes", () => {
    // This is the case byte-identity cannot decide. A generator still holding its literal passes
    // every zero-config assertion above and fails here.
    const m = scratch(SAMPLE_ROLES);
    substituteResolver(m, resolverAnswering("opus"));
    const r = runIn(m);
    expect(r.status, out(r)).toBe(0);

    const snap = snapshot(agentsDir(m));
    expect(
      Object.keys(snap),
      "the substituted-resolver run produced no adapters, so nothing below was actually observed",
    ).toHaveLength(SAMPLE_ROLES.length);
    for (const [name, text] of Object.entries(snap)) {
      // EXACTLY `model: opus`, on its own line, exactly once — not merely "contains opus".
      expect(modelLines(text), `${name}`).toEqual(["model: opus"]);
      // …and still in its slot, so following the field cannot have cost the layout.
      const fm = frontmatter(text).split("\n");
      expect(fm[fm.length - 1], `${name}`).toBe("model: opus");
      expect(fm[fm.length - 2].startsWith("tools: "), `${name}`).toBe(true);
    }
  });

  it("A REFUSED resolution exits 1 carrying the reason and writes NOTHING (T-27-32)", () => {
    // The resolution is taken BEFORE the build-everything loop precisely so a refusal cannot leave a
    // partial adapter directory behind. That is the property this case pins.
    const m = scratch(SAMPLE_ROLES);
    const reason = "model-tiers: a deliberately planted refusal for the fail-closed case";
    substituteResolver(m, resolverRefusing(reason));

    const before = snapshot(agentsDir(m));
    expect(Object.keys(before), "the fixture must start with an EMPTY output directory").toEqual([]);

    const r = runIn(m);
    expect(r.status, out(r)).toBe(1);
    expect(out(r)).toContain(reason);
    // Byte-for-byte unchanged: no partial artifact, not even one file.
    expect(snapshot(agentsDir(m))).toEqual(before);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// THE CONFIGURATION IS RESOLVED ONCE, ABOVE THE BUILD LOOP (plan 29.1-03, T-27-32 / MODEL-04)
//
// The generator's posture is ALL-OR-NOTHING: a structural miss prints a finding and exits 1 having
// written nothing, so a partial or garbled adapter directory never ships. Reading a user-authored
// `models` block is a new way for a run to be refused, and where that refusal is RAISED is the whole
// question. `render()` runs inside `adapters.map()`, so a refusal raised there breaks the posture.
//
// THE PROOF IS THE FILESYSTEM, NOT THE EXIT CODE. An exit code says the process failed; it says
// nothing about what the process left behind. Every refusal case below captures a map of filename to
// sha256 BEFORE the refused run and compares it after, and it asserts its own premise first — a
// pre-run map that is empty makes "nothing changed" a vacuous pass, so the case throws rather than
// passing.
//
// THE RESOLVED PRESET IS ANNOUNCED. Every successful run prints the preset it resolved, so the
// resolution is an observable property of the RUN rather than an inference from the tree. That line
// is what scripts/adapters-freshness.ts asserts to hold D-04; both sites read the grammar out of
// scripts/model-tiers.js, which is why this file imports it rather than spelling it.
// ═══════════════════════════════════════════════════════════════════════════════════════════════

/** Write a `models` block into the mirror's in-kit configuration location. */
function writeModelsConfig(m: string, models: unknown): void {
  const dir = join(m, "agent-factory", "config");
  mkdirSync(dir, { recursive: true });
  writeFileSync(
    join(dir, "factory.config.json"),
    `${JSON.stringify({ models }, null, 2)}\n`,
    "utf8",
  );
}

/**
 * Filename → sha256 of its bytes, over an output directory that may not exist.
 *
 * A DIGEST rather than the file text, because this map is the evidence for "nothing was written":
 * a hash names a changed file without the diff of a 1.5 KB adapter drowning the finding, and an
 * ABSENT directory is a legal input that answers with the empty map rather than throwing.
 */
function digestMap(dir: string): Record<string, string> {
  const out: Record<string, string> = {};
  if (!existsSync(dir)) return out;
  for (const rel of readdirSync(dir, { recursive: true, encoding: "utf8" }).sort()) {
    const p = join(dir, rel);
    if (!statSync(p).isFile()) continue;
    out[rel] = createHash("sha256").update(readFileSync(p)).digest("hex");
  }
  return out;
}

/**
 * Plant a `models` block into a POPULATED mirror, run, and assert all three facts at once: a
 * non-zero exit, the refusal text naming the offending member, and an output directory whose every
 * file is byte-unchanged.
 *
 * THE PREMISE IS ASSERTED BEFORE THE CLAIM. "Nothing changed in an empty directory" is true of every
 * implementation, correct or catastrophic, so an empty pre-run map THROWS here rather than passing.
 */
function expectConfigRefusal(models: unknown, needle: string): void {
  const m = scratch(SAMPLE_ROLES);
  const first = runIn(m);
  expect(first.status, out(first)).toBe(0);

  writeModelsConfig(m, models);

  const before = digestMap(agentsDir(m));
  if (Object.keys(before).length === 0) {
    throw new Error(
      "PREMISE: the pre-run digest map is EMPTY — a byte-unchanged assertion over an empty directory passes without observing anything",
    );
  }
  expect(
    Object.keys(before),
    "the populating run must have written one adapter per mirrored role",
  ).toHaveLength(SAMPLE_ROLES.length);

  const r = runIn(m);
  expect(r.status, out(r)).not.toBe(0);
  expect(out(r)).toContain(needle);
  expect(
    digestMap(agentsDir(m)),
    "T-27-32: the resolution is taken ABOVE the build loop, so a refused run must leave every adapter byte-for-byte unchanged",
  ).toEqual(before);
}

describe("generate-role-adapters.js — the `models` configuration is resolved above the build loop (plan 29.1-03)", () => {
  // ── The six refusal shapes. Each names a DIFFERENT member and prints a DIFFERENT sentence. ────
  it("refuses an ILLEGAL ALIAS for one role, naming the role, the value and the legal set", () => {
    expectConfigRefusal({ roles: { "qe-e2e": "gpt-4" } }, 'assigns role "qe-e2e" the value "gpt-4"');
  });

  it("refuses an UNKNOWN PRESET NAME, naming the value and the legal set", () => {
    expectConfigRefusal({ preset: "cost" }, "sets `models.preset` to \"cost\"");
  });

  it("refuses an UNKNOWN `roles` KEY, naming the key and the valid stem set", () => {
    expectConfigRefusal(
      { roles: { "qe-e2eee": "opus" } },
      "sets `models.roles` for \"qe-e2eee\"",
    );
  });

  it("refuses a NON-STRING alias, quoting the value it found rather than coercing it", () => {
    expectConfigRefusal({ roles: { "qe-e2e": 3 } }, 'assigns role "qe-e2e" the value 3');
  });

  it("refuses the EMPTY STRING as an alias — a blank is not a legal member of the closed set", () => {
    expectConfigRefusal({ roles: { "qe-e2e": "" } }, 'assigns role "qe-e2e" the value ""');
  });

  it("refuses `null` as an alias — distinct from an absent key, and never folded into it", () => {
    expectConfigRefusal({ roles: { "qe-e2e": null } }, 'assigns role "qe-e2e" the value null');
  });

  // ── Each of the six prints its OWN sentence: a shared blur would name no offender. ────────────
  it("the six refusals are six DISTINCT sentences, not one message with six causes", () => {
    const shapes: unknown[] = [
      { roles: { "qe-e2e": "gpt-4" } },
      { preset: "cost" },
      { roles: { "qe-e2eee": "opus" } },
      { roles: { "qe-e2e": 3 } },
      { roles: { "qe-e2e": "" } },
      { roles: { "qe-e2e": null } },
    ];
    const messages = shapes.map((models) => {
      const m = scratch(SAMPLE_ROLES);
      writeModelsConfig(m, models);
      const r = runIn(m);
      expect(r.status, out(r)).not.toBe(0);
      return out(r).trim();
    });
    expect(messages, "the premise: six shapes were actually run").toHaveLength(shapes.length);
    expect(
      new Set(messages).size,
      "each refusal must state its own fact — a shared sentence tells the author to go looking",
    ).toBe(shapes.length);
  });

  // ── The refusal happens before the directory is even created. ─────────────────────────────────
  it("a refused run does not CREATE the output directory that did not exist before it", () => {
    // The strongest form of "writes nothing": not merely unchanged files, but no directory at all.
    // Its premise is a CONTROL run — with nothing planted, the same removal is recreated — so
    // "absent afterwards" cannot pass for the trivial reason that the generator never gets that far.
    const control = scratch(SAMPLE_ROLES);
    rmSync(agentsDir(control), { recursive: true, force: true });
    const c = runIn(control);
    expect(c.status, out(c)).toBe(0);
    expect(
      existsSync(agentsDir(control)),
      "PREMISE: a clean run must RECREATE the removed output directory, or its later absence proves nothing",
    ).toBe(true);

    const m = scratch(SAMPLE_ROLES);
    rmSync(agentsDir(m), { recursive: true, force: true });
    writeModelsConfig(m, { preset: "cost" });
    const r = runIn(m);
    expect(r.status, out(r)).not.toBe(0);
    expect(existsSync(agentsDir(m))).toBe(false);
  });

  // ── The announced resolution. ─────────────────────────────────────────────────────────────────
  it("ZERO-CONFIG: exits 0, writes every adapter, and ANNOUNCES the resolved preset as `none`", () => {
    const m = scratch(SAMPLE_ROLES);
    const r = runIn(m);
    expect(r.status, out(r)).toBe(0);
    expect(Object.keys(digestMap(agentsDir(m)))).toHaveLength(SAMPLE_ROLES.length);
    expect(
      resolvedPresetsIn(r.stdout ?? ""),
      `the run must print exactly one "${RESOLVED_PRESET_PREFIX}" line — the D-04 pin scripts/adapters-freshness.ts asserts`,
    ).toEqual(["none"]);
  });

  it("A CONFIGURED PRESET: announces the preset it was given, and the emitted aliases follow it", () => {
    const m = scratch(SAMPLE_ROLES);
    writeModelsConfig(m, { preset: "tiered" });
    const r = runIn(m);
    expect(r.status, out(r)).toBe(0);
    expect(resolvedPresetsIn(r.stdout ?? "")).toEqual(["tiered"]);

    // The announcement is not decoration: the bytes moved with it. The coordinator sits on the
    // strong tier under `tiered`, and NOTHING may still read `inherit` under a non-`none` preset.
    const snap = snapshot(agentsDir(m));
    expect(Object.keys(snap)).toHaveLength(SAMPLE_ROLES.length);
    expect(fmValue(snap["grugops-orchestrator.md"], "model")).toBe("opus");
    const inherited = Object.entries(snap)
      .filter(([, text]) => fmValue(text, "model") === "inherit")
      .map(([name]) => name);
    expect(
      inherited,
      "under a configured preset no adapter may still carry the zero-config answer",
    ).toEqual([]);
  });

  it("the announcement follows the CONFIG, not a constant — `none` and `tiered` disagree", () => {
    // A generator that printed a hard-coded `none` would satisfy the zero-config case above and
    // every assertion the freshness gate makes. This is the pair that tells the two apart.
    const zero = scratch(SAMPLE_ROLES);
    const tiered = scratch(SAMPLE_ROLES);
    writeModelsConfig(tiered, { preset: "tiered" });
    const a = resolvedPresetsIn(runIn(zero).stdout ?? "");
    const b = resolvedPresetsIn(runIn(tiered).stdout ?? "");
    expect(a).toEqual(["none"]);
    expect(b).toEqual(["tiered"]);
    expect(a).not.toEqual(b);
  });

  it("a legal per-role OVERRIDE resolves, is announced as `none`, and moves only its own adapter", () => {
    // The success path through the same reader the six refusals travel: a valid block must not be
    // refused, or the refusals above would be passing for the wrong reason.
    const m = scratch(SAMPLE_ROLES);
    writeModelsConfig(m, { roles: { "qe-e2e": "haiku" } });
    const r = runIn(m);
    expect(r.status, out(r)).toBe(0);
    expect(resolvedPresetsIn(r.stdout ?? "")).toEqual(["none"]);

    const snap = snapshot(agentsDir(m));
    expect(fmValue(snap["grugops-qe-e2e.md"], "model")).toBe("haiku");
    for (const [name, text] of Object.entries(snap)) {
      if (name === "grugops-qe-e2e.md") continue;
      expect(fmValue(text, "model"), name).toBe("inherit");
    }
  });

  it("the generator's own OUT_DIR is still a fixed literal — no argv and no env on that path", () => {
    // T-29.1-01 / T-27-28, asserted on the COMMITTED source rather than by reading it once. The
    // config reader introduced a new untrusted input; the path surface must not have moved with it.
    const src = readFileSync(GEN_JS, "utf8");
    const outDirLines = src.split("\n").filter((l) => l.includes("const OUT_DIR"));
    expect(outDirLines, "OUT_DIR must be assigned exactly once").toHaveLength(1);
    expect(outDirLines[0]).toContain("join(ROOT,");
    expect(outDirLines[0]).not.toContain("process.argv");
    expect(outDirLines[0]).not.toContain("process.env");
    // And the whole module takes no output flag and reads no environment variable at all.
    expect(src).not.toContain("process.argv");
    expect(src).not.toContain("process.env");
  });
});

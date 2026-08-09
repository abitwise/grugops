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
import { tmpdir } from "node:os";
import { join } from "node:path";

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

// ── Refusal helper: assert non-zero exit, the named role file, and an UNCHANGED output dir ─────
function expectRefusal(m: string, needle: string): void {
  const before = snapshot(agentsDir(m));
  const r = runIn(m);
  expect(r.status).not.toBe(0);
  expect(out(r)).toContain(needle);
  // T-27-32: build everything, then write. A structural miss must leave NOTHING behind.
  expect(snapshot(agentsDir(m))).toEqual(before);
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
    const m = scratch(SAMPLE_ROLES);
    expect(runIn(m).status).toBe(0);
    const p = join(m, "agent-factory", "roles", "qe-e2e.md");
    const lines = readFileSync(p, "utf8").split("\n");
    expect(lines[4]).toBe("---"); // the closing delimiter must be where we think it is
    lines.splice(4, 1);
    const noFences = lines.filter((l) => !l.startsWith("```"));
    expect(noFences.length).toBeLessThan(lines.length); // the fixture really did carry fences
    writeFileSync(p, noFences.join("\n"));
    expectRefusal(m, "qe-e2e.md: frontmatter is unreadable");
    expectRefusal(m, "is never closed by a `---` delimiter");
    const r = runIn(m);
    expect(out(r)).not.toContain("is absent or empty");
  });

  it("refuses a CODE FENCE inside the located frontmatter region as UNREADABLE — the lines are never deleted and a shorter value never reported (27-45, D-53, WR-02)", () => {
    // The discriminating sibling of the case above, and the whole of WR-02 at the aggregator level.
    // Delete the closing delimiter and LEAVE the body's fences in place: the region now runs into the
    // body and meets a column-0 fence. The pre-fix module deleted those lines and every line between
    // them, then reported whatever remained; this module refuses, names the fence line and names its
    // line number IN THE DOCUMENT (not in a stripped text the author cannot see).
    const m = scratch(SAMPLE_ROLES);
    expect(runIn(m).status).toBe(0);
    const p = join(m, "agent-factory", "roles", "qe-e2e.md");
    const lines = readFileSync(p, "utf8").split("\n");
    expect(lines[4]).toBe("---");
    lines.splice(4, 1);
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

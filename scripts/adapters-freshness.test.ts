// adapters-freshness.test.ts — behavioral oracle for the SPAWN-02 adapter drift gate.
//
// Drives the COMMITTED compiled artifact scripts/adapters-freshness.js as a child process (never
// the .ts) and asserts the exit-code-as-signal contract:
//   exit 0 = the committed .claude/agents directory matches a fresh regeneration, byte for byte
//            and member for member
//   exit 1 = drift (byte, extra member or missing member), OR the regeneration itself failed
//
// WHY THIS FILE EXISTS AT ALL (Phase 27 / plan 27-11). Every other freshness gate in this tree has
// a test that spawns it; this one did not, and the continuous-integration workflow did not name it
// either. It was therefore a gate invoked by nothing — the single gate that would have caught
// either of the two hand-edit bypasses reproduced in 27-REVIEW.md, while a committed hand-edit to
// an adapter passed every gate in the repository. Plan 27-11 wires the workflow step AND this file,
// deliberately at both ends: the workflow makes drift turn the build red today, and this file makes
// the drift lane survive a workflow refactor that drops or renames the step (threat T-27-51).
//
// EVERY PLANT LANDS IN A HERMETIC MIRROR, never in the committed tree (threat T-27-52). The gate
// honors the CHECK_ROOT override that scripts/check-foundation-guards.ts and scripts/check-kit-refs.ts
// already honor, so each case builds its own temp mirror of the kit inputs, mutates that, and points
// the gate at it. No case can leave the repository dirty if it throws, and no case can interfere
// with a concurrently running test file. Vitest globals:false → import explicitly.

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
} from "node:fs";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { listRoles } from "./kit-model.js";
import {
  MIRRORED_RESOLVED_PRESET_PREFIX,
  mirroredResolvedPresetLine,
  mirroredResolvedPresetsIn,
  readModelsConfig,
  resolvedPresetsIn,
} from "./model-tiers.js";

const ROOT = join(import.meta.dirname, "..");
const GATE_JS = join(ROOT, "scripts", "adapters-freshness.js");

// The gate's own temp-mirror prefix, RECOVERED from the committed .js rather than restated here. A
// hand-copied prefix would make the IN-01 leftover assertion vacuously true the moment the gate
// renamed its directory — the failure mode Case 7 of coordinator-resolution-precheck.test.ts guards
// against by asserting its prefix is live. Recovering it is the stronger form of the same idea.
const GATE_TMP_PREFIX = ((): string => {
  const m = readFileSync(GATE_JS, "utf8").match(
    /mkdtempSync\(join\(tmpdir\(\),\s*"([^"]+)"\)\)/,
  );
  if (m === null) {
    throw new Error(
      "scripts/adapters-freshness.js: could not recover the temp-mirror prefix — the IN-01 leftover assertion would be filtering on nothing",
    );
  }
  return m[1];
})();

// Every entry in the system temp directory carrying the gate's prefix, right now.
const tempEntries = (): string[] =>
  readdirSync(tmpdir()).filter((n) => n.startsWith(GATE_TMP_PREFIX));

// The kit inputs the gate reads from its KIT root: the two generator sources it mirror-spawns over,
// and the committed adapter directory it compares. The compiled script twins deliberately do NOT
// appear here — the gate always takes those from its own script-relative root, because the
// committed compiled output is what continuous integration and host machines run.
const KIT_INPUTS = [
  "agent-factory/roles",
  "agent-factory/packaging",
  ".claude/agents",
];

const tmpDirs: string[] = [];

// Build a hermetic mirror carrying byte-faithful copies of every kit input. Returns the mirror dir.
function mirror(): string {
  const m = mkdtempSync(join(tmpdir(), "grugops-adapters-fresh-test-"));
  tmpDirs.push(m);
  for (const rel of KIT_INPUTS) {
    cpSync(join(ROOT, rel), join(m, rel), { recursive: true });
  }
  return m;
}

afterAll(() => {
  for (const d of tmpDirs) rmSync(d, { recursive: true, force: true });
});

// Spawn the committed gate. With no argument it judges the real tree; with a mirror it judges that.
function runGate(kitRoot?: string) {
  const env = { ...process.env };
  if (kitRoot) env.CHECK_ROOT = kitRoot;
  else delete env.CHECK_ROOT;
  return spawnSync("node", [GATE_JS], { cwd: ROOT, encoding: "utf8", env });
}

// The success-only wording. Kept as one constant because two cases key on it in opposite
// directions, and a fail-closed message must never be allowed to contain it.
const FRESH_MARKER = "Adapters fresh:";

describe("adapters-freshness.js (SPAWN-02 adapter drift gate)", () => {
  it("Case 1 (green): exits 0 over the real tree, reporting zero byte differences", () => {
    const r = runGate();
    expect(r.status).toBe(0);
    expect(r.stdout).toContain(FRESH_MARKER);
    expect(r.stdout).toContain("0 byte difference(s)");
  });

  it("Case 2 (RED, byte drift): exits non-zero and names the hand-edited adapter", () => {
    // THIS is the case that would have caught both bypasses reproduced in 27-REVIEW.md § CR-01 and
    // § CR-02. Both were byte-level hand edits of a COMMITTED adapter — a shape invisible to every
    // other gate, because the adapter's own content is what the platform loads and the generator's
    // output is only a claim about it.
    const m = mirror();
    const victim = "grugops-qe-e2e.md";
    const target = join(m, ".claude/agents", victim);
    writeFileSync(
      target,
      Buffer.concat([
        readFileSync(target),
        Buffer.from("\n<!-- hand-edited, never regenerated -->\n"),
      ]),
    );

    const r = runGate(m);
    expect(r.status).not.toBe(0);
    expect(r.stdout).toContain("STALE:");
    expect(r.stdout).toContain(victim);
    expect(r.stdout).not.toContain(FRESH_MARKER);
  });

  it("Case 3 (RED, top-level orphan): exits non-zero naming an extra adapter the generator does not produce", () => {
    // The orphan shape: an adapter left behind by a deleted role. A byte comparison alone cannot
    // see it, because nothing regenerates over it.
    const m = mirror();
    const orphan = "zz-orphan-adapter.md";
    writeFileSync(
      join(m, ".claude/agents", orphan),
      "---\nname: zz-orphan-adapter\ndescription: not produced by the generator\n---\n",
    );

    const r = runGate(m);
    expect(r.status).not.toBe(0);
    expect(r.stdout).toContain("EXTRA");
    expect(r.stdout).toContain(orphan);
    expect(r.stdout).not.toContain(FRESH_MARKER);
  });

  it("Case 4 (RED, nested orphan): exits non-zero naming the plant at its FULL relative path", () => {
    // Only possible because the set half compares relative paths derived from the shared authority.
    // The former non-recursive listing filtered on `.md`, so a subdirectory was dropped outright and
    // a nested adapter — which Claude Code DOES load, taking identity only from frontmatter — was
    // invisible to this gate. The assertion keys on the full relative path, not the basename, so it
    // also pins that a nested member is never folded into a top-level one.
    const m = mirror();
    const nestedRel = "nested/zz-nested-orphan.md";
    mkdirSync(join(m, ".claude/agents", "nested"), { recursive: true });
    writeFileSync(
      join(m, ".claude/agents", nestedRel),
      "---\nname: zz-nested-orphan\ndescription: a nested adapter the generator never wrote\n---\n",
    );

    const r = runGate(m);
    expect(r.status).not.toBe(0);
    expect(r.stdout).toContain("EXTRA");
    expect(r.stdout).toContain(nestedRel);
    expect(r.stdout).not.toContain(FRESH_MARKER);
  });

  it("Case 5 (fail-closed): exits non-zero without the success wording when the mirrored regeneration fails", () => {
    // Plant a non-conforming role file into the MIRROR's role corpus. The gate cpSyncs the kit
    // root's agent-factory/roles into its temp regeneration mirror, so the mirrored generator
    // rejects it and exits non-zero. A broken generator must never be mistaken for an up-to-date
    // adapter directory (T-27-31 / T-27-50).
    //
    // The filename must NOT start with `_`: the generator's D-03 underscore filter would silently
    // drop it, and the regeneration would then SUCCEED over a smaller role set — passing this case
    // for entirely the wrong reason, by never exercising the fail-closed branch at all.
    const m = mirror();
    writeFileSync(
      join(m, "agent-factory/roles", "zzz-adapters-freshness-badrole.md"),
      "---\nkind: role\ntier: core\n---\n\nNo H1 here.\n",
    );

    const r = runGate(m);
    expect(r.status).not.toBe(0);
    expect(r.stdout).not.toContain(FRESH_MARKER);
    expect(r.stdout).toContain("did not run cleanly");
  });

  it("Case 6 (IN-01, no leftovers): a run that throws before any handler still removes its temp mirror", () => {
    // The review's named input: a CHECK_ROOT mirror with agent-factory/packaging ABSENT. The gate
    // cpSyncs that directory at module top level, so the throw escapes both die() paths and both
    // tails. Before the exit handler was registered this run left <tmpdir>/<prefix>* behind every
    // time — reproduced, then re-run green. A gate that accumulates state outside its own lifetime
    // is a slow denial of service on the host and on CI runners (T-27-117).
    //
    // The mirror deliberately does NOT use mirror(): that helper copies every kit input, and the
    // whole point here is that one of them is missing. Its prefix is deliberately distinct from the
    // gate's, so this case's own scaffolding can never be counted as the gate's leak.
    const m = mkdtempSync(join(tmpdir(), "grugops-adapters-in01-"));
    tmpDirs.push(m);
    for (const rel of KIT_INPUTS.filter((r) => r !== "agent-factory/packaging")) {
      cpSync(join(ROOT, rel), join(m, rel), { recursive: true });
    }

    // Set difference, not a count: a concurrently running gate with its own mirror cannot influence
    // the verdict, and neither can an entry left by something outside this suite.
    const before = tempEntries();
    const r = runGate(m);
    const added = tempEntries().filter((n) => !before.includes(n));
    expect(added).toEqual([]);

    // ...and the run must still FAIL. A gate that cleaned up by quietly succeeding would satisfy the
    // assertion above for entirely the wrong reason, so the exit code is asserted beside it.
    expect(r.status).not.toBe(0);
    expect(r.stdout).not.toContain(FRESH_MARKER);

    // Anti-vacuity: the assertion above is a set difference over a FILTER, and a filter that matches
    // nothing passes forever. Prove the filter can actually see a directory carrying the gate's
    // prefix before trusting its silence.
    const sentinel = mkdtempSync(join(tmpdir(), GATE_TMP_PREFIX));
    try {
      expect(tempEntries()).toContain(basename(sentinel));
    } finally {
      rmSync(sentinel, { recursive: true, force: true });
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// THE D-04 ZERO-CONFIG PIN, MADE OBSERVABLE (plan 29.1-03, RESEARCH.md Pitfall 3)
//
// Until this plan the gate satisfied D-04 by ABSENCE. Its twin list copies agent-factory/roles and
// agent-factory/packaging into the regeneration mirror and no configuration directory, so a
// config-reading generator running inside that mirror resolves nothing and answers `inherit`. That
// is the right answer for the wrong reason: it is a property of what was NOT copied.
//
// Absence is not a pin. The comment above that twin list already justifies mirroring `packaging`
// "although the generator does not currently OPEN it", so adding a configuration directory beside it
// is a plausible, well-intentioned edit — and the day it lands the gate silently begins comparing a
// CONFIGURED regeneration against the committed zero-config adapters while every case stays green.
//
// The remedy is that the mirrored run ANNOUNCES the preset it resolved and the gate ASSERTS it reads
// `none`. The cases below drive that from both ends, and the load-bearing one performs exactly the
// future edit described above — it adds the configuration directory to a COPY of the gate's twin
// list and plants a non-default `models` block — so the pin is proven to hold against the change it
// exists to survive, rather than against the tree as it happens to stand today.
//
// EVERY MUTATION LANDS IN A SCRIPT-ROOT MIRROR, never in the committed tree. The gate takes its
// twins from its OWN script-relative root, so a case that needs a different generator or a different
// twin list must run a COPY of the gate from a scratch scripts directory. That copy is derived —
// every compiled .js under scripts/ is mirrored — rather than hand-listed, because a hand-listed
// twin set inside a test for a hand-listed twin list is the same rot with one more copy of it.
// ═══════════════════════════════════════════════════════════════════════════════════════════════

/**
 * A scratch SCRIPT root: every compiled `scripts/*.js`, plus the kit inputs the gate judges.
 *
 * Running the gate from here makes BOTH of its roots the mirror, so a case may substitute the
 * generator twin or the gate's own twin list without touching the repository.
 */
function scriptRootMirror(): string {
  const m = mkdtempSync(join(tmpdir(), "grugops-adapters-scriptroot-"));
  tmpDirs.push(m);
  mkdirSync(join(m, "scripts"), { recursive: true });
  const compiled = readdirSync(join(ROOT, "scripts")).filter((n) => n.endsWith(".js"));
  if (compiled.length === 0) {
    throw new Error(
      "PREMISE: no compiled .js under scripts/ — the mirror would carry no gate at all and every case below would be measuring a module-resolution error",
    );
  }
  for (const f of compiled) cpSync(join(ROOT, "scripts", f), join(m, "scripts", f));
  for (const rel of KIT_INPUTS) cpSync(join(ROOT, rel), join(m, rel), { recursive: true });
  return m;
}

/** Run the gate that lives INSIDE a script-root mirror, with CHECK_ROOT explicitly absent. */
function runMirroredGate(m: string) {
  const env = { ...process.env };
  delete env.CHECK_ROOT;
  return spawnSync("node", [join(m, "scripts", "adapters-freshness.js")], {
    cwd: ROOT,
    encoding: "utf8",
    env,
  });
}

/** Delete the mirrored generator's announcement, so its stdout carries no resolved-preset line. */
function stripAnnouncement(m: string): void {
  const p = join(m, "scripts", "generate-role-adapters.js");
  const lines = readFileSync(p, "utf8").split("\n");
  const at = lines
    .map((l, i) => [l, i] as const)
    .filter(([l]) => l.includes("resolvedPresetLine(") && l.includes("console.log"));
  if (at.length !== 1) {
    throw new Error(
      `PREMISE: expected exactly one announcement line in the mirrored generator, found ${String(at.length)} — this case would otherwise be deleting the wrong line, or nothing`,
    );
  }
  lines.splice(at[0][1], 1);
  writeFileSync(p, lines.join("\n"), "utf8");
}

/**
 * Perform THE FUTURE EDIT: add a configuration directory to the mirrored gate's twin list.
 *
 * Anchored on the `childEnv` declaration, which is the line immediately after the twin list and is
 * itself pinned by a case below. The anchor count is asserted, so a rename cannot make this helper
 * silently insert nothing and leave the case passing for the wrong reason.
 */
function mirrorConfigDirectoryIntoTheTwinList(m: string): void {
  const p = join(m, "scripts", "adapters-freshness.js");
  const text = readFileSync(p, "utf8");
  const anchor = "const childEnv = { ...process.env };";
  const hits = text.split(anchor).length - 1;
  if (hits !== 1) {
    throw new Error(
      `PREMISE: expected exactly one \`${anchor}\` to anchor the twin-list insertion on, found ${String(hits)}`,
    );
  }
  const inserted =
    'cpSync(join(KIT_ROOT, "agent-factory", "config"), join(tmp, "agent-factory", "config"), { recursive: true });\n';
  writeFileSync(p, text.replace(anchor, `${inserted}${anchor}`), "utf8");
}

/**
 * Delete the mirrored generator's ASSIGNMENT announcement, leaving its preset line intact.
 *
 * A separate helper from `stripAnnouncement` on purpose: "the run announced no preset" and "the run
 * announced no assignment" are different facts with different findings, and a helper that removed
 * both would make one case unable to tell which branch it exercised.
 */
function stripAssignmentAnnouncement(m: string): void {
  const p = join(m, "scripts", "generate-role-adapters.js");
  const lines = readFileSync(p, "utf8").split("\n");
  const at = lines
    .map((l, i) => [l, i] as const)
    .filter(([l]) => l.includes("resolvedAssignmentLine(") && l.includes("console.log"));
  if (at.length !== 1) {
    throw new Error(
      `PREMISE: expected exactly one assignment announcement in the mirrored generator, found ${String(at.length)} — this case would otherwise be deleting the wrong line, or nothing`,
    );
  }
  lines.splice(at[0][1], 1);
  writeFileSync(p, lines.join("\n"), "utf8");
}

/**
 * Make the mirrored generator announce a member count ONE SHORT of the map it actually resolved.
 *
 * The whole point of the member count is that a vacuity floor catches an EMPTY resolution and never
 * a silently SHORT one, so the shortness must be planted into the ANNOUNCEMENT while the emitted
 * adapters stay complete — otherwise the set/byte halves would catch it and the cross-check would
 * be passing on someone else's work.
 */
function shortenAnnouncedMemberCount(m: string): void {
  const p = join(m, "scripts", "generate-role-adapters.js");
  const text = readFileSync(p, "utf8");
  const anchor = "resolvedAssignmentLine(models, modelsConfig.overrides.size)";
  const hits = text.split(anchor).length - 1;
  if (hits !== 1) {
    throw new Error(
      `PREMISE: expected exactly one \`${anchor}\` call to shorten, found ${String(hits)}`,
    );
  }
  const shortened =
    "resolvedAssignmentLine(new Map([...models].slice(1)), modelsConfig.overrides.size)";
  writeFileSync(p, text.replace(anchor, shortened), "utf8");
}

/** Plant a `models` block at the in-kit configuration location of a mirror. */
function plantModelsConfig(m: string, models: unknown): void {
  const dir = join(m, "agent-factory", "config");
  mkdirSync(dir, { recursive: true });
  writeFileSync(
    join(dir, "factory.config.json"),
    `${JSON.stringify({ models }, null, 2)}\n`,
    "utf8",
  );
}

describe("adapters-freshness.js — the D-04 zero-config pin is asserted, not inherited (plan 29.1-03)", () => {
  it("Case 7 (green): the verdict states that the mirrored generator resolved the preset as `none`", () => {
    const r = runGate();
    expect(r.status, r.stdout + r.stderr).toBe(0);
    expect(r.stdout).toContain(FRESH_MARKER);
    expect(r.stdout).toContain("0 byte difference(s)");
    // The pin itself: the run says which resolution it compared, rather than leaving a reader to
    // deduce it from a directory listing the gate happens not to have copied.
    //
    // PARSED THROUGH THE MIRRORED GRAMMAR'S OWN READER, not the generator's (finding WR-04). This
    // is THIS GATE'S verdict — a different speaker making a different claim — and on the success
    // path the child's stdout is not forwarded, so this line is all there is. Reading it with the
    // generator's reader is what let a HAND-WRITTEN LITERAL in the gate stand in for the
    // generator's announcement while this case reported a round trip.
    expect(mirroredResolvedPresetsIn(r.stdout)).toEqual(["none"]);
    expect(
      resolvedPresetsIn(r.stdout),
      "the two grammars must not be conflated: this stdout carries no GENERATOR announcement",
    ).toEqual([]);
  });

  it("Case 8 (PREMISE): the script-root mirror harness itself runs the gate GREEN before anything is mutated", () => {
    // Without this, every RED below could be caused by the harness rather than by its mutation.
    const m = scriptRootMirror();
    const r = runMirroredGate(m);
    expect(r.status, r.stdout + r.stderr).toBe(0);
    expect(r.stdout).toContain(FRESH_MARKER);
    expect(mirroredResolvedPresetsIn(r.stdout)).toEqual(["none"]);
  });

  it("Case 9 (RED, absent line): a child that announces NOTHING fails the gate closed, naming the absence", () => {
    // An absent line is a FAILURE, never an agreement. A gate that read silence as consent would go
    // green the moment the generator stopped announcing — which is the one change that makes the pin
    // stop working at all.
    const m = scriptRootMirror();
    stripAnnouncement(m);

    const r = runMirroredGate(m);
    expect(r.status, r.stdout + r.stderr).not.toBe(0);
    expect(r.stdout).not.toContain(FRESH_MARKER);
    expect(r.stdout).toMatch(/no resolved-preset line|printed NO resolved-preset/i);
    // The finding must state the requirement, so the reader knows what the gate wanted.
    expect(r.stdout).toContain('"none"');
  });

  it("Case 10 (RED, the FUTURE EDIT): a configuration mirrored into the regeneration makes the gate name the preset it found", () => {
    const m = scriptRootMirror();
    plantModelsConfig(m, { preset: "tiered" });

    // ── THE PLANT'S OWN PREMISE, asserted through the reader the generator uses. A typo in the
    // fixture would otherwise leave the mirrored run resolving `none` and this case passing for a
    // reason that has nothing to do with what it claims.
    const stems = listRoles(m).map((f) => f.slice(0, -".md".length));
    expect(stems.length, "the mirror must carry a role corpus to validate the plant against")
      .toBeGreaterThan(0);
    const planted = readModelsConfig(m, stems);
    expect(planted.ok, planted.ok ? "" : planted.reason).toBe(true);
    if (!planted.ok) return;
    expect(
      planted.value.preset,
      "PREMISE: the planted configuration must really resolve to a NON-DEFAULT preset",
    ).toBe("tiered");

    // The future edit itself: the configuration directory joins the twin list.
    mirrorConfigDirectoryIntoTheTwinList(m);

    const r = runMirroredGate(m);
    expect(r.status, r.stdout + r.stderr).not.toBe(0);
    expect(r.stdout).not.toContain(FRESH_MARKER);
    // NAMING both sides: what the run resolved, and what this gate requires.
    expect(r.stdout).toContain('"tiered"');
    expect(r.stdout).toContain('"none"');
    // …and it must be the PRESET finding, not a byte-difference count. A configured regeneration
    // also moves bytes, so a gate that only reported drift would look correct while proving nothing
    // about which resolution it compared.
    expect(
      r.stdout,
      "the preset assertion must fire BEFORE the byte comparison — otherwise the pin is indistinguishable from ordinary drift",
    ).not.toContain("STALE:");
  });

  it("Case 11 (source pin): the committed gate still DELETES CHECK_ROOT from the child environment", () => {
    // T-29.1-04. If a future revision of the generator ever learned the same override, an inherited
    // CHECK_ROOT would point the "fresh regeneration" back at the tree it is compared against and
    // the gate would compare a tree with itself and always pass. The strip is asserted by a case
    // rather than by reading, so it cannot be removed silently.
    const src = readFileSync(GATE_JS, "utf8");
    expect(src).toContain("delete childEnv.CHECK_ROOT");
    const spawnAt = src.indexOf("spawnSync(");
    const deleteAt = src.indexOf("delete childEnv.CHECK_ROOT");
    expect(deleteAt, "the strip must be present").toBeGreaterThan(-1);
    expect(
      deleteAt,
      "the strip must happen BEFORE the child is spawned — a deletion afterwards strips nothing",
    ).toBeLessThan(spawnAt);
  });

  // ═════════════════════════════════════════════════════════════════════════════════════════════
  // THE `roles` HALF OF THE SAME HOLE (plan 29.1-07, finding CR-01)
  //
  // Case 10 above performs the future edit with a `preset` key and the gate goes red. The `roles`
  // half had NO case, and that is not a coverage gap in the abstract: the verifier performed
  // exactly this edit against the committed .js and watched the gate print the zero-config answer
  // and exit 0 while two committed adapters carried `model: opus`. `resolveModels` takes two inputs
  // and the pin observed one of them.
  //
  // The cases below are numbered from 12 because Case 11 is already taken by the CHECK_ROOT source
  // pin above; renumbering a committed case to match a plan's numbering would move a name other
  // work keys on for no behavioural gain.
  // ═════════════════════════════════════════════════════════════════════════════════════════════

  it("Case 12 (RED, the roles HALF of the future edit): a mirrored roles block with NO preset key makes the gate name the override count", () => {
    const m = scriptRootMirror();
    plantModelsConfig(m, { roles: { orchestrator: "opus", "security-nfr": "opus" } });

    // ── THE PLANT'S OWN PREMISE, asserted through the reader the generator uses. A typo in the
    // fixture would leave the mirrored run resolving zero overrides and this case passing for a
    // reason that has nothing to do with what it claims. BOTH halves are asserted: two overrides,
    // and the DEFAULT preset — because a plant that accidentally set a preset would be re-running
    // Case 10 under a new name.
    const stems = listRoles(m).map((f) => f.slice(0, -".md".length));
    expect(stems.length, "the mirror must carry a role corpus to validate the plant against")
      .toBeGreaterThan(0);
    const planted = readModelsConfig(m, stems);
    expect(planted.ok, planted.ok ? "" : planted.reason).toBe(true);
    if (!planted.ok) return;
    expect(
      planted.value.preset,
      "PREMISE: the plant must carry NO preset key — that is what makes this the `roles` half",
    ).toBe("none");
    expect(planted.value.overrides.size, "PREMISE: exactly two overrides were planted").toBe(2);

    // The future edit itself: the configuration directory joins the twin list.
    mirrorConfigDirectoryIntoTheTwinList(m);

    const r = runMirroredGate(m);
    expect(r.status, r.stdout + r.stderr).not.toBe(0);
    expect(r.stdout).not.toContain(FRESH_MARKER);
    // The finding must be about the OVERRIDE COUNT, naming what it found and what it requires. A
    // preset finding would be wrong here: the preset genuinely is `none`, which is exactly why the
    // preset pin alone certified this run.
    //
    // ASSERT THE SENTENCE, NOT THE DIGIT (finding R2-IN-03). This used to read
    // `expect(r.stdout).toContain("2")`, and a multi-paragraph refusal satisfies a single-digit
    // substring almost unconditionally — a temp path, a line number, an unrelated count — so it told
    // a reader nothing about WHICH refusal fired, and the case's whole discrimination was carried by
    // the `/override/i` match below it. The fragment now carries the count in the POSITION the gate
    // interpolates it and the required value the gate names beside it, so what is asserted is the
    // override refusal rather than a number that appeared somewhere. The count is still DERIVED —
    // it is the same run-time `planted.value.overrides.size` this case asserted as its premise
    // above — because replacing a derived number with a literal to gain specificity would trade this
    // finding for this repository's named first failure class.
    expect(r.stdout).toContain(
      `applied ${String(planted.value.overrides.size)} per-role model override(s), and this gate requires 0`,
    );
    // Kept as a second, weaker assertion. It is not wrong — it was only carrying the whole case.
    expect(r.stdout).toMatch(/override/i);
    // …and it must fire BEFORE the byte comparison, or the pin is indistinguishable from ordinary
    // staleness.
    expect(
      r.stdout,
      "the assignment assertion must precede the byte comparison",
    ).not.toContain("STALE:");
  });

  it("Case 13 (RED): a mirrored run whose announced member count disagrees with the derived adapter count fails closed", () => {
    // A VACUITY FLOOR CATCHES AN EMPTY RESOLUTION AND NEVER A SILENTLY SHORT ONE. The announced
    // member count is therefore cross-checked against a count THIS GATE derived itself through
    // listAgentAdapters(); an announcement that only agreed with itself would prove nothing.
    const m = scriptRootMirror();
    shortenAnnouncedMemberCount(m);

    const r = runMirroredGate(m);
    expect(r.status, r.stdout + r.stderr).not.toBe(0);
    expect(r.stdout).not.toContain(FRESH_MARKER);
    // BOTH numbers must be named, or the reader cannot tell which side is wrong — and they must be
    // named IN THE SENTENCE THAT REPORTS THEM (finding R2-IN-03). This used to be two bare
    // `toContain(String(n))` calls, which a multi-paragraph refusal satisfies for reasons that have
    // nothing to do with the disagreement being reported: either number could have come from a temp
    // path, a line number or the alias listing. The assertion below is the gate's own
    // member-count refusal with all three cardinalities in the positions the gate writes them, so it
    // identifies the refusal rather than finding digits in it.
    //
    // NO LITERAL IS INTRODUCED. Both numbers still come from the SAME directory listing this case
    // already read: the announced count is one short by construction — `shortenAnnouncedMemberCount`
    // drops the first member of the resolved map — and the derived and committed counts are the full
    // listing.
    const committed = readdirSync(join(ROOT, ".claude/agents")).filter((n) => n.endsWith(".md"));
    expect(committed.length, "PREMISE: the committed adapter set must be non-empty")
      .toBeGreaterThan(0);
    expect(r.stdout).toContain(
      `announced a resolution covering ${String(committed.length - 1)} role(s), while this gate ` +
        `derived ${String(committed.length)} regenerated adapter(s) through the shared adapter ` +
        `authority (set-equal to the ${String(committed.length)} committed adapter(s) by the check ` +
        "above). The two numbers must agree.",
    );
  });

  it("Case 14 (RED): a mirrored run that announces NO assignment line at all fails closed", () => {
    // Silence is not consent here either — the same direction Case 9 pins for the preset line. The
    // preset line is left INTACT so this case cannot pass through the preset-absent branch.
    const m = scriptRootMirror();
    stripAssignmentAnnouncement(m);

    const r = runMirroredGate(m);
    expect(r.status, r.stdout + r.stderr).not.toBe(0);
    expect(r.stdout).not.toContain(FRESH_MARKER);
    expect(r.stdout).toMatch(/assignment/i);
  });

  it("Case 15 (PREMISE): the gate's own verdict line is parsed through the mirrored grammar's reader, not a hand-written literal", () => {
    // FINDING WR-04. This gate used to spell its own verdict marker, inside the file that argues the
    // marker must never be hand-spelled — and it was load-bearing rather than cosmetic, because
    // Cases 7 and 8 parse THIS gate's stdout, so they were reading that literal rather than
    // anything the generator emits.
    const src = readFileSync(GATE_JS, "utf8");
    expect(
      src.includes(MIRRORED_RESOLVED_PRESET_PREFIX),
      "the gate must SPELL no announcement marker of its own",
    ).toBe(false);
    expect(
      src.includes("mirroredResolvedPresetLine"),
      "the gate must produce its verdict through the exported emitter",
    ).toBe(true);

    // COMPARED, NOT EYEBALLED: the live verdict line must be byte-identical to what the emitter
    // produces for the preset this gate requires.
    const r = runGate();
    expect(r.status, r.stdout + r.stderr).toBe(0);
    const verdict = r.stdout
      .split("\n")
      .map((l) => l.trimEnd())
      .filter((l) => l.startsWith(MIRRORED_RESOLVED_PRESET_PREFIX));
    expect(verdict).toHaveLength(1);
    expect(verdict[0]).toBe(mirroredResolvedPresetLine("none"));
  });
});

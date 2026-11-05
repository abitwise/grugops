// adapter-byte-baseline.test.ts — MODEL-01's byte baseline (Phase 29.1, plan 29.1-01; re-pinned by
// Phase 39 decision D-3, plan 39-03).
//
// MODEL-01 says the zero-config path must emit adapters "byte-identical to today's", not "still
// working". This file is the only assertion in the repository that can decide that question.
//
// WHY THE EXISTING GATE IS NOT ENOUGH. `npm run freshness:adapters` mirrors the committed generator
// into a temp tree, regenerates, and byte-compares the regeneration against the committed adapters.
// Both sides of that comparison are produced by the SAME generator, so it proves DETERMINISM — that
// the generator agrees with itself — and not IDENTITY WITH YESTERDAY. Change the emitted model line
// and regenerate, and that gate is green again with different bytes on the tree. The one opinion
// that cannot move with the generator is a baseline frozen at a commit that predates it, which is
// what this file holds.
//
// THE RECORDED DECISION (Phase 39, D-3, plan 39-03): THE BASELINE IS RE-PINNED, ONCE, TO THE TREE
// PHASE 39 STARTED FROM.
//
//   What the pin is. PRE_PHASE_ADAPTER_BASELINE below is the commit Phase 39 started from, recorded
//   as `plan_head_before` in 39-01-SUMMARY.md and resolved to its full object name with
//   `git rev-parse`. Its adapter tree was produced by the pre-Phase-39 generator, before any Phase 39
//   generator change, so it is independent of the generator under test.
//
//   The second source. The literal RECORDED_ADDED and RECORDED_REMOVED records below, written by
//   hand, one per later change, each with its reason. Every adapter name, count and grant this file
//   expects is the pinned tree moved by those records and nothing else; the generator's output is
//   never consulted for an expectation.
//
//   What is retired. The former pin 6f8411effe80b3f22d0d668e1fa40fa78e3a8088 (taken 2026-08-19, before Phase 29.1) and its three recorded transforms: plan 33-28's scoped admission tool on the coordinator's tools line, read from a held capture; 34-07 D-14's reworded Degraded phrase; and 36-10 D-14's v3 STATE clause with its fallback clause and the coordinator's v3 board path. All three are inside the new baseline tree, so a transform for them would now have no target, and they are deleted with their helpers.
//
//   What is NOT loosened. Every byte comparison, set difference, count and effort assertion the
//   file made still exists, measured against the new tree; the only change is which frozen tree they
//   are measured against. At the re-pin both records are empty and every adapter is byte-identical
//   to the pinned tree. A later change to an adapter is a new literal record with its reason, never
//   a deleted or weakened comparison (D-3).
//
// THE SET IS DERIVED, NEVER LISTED. The baseline adapter filenames come out of the git object store
// at the pinned revision. An EMPTY derivation throws naming the revision, because a byte comparison
// over nothing passes without comparing anything; and the baseline count moved by the records is
// asserted against listAgentAdapterNames(), an authority the git listing never consulted, so a
// SILENTLY SHORT listing is caught as well as an empty one.
//
// RECORDED RESIDUAL, the same one plan 29-39 recorded for its own commit-pinned census: this file
// depends on the pinned commit remaining REACHABLE in this repository. A history rewrite that drops
// it turns every case into a named `git ls-tree failed` throw rather than a silent pass — the failure
// direction is loud, which is what makes the residual acceptable rather than merely disclosed.
//
// Node stdlib plus the shared kit authority. Zero npm dependencies. Findings are written in CLEAR
// PROFESSIONAL VOICE — this is a build-safety surface (CLAUDE.md hard rule), never caveman voice.
//
// Drives the COMMITTED compiled scripts/kit-model.js (never the .ts) — the repo idiom, and the
// artifact every consumer actually imports.

import { describe, it, expect } from "vitest";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { AGENT_ADAPTER_PREFIX, listAgentAdapterNames, listAgentAdapters } from "./kit-model.js";

const ROOT = join(import.meta.dirname, "..");

// The generator's fixed-literal output directory, mirrored here as a fixed literal too. It is both
// the path inside the pinned tree object and the path on the working tree, so neither side can be
// pointed somewhere else.
const ADAPTER_DIR = ".claude/agents";
const MD = ".md";

/** The frontmatter line an emitted effort level starts with (D-06: never written for `inherit`). */
const EFFORT_LINE_PREFIX = "effort: ";
/** The frontmatter line an emitted model starts with. */
const MODEL_LINE_PREFIX = "model: ";
/** The frontmatter line the coordinator's spawn grant sits on. */
const TOOLS_LINE_PREFIX = "tools: ";

/** The one adapter allowed to hold the spawn grant, named through the kit's one namespace constant. */
const COORDINATOR = `${AGENT_ADAPTER_PREFIX}orchestrator`;

/**
 * THE PIN — the commit Phase 39 started from (39-01-SUMMARY.md, `plan_head_before`), re-pinned by
 * decision D-3 (see the module header for the decision and its two independent sources).
 *
 * THE FULL FORTY-CHARACTER OBJECT NAME IS PINNED, NOT AN ABBREVIATION (finding IN-06). An
 * abbreviation is unique only until history grows one that collides with it, and the failure that
 * follows is worse than loud — it is MISLEADING: `git ls-tree` errors on an ambiguous name, and the
 * throw below would report it as "the pinned baseline tree could not be read", sending a reader to
 * look for a lost commit rather than for an ambiguous prefix. The full name was RESOLVED in this
 * repository with `git rev-parse` rather than copied. A case below asserts this constant's length and
 * character class so an abbreviation cannot return through a later edit.
 */
const PRE_PHASE_ADAPTER_BASELINE = "8a530552d6c0e815d2959d16a8c06d99cc2d612b";

/**
 * An adapter the working tree carries and the pinned tree does not, recorded by hand with its
 * reason. `level`: one adapter of a leveled role (TIER-02), with the role stem it groups under, its
 * level, and the model and effort literals it must carry. `new-role`: the one adapter of a role the
 * pinned tree did not have.
 */
type RecordedAdded =
  | {
      readonly name: string;
      readonly kind: "level";
      readonly role: string;
      readonly level: string;
      readonly model: string;
      readonly effort: string;
      readonly reason: string;
    }
  | { readonly name: string; readonly kind: "new-role"; readonly reason: string };

// ── WHERE PLANS 39-05, 39-06 AND 39-07 ADD THEIR RECORDS. ─────────────────────────────────────────
//
// Each later adapter change appends a literal entry here, in the same commit as the change, with its
// reason. Nothing in this file may be deleted or weakened to make that change pass (D-3).
//
//   • A new role (39-05 Tech Lead, 39-06 Designer) adds one `new-role` entry to RECORDED_ADDED. The
//     coordinator's grant then names it, which the grant case below already expects from the record.
//   • Engineer levels (39-07) add one `level` entry per level adapter, with its role, level, model and
//     effort literals, and the replaced base adapter's name to RECORDED_REMOVED. 39-07 also adds the
//     LEVEL TRANSFORM case: a level adapter equals the baseline BASE adapter of its role with the
//     `name:` line, the `description:` line, the `model:` line, an inserted `effort:` line and the
//     level body line transformed, each target asserted to occur exactly once before it applies.
//     Plan 39-07 landed all three; the case sits after the shared-adapter byte case below.
//
// RECORDED_REMOVED holds adapter names only; each entry carries its reason in a trailing comment.
const RECORDED_ADDED: readonly RecordedAdded[] = [
  {
    name: "grugops-tech-lead",
    kind: "new-role",
    reason:
      "Plan 39-05 (TIER-01): the Tech Lead role, agent-factory/roles/tech-lead.md, is new in Phase 39. " +
      "Its one generated adapter runs on `model: inherit` with no effort line at zero config, like " +
      "every judgment role (D-03); the coordinator's grant names it.",
  },
  {
    name: "grugops-designer",
    kind: "new-role",
    reason:
      "Plan 39-06 (TIER-05): the Designer role, agent-factory/roles/designer.md, is new in Phase 39. " +
      "Its one generated adapter runs on `model: inherit` with no effort line at zero config, like " +
      "every judgment role (D-27); the coordinator's grant names it.",
  },
  // (Plan 39-07, TIER-02) The three engineer level adapters. D-13 names them and drops the base
  // adapter; D-14 fixes each pin and D-3 says the level adapters carry their pins at zero config. The
  // model and effort values are LITERALS written here from D-14, never read from the LEVELS table, so
  // a drifted table cannot move this file's expectation with it. The three effort literals were moved
  // by the human's recorded re-decision of 2026-10-30 (Phase 39 UAT, G-39-5; plan 39-14), not by
  // loosening the test (D-3).
  {
    name: "grugops-software-engineer-junior",
    kind: "level",
    role: "software-engineer",
    level: "junior",
    model: "haiku",
    effort: "xhigh",
    reason:
      "Plan 39-07 (TIER-02, D-13, D-14): software-engineer.md declares `levels: junior mid senior`; the " +
      "junior level pins `haiku` at effort `xhigh` at zero config (D-3, the D-2 amendment of D-09); " +
      "efforts re-decided by the human on 2026-10-30 (Phase 39 UAT, G-39-5; plan 39-14).",
  },
  {
    name: "grugops-software-engineer-mid",
    kind: "level",
    role: "software-engineer",
    level: "mid",
    model: "sonnet",
    effort: "high",
    reason:
      "Plan 39-07 (TIER-02, D-13, D-14): software-engineer.md declares `levels: junior mid senior`; the " +
      "mid level pins `sonnet` at effort `high` at zero config (D-3); efforts re-decided by the human " +
      "on 2026-10-30 (Phase 39 UAT, G-39-5; plan 39-14).",
  },
  {
    name: "grugops-software-engineer-senior",
    kind: "level",
    role: "software-engineer",
    level: "senior",
    model: "opus",
    effort: "medium",
    reason:
      "Plan 39-07 (TIER-02, D-13, D-14): software-engineer.md declares `levels: junior mid senior`; the " +
      "senior level pins `opus` at effort `medium` at zero config (D-3); efforts re-decided by the " +
      "human on 2026-10-30 (Phase 39 UAT, G-39-5; plan 39-14).",
  },
];
const RECORDED_REMOVED: readonly string[] = [
  "grugops-software-engineer", // Plan 39-07 (TIER-02, D-13): replaced by its three level adapters; no base adapter is kept.
];

/**
 * An adapter BOTH trees carry whose bytes moved, recorded by hand with its reason. The change is one
 * literal substring of the frontmatter `description:` line, `from` → `to`, written here in full; the
 * byte case asserts `from` occurs exactly once in the baseline adapter before it applies, so a stale
 * record fails loudly instead of admitting nothing. Every other byte stays the baseline's.
 */
type RecordedChanged = {
  readonly name: string;
  readonly from: string;
  readonly to: string;
  readonly reason: string;
};

// (Plan 40-10, PLAIN-07 / D-32) The role corpus joined the writing-profile sentence gate, which
// reported one finding: security-nfr.md's `## Activates when` first sentence was 34 words against the
// 25-word descriptive bound (WP-03). D-32 says reword first, so the sentence was split. The adapter's
// `Use when:` clause is that first sentence, so it moves here; the full trigger list stays in the role.
const RECORDED_CHANGED: readonly RecordedChanged[] = [
  {
    name: "grugops-security-nfr",
    from:
      "Use when: A change touches a risk-bearing surface — the triggers: authentication, 2FA, biometrics, " +
      "payments, banking, investment data, personal data, GDPR, public API, file upload, admin action, " +
      "database migration, queue/event, external integration, or a performance-sensitive flow.\"",
    to:
      "Use when: A change touches a risk-bearing surface, such as authentication, payments, personal data, " +
      "a public API or a database migration.\"",
    reason:
      "Plan 40-10 (PLAIN-07, D-32): the 34-word `## Activates when` first sentence of security-nfr.md broke " +
      "WP-03 once roles joined the governed corpus; it was reworded, and the adapter description follows it.",
  },
];

const recordedAddedNames = (): string[] => RECORDED_ADDED.map((r) => r.name).sort();
const recordedLevelAdapters = (): Extract<RecordedAdded, { kind: "level" }>[] =>
  RECORDED_ADDED.filter((r): r is Extract<RecordedAdded, { kind: "level" }> => r.kind === "level");

/**
 * Derive the adapter names present at a revision, out of the git object store.
 *
 * `-r` so the listing is by full path beneath the adapter directory at any depth, matching the
 * recursive shape of the adapter-set authority this file compares against. A non-zero spawn is a
 * throw naming the revision, and an empty derivation is a throw stating the premise is empty.
 * Returned as adapter names (the `.md` dropped), the space the records are written in.
 */
const baselineAdapterNames = (rev: string): string[] => {
  const listed = spawnSync(
    "git",
    ["ls-tree", "-r", "--name-only", `${rev}:${ADAPTER_DIR}`],
    { cwd: ROOT, encoding: "utf8" },
  );
  if (listed.status !== 0) {
    throw new Error(
      `git ls-tree failed for ${rev}:${ADAPTER_DIR} (status ${String(listed.status)}) — the pinned baseline tree could not be read, so nothing was compared: ${(listed.stderr ?? "").trim()}`,
    );
  }
  const names = (listed.stdout as string)
    .split("\n")
    .map((n) => n.trim())
    .filter((n) => n.endsWith(MD))
    .map((n) => n.slice(0, -MD.length))
    .sort();
  if (names.length === 0) {
    throw new Error(
      `no adapter files found at ${rev}:${ADAPTER_DIR} — the premise is empty, and a byte comparison over an empty set passes without comparing anything`,
    );
  }
  return names;
};

/** The adapter names on the working tree, read from the adapter directory (the `.md` dropped). */
const workingAdapterNames = (): string[] =>
  listAgentAdapters(ROOT)
    .map((rel) => rel.slice(0, -MD.length))
    .sort();

/**
 * Read one adapter's bytes at a revision. No encoding is passed, so stdout arrives as a Buffer and
 * the comparison below is over BYTES rather than over a decoded string — a decode would normalise
 * away exactly the differences this file exists to catch.
 */
const baselineBytes = (rev: string, name: string): Buffer => {
  const objectPath = `${rev}:${ADAPTER_DIR}/${name}${MD}`;
  const shown = spawnSync("git", ["show", objectPath], {
    cwd: ROOT,
    maxBuffer: 64 * 1024 * 1024,
  });
  if (shown.status !== 0) {
    throw new Error(
      `git show failed for ${objectPath} (status ${String(shown.status)}) — the pinned baseline object could not be read, so this adapter was not compared`,
    );
  }
  return shown.stdout as Buffer;
};

/** Sorted set difference `a \ b`, by exact string equality. */
const minus = (a: readonly string[], b: readonly string[]): string[] =>
  a.filter((n) => !b.includes(n)).sort();

/**
 * Split a coordinator `tools:` line into its Agent grant names and the rest of the line. The grant is
 * the one `Agent(...)` group, which the generator emits first; a line carrying none, or several, is a
 * named throw rather than an empty grant.
 */
const GRANT_RE = /Agent\(([^)]*)\)/g;
const splitGrant = (label: string, line: string): { names: string[]; rest: string } => {
  const groups = [...line.matchAll(GRANT_RE)];
  if (groups.length !== 1) {
    throw new Error(`${label}: the coordinator tools line carries ${String(groups.length)} Agent(...) group(s), expected exactly one: ${line}`);
  }
  const inner = (groups[0] as RegExpMatchArray)[1] as string;
  return {
    names: inner.split(",").map((n) => n.trim()).filter((n) => n !== ""),
    rest: line.replace(GRANT_RE, "Agent(<grant>)"),
  };
};

/** The one line of `lines` that starts with `prefix`; zero or several is a named throw. */
const onlyLineStarting = (label: string, lines: string[], prefix: string): number => {
  const at = lines.flatMap((l, i) => (l.startsWith(prefix) ? [i] : []));
  if (at.length !== 1) {
    throw new Error(`${label} carries ${String(at.length)} line(s) starting "${prefix}", expected exactly one`);
  }
  return at[0] as number;
};

describe("MODEL-01: the adapters are byte-identical to the Phase 39 start baseline, moved only by recorded changes (plan 29.1-01, re-pinned by 39-03 D-3)", () => {
  it("the pinned baseline is a full 40-character object name, never an abbreviation, and an ancestor of HEAD", () => {
    // FINDING IN-06, PINNED SO IT CANNOT COME BACK. This case is about the SHAPE of the pin, not
    // about which commit it is: an abbreviation is unique only until it collides, and the throw a
    // collision produces misdescribes the failure as an unreachable tree. Asserting the length and
    // the character class separately means "someone shortened it" and "someone pasted something
    // that is not an object name" are two different reds with two different remedies.
    expect(PRE_PHASE_ADAPTER_BASELINE).toHaveLength(40);
    expect(/^[0-9a-f]{40}$/.test(PRE_PHASE_ADAPTER_BASELINE)).toBe(true);
    // The pin is a tree this history passed through, not a commit from another line of work: a
    // baseline that is not an ancestor of HEAD would compare the kit against an unrelated tree.
    const anc = spawnSync("git", ["merge-base", "--is-ancestor", PRE_PHASE_ADAPTER_BASELINE, "HEAD"], {
      cwd: ROOT,
      encoding: "utf8",
    });
    expect(anc.status, `the pinned baseline ${PRE_PHASE_ADAPTER_BASELINE} is not an ancestor of HEAD: ${(anc.stderr ?? "").trim()}`).toBe(0);
  });

  it("the records are real before they are admitted: every ADDED name is absent from the baseline, every REMOVED name is present, and no name is recorded twice", () => {
    const baseline = baselineAdapterNames(PRE_PHASE_ADAPTER_BASELINE);
    const added = recordedAddedNames();
    expect(added.filter((n) => baseline.includes(n)), "a RECORDED_ADDED name the baseline already carries — the record would admit nothing").toEqual([]);
    expect(minus(RECORDED_REMOVED, baseline), "a RECORDED_REMOVED name the baseline does not carry — the record would remove nothing").toEqual([]);
    expect(new Set(added).size, "a name recorded twice in RECORDED_ADDED").toBe(added.length);
    expect(new Set(RECORDED_REMOVED).size, "a name recorded twice in RECORDED_REMOVED").toBe(RECORDED_REMOVED.length);
    expect(added.filter((n) => RECORDED_REMOVED.includes(n)), "a name recorded as both added and removed").toEqual([]);
    expect(added.includes(COORDINATOR), "the coordinator is never recorded as added").toBe(false);
    expect(RECORDED_REMOVED.includes(COORDINATOR), "the coordinator is never recorded as removed").toBe(false);
    const changed = RECORDED_CHANGED.map((r) => r.name);
    expect(new Set(changed).size, "a name recorded twice in RECORDED_CHANGED").toBe(changed.length);
    expect(changed.filter((n) => !baseline.includes(n)), "a RECORDED_CHANGED name the baseline does not carry — the record would change nothing").toEqual([]);
    expect(changed.filter((n) => added.includes(n) || RECORDED_REMOVED.includes(n)), "a RECORDED_CHANGED name also recorded as added or removed").toEqual([]);
    expect(changed.includes(COORDINATOR), "the coordinator's one admitted edit is its grant, never a RECORDED_CHANGED entry").toBe(false);
    for (const r of RECORDED_CHANGED) {
      expect(r.from, `${r.name}: a change record whose from and to are equal admits nothing`).not.toBe(r.to);
    }
    for (const r of recordedLevelAdapters()) {
      expect(r.effort, `${r.name}: a level record carries an empty effort literal`).not.toBe("");
      expect(r.model, `${r.name}: a level record carries an empty model literal`).not.toBe("");
    }
  });

  it("the working adapter set is the baseline set moved by the records — the added set is RECORDED_ADDED and the removed set is RECORDED_REMOVED", () => {
    // A byte comparison walks the names BOTH trees carry, so an adapter added since the pin is
    // invisible to it. Both directions of the set difference are therefore named here, each against
    // its own record and with its own message.
    const baseline = baselineAdapterNames(PRE_PHASE_ADAPTER_BASELINE);
    const working = workingAdapterNames();
    expect(
      minus(working, baseline),
      `the adapters the working tree carries and the pinned baseline ${PRE_PHASE_ADAPTER_BASELINE} does not must equal RECORDED_ADDED — an added adapter is outside every byte comparison in this file and must be recorded with its reason`,
    ).toEqual(recordedAddedNames());
    expect(
      minus(baseline, working),
      `the adapters the pinned baseline ${PRE_PHASE_ADAPTER_BASELINE} carries and the working tree does not must equal RECORDED_REMOVED — a deleted adapter has no working bytes to compare and must be recorded with its reason`,
    ).toEqual([...RECORDED_REMOVED].sort());
  });

  it("the working adapter count equals the adapter-identity derivation and, computed separately, the baseline count plus ADDED minus REMOVED", () => {
    const baseline = baselineAdapterNames(PRE_PHASE_ADAPTER_BASELINE);
    const working = workingAdapterNames();
    const derived = listAgentAdapterNames(ROOT);
    // Source one: the kit authority's derivation from the role files, which never read the adapter
    // directory or the git object store.
    expect(working.length, `the adapter directory holds ${String(working.length)} adapter(s) against ${String(derived.length)} derived from the role corpus`).toBe(derived.length);
    expect(working).toEqual([...derived].sort());
    // Source two: the frozen tree moved by the hand-written records. A SHORT git listing is a named
    // failure here, because the derivation above never consulted it.
    const fromRecords = baseline.length + RECORDED_ADDED.length - RECORDED_REMOVED.length;
    expect(
      working.length,
      `the working tree holds ${String(working.length)} adapter(s), but the pinned baseline's ${String(baseline.length)} plus ${String(RECORDED_ADDED.length)} recorded addition(s) less ${String(RECORDED_REMOVED.length)} recorded removal(s) is ${String(fromRecords)}`,
    ).toBe(fromRecords);
  });

  it("every adapter both trees carry is byte-identical to the baseline, except the coordinator's Agent grant, which equals the baseline grant moved by the records and the derived adapter set less the coordinator", () => {
    const baseline = baselineAdapterNames(PRE_PHASE_ADAPTER_BASELINE);
    const working = workingAdapterNames();
    const shared = baseline.filter((n) => working.includes(n));
    expect(shared, "the coordinator must be in both trees").toContain(COORDINATOR);

    // ── THE COORDINATOR'S GRANT, FROM TWO SOURCES. ───────────────────────────────────────────────
    const baselineCoord = baselineBytes(PRE_PHASE_ADAPTER_BASELINE, COORDINATOR).toString("utf8").split("\n");
    const workingCoord = readFileSync(join(ROOT, ADAPTER_DIR, `${COORDINATOR}${MD}`), "utf8").split("\n");
    const bAt = onlyLineStarting(`${COORDINATOR} at the baseline`, baselineCoord, TOOLS_LINE_PREFIX);
    const wAt = onlyLineStarting(`${COORDINATOR} on the working tree`, workingCoord, TOOLS_LINE_PREFIX);
    const bGrant = splitGrant("baseline", baselineCoord[bAt] as string);
    const wGrant = splitGrant("working", workingCoord[wAt] as string);
    // Source one: the frozen grant moved by the hand-written records.
    const fromRecords = [...minus(bGrant.names, RECORDED_REMOVED), ...recordedAddedNames()].sort();
    // Source two: the adapter-identity derivation, every adapter but the coordinator.
    const fromDerivation = listAgentAdapterNames(ROOT).filter((n) => n !== COORDINATOR).sort();
    expect(wGrant.names, "the coordinator's Agent grant against the baseline grant moved by RECORDED_ADDED and RECORDED_REMOVED").toEqual(fromRecords);
    expect(wGrant.names, "the coordinator's Agent grant against the derived adapter set less the coordinator").toEqual(fromDerivation);
    // Everything on the tools line outside the grant is the baseline's, byte for byte.
    expect(wGrant.rest, "the coordinator's tools line differs from the baseline outside its Agent grant").toBe(bGrant.rest);

    // ── EVERY OTHER BYTE OF EVERY SHARED ADAPTER. ────────────────────────────────────────────────
    // Findings are accumulated rather than thrown on the first mismatch, so a run reports EVERY
    // adapter that moved instead of the alphabetically first one, and each finding carries both byte
    // lengths rather than a bare boolean.
    const differing: string[] = [];
    for (const name of shared) {
      const base = baselineBytes(PRE_PHASE_ADAPTER_BASELINE, name);
      let work: Buffer;
      try {
        work = readFileSync(join(ROOT, ADAPTER_DIR, `${name}${MD}`));
      } catch (e) {
        // Fail closed: an unreadable working adapter is never treated as absent-and-therefore-fine.
        differing.push(`${name} — baseline ${String(base.length)} bytes, working tree UNREADABLE: ${e instanceof Error ? e.message : String(e)}`);
        continue;
      }
      let expected = base;
      if (name === COORDINATOR) {
        // The one admitted edit: the baseline tools line with its grant replaced by the grant the
        // records give. Every other byte, including the `model:` line MODEL-01 is about and the
        // trailing newline, is the baseline's.
        const lines = [...baselineCoord];
        lines[bAt] = (lines[bAt] as string).replace(GRANT_RE, `Agent(${fromRecords.join(", ")})`);
        expected = Buffer.from(lines.join("\n"), "utf8");
      }
      const change = RECORDED_CHANGED.find((r) => r.name === name);
      if (change !== undefined) {
        // The recorded description change, applied only where its `from` text occurs exactly once on
        // the baseline's one `description:` line. Zero or two occurrences is a stale record, reported
        // as a difference rather than silently skipped.
        const lines = expected.toString("utf8").split("\n");
        const at = onlyLineStarting(`${name} at the baseline`, lines, "description: ");
        const hits = (lines[at] as string).split(change.from).length - 1;
        if (hits !== 1) {
          differing.push(`${name} — RECORDED_CHANGED \`from\` occurs ${String(hits)} time(s) on the baseline description line, expected exactly 1`);
          continue;
        }
        lines[at] = (lines[at] as string).replace(change.from, change.to);
        expected = Buffer.from(lines.join("\n"), "utf8");
      }
      if (!expected.equals(work)) {
        differing.push(`${name} — baseline ${String(base.length)} bytes (expected ${String(expected.length)} after the recorded changes), working tree ${String(work.length)} bytes`);
      }
    }
    expect(
      differing,
      `the adapter bytes moved against the pinned baseline ${PRE_PHASE_ADAPTER_BASELINE} beyond the recorded changes. MODEL-01 requires the zero-config path to be byte-identical to that tree, not merely equivalent to it — regenerating does not settle this, because the freshness gate produces both of its sides from the same generator. Record the change with its reason; do not weaken this comparison (D-3)`,
    ).toEqual([]);
  });

  it("a level adapter is the baseline base adapter of its role with exactly five transforms: the name, the description's use-when clause and level suffix, the model, one inserted effort line and the inserted level body line (D-3, D-13, D-14)", () => {
    const levels = recordedLevelAdapters();
    expect(levels.length, "PREMISE: at least one level record, or this case holds over nothing").toBeGreaterThan(0);
    const working = workingAdapterNames();
    const differing: string[] = [];
    for (const record of levels) {
      const baseName = `${AGENT_ADAPTER_PREFIX}${record.role}`;
      // D-13: the base adapter a level replaces is recorded as removed, so no base adapter survives.
      expect(RECORDED_REMOVED, `${record.name}: its role's base adapter ${baseName} must be recorded as removed (D-13)`).toContain(baseName);
      expect(working, `${record.name} is recorded as a level adapter but the working tree does not carry it`).toContain(record.name);
      const lines = baselineBytes(PRE_PHASE_ADAPTER_BASELINE, baseName).toString("utf8").split("\n");

      // Each target occurs exactly once before it is transformed, so a transform cannot land twice
      // or silently land nowhere.
      const nameAt = onlyLineStarting(`${baseName} at the baseline`, lines, "name: ");
      expect(lines[nameAt], `${baseName}: the baseline name line`).toBe(`name: ${baseName}`);
      const descAt = onlyLineStarting(`${baseName} at the baseline`, lines, "description: ");
      const desc = lines[descAt] as string;
      expect(desc.endsWith('"'), `${baseName}: the baseline description is one quoted scalar`).toBe(true);
      const modelAt = onlyLineStarting(`${baseName} at the baseline`, lines, MODEL_LINE_PREFIX);
      expect(lines[modelAt], `${baseName}: the baseline base adapter runs on inherit`).toBe(`${MODEL_LINE_PREFIX}inherit`);
      expect(lines.filter((l) => l.startsWith(EFFORT_LINE_PREFIX)), `${baseName}: the baseline carries no effort line`).toEqual([]);
      const pointerTail = "thinking; this adapter only points at it.";
      const pointerAt = lines.flatMap((l, i) => (l === pointerTail ? [i] : []));
      expect(pointerAt, `${baseName}: the role-pointer lines end exactly once`).toHaveLength(1);
      expect(lines[(pointerAt[0] as number) - 1], `${baseName}: the role pointer names its role file`).toBe(
        `Read \`agent-factory/roles/${record.role}.md\` now and act as that role. The role file does the`,
      );

      // The five transforms, applied from the bottom up so earlier indexes stay valid.
      const out = [...lines];
      // Phase 41 D-31, 2026-11-04: the human decided that every tier gets one senior instruction, so
      // this line carries no level. A recorded transform, the comparison is not loosened (D-3).
      out.splice((pointerAt[0] as number) + 1, 0, "", "Work at senior level: read the `## Levels` section of that role file.");
      out.splice(modelAt, 1, `${MODEL_LINE_PREFIX}${record.model}`, `${EFFORT_LINE_PREFIX}${record.effort}`);
      // Gap plan 39-11, WR-03, 2026-10-30: the level adapter's use-when clause names its own adapter so
      // a main thread cannot route unscored code work to it. A recorded transform, the comparison is
      // not loosened (D-3): the baseline line is cut after its one `Use when: ` and the clause below,
      // typed here and never imported from the generator, is appended with the record's own name and
      // level.
      const useWhen = "Use when: ";
      expect(desc.split(useWhen).length - 1, `${baseName}: the baseline description carries exactly one use-when clause`).toBe(1);
      out[descAt] =
        `${desc.slice(0, desc.indexOf(useWhen) + useWhen.length)}` +
        `the Tech Lead's plan names ${record.name}; never for unscored work. Level: ${record.level}."`;
      out[nameAt] = `name: ${record.name}`;
      const expected = Buffer.from(out.join("\n"), "utf8");
      const work = readFileSync(join(ROOT, ADAPTER_DIR, `${record.name}${MD}`));
      if (!expected.equals(work)) {
        differing.push(`${record.name} — expected ${String(expected.length)} bytes from ${baseName} at the baseline with the five recorded transforms, working tree ${String(work.length)} bytes`);
      }
    }
    expect(
      differing,
      `a level adapter differs from its role's base adapter at the pinned baseline ${PRE_PHASE_ADAPTER_BASELINE} beyond the five recorded transforms. Record the change with its reason; do not weaken this comparison (D-3)`,
    ).toEqual([]);
  });

  it("a new-role adapter runs on `model: inherit` with no `effort:` line at zero config (D-03)", () => {
    const newRoles = RECORDED_ADDED.filter((r) => r.kind === "new-role").map((r) => r.name);
    expect(newRoles.length, "PREMISE: at least one new-role record, or this case holds over nothing").toBeGreaterThan(0);
    const working = workingAdapterNames();
    const findings: string[] = [];
    for (const name of newRoles) {
      if (!working.includes(name)) {
        findings.push(`${name} is recorded as a new-role adapter but the working tree does not carry it`);
        continue;
      }
      const lines = readFileSync(join(ROOT, ADAPTER_DIR, `${name}${MD}`), "utf8").split("\n");
      const model = lines.filter((l) => l.startsWith(MODEL_LINE_PREFIX));
      if (model.length !== 1 || model[0] !== `${MODEL_LINE_PREFIX}inherit`) {
        findings.push(`${name} must carry exactly one \`${MODEL_LINE_PREFIX}inherit\` line, found: ${JSON.stringify(model)}`);
      }
      const effort = lines.filter((l) => l.startsWith(EFFORT_LINE_PREFIX));
      if (effort.length !== 0) findings.push(`${name} carries ${String(effort.length)} \`effort:\` line(s) at zero config`);
    }
    expect(findings).toEqual([]);
  });

  it("effort, two-sided: exactly the adapters recorded as level adapters carry one `effort:` line equal to the record, and every other adapter carries none (D-06)", () => {
    const levels = new Map(recordedLevelAdapters().map((r) => [r.name, r]));
    const working = workingAdapterNames();
    expect(working.length, "the working adapter set is empty, so the effort rule would hold over nothing").toBeGreaterThan(0);
    const findings: string[] = [];
    for (const name of working) {
      const lines = readFileSync(join(ROOT, ADAPTER_DIR, `${name}${MD}`), "utf8").split("\n");
      const effort = lines.filter((l) => l.startsWith(EFFORT_LINE_PREFIX));
      const record = levels.get(name);
      if (record === undefined) {
        // D-06: an `inherit` effort writes no line, and no adapter but a recorded level adapter has
        // any other effort at zero config.
        if (effort.length !== 0) findings.push(`${name} carries ${String(effort.length)} \`effort:\` line(s) but is not a recorded level adapter`);
        continue;
      }
      if (effort.length !== 1 || effort[0] !== `${EFFORT_LINE_PREFIX}${record.effort}`) {
        findings.push(`${name} must carry exactly one \`${EFFORT_LINE_PREFIX}${record.effort}\` line, found: ${JSON.stringify(effort)}`);
      }
      const model = lines.filter((l) => l.startsWith(MODEL_LINE_PREFIX));
      if (model.length !== 1 || model[0] !== `${MODEL_LINE_PREFIX}${record.model}`) {
        findings.push(`${name} must carry exactly one \`${MODEL_LINE_PREFIX}${record.model}\` line, found: ${JSON.stringify(model)}`);
      }
    }
    // Every level record names an adapter the working tree carries, so a record cannot pass by
    // naming nothing.
    for (const name of levels.keys()) {
      if (!working.includes(name)) findings.push(`${name} is recorded as a level adapter but the working tree does not carry it`);
    }
    expect(findings).toEqual([]);
  });
});

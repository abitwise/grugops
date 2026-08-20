// adapter-byte-baseline.test.ts — MODEL-01's pre-phase byte baseline (Phase 29.1, plan 29.1-01).
//
// MODEL-01 says the zero-config path must emit adapters "byte-identical to today's", not "still
// working". This file is the only assertion in the repository that can decide that question, and it
// had to be written and made green BEFORE the generator changed, because after that commit the
// observation it makes is unobtainable.
//
// WHY THE EXISTING GATE IS NOT ENOUGH. `npm run freshness:adapters` mirrors the committed generator
// into a temp tree, regenerates, and byte-compares the regeneration against the committed adapters.
// Both sides of that comparison are produced by the SAME generator, so it proves DETERMINISM — that
// the generator agrees with itself — and not IDENTITY WITH YESTERDAY. Change the emitted model line
// and regenerate, and that gate is green again with different bytes on the tree. The one opinion
// that cannot move with the generator is a baseline frozen at a commit that predates it, which is
// what this file holds.
//
// THE SET IS DERIVED, NEVER LISTED. The adapter filenames come out of the git object store at the
// pinned revision. A hand-written list of adapter names in this file would be the set-literal-drift
// class this milestone exists to delete — and it would be the drift landing inside the case written
// to catch drift. Two floors sit under the derivation: an EMPTY set throws naming the revision,
// because a byte comparison over nothing passes without comparing anything; and the derived count is
// asserted against ROLE_COUNT, which is produced by an authority this file does not consult for the
// derivation, so a SILENTLY SHORT set is caught as well as an empty one.
//
// RECORDED RESIDUAL, the same one plan 29-39 recorded for its own commit-pinned census: this case
// depends on the pinned commit remaining REACHABLE in this repository. A history rewrite that drops
// it turns both cases into a named `git ls-tree failed` throw rather than a silent pass — the
// failure direction is loud, which is what makes the residual acceptable rather than merely
// disclosed.
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

import { listAgentAdapters, ROLE_COUNT } from "./kit-model.js";

const ROOT = join(import.meta.dirname, "..");

// The generator's fixed-literal output directory, mirrored here as a fixed literal too. It is both
// the path inside the pinned tree object and the path on the working tree, so neither side can be
// pointed somewhere else.
const ADAPTER_DIR = ".claude/agents";

/**
 * THE PIN — the commit this phase started from, taken 2026-08-19, before any generator change.
 *
 * This is the tree whose adapter bytes MODEL-01's "byte-identical to today's" refers to. It is
 * asserted against a git revision rather than against the working tree for the reason the module
 * header states at length: the freshness gate regenerates and byte-compares BOTH SIDES from the same
 * generator, and therefore proves determinism rather than identity-with-yesterday. A frozen
 * revision cannot be moved by editing the working tree, so the comparison has a genuinely
 * independent second opinion on one side of it.
 *
 * RESIDUAL: this case depends on this commit remaining reachable in this repository. If it is ever
 * dropped by a history rewrite, both cases below throw naming the revision — they do not pass.
 *
 * THE FULL FORTY-CHARACTER OBJECT NAME IS PINNED, NOT AN ABBREVIATION (finding IN-06). It was
 * `6f8411e`, a seven-character prefix. An abbreviation is unique only until history grows one that
 * collides with it, and the failure that follows is worse than loud — it is MISLEADING: `git
 * ls-tree` errors on an ambiguous name, and the throw immediately below would report it as "the
 * pinned baseline tree could not be read", sending a reader to look for a lost commit rather than
 * for an ambiguous prefix. The full name was RESOLVED in this repository rather than copied:
 * `git rev-parse 6f8411e` → `6f8411effe80b3f22d0d668e1fa40fa78e3a8088`. A case below asserts this
 * constant's length and character class so an abbreviation cannot return through a later edit.
 */
const PRE_PHASE_ADAPTER_BASELINE = "6f8411effe80b3f22d0d668e1fa40fa78e3a8088";

/**
 * Derive the adapter filenames present at a revision, out of the git object store.
 *
 * `-r` so the listing is by full path beneath the adapter directory at any depth, matching the
 * recursive shape of the adapter-set authority this file compares against. The two floors described
 * in the module header live here: a non-zero spawn is a throw naming the revision, and an empty
 * derivation is a throw stating the premise is empty.
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
    .filter((n) => n.endsWith(".md"))
    .sort();
  if (names.length === 0) {
    throw new Error(
      `no adapter files found at ${rev}:${ADAPTER_DIR} — the premise is empty, and a byte comparison over an empty set passes without comparing anything`,
    );
  }
  return names;
};

/**
 * Read one adapter's bytes at a revision. No encoding is passed, so stdout arrives as a Buffer and
 * the comparison below is over BYTES rather than over a decoded string — a decode would normalise
 * away exactly the differences this file exists to catch.
 */
const baselineBytes = (rev: string, name: string): Buffer => {
  const objectPath = `${rev}:${ADAPTER_DIR}/${name}`;
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

describe("MODEL-01: the adapters are byte-identical to the pre-phase baseline (plan 29.1-01)", () => {
  it("the pinned baseline is a full 40-character object name, never an abbreviation", () => {
    // FINDING IN-06, PINNED SO IT CANNOT COME BACK. This case is about the SHAPE of the pin, not
    // about which commit it is: an abbreviation is unique only until it collides, and the throw a
    // collision produces misdescribes the failure as an unreachable tree. Asserting the length and
    // the character class separately means "someone shortened it" and "someone pasted something
    // that is not an object name" are two different reds with two different remedies.
    expect(PRE_PHASE_ADAPTER_BASELINE).toHaveLength(40);
    expect(/^[0-9a-f]{40}$/.test(PRE_PHASE_ADAPTER_BASELINE)).toBe(true);
  });

  it("every adapter frozen at the pinned commit matches the working tree BYTE for BYTE", () => {
    // ── THE PREMISE, BEFORE THE CLAIM. ───────────────────────────────────────────────────────
    const names = baselineAdapterNames(PRE_PHASE_ADAPTER_BASELINE);
    // The count is derived INDEPENDENTLY of the loop that consumes it: ROLE_COUNT is the kit
    // authority's two-sided cardinality, and this derivation never consulted it. A short listing is
    // therefore a named failure rather than a smaller clean run.
    expect(
      names.length,
      `the pinned baseline at ${PRE_PHASE_ADAPTER_BASELINE} yielded ${String(names.length)} adapter(s), but the kit authority pins the role corpus at ${String(ROLE_COUNT)} — a SHORT derivation compares fewer files than it claims to and reports a clean run over the remainder`,
    ).toBe(ROLE_COUNT);

    // ── THE CLAIM. ───────────────────────────────────────────────────────────────────────────
    // Findings are accumulated rather than thrown on the first mismatch, so a run reports EVERY
    // adapter that moved instead of the alphabetically first one, and each finding carries both
    // byte lengths rather than a bare boolean.
    const differing: string[] = [];
    for (const name of names) {
      const baseline = baselineBytes(PRE_PHASE_ADAPTER_BASELINE, name);
      let working: Buffer;
      try {
        working = readFileSync(join(ROOT, ADAPTER_DIR, name));
      } catch (e) {
        // Fail closed: an unreadable working adapter is never treated as absent-and-therefore-fine.
        differing.push(
          `${name} — baseline ${String(baseline.length)} bytes, working tree UNREADABLE: ${e instanceof Error ? e.message : String(e)}`,
        );
        continue;
      }
      if (!baseline.equals(working)) {
        differing.push(
          `${name} — baseline ${String(baseline.length)} bytes, working tree ${String(working.length)} bytes`,
        );
      }
    }

    expect(
      differing,
      `the adapter bytes moved against the pinned pre-phase baseline ${PRE_PHASE_ADAPTER_BASELINE}. MODEL-01 requires the zero-config path to be byte-identical to that tree, not merely equivalent to it — regenerating does not settle this, because the freshness gate produces both of its sides from the same generator`,
    ).toEqual([]);
  });

  it("the working adapter directory holds EXACTLY the baseline set — none added, none removed", () => {
    // A byte comparison walks the BASELINE set, so an adapter ADDED since the pin is invisible to
    // the case above: nothing in the baseline names it, so nothing compares against it. Both
    // directions of the set difference are named here.
    const baselineNames = baselineAdapterNames(PRE_PHASE_ADAPTER_BASELINE);
    const workingNames = listAgentAdapters(ROOT);

    expect(
      workingNames.length,
      `the working adapter directory holds ${String(workingNames.length)} adapter(s) against the kit authority's pinned ${String(ROLE_COUNT)} — the set this case judges is the wrong size before either difference below is even taken`,
    ).toBe(ROLE_COUNT);

    expect(
      workingNames.filter((n) => !baselineNames.includes(n)),
      `EXTRA adapter(s) on the working tree that the pinned baseline ${PRE_PHASE_ADAPTER_BASELINE} does not carry — an added adapter is outside every byte comparison in this file and must be accounted for deliberately`,
    ).toEqual([]);

    expect(
      baselineNames.filter((n) => !workingNames.includes(n)),
      `MISSING adapter(s) that the pinned baseline ${PRE_PHASE_ADAPTER_BASELINE} carries and the working tree does not — a deleted adapter has no working bytes to compare and would otherwise leave the byte case one comparison short`,
    ).toEqual([]);
  });
});

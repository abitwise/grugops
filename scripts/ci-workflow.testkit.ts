// ci-workflow.testkit.ts — the ONE authority over "where is the ubuntu gate block of
// .github/workflows/ci.yml, and what does it run" (Phase 29.1, plan 29.1-24, closing R3-IN-03).
//
// THIS IS THE ONLY IMPLEMENTATION OF THAT QUESTION, AND A SECOND ONE IS A DEFECT RATHER THAN A
// DUPLICATION. Every test that needs the block's step name, the derived prefix that locates it, the
// step-boundary marker that bounds it on the right, the workflow path, the region itself or the
// region's command lines asks this module. A file that answers any of those questions with its own
// code is not sharing a helper differently — it is a second grammar over one fact, and two grammars
// over one fact is the failure class this milestone exists to delete. `(r-class-authority)` in
// scripts/check-foundation-guards.test.ts derives its member set from the IMPORT of this module and
// asserts that no other `scripts/*.test.ts` carries a locator of its own.
//
// IT IS CONSUMED BY TESTS ONLY AND IMPORTED BY NO PRODUCTION SCRIPT, WHICH IS WHY IT IS A TESTKIT
// AND NOT A PROMOTION INTO A SHIPPED MODULE. Sharing this reader was previously refused on the
// argument that the only two options were copying it — two authorities over one predicate — or
// promoting it into a production module that only tests consume, which is a shipped surface added
// for a test. This module answers the second horn: nothing that ships imports it. The property is
// asserted by a derived scan in `(r-class-authority)` rather than by this paragraph.
//
// WHY IT EXISTS AT ALL. Round 4 of this phase measured that `(r-class-prefix)` — the case that
// certified "these two readers read ONE region" — was structurally incapable of failing for either
// of its two members. It compared CANONICAL SOURCE SPELLINGS across a derived member set, and the
// constants that STATE those spellings are declared in the very files the case searches. Applying
// the exact divergence the finding named (slicing from the locator index rather than from the end of
// the step name) produced a failure set byte-for-byte identical to the unmutated baseline. Round 4's
// suggested cheap repair — strip `const NAME =` declaration lines before the containment tests — was
// measured against this tree and REDS A CORRECT TREE: after stripping, the right-bound marker's
// canonical spelling occurs ZERO times in BOTH members, because the only place either file spells
// those bytes IS the declaration. So the fix is structural. There is one implementation, both
// readers consume it, and "this class reads one region" is true by construction rather than
// certified by comparing source text a member's own declaration can supply.
//
// Clear professional voice throughout (CLAUDE.md hard rule for tooling and safety surfaces).
// .github/workflows/ci.yml is READ here and never written to; the synthetic-input builder below
// assembles its variant in memory.

import { readFileSync } from "node:fs";
import { join } from "node:path";

/** The repository root, resolved from this module's own directory rather than from a caller's cwd. */
const ROOT = join(import.meta.dirname, "..");

/**
 * The ubuntu-only gate block's step name, spelled ONCE in this repository's TypeScript surface.
 *
 * Every other reference — in code, in an assertion message, in a fixture or in a comment — is to
 * this constant. `(r-class-authority)` asserts that no `scripts/*.test.ts` outside the member set
 * carries the prefix below, and the plan that created this module pinned the tree at exactly one
 * `.ts` file spelling these bytes.
 */
export const UBUNTU_BLOCK_STEP_NAME = "Freshness gates + repo gates (ubuntu only)";

/**
 * The step-boundary marker: a newline, the workflow's six-space step indentation, and the step key.
 *
 * These bytes were read out of .github/workflows/ci.yml rather than remembered. `(r-bound)` asserts
 * the workflow really does carry markers spelled this way, because a right bound whose needle
 * matches nothing is not a bound — it is the unbounded read wearing a bound's name.
 */
export const STEP_MARKER = "\n      - name: ";

/**
 * The step-name prefix membership is decided by, DERIVED from the full name rather than typed
 * beside it. (Plan 29.1-19, R3-IN-03.)
 *
 * Membership used to be the FULL step name including its `(ubuntu only)` qualifier, so a future
 * reader locating this block by the shorter spelling was not a member, was never required to carry
 * the bound, and moved no pinned count — an invisible non-member rather than a red. The prefix is
 * cut from the full name at its qualifier, so the two are derived from one another and cannot drift
 * apart; `(r-class-authority)` asserts both that derivation and that exactly one step in the
 * committed workflow begins with it, so widening has not made the locator ambiguous.
 */
export const UBUNTU_BLOCK_STEP_PREFIX = UBUNTU_BLOCK_STEP_NAME.slice(
  0,
  UBUNTU_BLOCK_STEP_NAME.indexOf(" ("),
);

/** The committed workflow text. One path spelling, resolved from this module's own directory. */
export function ciWorkflow(): string {
  return readFileSync(join(ROOT, ".github", "workflows", "ci.yml"), "utf8");
}

/**
 * The ubuntu gate block: from the END of its step name to the NEXT step marker, or to end of file.
 *
 * BOUNDED ON THE RIGHT ON PURPOSE, AND THE FALLBACK IS NOT THE GUARANTEE. The block is the LAST
 * step in the workflow today, so on the committed file the bound lands on end-of-file either way —
 * which is exactly why it is written now rather than when it first matters.
 *
 * WHAT PROVES IT, AND WHAT DOES NOT. (Plan 29.1-19, R3-WR-01) An earlier docstring claimed
 * `(r-bound)` asserted the boundedness as a property. It did not: the assertion it pointed at probed
 * the RETURNED slice for a step marker, which neither branch of the return below can ever contain,
 * so its failure message was unreachable on every possible input and the file stayed green with the
 * bound deleted. The property is proven instead by `(r-bound-synthetic)` in
 * scripts/check-foundation-guards.test.ts and by `Case 8b` in scripts/skill-twins-freshness.test.ts,
 * over a workflow that HAS a following step, with a bounded-versus-unbounded control on the same
 * bytes that reds on every run if this bound is removed.
 *
 * THE SLICE BASE IS `at + UBUNTU_BLOCK_STEP_NAME.length`, NOT A BARE `at`. (Plan 29.1-19, R3-IN-03.)
 * The two readers of this block did not read the same region: one sliced from the end of the step
 * name, the other from the locator index. Measured on the committed workflow: 20 command entries
 * against 21, the extra entry being the step name itself — the region's own heading rather than
 * anything the region runs. This base returns a region rather than a region plus its heading. The
 * difference is now proven by `(r-base-discriminating)`, which computes both regions and compares
 * them, rather than by any scan over source spellings.
 *
 * Shape follows scripts/model-dial-consistency.test.ts `scopeSection()`, this repository's existing
 * worked example of a section reader bounded on the right, rather than inventing a second one.
 */
export function ubuntuBlock(ci: string): string {
  const at = ci.indexOf(UBUNTU_BLOCK_STEP_NAME);
  if (at === -1) {
    throw new Error(
      "CI wiring oracle: .github/workflows/ci.yml does not carry the step name " +
        `"${UBUNTU_BLOCK_STEP_NAME}" — refusing to read a block that is not there`,
    );
  }
  const rest = ci.slice(at + UBUNTU_BLOCK_STEP_NAME.length);
  const next = rest.indexOf(STEP_MARKER);
  return next === -1 ? rest : rest.slice(0, next);
}

/**
 * The block's COMMAND lines: trimmed, non-empty, and with comment lines dropped.
 *
 * The block is roughly four-fifths comment, so a probe over its raw text is a probe over prose. A
 * comment reading `# we used to run npm run generate:adapters here` satisfies a substring match with
 * the command itself deleted. Membership and ordering are decided over THIS list, by exact line
 * equality.
 */
export function ubuntuBlockCommands(ci: string): string[] {
  return ubuntuBlock(ci)
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith("#"));
}

/**
 * The committed workflow text plus ONE synthetic following step, in memory only.
 *
 * (Plan 29.1-19, R3-WR-01) The committed workflow's ubuntu block is its LAST step, so the search for
 * a following step marker returns -1 on this tree and BOTH branches of the bounded reader return the
 * same bytes. A bound the committed tree cannot exercise is proven on an input that carries what the
 * tree lacks — a following step — assembled here rather than written to disk.
 * .github/workflows/ci.yml is never written to, not even temporarily.
 *
 * The step is spelled with `STEP_MARKER` itself rather than with a hand-typed `- name:` line, so the
 * input a case proves the bound against and the bound's own needle cannot drift apart.
 *
 * THE NAME AND THE COMMAND ARE PARAMETERS, because they are INPUTS rather than grammar. The two
 * members that consume this builder pass different commands on purpose, and each one's choice
 * belongs beside the case that reasons about it. What must not vary — the marker, the indentation,
 * the shape of the appended step — is fixed here.
 */
export function withAppendedStep(ci: string, stepName: string, command: string): string {
  return `${ci}${STEP_MARKER}${stepName}\n        run: |\n          ${command}\n`;
}

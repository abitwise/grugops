// vacuity.ts — the ONE element-level vacuity rule (Phase 29 / AP-1, D-08).
//
// A gate may not print a PASS line without stating how many ELEMENTS it visited, and a check that
// visited zero elements is a check that was NOT performed. Four gates in this repository had
// arrived at the same defect independently — a vacuity floor that exists at the COLLECTION level
// (`the scan set derived zero members`) but not at the ELEMENT level (`the loop ran zero times`) —
// and the canonical instance was fixed inline in scripts/check-uat-oracles.ts:336-358. That fix is
// one two-sided check in one gate, not a mechanism.
//
// ---------------------------------------------------------------------------------------------
// THIS IS ONE RULE CLOSED AT THE CALL CONVENTION, DELIBERATELY NOT FOUR ONE-OFF ZERO CHECKS.
//
// The instruction this module answers is recorded verbatim at
// .planning/phases/28-kit-consistency-audit/.continue-here.md:
//
//   "Three of the four are one shape: a vacuity floor that exists at the collection level but not
//    at the element level. Fixing them one at a time, four times, would repeat the mistake —
//    consider whether one element-level vacuity rule belongs ... as the shared authority."
//
// So the measurement is a REQUIRED ARGUMENT rather than a habit. `pass(msg)` in
// check-foundation-guards.ts accepts an arbitrary string and prints it unconditionally; nothing in
// the type system or the call convention relates a PASS line to the number of elements the check
// actually examined. `reportMeasured` cannot be called without supplying `visited` and `expected`,
// and it will not emit a PASS line for either a zero visit count or a short scan set.
//
// A per-guard `if (n === 0)` check is the forbidden alternative, named so it is not rediscovered as
// a good idea: the fifth guard is the one that forgets, and a guard that forgets prints green.
// ---------------------------------------------------------------------------------------------
//
// ---------------------------------------------------------------------------------------------
// WHY THIS EMITS THROUGH fail() AND NEVER THROUGH warn().
//
// check-foundation-guards.ts:321-325 declares warn() advisory: it writes a line and DOES NOT
// increment FAILS. That is load-bearing for the two-tier byte ceilings (D-07), where a WARN is the
// "approaching the cap" early signal rather than a build break. Routing a vacuity refusal through
// warn() would print a green build over a check that never ran — the exact outcome this module
// exists to make impossible. The `emit` parameter therefore declares only `pass` and `fail`; there
// is no `warn` member to reach for.
// ---------------------------------------------------------------------------------------------
//
// Strictly declarative plus one pure fold: no I/O, no process.exit, no side effects beyond the
// caller's own `emit`, zero npm dependencies. The caller owns the exit code; this module owns only
// the verdict shape.

// What a guard measured while it did its work.
export interface Measured<T> {
  // What was checked, in the words the PASS/FAIL line will carry.
  readonly label: string;
  // Elements ACTUALLY examined. NEVER a constant: it is incremented by the loop that does the work,
  // so a guard that skips its loop reports 0 and fails its own floor below.
  readonly visited: number;
  // The DERIVED denominator (a role count, a bullet count, a scan-set size) — never hand-typed, so
  // it composes with this milestone's founding rule that a set is derived and its count asserted.
  readonly expected: number;
  readonly findings: readonly T[];
}

/**
 * Fold a Measured into an aggregator. Returns the FAIL delta, so a caller writes
 * `FAILS += reportMeasured(...)` and keeps its existing counter.
 *
 * Four ordered branches, and the order is the point: a zero-element run is reported as "not
 * performed" rather than as "no findings", and a short scan set is reported before any finding, so
 * a narrowed check can never be read as a clean one.
 */
export function reportMeasured<T>(
  m: Measured<T>,
  emit: { pass(s: string): void; fail(s: string): void },
  render: (f: T) => string,
): number {
  // (1) VACUITY FLOOR — element level. A zero-element run can never print PASS.
  if (m.visited === 0) {
    emit.fail(
      `${m.label}: ZERO elements visited (expected ${m.expected}) — this check was NOT performed. ` +
        `A PASS line here would state a check that did not run.`,
    );
    return 1;
  }
  // (2) DENOMINATOR FLOOR — collection level. A short scan set is a silently narrowed check.
  if (m.visited !== m.expected) {
    emit.fail(
      `${m.label}: visited ${m.visited} of ${m.expected} elements — the scan set is short, ` +
        `so the result covers less than it claims`,
    );
    return 1;
  }
  // (3) FINDINGS — the count is reported over the visited total, never bare.
  if (m.findings.length > 0) {
    emit.fail(
      `${m.label}: ${m.findings.length} finding(s) over ${m.visited} elements\n` +
        m.findings.map(render).join("\n"),
    );
    return 1;
  }
  // (4) The PASS line CARRIES THE MEASUREMENT (D-08) — never an assertion.
  emit.pass(`${m.label}: 0 findings over ${m.visited}/${m.expected} elements`);
  return 0;
}

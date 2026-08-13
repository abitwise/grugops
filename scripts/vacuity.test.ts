// vacuity.test.ts — the shared element-level vacuity rule (Phase 29 / AP-1, D-08, plan 29-01).
//
// WHAT THIS FILE IS FOR. `reportMeasured` is the mechanism that makes "a PASS line must never state a
// check that was not performed" structural instead of disciplinary. It is a pure fold with no I/O, so
// unlike the guards it can be exercised directly — but the property under test is a REFUSAL, and a
// refusal is only proven by a case that would have passed without it. Every case below therefore
// asserts the CHANNEL as well as the verdict: which of `pass`/`fail` was called, and what the FAIL
// delta was. Asserting only the returned number would pass against a fold that printed a PASS line
// and returned 1.
//
// The `emit` object deliberately has no `warn` member, because `warn()` in the aggregator does not
// increment FAILS; a case below asserts that the fold cannot reach one even if a caller supplied it.
//
// NOT in the e2e lane (project memory: `npm test` triggers the live claude-CLI lane). Run it with:
//   npx vitest run --exclude '**/scripts/e2e/**' scripts/vacuity.test.ts
// Vitest globals:false → import explicitly.

import { describe, it, expect } from "vitest";
import { reportMeasured, type Measured } from "./vacuity.js";

type Emitted = { channel: "pass" | "fail"; text: string };

function collect(): { emit: { pass(s: string): void; fail(s: string): void }; log: Emitted[] } {
  const log: Emitted[] = [];
  return {
    log,
    emit: {
      pass: (s: string) => log.push({ channel: "pass", text: s }),
      fail: (s: string) => log.push({ channel: "fail", text: s }),
    },
  };
}

const render = (f: string): string => `  ${f}`;

describe("reportMeasured — the vacuity floor (branch 1)", () => {
  it("a ZERO-visited measurement FAILS, returns a delta of 1, and never emits a PASS line", () => {
    const { emit, log } = collect();
    const m: Measured<string> = {
      label: "caveman voice",
      visited: 0,
      expected: 17,
      findings: [],
    };
    expect(reportMeasured(m, emit, render)).toBe(1);
    expect(log).toHaveLength(1);
    // THE CHANNEL IS THE PROPERTY. Zero findings over zero elements is exactly the shape that would
    // otherwise print `0 findings over 0/17 elements` and read as green.
    expect(log[0].channel).toBe("fail");
    expect(log[0].text).toContain("ZERO elements visited");
    expect(log[0].text).toContain("expected 17");
    expect(log[0].text).toContain("this check was NOT performed");
  });

  it("the zero-visited branch outranks the findings branch — it cannot be masked by having findings", () => {
    const { emit, log } = collect();
    expect(
      reportMeasured(
        { label: "x", visited: 0, expected: 3, findings: ["a"] },
        emit,
        render,
      ),
    ).toBe(1);
    expect(log[0].text).toContain("ZERO elements visited");
  });
});

describe("reportMeasured — the denominator floor (branch 2)", () => {
  it("a SHORT scan set FAILS naming BOTH numbers", () => {
    const { emit, log } = collect();
    expect(
      reportMeasured(
        { label: "caveman voice", visited: 16, expected: 17, findings: [] },
        emit,
        render,
      ),
    ).toBe(1);
    expect(log[0].channel).toBe("fail");
    expect(log[0].text).toContain("visited 16 of 17 elements");
    expect(log[0].text).toContain("the scan set is short");
  });

  it("a scan set LONGER than expected also FAILS — the floor is an equality, not a minimum", () => {
    // A silently WIDENED subject is the mirror image of a silently narrowed one: an eighteenth role
    // arriving without anyone updating ROLE_COUNT must be visible, not absorbed.
    const { emit, log } = collect();
    expect(
      reportMeasured(
        { label: "caveman voice", visited: 18, expected: 17, findings: [] },
        emit,
        render,
      ),
    ).toBe(1);
    expect(log[0].channel).toBe("fail");
    expect(log[0].text).toContain("visited 18 of 17 elements");
  });
});

describe("reportMeasured — findings (branch 3) and the measured PASS (branch 4)", () => {
  it("findings FAIL with the count over the visited total and every rendered finding", () => {
    const { emit, log } = collect();
    expect(
      reportMeasured(
        { label: "role clause uniqueness", visited: 17, expected: 17, findings: ["one", "two"] },
        emit,
        render,
      ),
    ).toBe(1);
    expect(log[0].channel).toBe("fail");
    expect(log[0].text).toContain("2 finding(s) over 17 elements");
    expect(log[0].text).toContain("  one");
    expect(log[0].text).toContain("  two");
  });

  it("THE ONLY PASS PATH: full denominator, zero findings — and the line CARRIES the measurement", () => {
    // The false-red control. Without it every refusal above is satisfied by a fold that never passes,
    // which is the trivially-red gate this whole discipline exists to rule out.
    const { emit, log } = collect();
    expect(
      reportMeasured(
        { label: "caveman voice", visited: 17, expected: 17, findings: [] },
        emit,
        render,
      ),
    ).toBe(0);
    expect(log).toHaveLength(1);
    expect(log[0].channel).toBe("pass");
    // D-08's literal shape. LANG-06's "publishes a number with a denominator" is this string.
    expect(log[0].text).toBe("caveman voice: 0 findings over 17/17 elements");
  });

  it("the PASS line never asserts — it states only what was measured", () => {
    const { emit, log } = collect();
    reportMeasured(
      { label: "role clause uniqueness", visited: 17, expected: 17, findings: [] },
      emit,
      render,
    );
    expect(log[0].text).toMatch(/^role clause uniqueness: 0 findings over 17\/17 elements$/);
  });
});

describe("reportMeasured — the channel contract", () => {
  it("NEVER emits through warn(), even when a caller supplies one", () => {
    // warn() does not increment FAILS in the aggregator, so a vacuity refusal routed through it would
    // print a green build over a check that did not run. The fold must be structurally unable to
    // reach it: the parameter type declares only pass and fail, and this case proves the runtime
    // behaviour matches the type by handing it an object that would record a warn if one happened.
    const warned: string[] = [];
    const { emit, log } = collect();
    const withWarn = { ...emit, warn: (s: string) => warned.push(s) };
    for (const m of [
      { label: "x", visited: 0, expected: 5, findings: [] },
      { label: "x", visited: 4, expected: 5, findings: [] },
      { label: "x", visited: 5, expected: 5, findings: ["f"] },
      { label: "x", visited: 5, expected: 5, findings: [] },
    ] as Measured<string>[]) {
      reportMeasured(m, withWarn, render);
    }
    expect(warned).toEqual([]);
    expect(log).toHaveLength(4);
    expect(log.map((e) => e.channel)).toEqual(["fail", "fail", "fail", "pass"]);
  });

  it("the returned delta equals the number of FAIL emissions, so `FAILS += reportMeasured(...)` cannot drift from the output", () => {
    for (const m of [
      { label: "x", visited: 0, expected: 5, findings: [] },
      { label: "x", visited: 4, expected: 5, findings: [] },
      { label: "x", visited: 5, expected: 5, findings: ["f", "g"] },
      { label: "x", visited: 5, expected: 5, findings: [] },
    ] as Measured<string>[]) {
      const { emit, log } = collect();
      const delta = reportMeasured(m, emit, render);
      expect(delta).toBe(log.filter((e) => e.channel === "fail").length);
    }
  });
});

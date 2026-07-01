// measure-cost.test.ts — the DOGF-03 fixture test for the honest cost harness (D-10 / D-11).
//
// Proves the load-bearing honesty contract of scripts/measure-cost.ts WITHOUT ever invoking the live
// `claude` CLI: the harness returns `UNKNOWN - verify` and NEVER a fabricated number for absent,
// unconfirmed-schema, and malformed input. The strongest no-fabrication proof is structural — across
// every branch, the numeric fields (input/output/total) are `undefined`; no number is ever emitted,
// so no external benchmark can leak in as grugops's own.
//
// Drives the COMMITTED compiled harness (./measure-cost.js), not the .ts, and spawns NO child process
// or live CLI — this is a pure fixture over hand-built payloads. `globals:false` house style: vitest
// fns are imported explicitly.

import { describe, it, expect } from "vitest";
import { measureCost, type CostMeasurement } from "./measure-cost.js";

// Assert the shared honesty invariant for a measurement: the note is the honest default and NO numeric
// field was fabricated. Reused by every branch so the no-fabrication proof is uniform.
function expectHonestDefault(result: CostMeasurement): void {
  expect(typeof result.note).toBe("string");
  expect(result.note).toContain("UNKNOWN - verify");
  // The no-fabrication keystone: a number appears ONLY after a real authed schema is mapped in — never
  // in these branches. Every numeric field stays undefined, so no benchmark figure can be returned.
  expect(result.input).toBeUndefined();
  expect(result.output).toBeUndefined();
  expect(result.total).toBeUndefined();
}

describe("measureCost — honest UNKNOWN - verify default (DOGF-03 / D-10)", () => {
  it("returns UNKNOWN - verify with no numeric total when no usage object is present", () => {
    // A well-formed --output-format json payload that simply carries no aggregate usage object.
    const result = measureCost({ type: "result", subtype: "success", is_error: false });
    expectHonestDefault(result);
  });

  it("STILL returns UNKNOWN - verify for a usage-shaped payload (schema unconfirmed this session)", () => {
    // Even when a plausible usage object is present at a candidate path, the field schema is not
    // confirmed against a real authed capture this session, so the harness must NOT map fields — the
    // honest default holds (D-10). Two candidate shapes exercised: top-level and result-nested.
    const topLevel = measureCost({ usage: { input_tokens: 123, output_tokens: 45 } });
    expectHonestDefault(topLevel);

    const nested = measureCost({ result: { usage: { input_tokens: 999, output_tokens: 111 } } });
    expectHonestDefault(nested);
  });

  it("never throws and returns UNKNOWN - verify for malformed / garbage input", () => {
    const garbage: unknown[] = [
      null,
      undefined,
      "not json at all",
      42,
      [],
      [{ usage: { input_tokens: 5 } }], // array, not the object the harness expects
      { usage: null },
      { usage: "nope" },
      { result: null },
      { result: { usage: 7 } },
    ];
    for (const input of garbage) {
      // The behavioral contract: no throw on any shape, and the honest default every time.
      expect(() => measureCost(input)).not.toThrow();
      expectHonestDefault(measureCost(input));
    }
  });

  it("never fabricates a number — no branch ever populates a numeric field", () => {
    // A direct restatement of the no-fabrication rule across a representative spread of inputs: the
    // returned object carries a note but zero numeric fields, so no benchmark figure can be asserted.
    const inputs: unknown[] = [
      {},
      { usage: {} },
      { usage: { input_tokens: 1, output_tokens: 2, total_tokens: 3 } },
      { result: { usage: { input_tokens: 10 } } },
    ];
    for (const input of inputs) {
      const result = measureCost(input);
      const numericFields = [result.input, result.output, result.total];
      expect(numericFields.every((v) => v === undefined)).toBe(true);
    }
  });
});

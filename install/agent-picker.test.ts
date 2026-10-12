// agent-picker.test.ts — the agent checkbox list as a pure state machine (phase 34.1, D-02; plan 34.1-12).
//
// Every case drives install/agent-picker.ts with an injected key stream: no terminal, no process, no environment
// variable. The raw-mode reader that feeds it at a real terminal (install.ts pickAgents) is covered by the pty cases in
// install/install.test.ts ("agent picker at a terminal (D-02)").
//
// Clear professional voice: test infrastructure for an installer surface.

import { describe, it, expect } from "vitest";
import { decodeKeys, initialPicker, render, step, type PickerKey, type PickerState, type PickerStep } from "./agent-picker.js";

/** Feeds chunks through decodeKeys and step, as pickAgents does, and returns the end of the run. */
function drive(chunks: readonly string[], checked: readonly boolean[]): { end: PickerStep; keys: PickerKey[] } {
  let state: PickerState = initialPicker(checked);
  let carry = "";
  const keys: PickerKey[] = [];
  for (const chunk of chunks) {
    const decoded = decodeKeys(chunk, carry);
    carry = decoded.carry;
    for (const key of decoded.keys) {
      keys.push(key);
      const next = step(state, key);
      if ("done" in next) return { end: next, keys };
      state = next;
    }
  }
  return { end: state, keys };
}

const ROWS = [
  { label: "Alpha", hint: "" },
  { label: "Beta", hint: "" },
  { label: "Gamma", hint: "" },
];

describe("agent picker tracer: down, space, Enter (D-02)", () => {
  it("over three unchecked rows, down then space then Enter confirms with only row 1 checked", () => {
    const { end, keys } = drive(["\x1b[B", " ", "\r"], [false, false, false]);
    expect(keys).toEqual(["down", "toggle", "confirm"]);
    expect(end).toEqual({ done: "confirm", checked: [false, true, false] });
  });

  it("the first frame moves nothing; the second moves up exactly the first frame's line count and clears below", () => {
    const first = render(initialPicker([false, false, false]), ROWS, 0);
    expect(first.text).not.toContain("\x1b[");
    expect(first.lines).toBe(ROWS.length + 1);
    expect(first.text.split("\n").length - 1, "every line the frame counts ends with a newline").toBe(first.lines);
    const second = render({ cursor: 1, checked: [false, true, false] }, ROWS, first.lines);
    expect(second.text.startsWith(`\r\x1b[${first.lines}A\x1b[J`)).toBe(true);
    expect(second.lines).toBe(first.lines);
  });
});

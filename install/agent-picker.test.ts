// agent-picker.test.ts — the agent checkbox list as a pure state machine (phase 34.1, D-02; plan 34.1-12).
//
// Every case drives install/agent-picker.ts with an injected key stream: no terminal, no process, no environment
// variable. The raw-mode reader that feeds it at a real terminal (install.ts pickAgents) is covered by the pty cases in
// install/install.test.ts ("agent picker at a terminal (D-02)").
//
// Clear professional voice: test infrastructure for an installer surface.

import { describe, it, expect } from "vitest";
import {
  PICKER_HEADER,
  SHOW_CURSOR,
  decodeKeys,
  initialPicker,
  pickerRows,
  render,
  restoreTerminal,
  screenLines,
  step,
  type PickerKey,
  type PickerState,
  type PickerStep,
} from "./agent-picker.js";

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

// ── the whole key class ─────────────────────────────────────────────────────────────────────────────────────────────

/** The meaning of every single byte other than ESC, written once: the rest of the 256 are `other`. */
const BYTE_KEYS: ReadonlyMap<number, PickerKey> = new Map<number, PickerKey>([
  [0x20, "toggle"],
  [0x0d, "confirm"],
  [0x0a, "confirm"],
  [0x03, "abort"],
  [0x6b, "up"], // k
  [0x6a, "down"], // j
]);

/** Every escape sequence the decoder must read as one key, whole. */
const SEQUENCES: readonly (readonly [string, PickerKey])[] = [
  ["\x1b[A", "up"],
  ["\x1bOA", "up"],
  ["\x1b[B", "down"],
  ["\x1bOB", "down"],
  ["\x1b[C", "other"], // right arrow
  ["\x1b[D", "other"], // left arrow
  ["\x1bOC", "other"],
  ["\x1bOP", "other"], // F1
  ["\x1b[H", "other"], // Home
  ["\x1b[3~", "other"], // Delete
  ["\x1b[1;5A", "other"], // Ctrl-Up: a modified arrow is not up
  ["\x1b[1;2B", "other"], // Shift-Down
  ["\x1b[200~", "other"], // bracketed paste start
];

describe("decodeKeys over the whole key class (D-02)", () => {
  it("every one of the 256 single bytes decodes as written in BYTE_KEYS, ESC alone is carried, and the rest are other", () => {
    let other = 0;
    for (let b = 0; b < 256; b++) {
      const c = String.fromCharCode(b);
      const d = decodeKeys(c, "");
      if (b === 0x1b) {
        expect(d, "a lone ESC is carried, never decoded").toEqual({ keys: [], carry: "\x1b" });
        continue;
      }
      const want = BYTE_KEYS.get(b) ?? "other";
      if (want === "other") other += 1;
      expect(d, `byte 0x${b.toString(16)}`).toEqual({ keys: [want], carry: "" });
    }
    expect(other, "every byte but ESC and the six meaningful ones is other").toBe(256 - 1 - BYTE_KEYS.size);
  });

  it("both arrow encodings and every other CSI or SS3 sequence decode as one key", () => {
    for (const [seq, key] of SEQUENCES) expect(decodeKeys(seq, ""), JSON.stringify(seq)).toEqual({ keys: [key], carry: "" });
  });

  it("every sequence split at every point across two reads decodes as the whole sequence does", () => {
    let splits = 0;
    for (const [seq, key] of SEQUENCES) {
      for (let at = 1; at < seq.length; at++) {
        const first = decodeKeys(seq.slice(0, at), "");
        expect(first, `${JSON.stringify(seq)} split at ${at}: the first read`).toEqual({ keys: [], carry: seq.slice(0, at) });
        const second = decodeKeys(seq.slice(at), first.carry);
        expect(second, `${JSON.stringify(seq)} split at ${at}: the second read`).toEqual({ keys: [key], carry: "" });
        splits += 1;
      }
    }
    expect(splits).toBe(SEQUENCES.reduce((n, [seq]) => n + seq.length - 1, 0));
  });

  it("the plan's two named splits: ESC then [A is up; ESC [ then B is down", () => {
    const a = decodeKeys("\x1b", "");
    expect(decodeKeys("[A", a.carry)).toEqual({ keys: ["up"], carry: "" });
    const b = decodeKeys("\x1b[", "");
    expect(decodeKeys("B", b.carry)).toEqual({ keys: ["down"], carry: "" });
  });

  it("a sequence split one byte per read across three reads still decodes as one key", () => {
    let carry = "";
    const keys: PickerKey[] = [];
    for (const c of "\x1bOB") {
      const d = decodeKeys(c, carry);
      carry = d.carry;
      keys.push(...d.keys);
    }
    expect({ keys, carry }).toEqual({ keys: ["down"], carry: "" });
  });

  it("an escape followed by a byte that is neither [ nor O is other for the escape, and the byte is decoded on its own", () => {
    expect(decodeKeys("\x1bx", "")).toEqual({ keys: ["other", "other"], carry: "" });
    expect(decodeKeys("\x1bj", "")).toEqual({ keys: ["other", "down"], carry: "" });
    expect(decodeKeys("\x1b ", "")).toEqual({ keys: ["other", "toggle"], carry: "" });
    expect(decodeKeys("\x1b\r", "")).toEqual({ keys: ["other", "confirm"], carry: "" });
    expect(decodeKeys("\x1b\x03", ""), "Ctrl-C after a lone ESC still cancels").toEqual({ keys: ["other", "abort"], carry: "" });
    expect(decodeKeys("\x1b\x1b[A", "")).toEqual({ keys: ["other", "up"], carry: "" });
  });

  it("a CSI sequence broken by a byte that cannot continue it is other, and the breaking byte keeps its meaning", () => {
    expect(decodeKeys("\x1b[1\x03", ""), "Ctrl-C inside a broken sequence still cancels").toEqual({ keys: ["other", "abort"], carry: "" });
    expect(decodeKeys("\x1b[\r", "")).toEqual({ keys: ["other", "confirm"], carry: "" });
  });

  it("several keys in one read decode in order, a trailing partial escape carried", () => {
    expect(decodeKeys("jj\x1b[A k\r\x1bO", "")).toEqual({ keys: ["down", "down", "up", "toggle", "up", "confirm"], carry: "\x1bO" });
  });
});

describe("step over the whole key class (D-02)", () => {
  const N = 4;
  const start = (cursor: number): PickerState => ({ cursor, checked: [true, false, true, false] });

  it("up and down wrap at both ends, and move by one everywhere else, leaving the checkboxes alone", () => {
    for (let c = 0; c < N; c++) {
      expect(step(start(c), "up")).toEqual({ cursor: (c + N - 1) % N, checked: start(c).checked });
      expect(step(start(c), "down")).toEqual({ cursor: (c + 1) % N, checked: start(c).checked });
    }
    expect((step(start(0), "up") as PickerState).cursor, "up from the first row wraps to the last").toBe(N - 1);
    expect((step(start(N - 1), "down") as PickerState).cursor, "down from the last row wraps to the first").toBe(0);
  });

  it("toggle flips exactly the row under the cursor, both ways, and does not change the state it was given", () => {
    for (let c = 0; c < N; c++) {
      const before = start(c);
      const copy = [...before.checked];
      const after = step(before, "toggle") as PickerState;
      expect(after.cursor).toBe(c);
      expect(after.checked).toEqual(copy.map((v, i) => (i === c ? !v : v)));
      expect(before.checked, "step mutated its input").toEqual(copy);
    }
  });

  it("confirm ends with the exact checked list; abort ends with nothing; other changes nothing", () => {
    expect(step(start(2), "confirm")).toEqual({ done: "confirm", checked: [true, false, true, false] });
    expect(step(start(2), "abort")).toEqual({ done: "abort" });
    expect(step(start(2), "other")).toEqual(start(2));
  });

  it("an empty list never moves or toggles (no division by zero)", () => {
    const empty = initialPicker([]);
    for (const k of ["up", "down", "toggle", "other"] as const) expect(step(empty, k)).toEqual(empty);
    expect(step(empty, "confirm")).toEqual({ done: "confirm", checked: [] });
  });
});

describe("render (D-02)", () => {
  it("draws the header, marks the cursor row, shows [x] and [ ], and carries each row's hint", () => {
    const rows = [
      { label: "Alpha", hint: "(installed)" },
      { label: "Beta", hint: "" },
      { label: "Gamma", hint: "(detected: .gamma)" },
    ];
    const frame = render({ cursor: 1, checked: [true, false, true] }, rows, 0);
    expect(frame.text.split("\n")).toEqual([
      PICKER_HEADER,
      "  [x] Alpha  (installed)",
      "> [ ] Beta",
      "  [x] Gamma  (detected: .gamma)",
      "",
    ]);
    expect(frame.lines).toBe(4);
  });

  it("lines counts screen lines: a line longer than the terminal wraps, and the next repaint moves up all of them", () => {
    expect(PICKER_HEADER.length, "PREMISE: the header is longer than an 80-column terminal").toBeGreaterThan(80);
    const rows = [{ label: "Alpha", hint: "" }];
    for (const columns of [20, 40, 80, 120, 200]) {
      const want = Math.ceil(PICKER_HEADER.length / columns) + 1;
      const first = render(initialPicker([false]), rows, 0, columns);
      expect(first.lines, `${columns} columns`).toBe(want);
      expect(render(initialPicker([true]), rows, first.lines, columns).text.startsWith(`\r\x1b[${want}A\x1b[J`)).toBe(true);
    }
    expect(render(initialPicker([false]), rows, 0).lines, "an unknown width counts each line once").toBe(2);
  });

  it("screenLines: exact width is one line, one more character is two, empty is one, an unknown or zero width is one", () => {
    expect(screenLines("x".repeat(80), 80)).toBe(1);
    expect(screenLines("x".repeat(81), 80)).toBe(2);
    expect(screenLines("x".repeat(160), 80)).toBe(2);
    expect(screenLines("", 80)).toBe(1);
    expect(screenLines("x".repeat(500), undefined)).toBe(1);
    expect(screenLines("x".repeat(500), 0)).toBe(1);
  });

  it("a repaint moves up exactly the given line count, whatever it is", () => {
    for (const prev of [1, 4, 7, 12]) expect(render(initialPicker([false]), [{ label: "A", hint: "" }], prev).text.startsWith(`\r\x1b[${prev}A\x1b[J`)).toBe(true);
  });
});

describe("pickerRows (D-02)", () => {
  const HOSTS = [
    { id: "alpha", name: "Alpha Agent", detect: ".alpha" },
    { id: "beta", name: "Beta Agent", detect: "beta.json" },
    { id: "gamma", name: "Gamma Agent", detect: ".gamma/x.md" },
  ];
  const subsets = (ids: readonly string[]): Set<string>[] =>
    Array.from({ length: 2 ** ids.length }, (_, m) => new Set(ids.filter((_, i) => (m & (1 << i)) !== 0)));

  it("over every installed and detected subset, exactly installed or detected starts checked, each row labelled why, in the given order", () => {
    const ids = HOSTS.map((h) => h.id);
    let cases = 0;
    for (const installed of subsets(ids)) {
      for (const detected of subsets(ids)) {
        const { rows, checked } = pickerRows(HOSTS, installed, detected);
        expect(rows.map((r) => r.label)).toEqual(HOSTS.map((h) => h.name));
        expect(checked).toEqual(HOSTS.map((h) => installed.has(h.id) || detected.has(h.id)));
        HOSTS.forEach((h, i) => {
          const why = [installed.has(h.id) ? "installed" : null, detected.has(h.id) ? `detected: ${h.detect}` : null].filter((w) => w !== null);
          expect(rows[i].hint, `${h.id} installed=${installed.has(h.id)} detected=${detected.has(h.id)}`).toBe(why.length > 0 ? `(${why.join("; ")})` : "");
        });
        cases += 1;
      }
    }
    expect(cases).toBe(4 ** HOSTS.length);
  });
});

// ── IN-18 (phase 34.1 gap round 1, D-26, brief CLEAN-1): the terminal is restored whatever throws ─────────────────────
// restoreTerminal is what pickAgents' finally block calls. Each row records the calls an io recorder receives: both
// steps are attempted, the write first, whichever of them throws, and restoreTerminal itself never throws.
describe("IN-18: restoreTerminal (D-26)", () => {
  const recorder = (writeThrows: boolean, rawThrows: boolean): { calls: string[]; io: { write(t: string): void; setRawMode(on: boolean): void } } => {
    const calls: string[] = [];
    return {
      calls,
      io: {
        write(t: string): void {
          calls.push(`write:${JSON.stringify(t)}`);
          if (writeThrows) throw new Error("write failed");
        },
        setRawMode(on: boolean): void {
          calls.push(`setRawMode:${on}`);
          if (rawThrows) throw new Error("setRawMode failed");
        },
      },
    };
  };
  const expectedCalls = [`write:${JSON.stringify(SHOW_CURSOR + "\n")}`, "setRawMode:false"];

  for (const writeThrows of [false, true]) {
    for (const rawThrows of [false, true]) {
      it(`write ${writeThrows ? "throws" : "succeeds"}, setRawMode ${rawThrows ? "throws" : "succeeds"}: both steps run, write first, and restoreTerminal does not throw`, () => {
        const r = recorder(writeThrows, rawThrows);
        expect(() => restoreTerminal(r.io)).not.toThrow();
        expect(r.calls).toEqual(expectedCalls);
      });
    }
  }

  it("a restore whose two steps both throw does not mask the error that ended the list", () => {
    const r = recorder(true, true);
    const list = (): void => {
      try {
        throw new Error("boom");
      } finally {
        restoreTerminal(r.io);
      }
    };
    expect(list).toThrow("boom");
    expect(r.calls).toEqual(expectedCalls);
  });

  it("SHOW_CURSOR is the ESC [ ? 2 5 h sequence", () => {
    expect([...SHOW_CURSOR].map((c) => c.charCodeAt(0))).toEqual([0x1b, 0x5b, 0x3f, 0x32, 0x35, 0x68]);
  });
});

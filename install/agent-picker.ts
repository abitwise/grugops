// agent-picker.ts — the interactive agent checkbox list as a pure state machine (phase 34.1, D-02).
//
// WHAT THIS OWNS. How the installer's checkbox list turns terminal key bytes into keys (decodeKeys), how a key changes
// the list (step), what the list looks like on screen (render), and which rows it shows and pre-checks (pickerRows).
// It owns no I/O: it imports nothing, reads no file, touches no terminal of its own and never exits. The raw-mode reader
// lives in install/install.ts (pickAgents): it puts the terminal in raw mode, reads standard input with the same
// synchronous readSync and EAGAIN wait as the installer's line prompts, feeds each chunk through decodeKeys and step,
// writes each render, and restores the terminal in a finally block through restoreTerminal, which is given the two
// terminal functions it calls (write and setRawMode) by pickAgents. Keeping the machine pure lets the tests drive every
// key and every split escape sequence without a terminal (no environment variable or file ever feeds it keys).
//
// KEYS. Up: ESC [ A, ESC O A, `k`. Down: ESC [ B, ESC O B, `j`. Toggle: space. Confirm: CR or LF. Abort: byte 0x03
// (Ctrl-C arrives as a byte in raw mode and raises no SIGINT). Every other byte or escape sequence is `other`, which
// changes nothing. An escape sequence split across two reads is carried to the next read, never guessed.
//
// Clear professional voice: these are installer strings.

/** One decoded key. `other` is every byte or sequence the list ignores. */
export type PickerKey = "up" | "down" | "toggle" | "confirm" | "abort" | "other";

/** The list's state: the row under the cursor and each row's checkbox, in row order. */
export interface PickerState {
  readonly cursor: number;
  readonly checked: readonly boolean[];
}

/** What a key leads to: the next state, a confirmed selection, or a cancelled list. */
export type PickerStep = PickerState | { readonly done: "confirm"; readonly checked: readonly boolean[] } | { readonly done: "abort" };

/** One row of the list: the agent's name and why it starts checked (empty when it does not). */
export interface PickerRow {
  readonly label: string;
  readonly hint: string;
}

const ESC = "\x1b";

/** The terminal sequence that hides the cursor (ESC [ ? 2 5 l), written when the list starts. */
export const HIDE_CURSOR = `${ESC}[?25l`;
/** The terminal sequence that shows the cursor again (ESC [ ? 2 5 h), written when the list ends. */
export const SHOW_CURSOR = `${ESC}[?25h`;

/** The two terminal functions restoreTerminal needs, passed in by the caller (this module does no I/O of its own). */
export interface TerminalIo {
  write(text: string): void;
  setRawMode(on: boolean): void;
}

/**
 * Puts the terminal back as the list found it: writes SHOW_CURSOR and a newline, then turns raw mode off (plan
 * 34.1-16, review IN-18, brief CLEAN-1). Each step runs in its own try and its error is dropped, so a failure in one
 * never skips the other, and restoreTerminal never throws: called from a finally block, it can never replace the error
 * that ended the list.
 */
export function restoreTerminal(io: TerminalIo): void {
  try {
    io.write(SHOW_CURSOR + "\n");
  } catch {
    // Dropped on purpose: raw mode must still be turned off, and the error that ended the list must reach the caller.
  }
  try {
    io.setRawMode(false);
  } catch {
    // Dropped on purpose, for the same reason.
  }
}

/** CSI parameter bytes (0x30-0x3F) and intermediate bytes (0x20-0x2F) come between `ESC [` and the final byte. */
function isCsiBody(c: string): boolean {
  const b = c.charCodeAt(0);
  return b >= 0x20 && b <= 0x3f;
}

/** A CSI final byte (0x40-0x7E) ends the sequence. */
function isCsiFinal(c: string): boolean {
  const b = c.charCodeAt(0);
  return b >= 0x40 && b <= 0x7e;
}

function singleByteKey(c: string): PickerKey {
  if (c === " ") return "toggle";
  if (c === "\r" || c === "\n") return "confirm";
  if (c === "\x03") return "abort";
  if (c === "k") return "up";
  if (c === "j") return "down";
  return "other";
}

/**
 * Decodes one chunk of terminal input (one character per byte, latin1) after the carry left by the previous chunk.
 *
 * - `ESC [ A` and `ESC O A` are up; `ESC [ B` and `ESC O B` are down; any other SS3 sequence (`ESC O` and one byte) or
 *   CSI sequence (`ESC [`, parameter and intermediate bytes, one final byte) is one `other`.
 * - An escape followed by a byte that is neither `[` nor `O` is `other` for the escape; the byte after it is then
 *   decoded on its own.
 * - An escape sequence that the chunk ends inside is returned as `carry`, to be passed with the next chunk.
 * - A CSI sequence broken by a byte that cannot continue it is `other` for the part read so far; the breaking byte is
 *   then decoded on its own.
 */
export function decodeKeys(chunk: string, carry: string): { keys: PickerKey[]; carry: string } {
  const s = carry + chunk;
  const keys: PickerKey[] = [];
  let i = 0;
  while (i < s.length) {
    if (s[i] !== ESC) {
      keys.push(singleByteKey(s[i]));
      i += 1;
      continue;
    }
    if (i + 1 >= s.length) return { keys, carry: s.slice(i) };
    const intro = s[i + 1];
    if (intro === "O") {
      if (i + 2 >= s.length) return { keys, carry: s.slice(i) };
      const f = s[i + 2];
      keys.push(f === "A" ? "up" : f === "B" ? "down" : "other");
      i += 3;
      continue;
    }
    if (intro === "[") {
      let j = i + 2;
      while (j < s.length && isCsiBody(s[j])) j += 1;
      if (j >= s.length) return { keys, carry: s.slice(i) };
      if (isCsiFinal(s[j])) {
        const seq = s.slice(i, j + 1);
        keys.push(seq === "\x1b[A" ? "up" : seq === "\x1b[B" ? "down" : "other");
        i = j + 1;
        continue;
      }
      keys.push("other");
      i = j;
      continue;
    }
    keys.push("other");
    i += 1;
  }
  return { keys, carry: "" };
}

/** The list before any key: the cursor on the first row, each row checked as given. */
export function initialPicker(checked: readonly boolean[]): PickerState {
  return { cursor: 0, checked: [...checked] };
}

/**
 * One key applied to the list. Up and down move the cursor and wrap at both ends; toggle flips the row under the
 * cursor; confirm ends the list with the checked rows as they stand; abort ends it with nothing chosen; other changes
 * nothing.
 */
export function step(state: PickerState, key: PickerKey): PickerStep {
  const n = state.checked.length;
  switch (key) {
    case "up":
      return n === 0 ? state : { cursor: (state.cursor + n - 1) % n, checked: state.checked };
    case "down":
      return n === 0 ? state : { cursor: (state.cursor + 1) % n, checked: state.checked };
    case "toggle":
      return n === 0 ? state : { cursor: state.cursor, checked: state.checked.map((c, i) => (i === state.cursor ? !c : c)) };
    case "confirm":
      return { done: "confirm", checked: [...state.checked] };
    case "abort":
      return { done: "abort" };
    case "other":
      return state;
  }
}

/** The list's header line. */
export const PICKER_HEADER =
  "Choose the coding agents to install grugops for (arrows or j/k move, space toggles, Enter confirms, Ctrl-C cancels):";

/**
 * The screen lines one line of text takes on a terminal `columns` wide: a line longer than the terminal wraps onto the
 * next screen line. A line exactly as wide as the terminal takes one (the newline after it does not add another). An
 * unknown or zero width counts every line as one.
 */
export function screenLines(text: string, columns: number | undefined): number {
  if (columns === undefined || !(columns > 0) || text.length === 0) return 1;
  return Math.ceil(text.length / columns);
}

/**
 * One frame of the list. When `previousLines` is above zero, the frame first moves the cursor up that many screen
 * lines (to the first line of the previous frame) and clears everything below it, so the new frame paints over the old
 * one. Then the header and one line per row: `>` on the cursor row, `[x]` or `[ ]`, the label, and the hint when there
 * is one. Every line ends with a newline. `lines` is the number of SCREEN lines the frame takes on a terminal `columns`
 * wide (screenLines): the header is longer than an 80-column terminal, and counting it as one line would leave the
 * next repaint one line short, stranding a copy of the header's first line on every key.
 */
export function render(
  state: PickerState,
  rows: readonly PickerRow[],
  previousLines: number,
  columns?: number,
): { text: string; lines: number } {
  const out: string[] = [PICKER_HEADER];
  rows.forEach((row, i) => {
    const marker = i === state.cursor ? ">" : " ";
    const box = state.checked[i] === true ? "[x]" : "[ ]";
    out.push(row.hint === "" ? `${marker} ${box} ${row.label}` : `${marker} ${box} ${row.label}  ${row.hint}`);
  });
  const repaint = previousLines > 0 ? `\r${ESC}[${previousLines}A${ESC}[J` : "";
  return { text: repaint + out.map((l) => `${l}\n`).join(""), lines: out.reduce((n, l) => n + screenLines(l, columns), 0) };
}

/**
 * The list's rows, one per host in the order given (the registry order), and which start checked: exactly the hosts
 * installed in the target or detected in it. Each pre-checked row says why: `(installed)`, `(detected: <detect>)`, or
 * both.
 */
export function pickerRows(
  hosts: readonly { readonly id: string; readonly name: string; readonly detect: string }[],
  installed: ReadonlySet<string>,
  detected: ReadonlySet<string>,
): { rows: PickerRow[]; checked: boolean[] } {
  const rows: PickerRow[] = [];
  const checked: boolean[] = [];
  for (const h of hosts) {
    const why: string[] = [];
    if (installed.has(h.id)) why.push("installed");
    if (detected.has(h.id)) why.push(`detected: ${h.detect}`);
    rows.push({ label: h.name, hint: why.length > 0 ? `(${why.join("; ")})` : "" });
    checked.push(why.length > 0);
  }
  return { rows, checked };
}

// runnable-stamp.ts — the one owner of the build stamp line that every host state runnable carries (phase 37,
// plan 37-24, D-17, WR-05, AUTH-1).
//
// WHY THIS EXISTS. The three state runnables (scripts/runnable-ref/state-check.ts, trace-render.ts and
// state-roll.ts) are installed into a host repository as separate files under tools/grugops/, and install never
// overwrites a copy that is already there. Each one carries its own generated copy of shared authorities (the
// trace model, the budget numbers). A host can therefore run a state-check.js and a trace-render.js built from
// different revisions of those authorities, and then state-check reports trace-stale on a tree the renderer has
// just written, with nothing to say why. So every generated region carries a build stamp: a sha256 the generator
// computes over the generated bodies of all three runnables. Equal stamps mean the three were built together.
//
// WHAT IT OWNS. The shape of the three generated lines, and nothing else:
//   export const RUNNABLE_SET_STAMP = "sha256:<64 lowercase hex>";
//   export const RUNNABLE_SET = Object.freeze([<the three file names, in code-unit order>] as const);
//   export const RUNNABLE_SELF = "<this program's file name>";
// scripts/generate-runnable-embeds.ts writes them through formatRunnableStampLines, and state-check reads a
// sibling's stamp through a generated copy of readRunnableStamp. One module owns the shape, so a change to it is
// one edit, and the writer and the reader cannot disagree about it.
//
// A CROSS-VERSION CONTRACT. From the release that ships it, state-check reads this line in sibling programs that
// may come from another kit version. A later change to the shape must keep reading this one.
//
// NOT A SECURITY BOUNDARY. The stamp tells two programs whether they were built together. Anyone who can edit
// tools/grugops/ can edit the stamp too (T-37-54, accepted).
//
// IMPORT-FREE. scripts/generate-runnable-embeds.ts embeds readRunnableStamp into state-check's generated region,
// and a host runnable may import `node:` builtins only, so this module imports nothing.
//
// Voice: clear professional voice (CLAUDE.md hard rule): a human acts on what state-check prints from this.

/** The name of the generated stamp constant. */
export const RUNNABLE_STAMP_NAME = "RUNNABLE_SET_STAMP";

/** The name of the generated constant that lists the file names built together. */
export const RUNNABLE_SET_NAME = "RUNNABLE_SET";

/** The name of the generated constant that names the program carrying the region. */
export const RUNNABLE_SELF_NAME = "RUNNABLE_SELF";

/** The three names the generated stamp lines declare, in the order the lines are written. */
export const RUNNABLE_STAMP_DECLARED_NAMES: readonly string[] = Object.freeze([
  RUNNABLE_STAMP_NAME,
  RUNNABLE_SET_NAME,
  RUNNABLE_SELF_NAME,
]);

/**
 * The whole stamp line, anchored at both ends, with one capture: the stamp, `sha256:` and 64 lowercase hex digits.
 * A line matches only when it is exactly the line formatRunnableStampLines writes.
 */
export const RUNNABLE_STAMP_LINE = new RegExp(`^export const ${RUNNABLE_STAMP_NAME} = "(sha256:[0-9a-f]{64})";$`);

/** Code-unit order, never the host locale's. */
function stampNameOrder(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/**
 * The three generated lines: the stamp, the set of file names built together (in code-unit order) and the name
 * of the program that carries them. Throws when `stamp` is not `sha256:` and 64 lowercase hex digits, when a
 * name repeats, or when `self` is not in `set`, so the generator can never write a line the reader refuses.
 */
export function formatRunnableStampLines(stamp: string, set: readonly string[], self: string): string[] {
  const stampLine = `export const ${RUNNABLE_STAMP_NAME} = ${JSON.stringify(stamp)};`;
  if (!RUNNABLE_STAMP_LINE.test(stampLine)) {
    throw new Error(`runnable-stamp: the stamp ${JSON.stringify(stamp)} is not "sha256:" and 64 lowercase hex digits`);
  }
  const names = [...set].sort(stampNameOrder);
  const repeated = names.find((n, i) => i > 0 && names[i - 1] === n);
  if (repeated !== undefined) throw new Error(`runnable-stamp: the file name ${JSON.stringify(repeated)} is listed twice`);
  if (!names.includes(self)) {
    throw new Error(`runnable-stamp: ${JSON.stringify(self)} is not one of the programs built together (${names.join(", ")})`);
  }
  return [
    stampLine,
    `export const ${RUNNABLE_SET_NAME} = Object.freeze([${names.map((n) => JSON.stringify(n)).join(", ")}] as const);`,
    `export const ${RUNNABLE_SELF_NAME} = ${JSON.stringify(self)};`,
  ];
}

/** What a program's text says about its build stamp. */
export type RunnableStampRead =
  | { readonly kind: "stamp"; readonly stamp: string }
  | { readonly kind: "none" }
  | { readonly kind: "ambiguous"; readonly count: number };

/**
 * The build stamp in `text`, a program's whole source: `stamp` when exactly one line is a stamp line, `none` when
 * no line is (an older kit built it), and `ambiguous` with the count when more than one line is. A line ending in
 * a carriage return is read without it.
 */
export function readRunnableStamp(text: string): RunnableStampRead {
  const stamps: string[] = [];
  for (const raw of text.split("\n")) {
    const line = raw.endsWith("\r") ? raw.slice(0, -1) : raw;
    const m = RUNNABLE_STAMP_LINE.exec(line);
    if (m !== null) stamps.push(m[1] as string);
  }
  if (stamps.length === 0) return { kind: "none" };
  if (stamps.length > 1) return { kind: "ambiguous", count: stamps.length };
  return { kind: "stamp", stamp: stamps[0] as string };
}

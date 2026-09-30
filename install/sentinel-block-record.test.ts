// sentinel-block-record.test.ts — the CLAUDE.md and Copilot pointer blocks are removed by install's
// record of what it appended, never by their presence (plan 33.1-33; brief DC-2,
// .planning/phases/33.1-phase-33-leftovers-guard-bypasses-first/33.1-GAP-PLANNING-BRIEF.md §1).
//
// WHAT THE RED TEAM FOUND (carried from the plan 33.1-27 and 33.1-28 red-teams to this plan):
//   carry 4   a line the user added INSIDE a grugops block was deleted with the block: CLAUDE.md lost the
//             line, and a Copilot file install had created was then deleted whole;
//   carry 6   the removal rebuilt the file line by line, so trailing blank lines in a user's CLAUDE.md
//             were trimmed, and a Copilot file that was `\n\n` before install ended at 0 bytes after
//             install and uninstall;
//   carry 11  on a target with no install marker, a block was removed because it was there, and the
//             file rewritten: nothing recorded that install appended it.
//
// THE RULE NOW. Install records, in the marker's `appendedBlocks` ledger, the content record
// (install-marker.ts contentRecord: sha256 of the bytes) of the exact block it appended to each file,
// the bytes `\n<open>\n<body>\n<close>\n`. Uninstall removes a block only when the ledger records one
// for that file AND the file holds exactly one span with those bytes, a newline followed by the open
// line through the close line's newline. It removes exactly that span and writes every other byte back
// unchanged, so install followed by uninstall gives back the file byte for byte. No marker, a marker
// without the ledger, a malformed ledger, no entry, a block the user edited inside, or two matching
// spans: nothing is removed, and the file is left and reported.
//
// Drives the COMMITTED install/install.js and install/uninstall.js (npm run build first), with HOME,
// GRUGOPS_HOME and TARGET in scratch directories removed at the end. Clear professional voice: this is a
// safety surface.
//
// Vitest `globals: false` (the repo default) → the test functions are imported explicitly.

import { describe, it, expect, afterAll } from "vitest";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { MARKER_REL, type Run, runInstall, runUninstall, snapshotTree } from "./installer-paths.test-support.js";

const SCRATCH = realpathSync(mkdtempSync(join(tmpdir(), "grugops-blocks-")));
afterAll(() => rmSync(SCRATCH, { recursive: true, force: true }));
let seq = 0;
function fresh(tag: string): string {
  const d = join(SCRATCH, `${tag}-${seq++}`);
  mkdirSync(d, { recursive: true });
  return d;
}

const NO_STACK = /^\s+at .+\(.+:\d+:\d+\)$/m;
const COPILOT = ".github/copilot-instructions.md";
const CLAUDE_OPEN = "<!-- GSD:grugops-start-here -->";
const COPILOT_OPEN = "<!-- GSD:grugops-copilot-start-here -->";

interface Box {
  readonly t: string;
  readonly home: string;
}
function box(tag: string): Box {
  const t = fresh(tag);
  const home = fresh(`${tag}-home`);
  return { t, home };
}
const at = (b: Box, rel: string): string => join(b.t, ...rel.split("/"));
function install(b: Box): Run {
  const r = runInstall(b.t, join(b.home, ".grugops"), [], { home: b.home, timeoutMs: 180_000 });
  expect(r.stderr).not.toMatch(NO_STACK);
  expect(r.status, r.stdout).toBe(0);
  return r;
}
function uninstall(b: Box, dryRun = false): Run {
  const r = runUninstall(b.t, join(b.home, ".grugops"), { dryRun, home: b.home, timeoutMs: 120_000 });
  expect(r.stderr).not.toMatch(NO_STACK);
  return r;
}
const bytes = (b: Box, rel: string): Buffer => readFileSync(at(b, rel));
const put = (b: Box, rel: string, body: string | Buffer): void => {
  mkdirSync(join(at(b, rel), ".."), { recursive: true });
  writeFileSync(at(b, rel), body);
};
const marker = (b: Box): Record<string, unknown> => JSON.parse(readFileSync(at(b, MARKER_REL), "utf8"));
const writeMarker = (b: Box, m: Record<string, unknown>): void => writeFileSync(at(b, MARKER_REL), JSON.stringify(m, null, 2) + "\n");
const sha = (s: string | Buffer): string => `sha256:${createHash("sha256").update(s).digest("hex")}`;

/** The block install appended to `rel`, cut out of the installed file: the bytes after `before`. */
function appendedBlock(b: Box, rel: string, before: Buffer): Buffer {
  const now = bytes(b, rel);
  expect(now.subarray(0, before.length).equals(before), `PREMISE: install appended to ${rel} rather than rewriting it`).toBe(true);
  return now.subarray(before.length);
}

describe("sentinel blocks are removed by install's appendedBlocks record (plan 33.1-33, carry 4, 6, 11)", () => {
  it("install records the exact block it appended to CLAUDE.md and the Copilot file, as a content record", () => {
    const b = box("record");
    const claude = Buffer.from("# Mine\n\nkeep me\n");
    put(b, "CLAUDE.md", claude);
    install(b);
    const m = marker(b);
    const blocks = m.appendedBlocks as Record<string, string>;
    expect(Object.keys(blocks).sort()).toEqual([COPILOT, "CLAUDE.md"].sort());
    expect(blocks["CLAUDE.md"]).toBe(sha(appendedBlock(b, "CLAUDE.md", claude)));
    // install created the Copilot file: the whole file is the block it appended.
    expect(blocks[COPILOT]).toBe(sha(bytes(b, COPILOT)));
  });

  for (const [name, body] of [
    ["trailing blank lines", "# Mine\n\nlast line\n\n\n\n"],
    ["no final newline", "# Mine\nlast line without a newline"],
    ["CRLF line ends and a trailing blank line", "# Mine\r\n\r\nline\r\n\r\n"],
    ["only blank lines", "\n\n"],
    ["a line that looks like a sentinel but is not on its own line", `text ${CLAUDE_OPEN} inline\n`],
  ] as const) {
    it(`carry 6: install then uninstall gives back a user CLAUDE.md and Copilot file byte for byte (${name})`, () => {
      const b = box("roundtrip");
      put(b, "CLAUDE.md", body);
      put(b, COPILOT, body);
      install(b);
      const installed = snapshotTree(b.t);
      const dry = uninstall(b, true);
      expect(snapshotTree(b.t), `DRY_RUN changed the target\n${dry.stdout}`).toBe(installed);
      const r = uninstall(b);
      expect(r.status, r.stdout).toBe(0);
      expect(bytes(b, "CLAUDE.md").equals(Buffer.from(body)), `CLAUDE.md is not what it was:\n${JSON.stringify(bytes(b, "CLAUDE.md").toString())}`).toBe(true);
      expect(bytes(b, COPILOT).equals(Buffer.from(body)), `${COPILOT} is not what it was:\n${JSON.stringify(bytes(b, COPILOT).toString())}`).toBe(true);
    });
  }

  it("carry 6: a pre-existing `\\n\\n` Copilot file is 2 bytes after install and uninstall, never 0", () => {
    const b = box("copilot-blank");
    put(b, COPILOT, "\n\n");
    install(b);
    const r = uninstall(b);
    expect(r.status, r.stdout).toBe(0);
    expect(bytes(b, COPILOT).toString()).toBe("\n\n");
  });

  it("the user's lines before and after the block survive exactly; only the appended bytes go", () => {
    const b = box("around");
    const claude = "# Mine\n";
    put(b, "CLAUDE.md", claude);
    install(b);
    const installed = bytes(b, "CLAUDE.md").toString();
    writeFileSync(at(b, "CLAUDE.md"), `# A line the user added at the top\n${installed}## Added after the block\n\n`);
    const r = uninstall(b);
    expect(r.status, r.stdout).toBe(0);
    expect(bytes(b, "CLAUDE.md").toString()).toBe(`# A line the user added at the top\n${claude}## Added after the block\n\n`);
  });

  for (const dryRun of [false, true]) {
    const mode = dryRun ? "DRY_RUN" : "real";
    it(`carry 4 (${mode}): a line the user added inside a grugops block is kept; the block and the file are left byte for byte and reported`, () => {
      const b = box(`inside-${mode}`);
      put(b, "CLAUDE.md", "# Mine\n");
      install(b);
      for (const [rel, open] of [["CLAUDE.md", CLAUDE_OPEN], [COPILOT, COPILOT_OPEN]] as const) {
        const cur = bytes(b, rel).toString();
        writeFileSync(at(b, rel), cur.replace(`${open}\n`, `${open}\nMY OWN LINE, inside the block\n`));
      }
      const beforeClaude = bytes(b, "CLAUDE.md");
      const beforeCopilot = bytes(b, COPILOT);
      const r = uninstall(b, dryRun);
      expect(bytes(b, "CLAUDE.md").equals(beforeClaude), r.stdout).toBe(true);
      expect(existsSync(at(b, COPILOT)), `${COPILOT} was deleted with the user's line in it\n${r.stdout}`).toBe(true);
      expect(bytes(b, COPILOT).equals(beforeCopilot), r.stdout).toBe(true);
      expect(r.stdout).toMatch(/^ {2}left\s+CLAUDE\.md start-here pointer \(no grugops block in it is exactly the block install recorded appending/m);
      expect(r.stdout).toMatch(/^ {2}left\s+\.github\/copilot-instructions\.md pointer \(no grugops block in it is exactly the block install recorded appending/m);
    });

    it(`carry 11 (${mode}): with no install marker, a hand-copied grugops block is left and the target changes by zero bytes`, () => {
      const b = box(`nomarker-${mode}`);
      put(b, "CLAUDE.md", "# Mine\n");
      install(b);
      rmSync(at(b, MARKER_REL));
      const before = snapshotTree(b.t);
      const r = uninstall(b, dryRun);
      expect(snapshotTree(b.t), r.stdout).toBe(before);
      expect(r.stdout).toMatch(/^ {2}left\s+CLAUDE\.md start-here pointer \(there is no install marker, so there is no record that install appended this block/m);
    });

    it(`a marker without the appendedBlocks ledger (an install made before it) leaves the block and says so (${mode})`, () => {
      const b = box(`legacy-${mode}`);
      put(b, "CLAUDE.md", "# Mine\n");
      install(b);
      const m = marker(b);
      delete m.appendedBlocks;
      writeMarker(b, m);
      const beforeClaude = bytes(b, "CLAUDE.md");
      const r = uninstall(b, dryRun);
      expect(bytes(b, "CLAUDE.md").equals(beforeClaude), r.stdout).toBe(true);
      expect(r.stdout).toMatch(/^ {2}left\s+CLAUDE\.md start-here pointer \(the install marker predates the appended-block ledger/m);
    });

    it(`a malformed appendedBlocks ledger is a verify: no block is removed and the marker is kept (${mode})`, () => {
      const b = box(`malformed-${mode}`);
      put(b, "CLAUDE.md", "# Mine\n");
      install(b);
      const m = marker(b);
      m.appendedBlocks = { "CLAUDE.md": "not a record" };
      writeMarker(b, m);
      const beforeClaude = bytes(b, "CLAUDE.md");
      const beforeMarker = bytes(b, MARKER_REL);
      const r = uninstall(b, dryRun);
      expect(r.status, r.stdout).toBe(3);
      expect(bytes(b, "CLAUDE.md").equals(beforeClaude), r.stdout).toBe(true);
      expect(existsSync(at(b, MARKER_REL)), r.stdout).toBe(true);
      expect(r.stdout).toMatch(/malformed appended-block ledger \(appendedBlocks\)/);
      if (dryRun) expect(bytes(b, MARKER_REL).equals(beforeMarker)).toBe(true);
    });
  }

  it("two spans that both match the record: which one install appended is not known, so neither is removed", () => {
    const b = box("twice");
    put(b, "CLAUDE.md", "# Mine\n");
    install(b);
    const installed = bytes(b, "CLAUDE.md");
    const block = installed.subarray("# Mine\n".length);
    writeFileSync(at(b, "CLAUDE.md"), Buffer.concat([installed, block]));
    const before = bytes(b, "CLAUDE.md");
    const r = uninstall(b);
    expect(bytes(b, "CLAUDE.md").equals(before), r.stdout).toBe(true);
    expect(r.stdout).toMatch(/^ {2}left\s+CLAUDE\.md start-here pointer \(it holds 2 copies of the block install recorded appending/m);
  });

  it("a re-install keeps the record (the block is already there, so nothing is appended), and uninstall still reverses the first install exactly", () => {
    const b = box("reinstall");
    const claude = "# Mine\n\n\n";
    put(b, "CLAUDE.md", claude);
    install(b);
    const first = (marker(b).appendedBlocks as Record<string, string>)["CLAUDE.md"];
    install(b);
    expect((marker(b).appendedBlocks as Record<string, string>)["CLAUDE.md"]).toBe(first);
    const r = uninstall(b);
    expect(r.status, r.stdout).toBe(0);
    expect(bytes(b, "CLAUDE.md").toString()).toBe(claude);
  });

  it("a kept marker drops the blocks this run removed, so a block the user pastes back later is left by the next run", () => {
    const b = box("kept");
    put(b, "CLAUDE.md", "# Mine\n");
    install(b);
    const installed = bytes(b, "CLAUDE.md");
    const m = marker(b);
    m.createdDirs = "garbage";
    writeMarker(b, m);
    const r1 = uninstall(b);
    expect(r1.status, r1.stdout).toBe(3);
    expect(bytes(b, "CLAUDE.md").toString(), r1.stdout).toBe("# Mine\n");
    const kept = marker(b);
    expect(kept.appendedBlocks, r1.stdout).toEqual({});
    writeFileSync(at(b, "CLAUDE.md"), installed);
    const r2 = uninstall(b);
    expect(bytes(b, "CLAUDE.md").equals(installed), r2.stdout).toBe(true);
    expect(r2.stdout).toMatch(/^ {2}left\s+CLAUDE\.md start-here pointer \(there is no record that install appended this block/m);
  });
});

// ── red-team B1 of plan 33.1-33: the separator newline ─────────────────────────────────────────────
// Install appends `\n` + the block lines to the END of the file. The `\n` is a separator: it made a
// blank line (the file was empty, absent, or ended with a newline) or it ended the user's last line
// (the file ended without one). The plan-33 build removed `\n<open>…<close>\n` wherever it was, so
// the `\n` it took could be the user's: moving the block lines between two lines joined them
// (`L1L2`), deleting the blank line took the final newline (`L1\nL2`), and text added after a block
// in a file with no final newline was glued to the last line (`L1MORE`).
//
// THE RULE (stated here, independently of the implementation, and checked for every case below):
//   - the block LINES (open line through close line and its newline, exactly the bytes the record
//     proves) are removed wherever the one matching copy is. They are whole lines, so removing them
//     never joins two lines;
//   - the separator newline before them is removed only when the block is still at the END of the
//     file, where install appended it, and the record and the bytes before it agree that it is
//     install's: for a `blank-line` separator the line before the block must be blank; for a
//     `line-end` separator (the file had no final newline) the newline is install's by the record;
//   - otherwise the separator stays: a moved block, or one with text after it, loses its lines and
//     keeps the newline before it, because which newline install added can no longer be shown.
// Every user byte survives, no two lines are joined, and a file the user did not touch comes back
// byte for byte.
describe("the separator newline is removed only when it is provably install's (red-team B1 of plan 33.1-33)", () => {
  const COPILOT_CLOSE_LINE = "<!-- GSD:grugops-copilot-start-here-end -->";
  const CLAUDE_CLOSE_LINE = "<!-- GSD:grugops-start-here-end -->";
  const FILES = [
    { rel: "CLAUDE.md", open: CLAUDE_OPEN, close: CLAUDE_CLOSE_LINE, label: "CLAUDE\\.md start-here pointer" },
    { rel: COPILOT, open: COPILOT_OPEN, close: COPILOT_CLOSE_LINE, label: "\\.github\\/copilot-instructions\\.md pointer" },
  ] as const;
  // What the file held before install (null: absent, install creates it).
  const SHAPES: ReadonlyArray<readonly [string, string | null]> = [
    ["absent", null],
    ["empty", ""],
    ["ends with a newline", "L1\nL2\n"],
    ["no final newline", "L1\nL2"],
    ["ends with a blank line", "L1\n\n"],
    ["CRLF", "L1\r\nL2\r\n"],
  ];
  type Mut = (orig: string, block: string) => string | null;
  // Each mutation is applied to the installed file, `orig + "\n" + block`. null: not applicable.
  const firstLineEnd = (orig: string): number => orig.indexOf("\n") + 1;
  const MUTATIONS: ReadonlyArray<readonly [string, Mut]> = [
    ["as installed", (o, b) => `${o}\n${b}`],
    ["blank line before the block deleted", (o, b) => (o === "" || o.endsWith("\n") ? `${o}${b}` : null)],
    ["block lines moved after the first line", (o, b) => (firstLineEnd(o) > 0 ? `${o.slice(0, firstLineEnd(o))}${b}${o.slice(firstLineEnd(o))}\n` : null)],
    ["block moved with its blank line after the first line", (o, b) => (firstLineEnd(o) > 0 ? `${o.slice(0, firstLineEnd(o))}\n${b}${o.slice(firstLineEnd(o))}` : null)],
    ["text added after the block", (o, b) => `${o}\n${b}MORE\n`],
    ["a line added at the top", (o, b) => `TOP\n${o}\n${b}`],
    ["block lines moved to the top of the file", (o, b) => `${b}${o}\n`],
  ];

  /** The rule above, as bytes: what uninstall must leave for `pre` (the file before uninstall). */
  function expected(pre: string, block: string, orig: string): string {
    const k = pre.indexOf(block);
    const u = pre.slice(0, k) + pre.slice(k + block.length);
    const atEnd = k + block.length === pre.length;
    if (!atEnd || k === 0) return u;
    const lineEnd = orig !== "" && !orig.endsWith("\n");
    if (lineEnd) return u.slice(0, -1);
    return u === "\n" || u.endsWith("\n\n") ? u.slice(0, -1) : u;
  }

  for (const [shapeName, orig] of SHAPES) {
    for (const [mutName, mut] of MUTATIONS) {
      const o = orig ?? "";
      const probe = mut(o, "B\n");
      if (probe === null) continue;
      it(`${shapeName} + ${mutName}: every user byte survives, no line is joined, and the preview matches the real run (CLAUDE.md and Copilot)`, () => {
        const b = box("sep");
        for (const f of FILES) if (orig !== null) put(b, f.rel, orig);
        install(b);
        const pre = new Map<string, string>();
        for (const f of FILES) {
          const installed = bytes(b, f.rel).toString("utf8");
          const k = installed.lastIndexOf(`${f.open}\n`);
          expect(k, `PREMISE: install appended the block to ${f.rel}`).toBeGreaterThan(0);
          const block = installed.slice(k);
          expect(installed, `PREMISE: install appended "\\n" + block to ${f.rel}`).toBe(`${o}\n${block}`);
          expect(block.endsWith(`${f.close}\n`)).toBe(true);
          const p = mut(o, block) as string;
          writeFileSync(at(b, f.rel), p);
          pre.set(f.rel, p);
        }
        const before = snapshotTree(b.t);
        const dry = uninstall(b, true);
        expect(snapshotTree(b.t), `DRY_RUN changed the target\n${dry.stdout}`).toBe(before);
        const r = uninstall(b);
        expect([0, 3], r.stdout).toContain(r.status);
        for (const f of FILES) {
          const p = pre.get(f.rel) as string;
          const block = p.slice(p.indexOf(`${f.open}\n`), p.indexOf(`${f.close}\n`) + f.close.length + 1);
          const want = expected(p, block, o);
          const gone = orig === null && mutName === "as installed";
          if (gone) {
            expect(existsSync(at(b, f.rel)), `${f.rel}: install created it and it holds only what install wrote\n${r.stdout}`).toBe(false);
          } else {
            expect(existsSync(at(b, f.rel)), `${f.rel} was deleted\n${r.stdout}`).toBe(true);
            expect(JSON.stringify(bytes(b, f.rel).toString("utf8")), `${f.rel}: before uninstall ${JSON.stringify(p)}\n${r.stdout}`).toBe(JSON.stringify(want));
          }
          // The preview names what the real run did: a would-remove line exactly when a removed line.
          const removedRe = new RegExp(`^ {2}removed\\s+${f.label} \\(sentinel block`, "m");
          const wouldRe = new RegExp(`^ {2}would-remove\\s+${f.label} \\(sentinel block`, "m");
          expect(removedRe.test(r.stdout), `${f.rel}: the block lines were not removed\n${r.stdout}`).toBe(true);
          expect(wouldRe.test(dry.stdout), `${f.rel}: the preview does not name the removal\n${dry.stdout}`).toBe(true);
        }
      });
    }
  }

  it("the three repros, literally: moved lines are not joined, a deleted blank line keeps the final newline, text after a block in a file with no final newline keeps its own line", () => {
    const cases: ReadonlyArray<readonly [string, Mut, string]> = [
      ["L1\nL2\n", (_o, b) => `L1\n${b}L2\n\n`, "L1\nL2\n\n"],
      ["L1\nL2\n", (_o, b) => `L1\nL2\n${b}`, "L1\nL2\n"],
      ["L1", (_o, b) => `L1\n${b}MORE\n`, "L1\nMORE\n"],
    ];
    for (const [orig, mut, want] of cases) {
      const b = box("repro");
      put(b, "CLAUDE.md", orig);
      install(b);
      const installed = bytes(b, "CLAUDE.md").toString("utf8");
      writeFileSync(at(b, "CLAUDE.md"), mut(orig, installed.slice(installed.indexOf(`${CLAUDE_OPEN}\n`))) as string);
      const r = uninstall(b);
      expect(JSON.stringify(bytes(b, "CLAUDE.md").toString("utf8")), r.stdout).toBe(JSON.stringify(want));
    }
  });

  it("install records the separator it supplied: `blank-line` after a newline or into an empty or new file, `line-end` after a last line with no newline", () => {
    for (const [orig, sep] of [["L1\n", "blank-line"], ["", "blank-line"], [null, "blank-line"], ["L1", "line-end"]] as const) {
      const b = box("sep-record");
      if (orig !== null) put(b, "CLAUDE.md", orig);
      install(b);
      const rec = (marker(b).appendedBlocks as Record<string, { block: string; separator: string }>)["CLAUDE.md"];
      const installed = bytes(b, "CLAUDE.md").toString("utf8");
      const lines = installed.slice(installed.indexOf(`${CLAUDE_OPEN}\n`));
      expect(rec, JSON.stringify(marker(b).appendedBlocks)).toEqual({ block: sha(lines), separator: sep });
    }
  });

  for (const [what, edit] of [
    ["converted to CRLF line ends", (s: string) => s.replace(/\n/g, "\r\n")],
    ["with trailing spaces on the close line", (s: string) => s.replace(`${CLAUDE_CLOSE_LINE}\n`, `${CLAUDE_CLOSE_LINE}   \n`)],
  ] as const) {
    it(`wording: a block ${what} is left, and the reason says it no longer matches what install recorded (not "without a matching close marker")`, () => {
      const b = box("wording");
      put(b, "CLAUDE.md", "# Mine\n");
      install(b);
      writeFileSync(at(b, "CLAUDE.md"), edit(bytes(b, "CLAUDE.md").toString("utf8")));
      const before = bytes(b, "CLAUDE.md");
      const r = uninstall(b);
      expect(bytes(b, "CLAUDE.md").equals(before), r.stdout).toBe(true);
      const line = r.stdout.split("\n").find((l) => /^ {2}left\s+CLAUDE\.md start-here pointer/.test(l)) ?? "";
      expect(line, r.stdout).toMatch(/no longer matches the block install recorded appending/);
      expect(line).not.toMatch(/without a matching close marker/);
    });
  }
});

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

// settings-json-provenance.test.ts — the red-team cases against plan 33.1-29 (brief
// 33.1-GAP-PLANNING-BRIEF.md §3: every red-team break is fixed before the next plan starts), and the
// same rules applied to the other user-owned JSON file install edits, `.claude/settings.json`.
//
// WHAT IS HELD HERE.
//   B1 (DC-2) Uninstall edits `.gemini/settings.json` only while `context.fileName` still holds the
//      record install wrote (`geminiSettings.fileNameContent`, one serialisation on both sides). A
//      user who removed install's entry and later wrote their own list (with their own "AGENTS.md",
//      other keys, other formatting) keeps it byte-identical, and so does a file under a forged,
//      well-formed record whose content record describes other content. DRY_RUN decides the same.
//   B2 (reversibility, no evidence read as proof) A re-install that cannot read the settings file
//      (mode 000, a hard link, a FIFO, too large, not JSON, not UTF-8, duplicate keys) has no
//      evidence either way, so it writes the earlier record back verbatim; a later uninstall still
//      removes install's entry. A fresh install over a file it could not read records that it did not
//      add an entry and why, so no uninstall line claims the marker predates the ledger, and "already
//      listed" is said only where install found AGENTS.md already listed.
//   B3 (D-18, never overwrite user content) Install edits a user's JSON file by splicing only the
//      value it changes into the original text; every other byte (big integers, trailing zeros,
//      integer-like key order, escapes, CRLF, tabs, a BOM, the final newline or its absence) is kept,
//      and install → uninstall restores the original bytes exactly. A file that cannot be spliced
//      safely (duplicate keys on the path, comments, a trailing comma, bytes that are not UTF-8) is
//      refused with a counted verify and left byte-identical. Both settings files are held to it.
//
// Drives the COMMITTED install/install.js and install/uninstall.js (npm run build first), with HOME,
// GRUGOPS_HOME and TARGET in scratch directories removed at the end. Run it on Node 22 and Node 24.
//
// Vitest `globals: false` (the repo default) → the test functions are imported explicitly.

import { describe, it, expect, afterAll } from "vitest";
import { chmodSync, existsSync, linkSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { hostCapabilityOrSkip, skipLine, stageShapeOrSkip } from "../scripts/check-platform-shapes.js";
import { MARKER_REL, type Run, makeFixture, runInstall, runUninstall, snapshotTree } from "./installer-paths.test-support.js";

const SCRATCH = realpathSync(mkdtempSync(join(tmpdir(), "grugops-settings-json-")));
afterAll(() => {
  // A mode-000 file left by a failed case must not stop the scratch root being removed.
  try {
    chmodSync(SCRATCH, 0o700);
  } catch {
    /* ignore */
  }
  rmSync(SCRATCH, { recursive: true, force: true });
});
let seq = 0;
function fresh(tag: string): string {
  const d = join(SCRATCH, `${tag}-${seq++}`);
  mkdirSync(d, { recursive: true });
  return d;
}
const newTarget = (tag: string): { t: string; home: string } => ({ t: makeFixture(fresh(`${tag}-t`)), home: fresh(`${tag}-h`) });

const GEM = ".gemini/settings.json";
const CLA = ".claude/settings.json";
const abs = (t: string, rel: string): string => join(t, ...rel.split("/"));
const plant = (t: string, rel: string, body: string | Buffer): Buffer => {
  mkdirSync(join(abs(t, rel), ".."), { recursive: true });
  writeFileSync(abs(t, rel), body);
  return readFileSync(abs(t, rel));
};
const bytesOf = (t: string, rel: string): Buffer => readFileSync(abs(t, rel));
const readMarker = (t: string): Record<string, unknown> => JSON.parse(readFileSync(abs(t, MARKER_REL), "utf8"));
const writeMarker = (t: string, m: Record<string, unknown>): void => writeFileSync(abs(t, MARKER_REL), JSON.stringify(m, null, 2) + "\n");
const sha = (b: string | Buffer): string => `sha256:${createHash("sha256").update(b).digest("hex")}`;

function under(stdout: string, label: string): string[] {
  const out: string[] = [];
  for (const line of stdout.split("\n")) {
    const m = /^ {2}(\S+)\s+(.+)$/.exec(line);
    if (m && m[1] === label) out.push(m[2]);
  }
  return out;
}
const naming = (stdout: string, label: string, rel: string): string[] =>
  under(stdout, label).filter((l) => l === rel || l.startsWith(`${rel} `) || l.startsWith(`${rel}:`));
const status = (r: Run, want: number, what: string): void => {
  expect(r.error, `${what}: ${String(r.error)}`).toBeUndefined();
  expect(r.status, `${what}: exit ${r.status}\n${r.stdout}\n${r.stderr}`).toBe(want);
};
const NO_STACK_TRACE = /^\s+at .+\(.+:\d+:\d+\)$/m;

/** DRY_RUN uninstall first (it must change nothing), then the real run, which is returned. */
function uninstallBoth(t: string, home: string, want: number): { dry: Run; real: Run } {
  const pre = snapshotTree(t);
  const dry = runUninstall(t, home, { dryRun: true, timeoutMs: 60_000 });
  status(dry, want, "DRY_RUN uninstall");
  expect(snapshotTree(t), `DRY_RUN changed the tree\n${dry.stdout}`).toBe(pre);
  const real = runUninstall(t, home, { timeoutMs: 60_000 });
  status(real, want, "uninstall");
  return { dry, real };
}

// The bytes of `before` that `after` does not keep in place: after removing the longest common prefix
// and suffix, what is left of `before`. An edit that only inserts leaves "" here; wrapping a value
// leaves exactly that value.
function replacedSpan(before: Buffer, after: Buffer): string {
  let p = 0;
  while (p < before.length && p < after.length && before[p] === after[p]) p++;
  let s = 0;
  while (s < before.length - p && s < after.length - p && before[before.length - 1 - s] === after[after.length - 1 - s]) s++;
  return before.subarray(p, before.length - s).toString("utf8");
}
const parseLoose = (b: Buffer): Record<string, unknown> => JSON.parse(b.toString("utf8").replace(/^﻿/, ""));

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// B1 — uninstall acts only while context.fileName still holds install's record
// ═══════════════════════════════════════════════════════════════════════════════════════════════
describe("B1 (DC-2): uninstall edits the Gemini settings only while context.fileName holds install's record", () => {
  const COMPACT = '{"context":{"fileName":["GEMINI.md"]}}\n';

  // The user removed install's entry, and later wrote their own list: other entries, their own
  // AGENTS.md, other keys, other formatting. None of it is install's.
  const LAPSED: ReadonlyArray<{ readonly name: string; readonly body: string }> = [
    {
      name: "their own list ending in AGENTS.md, other keys, tabs",
      body: '{\n\t"theme": "dark",\n\t"context": { "fileName": [ "GEMINI.md", "CONTEXT.md", "AGENTS.md" ] },\n\t"n": 1.50\n}\n',
    },
    { name: "AGENTS.md in the middle", body: '{"context":{"fileName":["GEMINI.md","AGENTS.md","CONTEXT.md"]}}\n' },
    { name: "the same entries reordered", body: '{"context":{"fileName":["AGENTS.md","GEMINI.md"]}}' },
    { name: "two AGENTS.md entries", body: '{"context":{"fileName":["AGENTS.md","GEMINI.md","AGENTS.md"]}}\n' },
  ];
  for (const c of LAPSED) {
    it(`record lapsed (${c.name}): real and DRY_RUN uninstall leave the file byte-identical with a left line and the remedy`, () => {
      const { t, home } = newTarget("b1-lapsed");
      plant(t, GEM, COMPACT);
      status(runInstall(t, home), 0, "install");
      expect(readMarker(t).geminiSettings, "PREMISE: install recorded its append").toMatchObject({ addedEntry: true });
      const user = plant(t, GEM, c.body);
      const { dry, real } = uninstallBoth(t, home, 0);
      expect(bytesOf(t, GEM).equals(user), `the user's settings file changed\n${bytesOf(t, GEM).toString("utf8")}\n${real.stdout}`).toBe(true);
      for (const [what, out] of [["DRY_RUN", dry.stdout], ["real", real.stdout]] as const) {
        for (const label of ["removed", "would-remove", "would-edit"]) {
          expect(naming(out, label, GEM), `${what}: a ${label} line names ${GEM}\n${out}`).toEqual([]);
        }
        const left = naming(out, "left", GEM);
        expect(left.length, `${what}: no left line names ${GEM}\n${out}`).toBe(1);
        expect(left[0]).toMatch(/by hand/);
      }
    });
  }

  it("record forged (well-formed, but its fileNameContent describes other content): uninstall leaves the file byte-identical", () => {
    const { t, home } = newTarget("b1-forged");
    plant(t, GEM, COMPACT);
    status(runInstall(t, home), 0, "install");
    const m = readMarker(t);
    m.geminiSettings = {
      createdFile: false,
      addedEntry: true,
      createdContext: false,
      fileNameBefore: "array",
      fileNameContent: sha(JSON.stringify(["OTHER.md", "AGENTS.md"])),
    };
    writeMarker(t, m);
    const merged = bytesOf(t, GEM);
    const { dry, real } = uninstallBoth(t, home, 0);
    expect(bytesOf(t, GEM).equals(merged), real.stdout).toBe(true);
    expect(naming(dry.stdout, "would-edit", GEM), dry.stdout).toEqual([]);
    expect(naming(real.stdout, "removed", GEM), real.stdout).toEqual([]);
  });

  it("record holds (the user only re-formatted the file and added a key): uninstall removes install's entry and keeps every other byte", () => {
    const { t, home } = newTarget("b1-holds");
    plant(t, GEM, COMPACT);
    status(runInstall(t, home), 0, "install");
    plant(t, GEM, '{\n\t"context": {\n\t\t"fileName": [\n\t\t\t"GEMINI.md",\n\t\t\t"AGENTS.md"\n\t\t]\n\t},\n\t"n": 1.50\n}\n');
    const { dry, real } = uninstallBoth(t, home, 0);
    expect(naming(dry.stdout, "would-edit", GEM).length, dry.stdout).toBe(1);
    expect(naming(real.stdout, "removed", GEM).length, real.stdout).toBe(1);
    expect(bytesOf(t, GEM).toString("utf8")).toBe('{\n\t"context": {\n\t\t"fileName": [\n\t\t\t"GEMINI.md"\n\t\t]\n\t},\n\t"n": 1.50\n}\n');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// B2 — a run that could not read the file keeps the earlier record; the wording is true
// ═══════════════════════════════════════════════════════════════════════════════════════════════
describe("B2: a re-install that cannot read the Gemini settings keeps install's record, and every uninstall line about it is true", () => {
  const ORIGINAL = '{"context":{"fileName":["GEMINI.md"]}}\n';
  interface Unreadable {
    readonly name: string;
    /** Make the file unreadable for the re-install; returns a skip line, or null when staged. */
    readonly make: (t: string, outside: string) => string | null;
    /** Put the installed bytes back as a readable, single-name regular file. */
    readonly undo: (t: string, installed: Buffer, outside: string) => void;
  }
  const restore = (t: string, installed: Buffer): void => {
    rmSync(abs(t, GEM), { force: true });
    writeFileSync(abs(t, GEM), installed);
  };
  const UNREADABLE: readonly Unreadable[] = [
    {
      name: "mode 000",
      make: (t) => {
        const s = hostCapabilityOrSkip("chmod 000 enforcement", "settings-json-provenance B2 mode 000");
        if (s !== null) return skipLine(s, "B2 mode 000");
        chmodSync(abs(t, GEM), 0o000);
        return null;
      },
      undo: (t) => chmodSync(abs(t, GEM), 0o644),
    },
    {
      name: "a hard link (a second name outside the target)",
      make: (t, outside) => {
        linkSync(abs(t, GEM), join(outside, "second-name.json"));
        return null;
      },
      undo: (_t, _i, outside) => rmSync(join(outside, "second-name.json")),
    },
    {
      name: "a FIFO",
      make: (t, outside) => {
        renameSync(abs(t, GEM), join(outside, "aside.json"));
        const s = stageShapeOrSkip("FIFO", abs(t, GEM), "settings-json-provenance B2 FIFO");
        return s === null ? null : skipLine(s, "B2 FIFO");
      },
      undo: restore,
    },
    {
      name: "too large (9 MiB)",
      make: (t) => {
        writeFileSync(abs(t, GEM), `{"context":{"fileName":["GEMINI.md","AGENTS.md"]},"pad":"${"x".repeat(9 * 1024 * 1024)}"}\n`);
        return null;
      },
      undo: restore,
    },
    {
      name: "not JSON",
      make: (t) => {
        writeFileSync(abs(t, GEM), "{not json");
        return null;
      },
      undo: restore,
    },
    {
      name: "not UTF-8",
      make: (t) => {
        writeFileSync(abs(t, GEM), Buffer.concat([Buffer.from('{"context":{"fileName":["GEMINI.md","AGENTS.md"]},"x":"'), Buffer.from([0xff, 0xfe]), Buffer.from('"}\n')]));
        return null;
      },
      undo: restore,
    },
    {
      name: "duplicate context keys",
      make: (t) => {
        writeFileSync(abs(t, GEM), '{"context":{"fileName":["GEMINI.md","AGENTS.md"]},"context":{"fileName":["GEMINI.md","AGENTS.md"]}}\n');
        return null;
      },
      undo: restore,
    },
  ];
  for (const c of UNREADABLE) {
    it(`re-install over ${c.name}: the earlier record is written back verbatim, and a later uninstall still removes install's entry`, () => {
      const { t, home } = newTarget("b2");
      const outside = fresh("b2-outside");
      const before = plant(t, GEM, ORIGINAL);
      status(runInstall(t, home), 0, "install");
      const record = readMarker(t).geminiSettings;
      expect(record, "PREMISE: install recorded its append").toMatchObject({ addedEntry: true });
      const installed = bytesOf(t, GEM);
      const skip = c.make(t, outside);
      if (skip !== null) {
        console.warn(skip);
        return;
      }
      const re = runInstall(t, home, [], { timeoutMs: 120_000 });
      status(re, 3, "re-install");
      expect(re.stderr).not.toMatch(NO_STACK_TRACE);
      expect(readMarker(t).geminiSettings, `the re-install replaced install's record\n${re.stdout}`).toEqual(record);
      c.undo(t, installed, outside);
      const r = runUninstall(t, home, { timeoutMs: 60_000 });
      status(r, 0, "uninstall");
      expect(bytesOf(t, GEM).equals(before), `install's entry was not removed\n${bytesOf(t, GEM).toString("utf8")}\n${r.stdout}`).toBe(true);
    });
  }

  it("a fresh install over a file it cannot read records that it added no entry, and uninstall says neither 'predates' nor 'already listed'", () => {
    const { t, home } = newTarget("b2-fresh");
    const body = plant(t, GEM, "{not json");
    status(runInstall(t, home), 3, "install");
    const rec = readMarker(t).geminiSettings as Record<string, unknown> | undefined;
    expect(rec, "a fresh install that could not read the file recorded nothing").toBeDefined();
    expect(rec).toMatchObject({ createdFile: false, addedEntry: false, fileNameContent: null });
    const { dry, real } = uninstallBoth(t, home, 0);
    expect(bytesOf(t, GEM).equals(body)).toBe(true);
    for (const out of [dry.stdout, real.stdout]) {
      expect(out).not.toMatch(/predates the Gemini settings ledger/);
      expect(out).not.toMatch(/already listed/);
      expect(naming(out, "skipped", GEM).some((l) => /could not read or merge/.test(l)), out).toBe(true);
    }
  });

  it("'already listed' is said only where install found AGENTS.md listed; a record reset because the file changed says so", () => {
    // Found listed.
    const a = newTarget("b2-listed");
    plant(a.t, GEM, '{"context":{"fileName":["AGENTS.md","GEMINI.md"]}}\n');
    status(runInstall(a.t, a.home), 0, "install");
    const ra = runUninstall(a.t, a.home);
    status(ra, 0, "uninstall");
    expect(naming(ra.stdout, "skipped", GEM).some((l) => /already listed when install found the file/.test(l)), ra.stdout).toBe(true);

    // Reset: install appended, the user changed context.fileName, a re-install could not prove the claim.
    const b = newTarget("b2-reset");
    plant(b.t, GEM, ORIGINAL);
    status(runInstall(b.t, b.home), 0, "install");
    const users = plant(b.t, GEM, '{"context":{"fileName":["AGENTS.md","CONTEXT.md"]}}\n');
    status(runInstall(b.t, b.home), 0, "re-install");
    expect(readMarker(b.t).geminiSettings).toMatchObject({ addedEntry: false });
    const rb = runUninstall(b.t, b.home);
    status(rb, 0, "uninstall");
    expect(bytesOf(b.t, GEM).equals(users)).toBe(true);
    expect(rb.stdout).not.toMatch(/already listed/);
    const lines = [...naming(rb.stdout, "left", GEM), ...naming(rb.stdout, "skipped", GEM)];
    expect(lines.some((l) => /changed after install/.test(l) && /by hand/.test(l)), rb.stdout).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// B3 — install edits only the value it changes; install → uninstall is byte-identical
// ═══════════════════════════════════════════════════════════════════════════════════════════════
interface CorpusCase {
  readonly name: string;
  readonly body: string | Buffer;
  /** The bytes install may replace (a string fileName it wraps into an array); "" for pure insertion. */
  readonly replaced?: string;
}

const GEMINI_CORPUS: readonly CorpusCase[] = [
  { name: "a big integer, a decimal with a trailing zero and an exponent", body: '{"id": 12345678901234567890, "ratio": 1.50, "e": 1E+2, "context": {"fileName": ["GEMINI.md"]}}\n' },
  { name: "integer-like keys out of numeric order", body: '{"10": "a", "2": "b", "context": {"fileName": "GEMINI.md"}}\n', replaced: '"GEMINI.md"' },
  { name: "nested values and unicode escapes", body: '{"a": {"b": [1, {"c": "\\u00e9\\ud83d\\ude00"}]}, "context": {"fileName": ["G\\u0045MINI.md"]}}\n' },
  { name: "CRLF line ends", body: '{\r\n  "context": {\r\n    "fileName": [\r\n      "GEMINI.md"\r\n    ]\r\n  }\r\n}\r\n' },
  { name: "tab indentation and a context with no fileName", body: '{\n\t"context": {\n\t\t"other": true\n\t}\n}\n' },
  { name: "a byte order mark", body: '﻿{"context": {"fileName": "GEMINI.md"}}\n', replaced: '"GEMINI.md"' },
  { name: "no final newline and no context", body: '{"theme":"dark"}' },
  { name: "an empty object with spaces and blank lines after it", body: "{ }  \n\n" },
  { name: "an empty array fileName with a space inside", body: '{"context":{"fileName":[ ]}}' },
  { name: "odd whitespace and an escaped slash", body: '{ "context" : { "fileName" : [ "GEMINI.md" ] } , "path" : "a\\/b" }\n' },
  { name: "an empty-string fileName", body: '{"context":{"fileName":""}}\n', replaced: '""' },
  { name: "a duplicate key off the edited path", body: '{"theme": "a", "theme": "b", "context": {"fileName": ["GEMINI.md"]}}\n' },
];

const GEMINI_REFUSED: readonly CorpusCase[] = [
  { name: "duplicate context keys", body: '{"context": {"fileName": ["A.md"]}, "context": {"fileName": ["GEMINI.md"]}}\n' },
  { name: "duplicate fileName keys", body: '{"context": {"fileName": ["A.md"], "fileName": ["GEMINI.md"]}}\n' },
  { name: "a line comment", body: '{\n  // mine\n  "context": {"fileName": ["GEMINI.md"]}\n}\n' },
  { name: "a block comment", body: '{/* mine */ "context": {"fileName": ["GEMINI.md"]}}\n' },
  { name: "a trailing comma", body: '{"context": {"fileName": ["GEMINI.md",]}}\n' },
  { name: "bytes that are not UTF-8", body: Buffer.concat([Buffer.from('{"x": "'), Buffer.from([0xc3, 0x28]), Buffer.from('", "context": {"fileName": ["GEMINI.md"]}}\n')]) },
];

const CLAUDE_CORPUS: readonly CorpusCase[] = [
  { name: "a big integer, a decimal with a trailing zero, and an ask list", body: '{"permissions": {"allow": ["Bash(ls)"], "ask": ["Bash(rm *)"]}, "n": 12345678901234567890, "r": 1.50}\n' },
  { name: "integer-like keys out of numeric order, no permissions, no final newline", body: '{"10": 1, "2": 2}' },
  { name: "CRLF line ends and permissions with no ask", body: '{\r\n  "permissions": {\r\n    "allow": [\r\n      "Read"\r\n    ]\r\n  }\r\n}\r\n' },
  { name: "tab indentation and an empty ask list", body: '{\n\t"permissions": {\n\t\t"ask": []\n\t}\n}\n' },
  { name: "a byte order mark", body: '﻿{"model": "x"}\n' },
  { name: "unicode escapes", body: '{"env": {"X": "\\u00e9"}, "permissions": {"ask": ["Bash(git\\u0020status)"]}}\n' },
];

const CLAUDE_REFUSED: readonly CorpusCase[] = [
  { name: "duplicate permissions keys", body: '{"permissions": {"ask": []}, "permissions": {"allow": []}}\n' },
  { name: "a line comment", body: '{\n  // mine\n  "model": "x"\n}\n' },
];

describe("B3 (D-18): install splices only the value it changes, and install → uninstall restores the user's bytes exactly", () => {
  for (const [rel, corpus] of [
    [GEM, GEMINI_CORPUS],
    [CLA, CLAUDE_CORPUS],
  ] as const) {
    for (const c of corpus) {
      it(`${rel}: ${c.name} — every byte outside the edit is kept, and the round trip is byte-identical`, () => {
        const { t, home } = newTarget("b3");
        const before = plant(t, rel, c.body);
        const i = runInstall(t, home);
        status(i, 0, "install");
        const after = bytesOf(t, rel);
        expect(after.equals(before), `PREMISE: install changed ${rel}\n${i.stdout}`).toBe(false);
        expect(replacedSpan(before, after), `install rewrote bytes it did not need to change\nBEFORE:\n${before.toString("utf8")}\nAFTER:\n${after.toString("utf8")}`).toBe(
          c.replaced ?? "",
        );
        const parsed = parseLoose(after);
        if (rel === GEM) {
          const fileName = (parsed.context as Record<string, unknown>).fileName as unknown[];
          expect(fileName[fileName.length - 1]).toBe("AGENTS.md");
        } else {
          expect(((parsed.permissions as Record<string, unknown>).ask as unknown[]).length).toBeGreaterThan(0);
        }
        uninstallBoth(t, home, 0);
        expect(bytesOf(t, rel).equals(before), `the round trip changed ${rel}\nBEFORE:\n${before.toString("utf8")}\nAFTER:\n${bytesOf(t, rel).toString("utf8")}`).toBe(true);
      });
    }
  }

  for (const [rel, corpus] of [
    [GEM, GEMINI_REFUSED],
    [CLA, CLAUDE_REFUSED],
  ] as const) {
    for (const c of corpus) {
      it(`${rel}: ${c.name} — install refuses with a counted verify, and install → uninstall leaves the file byte-identical`, () => {
        const { t, home } = newTarget("b3-refuse");
        const before = plant(t, rel, c.body);
        const i = runInstall(t, home);
        status(i, 3, "install");
        expect(i.stderr).not.toMatch(NO_STACK_TRACE);
        expect(under(i.stdout, "verify").filter((l) => l.includes(rel)).length, i.stdout).toBe(1);
        expect(bytesOf(t, rel).equals(before), "install changed a file it refused").toBe(true);
        const r = runUninstall(t, home);
        expect(r.status === 0 || r.status === 3, r.stdout).toBe(true);
        expect(bytesOf(t, rel).equals(before), `uninstall changed ${rel}\n${r.stdout}`).toBe(true);
        expect(existsSync(abs(t, rel))).toBe(true);
      });
    }
  }
});

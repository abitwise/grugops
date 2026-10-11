// settings-json-provenance.test.ts — the red-team cases against plan 33.1-29 (brief
// 33.1-GAP-PLANNING-BRIEF.md §3: every red-team break is fixed before the next plan starts), and the
// same rules applied to the other user-owned JSON file install edits, `.claude/settings.json`.
//
// WHAT IS HELD HERE.
//   B1 (DC-2) Uninstall edits `.gemini/settings.json` only while `context.fileName` still holds the
//      record an earlier install wrote (the gemini entry's `fileNameContent`, one serialisation on both
//      sides). A user who removed install's entry and later wrote their own list (with their own
//      "AGENTS.md", other keys, other formatting) keeps it byte-identical, and so does a file under a
//      forged, well-formed record whose content record describes other content. DRY_RUN decides the same.
//      Phase 34.1 D-12: install no longer reads or writes the file, so the recorded append is planted by
//      the legacy fixture (ledger.test-support.ts plantLegacyGemini, shape "merged").
//   B2 (deleted by phase 34.1 D-12) held what a re-install that could not read the Gemini settings
//      recorded; install no longer reads the file, and carries an earlier entry verbatim
//      (install/uninstall-removal.test.ts, "legacy Gemini entry (D-12)").
//   B3 (D-18, never overwrite user content) Install edits a user's JSON file by splicing only the
//      value it changes into the original text; every other byte (big integers, trailing zeros,
//      integer-like key order, escapes, CRLF, tabs, a BOM, the final newline or its absence) is kept,
//      and install → uninstall restores the original bytes exactly. A file that cannot be spliced
//      safely (duplicate keys on the path, a comment) is refused with a counted verify and left
//      byte-identical. Since phase 34.1 D-12 the one settings file install edits is `.claude/settings.json`.
//
// Drives the COMMITTED install/install.js and install/uninstall.js (npm run build first), with HOME,
// GRUGOPS_HOME and TARGET in scratch directories removed at the end. Run it on Node 22 and Node 24.
//
// Vitest `globals: false` (the repo default) → the test functions are imported explicitly.

import { describe, it, expect, afterAll } from "vitest";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { MARKER_REL, type Run, makeFixture, runInstall, runUninstall, snapshotTree } from "./installer-paths.test-support.js";
import { geminiRecord, plantLegacyGemini, withLedger } from "./ledger.test-support.js";

const SCRATCH = realpathSync(mkdtempSync(join(tmpdir(), "grugops-settings-json-")));
// Phase 34.1 D-12 deleted B2, the one case that made a mode-000 file here, so the scratch root needs no restore.
afterAll(() => rmSync(SCRATCH, { recursive: true, force: true }));
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
  /** An installed target holding the recorded append an earlier install made (D-12: planted, not installed). */
  const legacyMerged = (tag: string): { t: string; home: string } => {
    const { t, home } = newTarget(tag);
    status(runInstall(t, home), 0, "install");
    plantLegacyGemini(t, "merged");
    return { t, home };
  };

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
      const { t, home } = legacyMerged("b1-lapsed");
      expect(geminiRecord(readMarker(t)), "PREMISE: install recorded its append").toMatchObject({ addedEntry: true });
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
    const { t, home } = legacyMerged("b1-forged");
    const m = withLedger(readMarker(t), (l) => [
      ...l.filter((e) => e.kind !== "gemini"),
      {
        path: GEM,
        kind: "gemini",
        createdFile: false,
        addedEntry: true,
        createdContext: false,
        fileNameBefore: "array",
        fileNameContent: sha(JSON.stringify(["OTHER.md", "AGENTS.md"])),
      },
    ]);
    writeMarker(t, m);
    const merged = bytesOf(t, GEM);
    const { dry, real } = uninstallBoth(t, home, 0);
    expect(bytesOf(t, GEM).equals(merged), real.stdout).toBe(true);
    expect(naming(dry.stdout, "would-edit", GEM), dry.stdout).toEqual([]);
    expect(naming(real.stdout, "removed", GEM), real.stdout).toEqual([]);
  });

  it("record holds (the user only re-formatted the file and added a key): uninstall removes install's entry and keeps every other byte", () => {
    const { t, home } = legacyMerged("b1-holds");
    plant(t, GEM, '{\n\t"context": {\n\t\t"fileName": [\n\t\t\t"GEMINI.md",\n\t\t\t"AGENTS.md"\n\t\t]\n\t},\n\t"n": 1.50\n}\n');
    const { dry, real } = uninstallBoth(t, home, 0);
    expect(naming(dry.stdout, "would-edit", GEM).length, dry.stdout).toBe(1);
    expect(naming(real.stdout, "removed", GEM).length, real.stdout).toBe(1);
    expect(bytesOf(t, GEM).toString("utf8")).toBe('{\n\t"context": {\n\t\t"fileName": [\n\t\t\t"GEMINI.md"\n\t\t]\n\t},\n\t"n": 1.50\n}\n');
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
  // Phase 34.1 D-12: the Gemini half (GEMINI_CORPUS, GEMINI_REFUSED) was deleted with the merge; install no longer
  // edits `.gemini/settings.json`.
  for (const [rel, corpus] of [[CLA, CLAUDE_CORPUS]] as const) {
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
        expect(((parsed.permissions as Record<string, unknown>).ask as unknown[]).length).toBeGreaterThan(0);
        uninstallBoth(t, home, 0);
        expect(bytesOf(t, rel).equals(before), `the round trip changed ${rel}\nBEFORE:\n${before.toString("utf8")}\nAFTER:\n${bytesOf(t, rel).toString("utf8")}`).toBe(true);
      });
    }
  }

  for (const [rel, corpus] of [[CLA, CLAUDE_REFUSED]] as const) {
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

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// IN-02 (plan 33.1-39): writeAskRules decides its splice and oracle before its DRY_RUN return, so over the
// whole .claude/settings.json corpus a DRY_RUN install and the real install exit alike and report the same
// outcome for the file (would-add ↔ created, verify ↔ verify, skipped ↔ skipped). The static order case
// is in install/install.test.ts.
// ═══════════════════════════════════════════════════════════════════════════════════════════════
describe("IN-02: a DRY_RUN install and the real install reach the same outcome for .claude/settings.json over the corpus", () => {
  const ASK_OUTCOME: Readonly<Record<string, string>> = { "would-add": "added", created: "added", verify: "verify", skipped: "skipped" };
  const outcomeOf = (stdout: string): string[] =>
    Object.keys(ASK_OUTCOME)
      .filter((label) => naming(stdout, label, CLA).length > 0)
      .map((label) => ASK_OUTCOME[label])
      .sort();
  const cases: readonly CorpusCase[] = [{ name: "no settings file at all", body: "" }, ...CLAUDE_CORPUS, ...CLAUDE_REFUSED];
  for (const c of cases) {
    it(`${c.name}: the same exit status and the same outcome for ${CLA}, and the preview writes nothing`, () => {
      const dryT = newTarget("in02-dry");
      const realT = newTarget("in02-real");
      if (c.body !== "") {
        plant(dryT.t, CLA, c.body);
        plant(realT.t, CLA, c.body);
      }
      const pre = snapshotTree(dryT.t);
      const dry = runInstall(dryT.t, dryT.home, [], { dryRun: true });
      expect(snapshotTree(dryT.t), `the DRY_RUN install changed the target\n${dry.stdout}`).toBe(pre);
      const real = runInstall(realT.t, realT.home);
      expect(dry.status, `DRY_RUN exit ${dry.status}, real exit ${real.status}\n${dry.stdout}\n----\n${real.stdout}`).toBe(real.status);
      const want = outcomeOf(real.stdout);
      expect(want.length, `PREMISE: the real install reported no outcome for ${CLA}\n${real.stdout}`).toBeGreaterThan(0);
      expect(outcomeOf(dry.stdout), `the preview reported another outcome for ${CLA}\n${dry.stdout}`).toEqual(want);
    });
  }
});

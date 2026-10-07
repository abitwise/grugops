// canonical-path.test.ts — the one spelling of a recorded path (plan 34-11, D-19, defect class WIN-1;
// .planning/phases/34-model-effort-dial-pi-support/34-GAP-PLANNING-BRIEF.md §1 and §2.2).
//
// WHAT FAILED. The windows-latest run 37521787426 (job 112468804112) printed, for 91 tests, a marker
// "written for another directory (C:\Users\...), not this one (C:/Users/...)": one directory, two
// spellings, compared as bytes. install/user-file.ts canonicalPathSpelling is now the one function that
// spells a recorded path, and sameRecordedPath compares through it on both sides.
//
// WHY THESE TESTS RUN ON EVERY OS. The function takes the path flavor as a parameter and branches only
// on it, never on the platform. Every case below hands it `path.win32` or `path.posix` explicitly, so a
// macOS or Linux run exercises the Windows spellings, and a mutation of either flavor's rule turns a case
// red on any host. This proves the spelling rule; it does not prove a windows-latest run is green (WIN-3:
// that is measured only by a human-pushed CI run).
//
// Drives the COMMITTED install/user-file.js (npm run build first). Pure except case (11), which resolves
// one scratch directory and removes it.
//
// Vitest `globals: false` (the repo default) → the test functions are imported explicitly.

import { describe, it, expect, afterAll } from "vitest";
import path from "node:path";
import { mkdtempSync, realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { absoluteSpelling, canonicalPathSpelling, realTargetPath, sameRecordedPath, type PathFlavor } from "./user-file.js";

const win = path.win32;
const posix = path.posix;
const B = "\\";

// The exact pair printed by job 112468804112 of run 37521787426 (the installer-user-edit rows): the
// recorded target in the host's native spelling, and this directory's real path as the product spelled it.
const LOG_RECORDED = String.raw`C:\Users\runneradmin\AppData\Local\Temp\grugops-useredit-tesGCj\edit-default-1`;
const LOG_HERE = "C:/Users/runneradmin/AppData/Local/Temp/grugops-useredit-tesGCj/edit-default-1";

interface SpellRow {
  readonly name: string;
  readonly flavor: PathFlavor;
  readonly input: string;
  readonly spelled: string;
}

// The spelling table: derived once, its size asserted, so a dropped row fails.
const SPELL_TABLE: readonly SpellRow[] = [
  { name: "(1) the log's recorded spelling", flavor: win, input: LOG_RECORDED, spelled: LOG_HERE },
  { name: "(1) the log's here spelling", flavor: win, input: LOG_HERE, spelled: LOG_HERE },
  { name: "(2) mixed separators", flavor: win, input: String.raw`C:\Users/x\y`, spelled: "C:/Users/x/y" },
  { name: "(3) lower-case drive letter", flavor: win, input: String.raw`c:\x`, spelled: "C:/x" },
  { name: "(3) forward-slash drive form", flavor: win, input: "C:/x", spelled: "C:/x" },
  { name: "(4) trailing separator kept", flavor: win, input: String.raw`C:\x` + B, spelled: "C:/x/" },
  { name: "(5) long-form drive prefix dropped", flavor: win, input: String.raw`\\?\C:\x`, spelled: "C:/x" },
  { name: "(5) long-form UNC prefix to plain UNC", flavor: win, input: String.raw`\\?\UNC\srv\share\x`, spelled: "//srv/share/x" },
  { name: "(6) plain UNC", flavor: win, input: String.raw`\\srv\share\x`, spelled: "//srv/share/x" },
  { name: "(no dot resolution)", flavor: win, input: String.raw`C:\a\.\b\..\c`, spelled: "C:/a/./b/../c" },
  { name: "(7) posix backslash is a filename byte", flavor: posix, input: "/tmp/a" + B + "b", spelled: "/tmp/a" + B + "b" },
  { name: "(8) posix absolute unchanged", flavor: posix, input: "/tmp/x", spelled: "/tmp/x" },
  { name: "(8) posix lower-case letter-colon unchanged", flavor: posix, input: "c:/x", spelled: "c:/x" },
  { name: "(P10) a recorded relative path, win32", flavor: win, input: String.raw`a\b\c`, spelled: "a/b/c" },
  { name: "(P10) a recorded relative path, posix backslash kept", flavor: posix, input: "a" + B + "b", spelled: "a" + B + "b" },
];
const SPELL_TABLE_SIZE = 15;

describe("canonicalPathSpelling — one spelling per flavor (WIN-1)", () => {
  it("the spelling table has its full size", () => {
    expect(SPELL_TABLE.length).toBe(SPELL_TABLE_SIZE);
  });

  for (const row of SPELL_TABLE) {
    it(`${row.name}: ${JSON.stringify(row.input)} spells ${JSON.stringify(row.spelled)}`, () => {
      expect(canonicalPathSpelling(row.input, row.flavor)).toBe(row.spelled);
    });
  }

  it("(10) applying the spelling twice equals applying it once, for every input in the table", () => {
    for (const row of SPELL_TABLE) {
      const once = canonicalPathSpelling(row.input, row.flavor);
      expect(canonicalPathSpelling(once, row.flavor), row.name).toBe(once);
    }
  });
});

interface CompareRow {
  readonly name: string;
  readonly flavor: PathFlavor;
  readonly recorded: string;
  readonly here: string;
  readonly same: boolean;
}

const COMPARE_TABLE: readonly CompareRow[] = [
  { name: "(1) the exact pair job 112468804112 printed", flavor: win, recorded: LOG_RECORDED, here: LOG_HERE, same: true },
  { name: "(3) drive-letter case", flavor: win, recorded: String.raw`c:\x`, here: "C:/x", same: true },
  { name: "(5) long form against plain", flavor: win, recorded: String.raw`\\?\C:\x`, here: "C:/x", same: true },
  { name: "(7) posix backslash is not a separator", flavor: posix, recorded: "/tmp/a" + B + "b", here: "/tmp/a/b", same: false },
  { name: "(9) different directories, win32", flavor: win, recorded: "C:/x", here: "C:/y", same: false },
  { name: "(9) different drives, win32", flavor: win, recorded: "C:/x", here: "D:/x", same: false },
  { name: "(9) different directories, posix", flavor: posix, recorded: "/x", here: "/y", same: false },
  { name: "(9) posix keeps letter case", flavor: posix, recorded: "/X", here: "/x", same: false },
];
const COMPARE_TABLE_SIZE = 8;

describe("sameRecordedPath — the recorded value passes through the same spelling (WIN-1)", () => {
  it("the comparison table has its full size", () => {
    expect(COMPARE_TABLE.length).toBe(COMPARE_TABLE_SIZE);
  });

  for (const row of COMPARE_TABLE) {
    it(`${row.name}: ${row.same ? "same" : "different"}`, () => {
      expect(sameRecordedPath(row.recorded, row.here, row.flavor)).toBe(row.same);
      expect(sameRecordedPath(row.here, row.recorded, row.flavor)).toBe(row.same);
    });
  }
});

describe("realTargetPath — the product's spelling of a real directory", () => {
  const scratch = mkdtempSync(path.join(tmpdir(), "grugops-canonical-"));
  afterAll(() => rmSync(scratch, { recursive: true, force: true }));

  it("(11) equals canonicalPathSpelling of the operating system's real path, under the host flavor", () => {
    const here = realTargetPath(scratch);
    expect(here).not.toBeNull();
    expect(here).toBe(canonicalPathSpelling(realpathSync.native(scratch)));
    expect(sameRecordedPath(realpathSync.native(scratch), here as string)).toBe(true);
  });
});

interface AbsoluteRow {
  readonly name: string;
  readonly flavor: PathFlavor;
  readonly p: string;
  readonly cwd: string;
  readonly spelled: string;
}

// absoluteSpelling (install.ts docAbspath, the doctor's kit-root cross-check, P8): the flavor's own
// isAbsolute decides, so a Windows `C:/…` kitRoot is absolute, and nothing is collapsed or trimmed.
const ABSOLUTE_TABLE: readonly AbsoluteRow[] = [
  { name: "win32 forward-slash absolute kept", flavor: win, p: "C:/x", cwd: String.raw`D:\w`, spelled: "C:/x" },
  { name: "win32 backslash absolute spelled", flavor: win, p: String.raw`C:\x`, cwd: String.raw`D:\w`, spelled: "C:/x" },
  { name: "win32 relative prefixed with the canonical cwd", flavor: win, p: "a/b", cwd: String.raw`D:\w`, spelled: "D:/w/a/b" },
  { name: "win32 relative kept verbatim after the prefix", flavor: win, p: "a/./b/..", cwd: String.raw`D:\w`, spelled: "D:/w/a/./b/.." },
  { name: "win32 absolute trailing dot kept", flavor: win, p: String.raw`C:\k\agent-factory\.`, cwd: String.raw`D:\w`, spelled: "C:/k/agent-factory/." },
  { name: "posix absolute kept", flavor: posix, p: "/x", cwd: "/w", spelled: "/x" },
  { name: "posix relative prefixed", flavor: posix, p: "a", cwd: "/w", spelled: "/w/a" },
  { name: "posix letter-colon is relative", flavor: posix, p: "C:/x", cwd: "/w", spelled: "/w/C:/x" },
];
const ABSOLUTE_TABLE_SIZE = 8;

describe("absoluteSpelling — the doctor's kit-root spelling (P8)", () => {
  it("the absolute-spelling table has its full size", () => {
    expect(ABSOLUTE_TABLE.length).toBe(ABSOLUTE_TABLE_SIZE);
  });

  for (const row of ABSOLUTE_TABLE) {
    it(`${row.name}: ${JSON.stringify(row.p)} in ${JSON.stringify(row.cwd)} spells ${JSON.stringify(row.spelled)}`, () => {
      expect(absoluteSpelling(row.p, row.cwd, row.flavor)).toBe(row.spelled);
    });
  }
});

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
// Drives the COMMITTED install/user-file.js and install/install-marker.js (npm run build first). Not
// pure: case (11) resolves one scratch directory, and the isOwnLink host cases (plan 34-21) make links
// and a file in another scratch directory; both are removed afterwards.
//
// Plan 34-21 (D-23, review WR-09) adds: isRecordedAbsolute, the one absoluteness rule for a recorded path,
// as a table under both flavors; installMarkerProblems judging a marker path by that rule, per flavor; and
// isOwnLink comparing a link's readback with the recorded source through sameRecordedPath, on this host,
// with links staged through scripts/check-platform-shapes.js stageSymlinkOrSkip (a host that cannot make
// a link prints the skip and the route that still pins the rule).
//
// Plan 34-12 adds the test-side helpers (install/installer-paths.test-support.ts pathText, lineNamesPath,
// printedRel): the same spelling applied to a path the product PRINTS, proven here with the exact
// uninstall line job 112468804112 printed and with negative cases, under both flavors.
//
// Vitest `globals: false` (the repo default) → the test functions are imported explicitly.

import { describe, it, expect, afterAll } from "vitest";
import path from "node:path";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import {
  absoluteSpelling,
  canonicalPathSpelling,
  isOwnLink,
  isRecordedAbsolute,
  realTargetPath,
  sameRecordedPath,
  type PathFlavor,
} from "./user-file.js";
import { installMarkerProblems } from "./install-marker.js";
import { lineNamesPath, nativeRealPath, pathText, printedRel } from "./installer-paths.test-support.js";
import { skipLine, stageSymlinkOrSkip } from "../scripts/check-platform-shapes.js";

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
    expect(here).toBe(canonicalPathSpelling(nativeRealPath(scratch)));
    expect(sameRecordedPath(nativeRealPath(scratch), here as string)).toBe(true);
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

interface AbsRow {
  readonly name: string;
  readonly flavor: PathFlavor;
  readonly p: string;
  readonly absolute: boolean;
}

// isRecordedAbsolute (plan 34-21, D-23, WR-09): the one absoluteness rule for a recorded path, the flavor's
// own isAbsolute. The native UNC row is the marker target the hand-written rule refused on Windows; the
// posix `C:/x` row is the relative path it accepted on POSIX.
const ABS_RULE_TABLE: readonly AbsRow[] = [
  { name: "win32 forward-slash drive path", flavor: win, p: "C:/x", absolute: true },
  { name: "win32 backslash drive path", flavor: win, p: String.raw`C:\x`, absolute: true },
  { name: "win32 lower-case drive path", flavor: win, p: String.raw`c:\x`, absolute: true },
  { name: "win32 canonical UNC", flavor: win, p: "//srv/share/x", absolute: true },
  { name: "win32 native UNC", flavor: win, p: String.raw`\\srv\share\x`, absolute: true },
  { name: "win32 long-form drive path", flavor: win, p: String.raw`\\?\C:\x`, absolute: true },
  { name: "win32 drive-relative", flavor: win, p: "C:x", absolute: false },
  { name: "win32 bare name", flavor: win, p: "x", absolute: false },
  { name: "win32 dot-relative", flavor: win, p: String.raw`.\x`, absolute: false },
  { name: "win32 empty string", flavor: win, p: "", absolute: false },
  { name: "posix rooted", flavor: posix, p: "/x", absolute: true },
  { name: "posix letter-colon forward slash", flavor: posix, p: "C:/x", absolute: false },
  { name: "posix letter-colon backslash", flavor: posix, p: String.raw`C:\x`, absolute: false },
  { name: "posix backslash UNC spelling", flavor: posix, p: String.raw`\\srv\share`, absolute: false },
  { name: "posix bare name", flavor: posix, p: "x", absolute: false },
];
const ABS_RULE_TABLE_SIZE = 15;

describe("isRecordedAbsolute — the one absoluteness rule for a recorded path (plan 34-21, WR-09)", () => {
  it("the absoluteness table has its full size", () => {
    expect(ABS_RULE_TABLE.length).toBe(ABS_RULE_TABLE_SIZE);
  });

  for (const row of ABS_RULE_TABLE) {
    it(`${row.name}: ${JSON.stringify(row.p)} is ${row.absolute ? "absolute" : "not absolute"}`, () => {
      expect(isRecordedAbsolute(row.p, row.flavor)).toBe(row.absolute);
    });
  }
});

describe("installMarkerProblems — a marker path is absolute by the one rule, per flavor (plan 34-21, WR-09)", () => {
  // One otherwise valid marker per flavor: every field install writes, in values install could write.
  const posixMarker = { grugopsHome: "/h/.grugops", kitRoot: "/h/.grugops/agent-factory", installMode: "copy", kitVersion: "2.1.0", target: "/r" };
  const winMarker = { grugopsHome: "C:/h/.grugops", kitRoot: "C:/h/.grugops/agent-factory", installMode: "copy", kitVersion: "2.1.0", target: "C:/r" };

  it("posix: the valid marker has no problem (the control)", () => {
    expect(installMarkerProblems(posixMarker, posix)).toEqual([]);
  });

  it("posix: a target spelled `C:/x` is not an absolute path there", () => {
    expect(installMarkerProblems({ ...posixMarker, target: "C:/x" }, posix)).toEqual(["target is not an absolute path"]);
  });

  it("win32: a target in native UNC spelling, with grugopsHome and kitRoot in `C:/` spelling, has no problem", () => {
    expect(installMarkerProblems({ ...winMarker, target: String.raw`\\srv\share\repo` }, win)).toEqual([]);
  });

  it("win32: a drive-relative target is still refused, and a padded or empty kitRoot is still not install's value", () => {
    expect(installMarkerProblems({ ...winMarker, target: "C:r" }, win)).toEqual(["target is not an absolute path"]);
    expect(installMarkerProblems({ ...winMarker, kitRoot: " C:/k" }, win)).toEqual(["kitRoot is not an absolute path"]);
    expect(installMarkerProblems({ ...winMarker, kitRoot: "" }, win)).toEqual(["kitRoot is not an absolute path"]);
  });
});

describe("isOwnLink — a link's readback compared with the recorded source through the one spelling (plan 34-21)", () => {
  const scratch = mkdtempSync(path.join(tmpdir(), "grugops-ownlink-"));
  afterAll(() => rmSync(scratch, { recursive: true, force: true }));
  // An absolute source built with join under the scratch directory, as install builds its sources.
  const source = path.join(scratch, "kit", "AGENTS.md");
  mkdirSync(path.dirname(source), { recursive: true });
  writeFileSync(source, "kit\n");
  const elsewhere = path.join(scratch, "other", "AGENTS.md");
  const PINNED_BY = "the sameRecordedPath comparison table (both flavors, pure)";

  // Stage `at` -> `to`; a host that cannot make a link prints the skip and answers false.
  const staged = (to: string, name: string): string | null => {
    const at = path.join(scratch, name);
    const s = stageSymlinkOrSkip(to, at, "isOwnLink link", `canonical-path isOwnLink ${name}`);
    if (s !== null) {
      console.log(skipLine(s, PINNED_BY));
      return null;
    }
    return at;
  };
  const own = staged(source, "own-link");
  const rel = staged("kit/AGENTS.md", "relative-link");

  it("true for the link to its recorded source (the host flavor)", () => {
    if (own === null) return;
    expect(isOwnLink(own, source)).toBe(true);
  });

  it("true under path.win32 when the source is asked in backslash spelling (path.win32.normalize of it)", () => {
    if (own === null) return;
    const backslashed = win.normalize(source);
    expect(isOwnLink(own, backslashed, win)).toBe(true);
  });

  it("false for another directory's path, under both flavors", () => {
    if (own === null) return;
    expect(isOwnLink(own, elsewhere, posix)).toBe(false);
    expect(isOwnLink(own, elsewhere, win)).toBe(false);
    expect(isOwnLink(own, win.normalize(elsewhere), win)).toBe(false);
  });

  it("false for a link whose target is relative, under both flavors", () => {
    if (rel === null) return;
    expect(isOwnLink(rel, source, posix)).toBe(false);
    expect(isOwnLink(rel, source, win)).toBe(false);
    expect(isOwnLink(rel, source)).toBe(false);
  });

  it("false for a regular file and for an absent path", () => {
    expect(isOwnLink(source, source)).toBe(false);
    expect(isOwnLink(source, source, win)).toBe(false);
    expect(isOwnLink(path.join(scratch, "absent"), source)).toBe(false);
    expect(isOwnLink(path.join(scratch, "absent"), source, win)).toBe(false);
  });
});

// ── the test-side helpers for a PRINTED path (plan 34-12, D-19, WIN-1) ──────────────────────────────
// The exact line job 112468804112 of run 37521787426 printed for the uninstall-removal never-installed
// case: uninstall composes `${TARGET}/${rel}` from the host spelling of the target, so the line mixes both
// separators. The test looked for the all-backslash `join(target, ".claude", "agents")` and missed it.
const LOG_TARGET = String.raw`C:\Users\RUNNER~1\AppData\Local\Temp\grugops-removal-aRsjcl\never-real-18\target`;
const LOG_LEFT_LINE =
  String.raw`  left           C:\Users\RUNNER~1\AppData\Local\Temp\grugops-removal-aRsjcl\never-real-18\target/.claude/agents` +
  " (there is no install marker this run can use, so there is no record that install created it; left in place)";

interface NamesRow {
  readonly name: string;
  readonly flavor: PathFlavor;
  readonly line: string;
  readonly path: string;
  readonly names: boolean;
}

const NAMES_TABLE: readonly NamesRow[] = [
  { name: "(h1) the log's mixed uninstall line names the win32-joined path", flavor: win, line: LOG_LEFT_LINE, path: win.join(LOG_TARGET, ".claude", "agents"), names: true },
  { name: "(h2) the same line does not name .claude/agents-old", flavor: win, line: LOG_LEFT_LINE, path: win.join(LOG_TARGET, ".claude", "agents-old"), names: false },
  { name: "(h2) the log line with agents-old in place of agents does not name .claude/agents (the delimiter decides)", flavor: win, line: LOG_LEFT_LINE.replace("/.claude/agents ", "/.claude/agents-old "), path: win.join(LOG_TARGET, ".claude", "agents"), names: false },
  { name: "(h2) the same line does not name the parent .claude", flavor: win, line: LOG_LEFT_LINE, path: win.join(LOG_TARGET, ".claude"), names: false },
  { name: "(h2) the same line does not name another target", flavor: win, line: LOG_LEFT_LINE, path: win.join(LOG_TARGET + "2", ".claude", "agents"), names: false },
  { name: "(h3) the path at the end of a line", flavor: win, line: String.raw`  rmdir   C:\t/.claude`, path: String.raw`C:\t\.claude`, names: true },
  { name: "(h3) the path before a colon", flavor: win, line: String.raw`  verify  C:\t/.claude/agents: not writable`, path: String.raw`C:\t\.claude\agents`, names: true },
  { name: "(h3) the path before a closing parenthesis", flavor: win, line: String.raw`  left    x (C:\t/.claude)`, path: String.raw`C:\t\.claude`, names: true },
  { name: "(h4) posix: a path before a space", flavor: posix, line: "  left  /t/.claude/agents (x)", path: "/t/.claude/agents", names: true },
  { name: "(h4) posix: a backslash is a filename byte, not a separator", flavor: posix, line: "  left  /t" + B + "x", path: "/t/x", names: false },
  { name: "(h4) posix: agents-old is not agents", flavor: posix, line: "  left  /t/.claude/agents-old (x)", path: "/t/.claude/agents", names: false },
  { name: "(h5) a path before a comma that ends a clause", flavor: win, line: String.raw`  verify  .claude/agents/ — cannot read C:\t/.claude/agents, so the install set is unknown.`, path: String.raw`C:\t\.claude\agents`, names: true },
  { name: "(h5) a path before a semicolon that ends a clause", flavor: posix, line: "  info  the file this check reads is /t/.grugops/factory.config.json; any path", path: "/t/.grugops/factory.config.json", names: true },
  { name: "(h5) a path that ends a sentence", flavor: posix, line: "  verify  cannot read /t/x.", path: "/t/x", names: true },
  { name: "(h5) agents.md is not agents", flavor: posix, line: "  left  /t/.claude/agents.md (x)", path: "/t/.claude/agents", names: false },
  { name: "(h5) a comma inside a name is not a delimiter", flavor: posix, line: "  left  /t/a,b (x)", path: "/t/a", names: false },
];
const NAMES_TABLE_SIZE = 16;

interface RelRow {
  readonly name: string;
  readonly flavor: PathFlavor;
  readonly root: string;
  readonly printed: string;
  readonly rel: string;
}

const REL_TABLE: readonly RelRow[] = [
  { name: "(r1) a mixed win32 print under a backslash root", flavor: win, root: LOG_TARGET, printed: LOG_TARGET + "/.claude/agents", rel: ".claude/agents" },
  { name: "(r1) an all-backslash win32 print under the root", flavor: win, root: LOG_TARGET, printed: win.join(LOG_TARGET, ".claude", "agents"), rel: ".claude/agents" },
  { name: "(r1) the root itself", flavor: win, root: LOG_TARGET, printed: LOG_TARGET, rel: "" },
  { name: "(r2) a relative win32 print is kept, in the one spelling", flavor: win, root: LOG_TARGET, printed: String.raw`.claude\agents`, rel: ".claude/agents" },
  { name: "(r2) a relative posix print is kept verbatim", flavor: posix, root: "/t", printed: ".claude/agents", rel: ".claude/agents" },
  { name: "(r3) a win32 path outside the root", flavor: win, root: LOG_TARGET, printed: String.raw`C:\elsewhere\x`, rel: String.raw`OUTSIDE:C:\elsewhere\x` },
  { name: "(r3) a sibling that shares the root's prefix is outside", flavor: win, root: LOG_TARGET, printed: LOG_TARGET + "2/x", rel: `OUTSIDE:${LOG_TARGET}2/x` },
  { name: "(r3) posix: a backslash spelling is not under the root", flavor: posix, root: "/t", printed: "/t" + B + "x", rel: "OUTSIDE:/t" + B + "x" },
  { name: "(r1) posix: a path under the root", flavor: posix, root: "/t", printed: "/t/.claude", rel: ".claude" },
];
const REL_TABLE_SIZE = 9;

describe("pathText / lineNamesPath / printedRel — a printed path compared in the one spelling (plan 34-12)", () => {
  it("the helper tables have their full sizes", () => {
    expect(NAMES_TABLE.length).toBe(NAMES_TABLE_SIZE);
    expect(REL_TABLE.length).toBe(REL_TABLE_SIZE);
  });

  it("pathText is canonicalPathSpelling, for both flavors", () => {
    expect(pathText(LOG_LEFT_LINE, win)).toBe(canonicalPathSpelling(LOG_LEFT_LINE, win));
    expect(pathText("/t" + B + "x", posix)).toBe("/t" + B + "x");
  });

  for (const row of NAMES_TABLE) {
    it(`${row.name}: ${row.names ? "names" : "does not name"}`, () => {
      expect(lineNamesPath(row.line, row.path, row.flavor)).toBe(row.names);
    });
  }

  for (const row of REL_TABLE) {
    it(`${row.name}: ${JSON.stringify(row.printed)} is ${JSON.stringify(row.rel)}`, () => {
      expect(printedRel(row.root, row.printed, row.flavor)).toBe(row.rel);
    });
  }
});

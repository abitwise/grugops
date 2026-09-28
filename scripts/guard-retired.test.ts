// guard-retired.test.ts — the retired Bash command guard stays retired (phase 33.1, D-20 part (a)).
//
// WHAT THIS PROVES. Decision D-17 (amended by D-26; with D-22 and D-28) retired the Bash
// command-parsing guard, its two-key floor-grant family, its banner and evaluator, its deny matcher
// and corpus, and the oracles that asserted its deny. The hard floor now lives at the git host and the
// speed bump in the host CLI's own permission rules. This test holds that retirement mechanically:
// every file `git ls-files` reports, minus a pinned exclusion list of seven history and self entries,
// must carry ZERO names from any retired family. A retired name that comes back into the live tree
// turns the suite red and the failure names the file and the family.
//
// WHERE THE NAMES COME FROM. Only from scripts/dead-vocabulary.ts, the tree's one home for retired
// vocabulary. This file holds no retired literal of its own; the mutation case plants members it
// reads from that module. Both that module and its compiled twin contain every literal they define,
// so they are in the exclusion list, as is this file.
//
// HOW IT AVOIDS PASSING VACUOUSLY (T-33.1-100, T-33.1-101):
//   - the scan set is derived from git, never hand-listed, and asserted non-vacuous (size floor plus
//     named members);
//   - the exclusion list is pinned by content AND by length, so widening it to go green is a visible
//     act in a diff, not a quiet edit;
//   - every file is decoded as latin1, so a file carrying a NUL byte is scanned like text (a
//     binary-classified file is where BSD grep silently reports zero matches);
//   - a mutation case plants one member of every family into a temp copy of a scanned file and asserts
//     the same matcher reports each family.
//
// NOT in the e2e lane. Run it with:
//   npx vitest run --exclude '**/scripts/e2e/**' scripts/guard-retired.test.ts
// Vitest globals:false → import explicitly.

import { describe, it, expect, afterEach } from "vitest";
import { execFileSync } from "node:child_process";
import {
  appendFileSync,
  copyFileSync,
  mkdtempSync,
  readFileSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  RETIRED_GUARD_FILE_PATTERN,
  RETIRED_GUARD_IDENTIFIERS,
  RETIRED_GUARD_PREFIXES,
} from "./dead-vocabulary.js";

const ROOT = join(import.meta.dirname, "..");

// The pinned exclusions. Entries ending in "/" exclude a directory prefix; the others exclude one
// exact path. The first four are history (planning records, audit records, the initial spec, the
// changelog); the last three are the vocabulary module, its compiled twin, and this file. Changing
// this list changes the two pins in the case below: that is the point.
const EXCLUDED: readonly string[] = [
  ".planning/",
  "docs/audit/",
  "docs/initial/",
  "CHANGELOG.md",
  "scripts/dead-vocabulary.ts",
  "scripts/dead-vocabulary.js",
  "scripts/guard-retired.test.ts",
];

function isExcluded(path: string): boolean {
  return EXCLUDED.some((e) => (e.endsWith("/") ? path.startsWith(e) : path === e));
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// One matcher per family, built only from the vocabulary module. F1 is a pattern; F2-F7 are whole
// words; the prefix family matches at a word start.
const FAMILY_MATCHERS: ReadonlyArray<{ family: string; re: RegExp }> = [
  { family: "F1", re: new RegExp(RETIRED_GUARD_FILE_PATTERN) },
  ...Object.entries(RETIRED_GUARD_IDENTIFIERS).map(([family, members]) => ({
    family,
    re: new RegExp(`\\b(?:${members.map(escapeRegExp).join("|")})\\b`),
  })),
  {
    family: "F4-prefix",
    re: new RegExp(`\\b(?:${RETIRED_GUARD_PREFIXES.map(escapeRegExp).join("|")})`),
  },
];

/** The families whose retired names appear in `text`. */
function retiredFamiliesIn(text: string): string[] {
  return FAMILY_MATCHERS.filter(({ re }) => re.test(text)).map(({ family }) => family);
}

function trackedFiles(): string[] {
  // -z: NUL-separated, so a path with unusual bytes is never quoted or split.
  return execFileSync("git", ["ls-files", "-z"], { cwd: ROOT, encoding: "utf8" })
    .split("\0")
    .filter((f) => f !== "");
}

function scanSet(): string[] {
  return trackedFiles().filter((f) => !isExcluded(f));
}

/** Read a tracked file as latin1; a tracked path absent on disk (an uncommitted deletion) is null. */
function readTracked(path: string): string | null {
  try {
    return readFileSync(join(ROOT, path), "latin1");
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw err;
  }
}

describe("guard-retired — no retired guard name survives in the live tree (D-20 (a))", () => {
  it("(i) every scanned file carries zero names from every retired family", () => {
    const hits: string[] = [];
    let read = 0;
    for (const f of scanSet()) {
      const text = readTracked(f);
      if (text === null) continue;
      read += 1;
      for (const family of retiredFamiliesIn(text)) hits.push(`${f}: ${family}`);
    }
    expect(read).toBeGreaterThan(100);
    expect(
      hits,
      `retired guard vocabulary (scripts/dead-vocabulary.ts, 33.1 D-17) found in the live tree:\n${hits.join("\n")}`,
    ).toEqual([]);
  });

  it("(ii) the exclusion list is exactly its seven pinned entries", () => {
    expect(EXCLUDED).toEqual([
      ".planning/",
      "docs/audit/",
      "docs/initial/",
      "CHANGELOG.md",
      "scripts/dead-vocabulary.ts",
      "scripts/dead-vocabulary.js",
      "scripts/guard-retired.test.ts",
    ]);
    expect(EXCLUDED.length).toBe(7);
    expect(EXCLUDED.length).not.toBe(6);
    expect(EXCLUDED.length).not.toBe(8);
  });

  it("(iii) the scan set is non-vacuous and contains the live files that carried the guard", () => {
    const scan = scanSet();
    expect(scan.length).toBeGreaterThan(100);
    for (const member of [
      "CLAUDE.md",
      "AGENTS.md",
      "install/README.md",
      "hooks/hooks.json",
      "scripts/checkpoints.ts",
    ]) {
      expect(scan).toContain(member);
    }
    // Every family has at least one member, so no family matcher is an empty alternation.
    for (const members of Object.values(RETIRED_GUARD_IDENTIFIERS)) {
      expect(members.length).toBeGreaterThan(0);
    }
    expect(RETIRED_GUARD_PREFIXES.length).toBeGreaterThan(0);
    expect(Object.keys(RETIRED_GUARD_IDENTIFIERS)).toEqual(["F2", "F3", "F4", "F5", "F6", "F7"]);
  });

  it("(iv) hooks/hooks.json has exactly one PreToolUse entry: the MCP admission matcher", () => {
    const hooks = JSON.parse(readFileSync(join(ROOT, "hooks", "hooks.json"), "utf8")) as {
      hooks: { PreToolUse: Array<{ matcher: string }> };
    };
    const pre = hooks.hooks.PreToolUse;
    expect(pre).toHaveLength(1);
    expect(pre[0].matcher).toBe("mcp__(plugin_grugops_)?grugops__.*");
  });

  describe("(v) mutation: a planted name from every family is reported", () => {
    let tmp: string | null = null;
    afterEach(() => {
      if (tmp !== null) rmSync(tmp, { recursive: true, force: true });
      tmp = null;
    });

    it("the same matcher reports each family planted into a temp copy of AGENTS.md", () => {
      tmp = mkdtempSync(join(tmpdir(), "gops-guard-retired-"));
      const copy = join(tmp, "AGENTS.md");
      copyFileSync(join(ROOT, "AGENTS.md"), copy);
      // The unplanted copy is clean, so every hit below comes from the plant.
      expect(retiredFamiliesIn(readFileSync(copy, "latin1"))).toEqual([]);

      const expected: string[] = [];
      for (const { family } of FAMILY_MATCHERS) {
        const plantDir = mkdtempSync(join(tmp, `${family}-`));
        const planted = join(plantDir, "AGENTS.md");
        copyFileSync(copy, planted);
        let name: string;
        if (family === "F1") {
          // A path built at run time from the pattern's own base name, never written here.
          name = `hooks/${"guard"}.js`;
        } else if (family === "F4-prefix") {
          name = `${RETIRED_GUARD_PREFIXES[0]}PLANTED`;
        } else {
          name = RETIRED_GUARD_IDENTIFIERS[family][0];
        }
        appendFileSync(planted, `\nplanted: ${name}\n`);
        const found = retiredFamiliesIn(readFileSync(planted, "latin1"));
        expect(found, `planting ${family} in ${planted}`).toContain(family);
        expected.push(family);
      }
      expect(expected).toEqual(["F1", "F2", "F3", "F4", "F5", "F6", "F7", "F4-prefix"]);

      // The surviving admission gate's file name must NOT be reported (the F1 lookbehind).
      const survivor = join(tmp, "survivor.md");
      copyFileSync(copy, survivor);
      appendFileSync(survivor, "\nhooks/admission-guard.js and hooks/admission-guard.ts\n");
      expect(retiredFamiliesIn(readFileSync(survivor, "latin1"))).toEqual([]);
    });
  });
});

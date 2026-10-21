// check-state-paths.ts — the old-spelling gate (phase 36, D-13 step 4; LAYOUT-01, LAYOUT-02).
//
// Asserts that no file in this repository, outside a short per-file allow-list and the named .planning/ exclusion,
// spells the pre-v3 state root, and that no listed path lies under a directory named for it.
//
//   node scripts/check-state-paths.js
// Exit codes (the convention scripts/state-path-scan.ts states):
//   0  zero sites and zero legacy paths outside the allow-list;
//   1  one site or legacy path outside the allow-list, or more;
//   2  could not run: git failed (for example outside a repository), a listed file could not be read, the scan set
//      is empty, or an allow-list glob has a shape this gate does not read. No count is reported and no
//      ALL CHECKS PASSED line is printed.
//
// WHAT IT COUNTS. Everything is counted by scripts/state-path-scan.ts (scanTracked, countSpellings, SCAN_EXCLUSIONS):
// the slash, quoted-segment and backslash spellings of the pre-v3 root, each built from install/state-layout.ts, so
// this file holds no literal pre-v3 root and the scan run over it reports zero. It counts occurrences, not lines: two
// sites on one line count two. It subtracts exact occurrences of LEGACY_FALLBACK_CLAUSE and nothing else (D-15); the
// files that carry the clause are NOT allow-listed, so any other old spelling in them still counts.
//
// WHAT IT EXCLUDES, BY NAME (D-11). `.planning/`, through SCAN_EXCLUSIONS. The output prints the exclusion, its reason
// and the number of files it skipped.
//
// THE ALLOW-LIST (D-09, D-10, D-16, D-04). One entry per file or directory, each with a reason. A glob ending in `/**`
// matches every file under that directory at any depth; any other glob is one exact path. A prefix that is not a full
// path segment never matches: `docs/audit/**` does not match `docs/audit-notes.md`. An entry is never widened to make
// a red go away; a site found outside is fixed at its source with the constants. scripts/check-state-paths.test.ts
// asserts the converse over the live tree: every entry matches at least one listed file and holds at least one site,
// so a dead entry is red. It never pins the list's length.
//
// EVERY COUNT IT PRINTS IS READ FROM THIS RUN: the scanned denominator, the excluded count, each entry's per-spelling
// counts, the inside and outside totals, and the clause occurrences removed. Nothing is typed.
//
// OUTPUT ORDER. Allow-list entries print in declaration order; outside sites print sorted by path, then line, then
// spelling order; outside legacy paths print sorted. Two runs over one tree print identical output.
//
// No node: import of its own; it reads the tree only through ./state-path-scan.js, plus ./is-entry.js. Findings are written in clear voice.

import { isEntrypoint } from "./is-entry.js";
import {
  SCAN_EXCLUSIONS,
  SPELLING_NAMES,
  ScanError,
  scanTracked,
  type ScanResult,
  type SpellingName,
} from "./state-path-scan.js";

/** One allow-list entry: a path, or a directory glob ending in `/**`, and the reason it may name the pre-v3 root. */
export interface AllowEntry {
  readonly glob: string;
  readonly reason: string;
}

/**
 * The files that may name the pre-v3 state root. Declaration order is print order. Each entry carries the decision
 * that admits it; an entry without one does not belong here.
 */
export const ALLOW_LIST: readonly AllowEntry[] = Object.freeze([
  { glob: "install/state-layout.ts", reason: "the authority names the pre-v3 root once (D-10)" },
  { glob: "install/state-layout.js", reason: "the committed build of the authority (D-10)" },
  { glob: "docs/audit/**", reason: "historical audit records, never rewritten (D-09)" },
  { glob: "CHANGELOG.md", reason: "release history: entries before v3.0 record what was true then, and the v3.0 entry names the layout it moves from (D-09)" },
  { glob: "docs/initial/**", reason: "the original specification, kept as history (D-16)" },
  {
    glob: "docs/pre-v3-state-layout.md",
    reason: "the user doc for the pre-v3 layout a repository may carry until v4.0 (D-04)",
  },
]);

/** True when `glob` has a shape this gate reads: an exact path, or a directory followed by `/**`. */
export function isReadableGlob(glob: string): boolean {
  if (glob === "" || glob.startsWith("/") || glob.includes("\\")) return false;
  const body = glob.endsWith("/**") ? glob.slice(0, -3) : glob;
  return body !== "" && !body.includes("*") && !body.split("/").includes("") && !body.split("/").includes("..");
}

/** True when the repository-relative POSIX `path` is matched by `glob` (see the header for the two shapes). */
export function matchesGlob(glob: string, path: string): boolean {
  if (glob.endsWith("/**")) return path.startsWith(glob.slice(0, -2));
  return path === glob;
}

type Counts = Record<SpellingName, number>;
const zero = (): Counts => ({ slash: 0, segment: 0, backslash: 0 });
const sum = (c: Counts): number => SPELLING_NAMES.reduce((n, s) => n + c[s], 0);

/** One allow-list entry's share of the run. */
export interface EntryResult {
  readonly entry: AllowEntry;
  /** Listed, non-excluded paths the entry matches. */
  readonly files: number;
  readonly counts: Counts;
  readonly sites: number;
  readonly legacyPaths: number;
}

/** What the gate found. */
export interface GateResult {
  readonly scan: ScanResult;
  readonly entries: readonly EntryResult[];
  readonly inside: { readonly counts: Counts; readonly sites: number; readonly files: number; readonly legacyPaths: number };
  readonly outside: {
    readonly counts: Counts;
    readonly sites: number;
    readonly files: number;
    /** Every outside site, sorted by path, then line, then spelling order. */
    readonly siteList: ReadonlyArray<{ readonly path: string; readonly line: number; readonly spelling: SpellingName }>;
    /** Every outside legacy path, sorted. */
    readonly legacyPaths: readonly string[];
  };
}

const byPath = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0);

/** The first entry (declaration order) matching `path`, or undefined. */
function entryFor(allowList: readonly AllowEntry[], path: string): number {
  return allowList.findIndex((e) => matchesGlob(e.glob, path));
}

/**
 * Scan every listed file under `root` and partition sites and legacy paths into inside and outside `allowList`.
 * Throws ScanError when git fails, a file cannot be read, or an allow-list glob is not readable.
 */
export function evaluate(root: string, allowList: readonly AllowEntry[] = ALLOW_LIST): GateResult {
  for (const e of allowList) {
    if (!isReadableGlob(e.glob)) throw new ScanError(`allow-list glob ${JSON.stringify(e.glob)} is not an exact path or a directory followed by /**`);
    if (e.reason.trim() === "") throw new ScanError(`allow-list entry ${e.glob} gives no reason`);
    const under = SCAN_EXCLUSIONS.find((x) => e.glob.startsWith(x.prefix));
    if (under !== undefined) throw new ScanError(`allow-list entry ${e.glob} lies under the excluded ${under.prefix}, so it could never match`);
  }
  const scan = scanTracked(root, []);
  const perEntry = allowList.map(() => ({ files: 0, counts: zero(), legacyPaths: 0 }));
  const inside = { counts: zero(), files: 0, legacyPaths: 0 };
  const outsideCounts = zero();
  const outsideFiles = new Set<string>();
  const siteList: Array<{ path: string; line: number; spelling: SpellingName }> = [];
  for (const file of scan.files) {
    const i = entryFor(allowList, file.path);
    if (i >= 0) {
      inside.files += 1;
      for (const s of file.sites) {
        perEntry[i].counts[s.spelling] += 1;
        inside.counts[s.spelling] += 1;
      }
    } else {
      outsideFiles.add(file.path);
      for (const s of file.sites) {
        outsideCounts[s.spelling] += 1;
        siteList.push({ path: file.path, line: s.line, spelling: s.spelling });
      }
    }
  }
  const outsideLegacy: string[] = [];
  for (const p of scan.legacyPaths) {
    const i = entryFor(allowList, p);
    if (i >= 0) {
      perEntry[i].legacyPaths += 1;
      inside.legacyPaths += 1;
    } else outsideLegacy.push(p);
  }
  for (const p of scan.scannedPaths) {
    const i = entryFor(allowList, p);
    if (i >= 0) perEntry[i].files += 1;
  }
  siteList.sort((a, b) => byPath(a.path, b.path) || a.line - b.line || SPELLING_NAMES.indexOf(a.spelling) - SPELLING_NAMES.indexOf(b.spelling));
  outsideLegacy.sort(byPath);
  return {
    scan,
    entries: allowList.map((entry, i) => ({
      entry,
      files: perEntry[i].files,
      counts: perEntry[i].counts,
      sites: sum(perEntry[i].counts),
      legacyPaths: perEntry[i].legacyPaths,
    })),
    inside: { counts: inside.counts, sites: sum(inside.counts), files: inside.files, legacyPaths: inside.legacyPaths },
    outside: { counts: outsideCounts, sites: sum(outsideCounts), files: outsideFiles.size, siteList, legacyPaths: outsideLegacy },
  };
}

/** The entries that match no listed file or hold no site: the converse the test asserts (a dead entry is red). */
export function deadEntries(result: GateResult): EntryResult[] {
  return result.entries.filter((e) => e.files === 0 || e.sites + e.legacyPaths === 0);
}

const fmt = (c: Counts): string => SPELLING_NAMES.map((s) => `${s} ${c[s]}`).join(", ");

/** The report the CLI prints, every number read from `r`. Exposed so the test can compare two runs. */
export function render(r: GateResult): string {
  const out: string[] = [];
  out.push("check-state-paths: sites spelling the pre-v3 state root, against the allow-list (D-09, D-10, D-16)");
  out.push(
    `scanned ${r.scan.scanned} file(s) of ${r.scan.listed} listed; ${r.scan.excluded} excluded; ${r.scan.notOnDisk.length} not on disk`,
  );
  for (const { exclusion, count } of r.scan.excludedBy) out.push(`excluded: ${exclusion.prefix} (${exclusion.reason}): ${count} file(s) skipped`);
  for (const p of r.scan.notOnDisk) out.push(`not on disk: ${p}`);
  out.push(
    `fallback clause: ${r.scan.clauseOccurrences} exact occurrence(s) of LEGACY_FALLBACK_CLAUSE removed before counting (D-15); ` +
      "the files carrying it are not allow-listed",
  );
  out.push("allow-list (declaration order):");
  for (const e of r.entries) {
    out.push(
      `  ${e.entry.glob}: ${e.entry.reason}; ${e.files} file(s) matched; ${fmt(e.counts)}; ${e.sites} site(s); ${e.legacyPaths} legacy path(s)`,
    );
  }
  out.push(`inside the allow-list: ${fmt(r.inside.counts)}; ${r.inside.sites} site(s) in ${r.inside.files} file(s); ${r.inside.legacyPaths} legacy path(s)`);
  out.push(
    `outside the allow-list: ${fmt(r.outside.counts)}; ${r.outside.sites} site(s) in ${r.outside.files} file(s); ${r.outside.legacyPaths.length} legacy path(s)`,
  );
  for (const s of r.outside.siteList) out.push(`${s.path}:${s.line}: ${s.spelling}`);
  for (const p of r.outside.legacyPaths) out.push(`legacy path: ${p}`);
  return out.join("\n");
}

function couldNotRun(reason: string): never {
  process.stdout.write(`could not run: ${reason}\n\n== Result ==\nCOULD NOT RUN (exit 2): no count is reported\n`);
  process.stderr.write(`check-state-paths: could not run: ${reason}\n`);
  process.exit(2);
}

function main(): void {
  let result: GateResult;
  try {
    result = evaluate(process.cwd());
  } catch (err) {
    couldNotRun(err instanceof Error ? err.message : String(err));
  }
  if (result.scan.listed === 0) couldNotRun("the scan set is empty: git listed no file");
  if (result.scan.scanned === 0) {
    couldNotRun(
      `the scan set is empty: git listed ${result.scan.listed} file(s) and none was read (${result.scan.excluded} excluded, ${result.scan.notOnDisk.length} not on disk)`,
    );
  }
  const clean = result.outside.sites === 0 && result.outside.legacyPaths.length === 0;
  const lines = [render(result), "", "== Result =="];
  if (clean) {
    lines.push(
      `PASS: ${result.scan.scanned} file(s) scanned, zero sites and zero legacy paths outside the allow-list; ` +
        `${result.inside.sites} site(s) inside it, in ${result.entries.length} entr(ies)`,
      "ALL CHECKS PASSED",
    );
  } else {
    lines.push(
      `FAIL: ${result.outside.sites} site(s) in ${result.outside.files} file(s) and ${result.outside.legacyPaths.length} legacy path(s) outside the allow-list. ` +
        "Fix each at its source with the constants in install/state-layout.ts; never widen the allow-list to clear it.",
      "1 CHECK(S) FAILED",
    );
  }
  process.stdout.write(`${lines.join("\n")}\n`);
  process.exit(clean ? 0 : 1);
}

if (isEntrypoint(import.meta.url)) main();

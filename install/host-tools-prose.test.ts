// host-tools-prose.test.ts — the derived host-prose scan (phase 34, D-11, plan 34-09).
//
// WHAT THIS HOLDS. Shipped prose never states how many host CLIs grugops supports, and never lists
// the non-spawning hosts with exactly one of them left out. A count goes stale the day a host is
// added; a list that is one short tells a reader the support set is smaller than it is. Both are the
// set-literal drift class this repository keeps meeting, so neither is held by a hand grep list.
//
// THE SCAN SET IS DERIVED, NEVER LISTED. It is `git ls-files -z` in the scanned root, split on NUL,
// minus the declared exclusions below (each with its reason). `*.md` files form the markdown arm and
// `*.ts` files the TypeScript arm; `*.js` files are build outputs that follow their `.ts`, so they
// are in neither arm. A tracked file joins the scan by existing.
//
// THE HOST VOCABULARY IS DERIVED, NEVER LISTED. The short names and the non-spawning set come from
// HOST_TOOLS in install/host-tools.ts. No host name is spelled in this file.
//
// RULE A, THE COUNT WORD (case-insensitive). A number word from two to ten or a digit from 2 to 9,
// then any number of the qualifiers `other`, `supported`, `host` or `non-…` in any order, then a
// host noun: `CLIs`, `CLI`, `hosts`, `host tools`, `host-CLI`, or (markdown arm only) `tools`. The
// hyphen forms `<n>-tool` and `<n>-host` are hits in both arms. The rule runs over a joined BLOCK of text rather
// than one line, so a phrase that wraps across a line break is still found: a markdown block is a
// blank-line-delimited paragraph; a TypeScript block is a run of comment lines (broken at an empty
// comment line) or a run of code lines joined by a trailing `+` (a wrapped string literal).
//
// RULE B, THE SHORT HOST LIST. Each block (a markdown paragraph, where a table is one paragraph; a
// TypeScript comment paragraph or wrapped string) is checked for the registry short names it names
// (case-sensitive, word-bounded). Naming every `sequential`-dispatch host except exactly one is a
// hit; the finding names the host that was left out and the line where the list starts. A
// TypeScript line is judged inside its block, never alone: a block always contains its lines, so a
// line that names all hosts but one is reported unless its own paragraph names the missing host,
// and a list that wraps across a line break is not misread as short.
//
// EXEMPTIONS are declared, reasoned and counted: each entry names a file, a rule and a needle that
// must occur in the finding's block text. An exemption that no longer matches a finding fails (a
// stale exemption is a lie about the tree). Rule A takes an exemption only for a phrase that is not
// about host CLIs; the pinned Rule A exemption count is zero today.
//
// PROOF BY MUTATION. A scratch git repository (realpath'd mkdtemp, removed by afterAll) is planted
// with faults and committed, and the same scanner must report each fault by the right rule, find
// nothing in the clean files, and never scan a file under an excluded path. Planted count phrases
// are assembled from separate constants, so no source line of this file carries one itself.
//
// Windows-safe (D-09): files are listed with `git ls-files -z` through spawnSync and split on NUL,
// paths are joined per segment, lines are split on `\r?\n`, and no case changes a mode, creates a
// symlink or renames over a file.
//
// Vitest `globals: false` (the repo default) → the test functions are imported explicitly.

import { describe, it, expect, afterAll } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, realpathSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { HOST_TOOLS } from "./host-tools.js";

const REPO = join(import.meta.dirname, "..");

// ── Declared exclusions ──────────────────────────────────────────────────────────────────────────
/** Path prefixes never scanned, each with its reason. */
const EXCLUDED_PREFIXES: readonly { prefix: string; reason: string }[] = [
  { prefix: ".planning/", reason: "planning history: past plans and summaries record what was true then" },
  { prefix: "docs/audit/", reason: "audit records: dated entries quote text as it read when audited" },
  { prefix: "docs/initial/", reason: "the frozen product spec and brand inputs, kept as received" },
];
/** Whole files never scanned, each with its reason. */
const EXCLUDED_FILES: readonly { file: string; reason: string }[] = [
  { file: "CHANGELOG.md", reason: "release history: each entry records what a past release shipped" },
];

// ── The registry vocabulary ──────────────────────────────────────────────────────────────────────
/** The short names of the hosts that dispatch roles sequentially (every host but the spawning one). */
const SEQUENTIAL = HOST_TOOLS.filter((t) => t.dispatch === "sequential").map((t) => t.shortName);

const escapeRe = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const SHORT_NAME_RES = SEQUENTIAL.map((s) => ({ name: s, re: new RegExp(`(?<![\\w])${escapeRe(s)}(?![\\w])`) }));

// ── Rule A's grammar ─────────────────────────────────────────────────────────────────────────────
const NUMBER_WORDS = ["two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];
const NUMBER = `(?:${[...NUMBER_WORDS, "[2-9]"].join("|")})`;
const QUALIFIERS = `(?:(?:${["other", "supported", "host", "non-[A-Za-z][\\w-]*"].join("|")})[ -]+)*`;
const NOUNS_TS = ["host[ -]tools", "host-cli", "clis?", "hosts"];
const NOUNS_MD = [...NOUNS_TS, "tools"];
function ruleARe(arm: Arm): RegExp {
  const nouns = (arm === "md" ? NOUNS_MD : NOUNS_TS).join("|");
  return new RegExp(`\\b${NUMBER}[ -]+${QUALIFIERS}(?:${nouns})\\b|\\b${NUMBER}-(?:tool|host)\\b`, "gi");
}

// ── The scanner ──────────────────────────────────────────────────────────────────────────────────
type Arm = "md" | "ts";
type Rule = "A" | "B";

interface Finding {
  readonly file: string;
  /** 1-based line the hit starts on. */
  readonly line: number;
  readonly rule: Rule;
  /** Rule A: the matched phrase. Rule B: `omits <host>`. */
  readonly text: string;
  /** The joined text of the block (or line) the hit was found in; exemption needles match here. */
  readonly context: string;
}

interface Block {
  /** 0-based line indexes of the block's lines, in order. */
  readonly lines: number[];
  /** Each line's text with its comment marker or string quote stripped. */
  readonly parts: string[];
}

const COMMENT_LINE = /^\s*(?:\/\/|\/\*|\*(?!\/))/;
function stripTs(line: string): string {
  return line
    .replace(/^\s*(?:\/\/+|\/\*+|\*(?!\/))?\s*["'`]?/, "")
    .replace(/\*\/\s*$/, "")
    .replace(/["'`]\s*\+\s*$/, "")
    .trim();
}

function markdownBlocks(lines: readonly string[]): Block[] {
  const out: Block[] = [];
  let cur: Block | null = null;
  lines.forEach((raw, i) => {
    const t = raw.replace(/^\s*(?:>\s*)*/, "").trim();
    if (t === "") {
      if (cur) out.push(cur);
      cur = null;
      return;
    }
    if (!cur) cur = { lines: [], parts: [] };
    cur.lines.push(i);
    cur.parts.push(t);
  });
  if (cur) out.push(cur);
  return out;
}

function typescriptBlocks(lines: readonly string[]): Block[] {
  const out: Block[] = [];
  let cur: (Block & { kind: "comment" | "code"; open: boolean }) | null = null;
  const close = (): void => {
    if (cur) out.push({ lines: cur.lines, parts: cur.parts });
    cur = null;
  };
  lines.forEach((raw, i) => {
    const kind = COMMENT_LINE.test(raw) ? "comment" : "code";
    const t = stripTs(raw);
    if (t === "") {
      close();
      return;
    }
    const joins = cur !== null && cur.kind === kind && (kind === "comment" || cur.open);
    if (joins && cur) {
      cur.lines.push(i);
      cur.parts.push(t);
    } else {
      close();
      cur = { kind, open: false, lines: [i], parts: [t] };
    }
    if (cur && kind === "code") {
      cur.open = /\+\s*$/.test(raw);
      if (!cur.open) close();
    }
  });
  close();
  return out;
}

/** Join a block's parts with one space and keep each part's start offset, to map a hit to its line. */
function joinBlock(b: Block): { text: string; lineAt: (offset: number) => number } {
  const starts: number[] = [];
  let text = "";
  b.parts.forEach((p, k) => {
    if (k > 0) text += " ";
    starts.push(text.length);
    text += p;
  });
  const lineAt = (offset: number): number => {
    let k = 0;
    for (let j = 0; j < starts.length; j++) if (starts[j] <= offset) k = j;
    return b.lines[k] + 1;
  };
  return { text, lineAt };
}

/**
 * The one sequential host a text leaves out when it names all the others, with the offset of the
 * first host it does name; null when it names all of them, or two or more fewer.
 */
function omittedHost(text: string): { host: string; at: number } | null {
  const named = SHORT_NAME_RES.map((s) => ({ name: s.name, at: text.search(s.re) })).filter((n) => n.at >= 0);
  if (named.length !== SEQUENTIAL.length - 1) return null;
  const host = SEQUENTIAL.find((s) => !named.some((n) => n.name === s));
  return host === undefined ? null : { host, at: Math.min(...named.map((n) => n.at)) };
}

function scanFile(file: string, arm: Arm, body: string): Finding[] {
  const lines = body.split(/\r?\n/);
  const blocks = arm === "md" ? markdownBlocks(lines) : typescriptBlocks(lines);
  const out: Finding[] = [];
  const re = ruleARe(arm);
  for (const b of blocks) {
    const { text, lineAt } = joinBlock(b);
    for (const m of text.matchAll(re)) {
      out.push({ file, line: lineAt(m.index ?? 0), rule: "A", text: m[0], context: text });
    }
    const miss = omittedHost(text);
    if (miss !== null) out.push({ file, line: lineAt(miss.at), rule: "B", text: `omits ${miss.host}`, context: text });
  }
  return out;
}

interface Scan {
  /** Every path `git ls-files` reported, before exclusions. */
  readonly tracked: string[];
  readonly md: string[];
  readonly ts: string[];
  readonly findings: Finding[];
}

function trackedFiles(root: string): string[] {
  const r = spawnSync("git", ["ls-files", "-z"], { cwd: root, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  expect(r.error, `git ls-files could not run: ${String(r.error)}`).toBeUndefined();
  expect(r.status, `git ls-files failed: ${r.stderr}`).toBe(0);
  return r.stdout.split("\0").filter((p) => p !== "");
}

function isExcluded(rel: string): boolean {
  return EXCLUDED_PREFIXES.some((x) => rel.startsWith(x.prefix)) || EXCLUDED_FILES.some((x) => x.file === rel);
}

function scanTree(root: string): Scan {
  const tracked = trackedFiles(root);
  const kept = tracked.filter((p) => !isExcluded(p));
  const md = kept.filter((p) => p.endsWith(".md"));
  const ts = kept.filter((p) => p.endsWith(".ts"));
  const findings: Finding[] = [];
  for (const [arm, files] of [["md", md], ["ts", ts]] as const) {
    for (const f of files) findings.push(...scanFile(f, arm, readFileSync(join(root, ...f.split("/")), "utf8")));
  }
  return { tracked, md, ts, findings };
}

const show = (f: Finding): string => `${f.file}:${f.line} [Rule ${f.rule}] ${f.text}`;

// ── Declared exemptions ──────────────────────────────────────────────────────────────────────────
interface Exemption {
  readonly file: string;
  readonly rule: Rule;
  /** Must occur in the finding's block text. */
  readonly needle: string;
  readonly reason: string;
}

// Plan 34.1-04 removed two entries that went stale with the Antigravity CLI rename (phase 34.1, D-12): the R2 block
// and the oracle's SCOPE_SENTENCE pin now name the hosts that accept a per-agent `model` field without Antigravity CLI
// (whose support is `UNKNOWN - verify`) and without Pi, so neither omits exactly one host and neither is a finding.
const EXEMPTIONS: readonly Exemption[] = [
  {
    file: "agent-factory/packaging/subagent.frontmatter.md",
    rule: "B",
    needle: "R3, whether grugops should emit for the other host CLIs",
    reason:
      "The list names the hosts grugops could generate agent definitions for. The registry host it " +
      "leaves out has no per-agent definition format, so it is not a candidate (plan 34-07, D-12).",
  },
];
/** Pinned: moves only in the commit that adds or removes an exemption. */
const EXEMPTION_COUNT = 1;
/** Pinned: Rule A exemptions are allowed only for a phrase that is not about host CLIs; none today. */
const RULE_A_EXEMPTION_COUNT = 0;

const isExempt = (f: Finding): boolean =>
  EXEMPTIONS.some((e) => e.file === f.file && e.rule === f.rule && f.context.includes(e.needle));

/** The live scan, run once and shared by the live cases. */
let liveScan: Scan | null = null;
const live = (): Scan => (liveScan ??= scanTree(REPO));

const armOf = (file: string): Arm | null => (file.endsWith(".md") ? "md" : file.endsWith(".ts") ? "ts" : null);

function liveCase(arm: Arm): void {
  const scan = live();
  const inArm = scan.findings.filter((f) => armOf(f.file) === arm);
  const open = inArm.filter((f) => !isExempt(f));
  expect(open.map(show), `host count or short host list in tracked ${arm} files`).toEqual([]);
  const stale = EXEMPTIONS.filter((e) => armOf(e.file) === arm).filter(
    (e) => !inArm.some((f) => f.file === e.file && f.rule === e.rule && f.context.includes(e.needle)),
  );
  expect(stale.map((e) => `${e.file} [Rule ${e.rule}] ${e.needle}`), "stale exemption(s)").toEqual([]);
}

// ── Mutation proofs ──────────────────────────────────────────────────────────────────────────────
const SCRATCH = realpathSync(mkdtempSync(join(tmpdir(), "grugops-host-prose-")));
afterAll(() => rmSync(SCRATCH, { recursive: true, force: true }));

// Planted phrases are built from these parts so that no source line here carries a count phrase.
const PLANT_DIGIT = "5";
const PLANT_FIVE = "five";
const PLANT_FOUR = "four";
const PLANT_TOOLS = "tools";
const PLANT_CLIS = "CLIs";
const PLANT_HOST = "host";

function git(root: string, args: string[]): void {
  const r = spawnSync(
    "git",
    ["-c", "user.name=grugops-test", "-c", "user.email=grugops-test@example.invalid", "-c", "commit.gpgsign=false", ...args],
    { cwd: root, encoding: "utf8" },
  );
  expect(r.error, `git ${args[0]} could not run: ${String(r.error)}`).toBeUndefined();
  expect(r.status, `git ${args.join(" ")} failed: ${r.stderr}`).toBe(0);
}

/** A scratch git repository holding `files` (POSIX relative path → body), staged and committed. */
function plantedRepo(label: string, files: Record<string, string>): string {
  const root = join(SCRATCH, label);
  mkdirSync(root, { recursive: true });
  git(root, ["init", "-q"]);
  for (const [rel, body] of Object.entries(files)) {
    const parts = rel.split("/");
    if (parts.length > 1) mkdirSync(join(root, ...parts.slice(0, -1)), { recursive: true });
    writeFileSync(join(root, ...parts), body);
  }
  git(root, ["add", "-A"]);
  git(root, ["commit", "-q", "--no-verify", "-m", "plant"]);
  return root;
}

describe("the host-prose scan's premises (plan 34-09, D-11)", () => {
  it("the registry has at least two sequential hosts, so 'all but one' names at least one host", () => {
    expect(SEQUENTIAL.length).toBeGreaterThanOrEqual(2);
    expect(new Set(SEQUENTIAL).size, "duplicate short name").toBe(SEQUENTIAL.length);
  });

  it("the exemption table has exactly EXEMPTION_COUNT entries, each reasoned, and RULE_A_EXEMPTION_COUNT Rule A entries", () => {
    expect(EXEMPTIONS).toHaveLength(EXEMPTION_COUNT);
    expect(EXEMPTIONS.filter((e) => e.rule === "A")).toHaveLength(RULE_A_EXEMPTION_COUNT);
    for (const e of EXEMPTIONS) {
      expect(e.reason.length, `${e.file}: an exemption with no reason`).toBeGreaterThan(40);
      expect(e.needle.length, `${e.file}: an empty needle`).toBeGreaterThan(10);
      expect(isExcluded(e.file), `${e.file} is excluded, so its exemption can never match`).toBe(false);
    }
  });
});

describe("the host-prose scan catches both members of the class, by mutation (plan 34-09, D-11)", () => {
  const lastSeq = SEQUENTIAL[SEQUENTIAL.length - 1];
  const shortList = SEQUENTIAL.slice(0, -1).join(", ");

  it("(1) a markdown count phrase is reported by Rule A, naming file and line", () => {
    const root = plantedRepo("m1", { "docs/a.md": `# A\n\nIntro line.\nWorks across the ${PLANT_FIVE} ${PLANT_TOOLS}.\n` });
    const hits = scanTree(root).findings;
    expect(hits.map(show)).toEqual([`docs/a.md:4 [Rule A] ${PLANT_FIVE} ${PLANT_TOOLS}`]);
  });

  it("(2) a markdown paragraph naming every sequential host but the last is reported by Rule B, naming that host", () => {
    const root = plantedRepo("m2", { "b.md": `# B\n\nIt runs on ${shortList}.\n` });
    const hits = scanTree(root).findings;
    expect(hits.map(show)).toEqual([`b.md:3 [Rule B] omits ${lastSeq}`]);
  });

  it("(3) a TypeScript comment with a count before `non-CC CLIs` is reported by Rule A", () => {
    const root = plantedRepo("m3", {
      "src/c.ts": `// Covers the ${PLANT_FOUR} non-CC ${PLANT_CLIS} at the script level.\nexport const c = 1;\n`,
    });
    const hits = scanTree(root).findings;
    expect(hits.map(show)).toEqual([`src/c.ts:1 [Rule A] ${PLANT_FOUR} non-CC ${PLANT_CLIS}`]);
  });

  it("(4) a clean markdown file and a clean TypeScript file give zero findings, and both were scanned", () => {
    const root = plantedRepo("m4", {
      "clean.md": `# Clean\n\nIt runs on ${SEQUENTIAL.join(", ")}.\n\nTwo platforms, two answers.\n`,
      "clean.ts": `// It runs on ${SEQUENTIAL.join(", ")}.\nexport const tools = 2;\n`,
    });
    const scan = scanTree(root);
    expect(scan.md).toEqual(["clean.md"]);
    expect(scan.ts).toEqual(["clean.ts"]);
    expect(scan.findings.map(show)).toEqual([]);
  });

  it("(5) a count phrase under `.planning/` is tracked but never scanned", () => {
    const planted = `Across the ${PLANT_FIVE} ${PLANT_TOOLS}.\n`;
    const root = plantedRepo("m5", { ".planning/notes.md": planted, "ok.md": "# Ok\n" });
    const scan = scanTree(root);
    expect(scan.tracked).toContain(".planning/notes.md");
    expect(scan.md).toEqual(["ok.md"]);
    expect(scan.findings.map(show)).toEqual([]);
  });

  it("(6) a count phrase and a short host list that wrap across TypeScript lines are still reported", () => {
    const root = plantedRepo("m6", {
      "w.ts":
        `// On the ${PLANT_FOUR} non-spawning ${PLANT_HOST}\n// ${PLANT_CLIS} this is the only mode.\n` +
        `export const s =\n  "open on ${SEQUENTIAL.slice(0, 1).join("")}, " +\n  "${SEQUENTIAL.slice(1, -1).join(", ")} only.";\n`,
    });
    const hits = scanTree(root).findings;
    expect(hits.map(show)).toEqual([
      `w.ts:1 [Rule A] ${PLANT_FOUR} non-spawning ${PLANT_HOST} ${PLANT_CLIS}`,
      `w.ts:4 [Rule B] omits ${lastSeq}`,
    ]);
  });

  it("(7) the `<n>-tool` and `<n>-host` hyphen forms are Rule A hits, and bare `tools` is a host noun only in markdown", () => {
    const root = plantedRepo("m7", {
      "h.md": `The ${PLANT_DIGIT}-tool table.\n\nThe ${PLANT_DIGIT}-${PLANT_HOST} control.\n`,
      "h.ts": `// The ${PLANT_DIGIT}-tool table; the ${PLANT_FIVE} ${PLANT_TOOLS} of the build.\nexport const h = 1;\n`,
    });
    const hits = scanTree(root).findings;
    expect(hits.map(show)).toEqual([
      `h.md:1 [Rule A] ${PLANT_DIGIT}-tool`,
      `h.md:3 [Rule A] ${PLANT_DIGIT}-${PLANT_HOST}`,
      `h.ts:1 [Rule A] ${PLANT_DIGIT}-tool`,
    ]);
  });

  it("(8) a list wrapped across a string concatenation is judged whole, so a complete wrapped list is clean", () => {
    const root = plantedRepo("m9", {
      "full.ts": `export const s =\n  "open on ${SEQUENTIAL.slice(0, 1).join("")}, " +\n  "${SEQUENTIAL.slice(1).join(", ")} only.";\n`,
    });
    expect(scanTree(root).findings.map(show)).toEqual([]);
  });

  it("(9) an exemption whose needle matches no finding is reported as stale", () => {
    const root = plantedRepo("m8", { "x.md": `# X\n\nIt runs on ${SEQUENTIAL.join(", ")}.\n` });
    const findings = scanTree(root).findings;
    const probe: Exemption = { file: "x.md", rule: "B", needle: "It runs on", reason: "probe" };
    const matched = findings.some((f) => f.file === probe.file && f.rule === probe.rule && f.context.includes(probe.needle));
    expect(matched, "a complete host list gives no finding, so an exemption for it is stale").toBe(false);
  });
});

describe("the live tree carries no host count and no short host list (plan 34-09, D-11)", () => {
  it("markdown arm: premise — the scan set is non-empty, holds the anchor documents, and excludes the declared paths", () => {
    const scan = live();
    expect(scan.md.length).toBeGreaterThan(100);
    for (const f of ["README.md", "AGENTS.md", "CLAUDE.md", "agent-factory/packaging/adapters.md", "install/README.md"]) {
      expect(scan.md, `${f} is missing from the markdown scan set`).toContain(f);
    }
    for (const f of scan.md) expect(isExcluded(f), `${f} is excluded but was scanned`).toBe(false);
    expect(scan.tracked.some(isExcluded), "no tracked path is excluded, so the exclusion is untested").toBe(true);
  });

  it("markdown arm: zero findings outside the declared exemptions, and every markdown exemption still matches", () => {
    liveCase("md");
  });

  it("TypeScript arm: premise — the scan set is non-empty, holds the anchor sources and this file, and excludes the declared paths", () => {
    const scan = live();
    expect(scan.ts.length).toBeGreaterThan(100);
    for (const f of ["install/install.ts", "scripts/model-tiers.ts", "install/host-tools.ts", "install/host-tools-prose.test.ts"]) {
      expect(scan.ts, `${f} is missing from the TypeScript scan set`).toContain(f);
    }
    for (const f of scan.ts) expect(isExcluded(f), `${f} is excluded but was scanned`).toBe(false);
  });

  it("TypeScript arm: zero findings outside the declared exemptions, and every TypeScript exemption still matches", () => {
    liveCase("ts");
  });
});

// ── DOC-1 (DI-10, plan 34.1-31, D-31): the retired whole-file host entry claim ───────────────────
// Since the per-agent selection (phase 34.1, D-01), install writes the whole-file host entry of each CHOSEN agent
// only (install.ts writeWholeFileEntry, wholeFileEntryRels(SELECTION)). Five dated count re-pin notes from plan
// 34.1-01 said otherwise, and no test read a comment, so they stayed. This scan reads comments too (brief §4).
//
// THE NEEDLE is one sentence that names a host entry (or host entries) and says the write happens every run, the
// retired wording. Both parts are built from words below, so no source line of this file holds the claim. A sentence
// is a piece of a joined block (markdownBlocks, typescriptBlocks, joinBlock above) cut after `.`, `!` or `?` and
// whitespace, so a claim wrapped across comment lines or string parts is read whole. The true sentences that share
// one part only (the marker's `kitRoot` field, AGENTS.md's shared step, the README's shared files) are not hits.
//
// THE SCAN SET IS DERIVED: every tracked `.ts` under install/ (sources, tests and test support; `.js` twins are build
// outputs and follow their `.ts`), plus install/README.md, from `git ls-files -z`. Its size is held by a floor (46
// `.ts` files on 2026-10-12), so an empty or wrong listing cannot pass.

const DI10_ENTRY_WORDS = ["host", "entr"].join(" ");
const DI10_EVERY_WORDS = ["on", "every", "install"].join(" ");
const DI10_ENTRY_RE = new RegExp(`\\b${DI10_ENTRY_WORDS}(?:y|ies)\\b`, "i");
const DI10_EVERY_RE = new RegExp(`\\b${DI10_EVERY_WORDS}\\b`, "i");
/** The retired claim, spelled from parts, for the describe name and the planted proof. */
const DI10_CLAIM = `every whole-file ${DI10_ENTRY_WORDS}y ${DI10_EVERY_WORDS}`;
const DI10_SCAN_FLOOR = 40;

interface Di10Scan {
  readonly scanned: string[];
  /** `file:line`, the line holding the host entry words of a sentence that also holds the every-run words. */
  readonly hits: string[];
}

/** The DI-10 hits in one file's text: each sentence of each joined block that holds both parts of the needle. */
function di10Hits(file: string, body: string): string[] {
  const lines = body.split(/\r?\n/);
  const blocks = file.endsWith(".md") ? markdownBlocks(lines) : typescriptBlocks(lines);
  const out: string[] = [];
  for (const b of blocks) {
    const { text, lineAt } = joinBlock(b);
    let start = 0;
    for (const cut of [...text.matchAll(/[.!?]\s+/g), null]) {
      const end = cut === null ? text.length : (cut.index ?? 0) + 1;
      const sentence = text.slice(start, end);
      const entry = sentence.search(DI10_ENTRY_RE);
      if (entry >= 0 && DI10_EVERY_RE.test(sentence)) out.push(`${file}:${lineAt(start + entry)}`);
      if (cut !== null) start = (cut.index ?? 0) + cut[0].length;
    }
  }
  return out;
}

function di10Scan(root: string): Di10Scan {
  const scanned = trackedFiles(root).filter((p) => (p.startsWith("install/") && p.endsWith(".ts")) || p === "install/README.md");
  const hits: string[] = [];
  for (const f of scanned) hits.push(...di10Hits(f, readFileSync(join(root, ...f.split("/")), "utf8")));
  return { scanned, hits };
}

describe(`DOC-1 (DI-10): no tracked installer source or README says install writes ${DI10_CLAIM}`, () => {
  it("the live scan finds no hit, over a derived set held by a floor that holds the README, this file and the five re-pinned tests", () => {
    const scan = di10Scan(REPO);
    expect(scan.hits, "tracked installer files that still say install writes every agent's whole-file host entry every run").toEqual([]);
    expect(scan.scanned.filter((f) => f.endsWith(".ts")).length, "the derived install/*.ts set is too small").toBeGreaterThanOrEqual(DI10_SCAN_FLOOR);
    for (const f of [
      "install/README.md",
      "install/host-tools-prose.test.ts",
      "install/installer-paths.test-support.ts",
      "install/installer-cross-version.test.ts",
      "install/installer-never-installed.test.ts",
      "install/installer-special-files.test.ts",
      "install/installer-user-edit.test.ts",
      "install/ledger-provenance.test.ts",
    ]) {
      expect(scan.scanned, `${f} is not in the DI-10 scan set`).toContain(f);
    }
    expect(scan.scanned.some((f) => f.endsWith(".js")), "a `.js` build output is in the scan set").toBe(false);
  });

  it("a planted copy of a re-pinned test with its old wrapped comment restored is a hit naming the file and line; the true marker sentence is not", () => {
    const rel = "install/installer-user-edit.test.ts";
    const real = readFileSync(join(REPO, ...rel.split("/")), "utf8");
    // The note as plan 34.1-31 reworded it, and as plan 34.1-01 wrapped it before: the claim starts on one comment
    // line and ends on the next. The copy puts the old note back in place of the new one.
    const newNote =
      " * `.opencode/commands` entered INSTALLED_DIRS (29 -> 34), because install writes the whole-file host entry of each\n" +
      " * chosen agent and this test chooses every agent (runInstall's withAgentFlags). 59 -> 61.\n";
    const oldNote =
      ` * \`.opencode/commands\` entered INSTALLED_DIRS (29 -> 34), because install now writes every whole-file ${DI10_ENTRY_WORDS}y\n` +
      ` * ${DI10_EVERY_WORDS}. 59 -> 61.\n`;
    expect(real.split(newNote).length - 1, `premise: ${rel} holds the reworded note exactly once`).toBe(1);
    const planted = real.replace(newNote, oldNote);
    const claimLine = real.slice(0, real.indexOf(newNote)).split("\n").length;
    expect(planted.split("\n")[claimLine - 1], "premise: the claim line holds the host entry words").toContain(`whole-file ${DI10_ENTRY_WORDS}y`);
    // The control: the true sentence about the marker's `kitRoot` field shares the every-run words and no host entry.
    const control =
      "# Install\n\nInstall writes the kit root into the `kitRoot` field of `.grugops/install.json`\n" +
      `${DI10_EVERY_WORDS} (install.ts writeMarker).\n`;
    const controlTs =
      "// Install writes the kit root into the `kitRoot` field of `.grugops/install.json`\n" +
      `// ${DI10_EVERY_WORDS} (install.ts writeMarker).\nexport const c = 1;\n`;
    const root = plantedRepo("di10", { [rel]: planted, "install/README.md": control, "install/clean.ts": controlTs });
    const scan = di10Scan(root);
    expect(scan.scanned.sort()).toEqual(["install/README.md", "install/clean.ts", rel].sort());
    expect(scan.hits).toEqual([`${rel}:${claimLine}`]);
  });
});

// ── DOC-1 (D-34, plan 34.1-38): the retired printed-command claims ─────────────────────────────────
// Gap round 3 (D-36) changed where a printed install command takes its kit home and install mode from:
// host-tools.ts commandContextFromRecord takes them from an `ok` install marker for `install.js --check`, from the run
// for install, `--migrate`, `--update` and `--prune-old-kit`, and from the uninstall run (never an `unbound` marker) for
// the install command the uninstaller prints. Three shipped sentences said otherwise: the CHANGELOG line that following
// a printed install command never wrote a second kit, the README sentence that `--check` printed its commands in the
// mode it was run in, and the README sentence that the uninstaller's install step took its kit home from the marker
// when no GRUGOPS_HOME was given. Plans 34.1-35, 34.1-41 and 34.1-38 corrected them. A fourth, from plan 34.1-37's
// README sentence, put the GRUGOPS_SRC word first in every printed command, while scriptCommand prints it after any
// GRUGOPS_HOME word (the WR-23 case's span); plan 34.1-38 corrected it. This scan holds all four at zero.
//
// THE CLAIMS are spelled from parts below, so no source line of this file holds one, and a grep for a claim finds only
// real hits. Each is matched over a joined block (markdownBlocks, typescriptBlocks, joinBlock above) with any run of
// whitespace between its words, so a claim wrapped across lines or string parts is found, and the hit names the line
// where the claim starts.
//
// THE SCAN SET IS DERIVED from `git ls-files -z`: every tracked README.md, CHANGELOG.md, AGENTS.md, the markdown files
// directly under agent-factory/packaging/, and every `.ts` directly under install/ (sources, tests and test support;
// the `.js` twins are build outputs that follow their `.ts`). `.planning/` is never scanned: planning history records
// what was true then. A floor holds the anchor files and the size of the `.ts` arm, so an empty or wrong listing cannot
// pass.
//
// D-37 (gap round 4, plan 34.1-51, 34.1 review CR-05 and CR-06): no printed remedy offers removing the marker, for any
// marker read (install-marker.ts markerFixText is the one wording; the reader-state matrix in agents-record.test.ts and
// R20, R41, R43 and the R36 control follow it as printed). Three shipped sentences said otherwise and plan 34.1-51
// removed them: the README sentence that over a not-JSON marker `--check` and the installer still offered the
// fix-or-remove remedy (`fix-or-remove-marker`), that sentence's reason, that a fix could not give such a marker's
// record back (`no-record-a-fix`), and the README and CHANGELOG sentences that offered deleting the marker by hand
// after a flag-less uninstall so as to keep an edited file (`delete-marker-by-hand`; uninstall.ts keepWithoutRecord now
// offers the per-entry ledger edit on every run kind). Each is spelled so it matches the retired sentence and not the
// removal-offer patterns, test names and expectations in agents-record.test.ts that name the retired behaviour (its
// MARKER_REMOVAL and REMOVAL_OFFER patterns, and a `not.toContain` of the old kept-line text, which stops before "the").
//
// D-38 (gap round 4, plan 34.1-51, 34.1 review WR-25 and IN-32; plans 34.1-47 and 34.1-48): every printed install
// command states GRUGOPS_HOME, INSTALL_MODE and GRUGOPS_SRC, every printed uninstall command GRUGOPS_HOME and
// GRUGOPS_SRC, and none carries `--symlink` (host-tools.ts scriptCommand; the env-read census, R49 to R52 and the DI-16
// and DI-17 rows follow it). Plan 34.1-51 removed the sentences that said otherwise, in the README, the CHANGELOG and
// the code and test comments DI-20 found: the kit-home word only for a kit home other than the default
// (`home-only-not-default`, `home-when-another`, `home-not-default-so`), the symlink flag for a symlink install
// (`symlink-word`, which leaves "no printed command carries `--symlink`" alone), the checkout word only for another
// checkout (`src-only-other`), an uninstall command stating no kit home (`uninstall-no-kit-home`), and the CHANGELOG's
// general equality of the uninstaller's install command with `install.js --check`'s, which R39 shows only for one
// case (`same-command-as-check`, 34.1 review IN-32).
//
// D-42 (gap round 5, plan 34.1-56, 2026-10-14, 34.1 review WR-37): the bare claim that following a `--check` remedy, or
// a printed command, never leaves a second kit behind (`no-second-kit`). A kit home moved by hand made it false: the
// doctor's printed install commands state the recorded kit home, so following one copies a kit back there while the
// moved kit stays. The CHANGELOG sentence and the install.ts COMMAND_CONTEXT comment that said it now say what the doctor does
// with a moved kit home (its moved-kit FAIL, whose by-hand remedy writes no kit), and R54 in kit-route.test.ts follows
// that remedy as printed.

const RETIRED_PRINTED_CLAIMS: readonly { readonly id: string; readonly words: readonly string[] }[] = [
  { id: "second-kit", words: ["never", "writes", "a", "second", "kit"] },
  { id: "mode-it-ran-in", words: ["in", "the", "mode", "it", "ran", "in"] },
  { id: "marker-kit-home", words: ["else", "the", "one", "the", "marker", "records"] },
  { id: "src-first", words: ["starts", "with", "`?GRUGOPS_SRC"] },
  { id: "fix-or-remove-marker", words: ["says?", "to", "fix", "or", "remove"] },
  { id: "no-record-a-fix", words: ["no", "record", "a", "fix", "could", "give", "back"] },
  { id: "delete-marker-by-hand", words: ["delete", "(?:the\\s+marker|`?\\.grugops/install\\.json`?)", "by", "hand", "to", "keep", "the"] },
  { id: "home-only-not-default", words: ["`?GRUGOPS_HOME=<dir>`?", "when", "the", "kit", "home", "it", "names", "is", "not"] },
  { id: "home-when-another", words: ["GRUGOPS_HOME", "when", "this", "run", "used", "another", "kit", "home"] },
  { id: "home-not-default-so", words: ["kit", "home", "is", "not", "the", "default", "one,", "so"] },
  { id: "symlink-word", words: ["(?:carries|and)", "`?--symlink`?", "(?:for\\s+a|when\\s+(?:it|this\\s+run)\\s+was\\s+a)", "symlink", "install"] },
  { id: "src-only-other", words: ["(?:other\\s+than\\s+the\\s+one\\s+the\\s+script\\s+is\\s+in|is\\s+not\\s+this\\s+script's\\s+own\\s+checkout)"] },
  { id: "uninstall-no-kit-home", words: ["carries", "no", "`?GRUGOPS_HOME"] },
  { id: "same-command-as-check", words: ["is", "the", "one", "`?install\\.js", "--check`?", "prints", "for", "the", "same", "marker"] },
  { id: "no-second-kit", words: ["writes", "no", "second", "kit"] },
];
/** One retired claim's words, by id, so a planted proof reads them from the table rather than by index. */
const claimWords = (id: string): readonly string[] => {
  const c = RETIRED_PRINTED_CLAIMS.find((x) => x.id === id);
  if (c === undefined) throw new Error(`no retired claim ${id}`);
  return c.words;
};
const retiredClaimRe = (words: readonly string[]): RegExp => new RegExp(`\\b${words.join("\\s+")}\\b`, "gi");
const RETIRED_SCAN_ANCHORS = [
  "install/README.md",
  "CHANGELOG.md",
  "AGENTS.md",
  "install/host-tools.ts",
  "install/install.ts",
  "install/uninstall.ts",
  "install/host-tools-prose.test.ts",
];
const RETIRED_SCAN_TS_FLOOR = 40;

function inRetiredScanSet(p: string): boolean {
  if (p.startsWith(".planning/")) return false;
  if (p === "README.md" || p.endsWith("/README.md")) return true;
  if (p === "CHANGELOG.md" || p === "AGENTS.md") return true;
  if (/^agent-factory\/packaging\/[^/]+\.md$/.test(p)) return true;
  return /^install\/[^/]+\.ts$/.test(p);
}

/** Every retired claim in one file's text, as `file:line [id]`, the line where the claim starts. */
function retiredClaimHits(file: string, body: string): string[] {
  const lines = body.split(/\r?\n/);
  const blocks = file.endsWith(".ts") ? typescriptBlocks(lines) : markdownBlocks(lines);
  const out: string[] = [];
  for (const b of blocks) {
    const { text, lineAt } = joinBlock(b);
    for (const c of RETIRED_PRINTED_CLAIMS) {
      for (const m of text.matchAll(retiredClaimRe(c.words))) out.push(`${file}:${lineAt(m.index ?? 0)} [${c.id}]`);
    }
  }
  return out;
}

function retiredClaimScan(root: string): { scanned: string[]; hits: string[] } {
  const scanned = trackedFiles(root).filter(inRetiredScanSet);
  const hits: string[] = [];
  for (const f of scanned) hits.push(...retiredClaimHits(f, readFileSync(join(root, ...f.split("/")), "utf8")));
  return { scanned, hits };
}

describe("DOC-1 (D-34): no tracked document or comment carries a retired printed-command claim", () => {
  it("the live scan finds no hit, over a derived set held by a floor of anchor files and a `.ts` count", () => {
    const scan = retiredClaimScan(REPO);
    expect(scan.hits, "tracked documents or comments that still carry a retired printed-command claim").toEqual([]);
    for (const f of RETIRED_SCAN_ANCHORS) expect(scan.scanned, `${f} is not in the scan set`).toContain(f);
    expect(scan.scanned.filter((f) => f.endsWith(".ts")).length, "the derived install/*.ts set is too small").toBeGreaterThanOrEqual(RETIRED_SCAN_TS_FLOOR);
    expect(scan.scanned.some((f) => /^agent-factory\/packaging\/[^/]+\.md$/.test(f)), "no packaging markdown in the scan set").toBe(true);
    expect(scan.scanned.some((f) => f.startsWith(".planning/")), "a .planning/ file is in the scan set").toBe(false);
    expect(scan.scanned.some((f) => f.endsWith(".js")), "a `.js` build output is in the scan set").toBe(false);
  });

  it("a planted copy of install/README.md with a retired claim restored is a hit naming the file and line; each claim is found wrapped, and true sentences that share words are not", () => {
    const real = readFileSync(join(REPO, "install", "README.md"), "utf8");
    const anchor = "`install.js --check` reads the install marker it checks (`.grugops/install.json`). When that marker\n";
    expect(real.split(anchor).length - 1, "premise: install/README.md holds the --check sentence exactly once").toBe(1);
    // The sentence plan 34.1-35 removed, put back in front of the one that replaced it, wrapped as it was.
    const restored = `\`install.js --check\` prints its commands ${RETIRED_PRINTED_CLAIMS[1].words.join(" ")}, so after a \`--symlink\` install run\n` +
      "`--check --symlink`, or add `--symlink` to the install command it prints.\n";
    const planted = real.replace(anchor, restored + anchor);
    const claimLine = real.slice(0, real.indexOf(anchor)).split("\n").length;
    expect(planted.split("\n")[claimLine - 1], "premise: the claim line holds the restored sentence").toContain("prints its commands");
    // The other two claims, each wrapped across a line break, in a changelog entry and a code comment.
    const [w0, w2] = [RETIRED_PRINTED_CLAIMS[0].words, RETIRED_PRINTED_CLAIMS[2].words];
    const changelog = "# Changelog\n\n- An install command carries `--symlink`, so following it\n" +
      `  ${w0.slice(0, 2).join(" ")}\n  ${w0.slice(2).join(" ")} there (a review id).\n` +
      `- A printed command ${RETIRED_PRINTED_CLAIMS[3].words.slice(0, 2).join(" ")} \`GRUGOPS_SRC=<dir>\` when the run used another checkout.\n`;
    const comment = `// the kit home (the GRUGOPS_HOME you ran the uninstaller with, ${w2.slice(0, 2).join(" ")}\n` +
      `// ${w2.slice(2).join(" ")}).\nexport const c = 1;\n`;
    // Controls: true sentences that share words with a claim, and copies outside the scan set.
    const controlTs = "// --check: a printed command names its kit home, so it writes the kit there; no second kit home is named.\n" +
      "// An install command starts with GRUGOPS_HOME=<dir>, the default kit home included.\n" +
      "// The new marker records a copy install, and the kit home and install mode the marker records.\nexport const d = 1;\n";
    const outside = `${w0.join(" ")}\n`;
    const root = plantedRepo("doc1-printed", {
      "install/README.md": planted,
      "CHANGELOG.md": changelog,
      "install/uninstall.ts": comment,
      "install/clean.ts": controlTs,
      "install/uninstall.js": outside,
      ".planning/old/README.md": outside,
      "docs/other.md": outside,
    });
    const scan = retiredClaimScan(root);
    expect(scan.scanned.sort()).toEqual(["CHANGELOG.md", "install/README.md", "install/clean.ts", "install/uninstall.ts"]);
    expect(scan.hits.sort()).toEqual(
      [
        `install/README.md:${claimLine} [mode-it-ran-in]`,
        "CHANGELOG.md:4 [second-kit]",
        "CHANGELOG.md:6 [src-first]",
        "install/uninstall.ts:1 [marker-kit-home]",
      ].sort(),
    );
  });

  it("D-37 (plan 34.1-51): a planted README and CHANGELOG with the marker-removal sentences restored are hits naming the file and line, each wrapped; the never-remove sentences and the census patterns that name the old behaviour are not", () => {
    const real = readFileSync(join(REPO, "install", "README.md"), "utf8");
    const anchor = "**When uninstall keeps `.grugops/install.json`.** The marker is the only record of what install\n";
    expect(real.split(anchor).length - 1, "premise: install/README.md holds the kept-marker heading exactly once").toBe(1);
    // The sentences plan 34.1-51 removed, put back in front of the kept-marker heading, each wrapped across a line
    // break as it was. The words come from the claim table (or from parts), so no source line here holds a claim.
    const noRecord = claimWords("no-record-a-fix");
    const say = ["say", "to", "fix"].join(" ");
    const restored =
      `A marker that is not JSON, or whose install ledger is malformed as well, holds ${noRecord.slice(0, 4).join(" ")}\n` +
      `${noRecord.slice(4).join(" ")}, so \`--check\` and the installer still ${say}\n` +
      "or remove it.\n\n" +
      `After a flag-less uninstall, ${"delete"} ${"`.grugops/install.json`"} ${"by"} hand\n` +
      `${["to", "keep", "the"].join(" ")} edited file for good; the uninstaller then has no record.\n\n`;
    const planted = real.replace(anchor, restored + anchor);
    const base = real.slice(0, real.indexOf(anchor)).split("\n").length;
    const plantedLines = planted.split("\n");
    expect(plantedLines[base - 1], "premise: the first restored line holds the no-record words").toContain(noRecord.slice(0, 4).join(" "));
    expect(plantedLines[base], "premise: the second restored line holds the fix-or-remove words").toContain(say);
    expect(plantedLines[base + 3], "premise: the delete line is where the test puts it").toContain("by hand");
    const changelog =
      "# Changelog\n\n- A file you edited keeps the install marker. To keep the file instead, after\n" +
      `  a flag-less uninstall ${["delete", "the", "marker"].join(" ")} by hand\n` +
      `  ${["to", "keep", "the"].join(" ")} file without a record (a review id).\n` +
      "- Uninstall names the field to fix by hand and says never to delete the marker; none of them offers to\n" +
      "  remove it. To keep the edited file, take its entry out of the `ledger` list in `.grugops/install.json`\n" +
      "  by hand, then run the command the run printed.\n";
    // Controls in a code file: the census patterns and expectations that name the retired behaviour.
    const controlTs =
      `const MARKER_REMOVAL = /\\b(fix or remove the marker|fix or remove it by hand|remove the marker)\\b/i;\n` +
      `const REMOVAL_OFFER = /\\bremove the marker\\b|\\bfix or remove\\b/i;\n` +
      `expect(out, "a partial run offers deleting the marker").not.toContain("${["delete", "the", "marker", "by", "hand", "to", "keep"].join(" ")}");\n` +
      "// The class \"no well-formed ledger: fix or remove\" is retired; never delete the marker by hand.\nexport const d = 1;\n";
    const root = plantedRepo("doc1-d37", {
      "install/README.md": planted,
      "CHANGELOG.md": changelog,
      "install/clean.ts": controlTs,
    });
    const scan = retiredClaimScan(root);
    expect(scan.scanned.sort()).toEqual(["CHANGELOG.md", "install/README.md", "install/clean.ts"]);
    expect(scan.hits.sort()).toEqual(
      [
        `install/README.md:${base} [no-record-a-fix]`,
        `install/README.md:${base + 1} [fix-or-remove-marker]`,
        `install/README.md:${base + 4} [delete-marker-by-hand]`,
        "CHANGELOG.md:4 [delete-marker-by-hand]",
      ].sort(),
    );
  });

  it("D-38 (plan 34.1-51): planted docs and comments with the printed-command sentences restored are hits naming the file and line, each wrapped; the sentences that replaced them are not", () => {
    const real = readFileSync(join(REPO, "install", "README.md"), "utf8");
    const anchor = "**When uninstall keeps `.grugops/install.json`.** The marker is the only record of what install\n";
    expect(real.split(anchor).length - 1, "premise: install/README.md holds the kept-marker heading exactly once").toBe(1);
    // The README sentences plan 34.1-51 removed, put back in front of the kept-marker heading, wrapped as they were.
    // The words come from parts, so no source line here holds a claim.
    const home = "`GRUGOPS_HOME=<dir>`";
    const restored =
      `It starts with ${home} ${["when", "the", "kit"].join(" ")}\n` +
      `${["home", "it", "names", "is", "not"].join(" ")} \`~/.grugops\`, and ${["carries", "`--symlink`", "for", "a"].join(" ")} symlink install.\n` +
      `It ${["carries", "no"].join(" ")} ${"`GRUGOPS_HOME=`"} and no \`--symlink\`: the uninstaller needs neither.\n` +
      `A command carries \`GRUGOPS_SRC=<dir>\` when the run used a kit checkout ${["other", "than"].join(" ")}\n` +
      `${["the", "one", "the", "script", "is", "in"].join(" ")}, so it renders from the checkout the run used.\n\n`;
    const planted = real.replace(anchor, restored + anchor);
    const base = real.slice(0, real.indexOf(anchor)).split("\n").length;
    expect(planted.split("\n")[base - 1], "premise: the first restored line is where the test puts it").toContain("It starts with");
    const changelog =
      "# Changelog\n\n- The uninstall line names that kit home, and the command is\n" +
      `  the one \`install.js --check\` ${["prints", "for", "the", "same"].join(" ")} marker and environment (a review id).\n` +
      "- A printed command always states `GRUGOPS_SRC=<dir>`, the kit checkout the run used (`GRUGOPS_SRC`,\n" +
      "  else the checkout the script is in). No printed command carries `--symlink`, so a `GRUGOPS_HOME`,\n" +
      "  `INSTALL_MODE` or `GRUGOPS_SRC` exported in your shell does not change what it does.\n";
    // The DI-20 comment forms: a product comment and a test comment.
    const productTs =
      `// path, ${["GRUGOPS_HOME", "when", "this", "run", "used"].join(" ")} another\n` +
      `// kit home, ${["and", "`--symlink`", "when", "this", "run"].join(" ")} was a symlink install, so\nexport const c = 1;\n`;
    const testTs =
      `    // context (the ${["kit", "home", "is", "not", "the", "default"].join(" ")} one, so GRUGOPS_HOME), and the\n` +
      "    // remedy renders from the same checkout: the context carries `GRUGOPS_SRC=<dir>` when it\n" +
      `    // ${["is", "not", "this", "script's", "own"].join(" ")} checkout.\nexport const e = 1;\n`;
    // Controls: the sentences that replaced them, and test expectations that name the retired word.
    const controlTs =
      "// no printed command carries `--symlink`; INSTALL_MODE is the one spelling install.js accepts for both modes.\n" +
      "// scriptCommand states GRUGOPS_HOME, the default kit home included, and GRUGOPS_SRC, this script's own checkout included.\n" +
      "// An uninstall command states GRUGOPS_HOME and GRUGOPS_SRC; an install command it prints states INSTALL_MODE=copy.\n" +
      'expect(words, "the printed command carries --symlink").not.toContain("--symlink");\nexport const d = 1;\n';
    const root = plantedRepo("doc1-d38", {
      "install/README.md": planted,
      "CHANGELOG.md": changelog,
      "install/install.ts": productTs,
      "install/closing-claims.test.ts": testTs,
      "install/clean.ts": controlTs,
    });
    const scan = retiredClaimScan(root);
    expect(scan.scanned.sort()).toEqual(["CHANGELOG.md", "install/README.md", "install/clean.ts", "install/closing-claims.test.ts", "install/install.ts"]);
    expect(scan.hits.sort()).toEqual(
      [
        `install/README.md:${base} [home-only-not-default]`,
        `install/README.md:${base + 1} [symlink-word]`,
        `install/README.md:${base + 2} [uninstall-no-kit-home]`,
        `install/README.md:${base + 3} [src-only-other]`,
        "CHANGELOG.md:3 [same-command-as-check]",
        "install/install.ts:1 [home-when-another]",
        "install/install.ts:2 [symlink-word]",
        "install/closing-claims.test.ts:1 [home-not-default-so]",
        "install/closing-claims.test.ts:3 [src-only-other]",
      ].sort(),
    );
  });

  it("D-42 (plan 34.1-56): a planted CHANGELOG with the no-second-kit sentence restored, wrapped across a line, is a hit naming the file and line; the sentences that replaced it are not", () => {
    // The CHANGELOG sentence plan 34.1-56 replaced, wrapped as it was. The words come from the claim table, so no
    // source line here holds the claim.
    const w = claimWords("no-second-kit");
    const changelog =
      "# Changelog\n\n- `install.js --check` takes the kit home from the marker, so following a `--check` remedy\n" +
      `  ${w.slice(0, 2).join(" ")}\n  ${w.slice(2).join(" ")} and leaves the install where it was (a review id).\n` +
      "- When the kit home was moved by hand and `--check` is given the new one, it fails naming both kit homes.\n" +
      "  Its remedy is to move the kit home back and run the check again, which writes no kit.\n";
    const controlTs = "// The moved-kit FAIL's remedy writes no kit; the install commands copy a kit to the recorded kit home.\nexport const d = 1;\n";
    const root = plantedRepo("doc1-d42", { "CHANGELOG.md": changelog, "install/clean.ts": controlTs });
    const scan = retiredClaimScan(root);
    expect(scan.scanned.sort()).toEqual(["CHANGELOG.md", "install/clean.ts"]);
    expect(scan.hits).toEqual(["CHANGELOG.md:4 [no-second-kit]"]);
  });
});

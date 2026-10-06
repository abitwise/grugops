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
// hyphen form `<n>-tool` is a hit in both arms. The rule runs over a joined BLOCK of text rather
// than one line, so a phrase that wraps across a line break is still found: a markdown block is a
// blank-line-delimited paragraph; a TypeScript block is a run of comment lines (broken at an empty
// comment line) or a run of code lines joined by a trailing `+` (a wrapped string literal).
//
// RULE B, THE SHORT HOST LIST. Each markdown paragraph (a table is one paragraph), each TypeScript
// block and each TypeScript line is checked for the registry short names it names (case-sensitive,
// word-bounded). Naming every `sequential`-dispatch host except exactly one is a hit, and the
// finding names the host that was left out. A line hit inside a block that already reports the same
// missing host is folded into the block's finding.
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
  return new RegExp(`\\b${NUMBER}[ -]+${QUALIFIERS}(?:${nouns})\\b|\\b${NUMBER}-tool\\b`, "gi");
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

/** The one sequential host a text leaves out when it names all the others, else null. */
function omittedHost(text: string): string | null {
  const named = SHORT_NAME_RES.filter((s) => s.re.test(text)).map((s) => s.name);
  if (named.length !== SEQUENTIAL.length - 1) return null;
  return SEQUENTIAL.find((s) => !named.includes(s)) ?? null;
}

function scanFile(file: string, arm: Arm, body: string): Finding[] {
  const lines = body.split(/\r?\n/);
  const blocks = arm === "md" ? markdownBlocks(lines) : typescriptBlocks(lines);
  const out: Finding[] = [];
  const re = ruleARe(arm);
  const blockMisses: { lines: number[]; host: string }[] = [];
  for (const b of blocks) {
    const { text, lineAt } = joinBlock(b);
    for (const m of text.matchAll(re)) {
      out.push({ file, line: lineAt(m.index ?? 0), rule: "A", text: m[0], context: text });
    }
    const host = omittedHost(text);
    if (host !== null) {
      out.push({ file, line: b.lines[0] + 1, rule: "B", text: `omits ${host}`, context: text });
      blockMisses.push({ lines: b.lines, host });
    }
  }
  if (arm === "ts") {
    lines.forEach((l, i) => {
      const host = omittedHost(l);
      if (host === null) return;
      if (blockMisses.some((bm) => bm.host === host && bm.lines.includes(i))) return;
      out.push({ file, line: i + 1, rule: "B", text: `omits ${host}`, context: l.trim() });
    });
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

const EXEMPTIONS: readonly Exemption[] = [
  {
    file: "agent-factory/packaging/subagent.frontmatter.md",
    rule: "B",
    needle: "R2, Copilot CLI's `model` property at run time",
    reason:
      "The list names the hosts whose own agent-definition formats accept a per-agent `model` field. " +
      "The registry host it leaves out ships no sub-agents and so has no such field; the scope " +
      "sentence states that in its own clause (plan 34-07, D-12).",
  },
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
const EXEMPTION_COUNT = 2;
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

  it("(7) the `<n>-tool` hyphen form is a Rule A hit, and bare `tools` is a host noun only in markdown", () => {
    const root = plantedRepo("m7", {
      "h.md": `The ${PLANT_DIGIT}-tool table.\n`,
      "h.ts": `// The ${PLANT_DIGIT}-tool table; the ${PLANT_FIVE} ${PLANT_TOOLS} of the build.\nexport const h = 1;\n`,
    });
    const hits = scanTree(root).findings;
    expect(hits.map(show)).toEqual([`h.md:1 [Rule A] ${PLANT_DIGIT}-tool`, `h.ts:1 [Rule A] ${PLANT_DIGIT}-tool`]);
  });

  it("(8) an exemption whose needle matches no finding is reported as stale", () => {
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
});

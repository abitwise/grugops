// host-entry-docs.test.ts — what shipped documents tell a user to type on each agent (phase 34.1, D-21).
//
// WHAT THIS HOLDS. Codex CLI does not turn a skill into a slash command: a user mentions the skill as `$grugops`, or
// picks it from the `/skills` list (learn.chatgpt.com/docs/build-skills, retrieved 2026-10-11). So no shipped
// sentence may tell a Codex reader to type `/grugops`. The rule is the Codex row's `invoke` in install/host-tools.ts,
// and this scan holds every tracked markdown file to it.
//
// THE SCAN SET IS DERIVED, NEVER LISTED. It is `git ls-files -z` in the scanned root, split on NUL, keeping `*.md`,
// minus the declared exclusions below, which are the host-prose scan's exclusions (install/host-tools-prose.test.ts)
// with the same reasons. A tracked markdown file joins the scan by existing.
//
// THE VOCABULARY IS DERIVED, NEVER LISTED. The names that mean Codex are the `name` and `shortName` of the registry
// row whose id is `codex`; no other host name is spelled in this file.
//
// THE RULE. A file is split into units: a heading line, a table cell, a list item, a fenced code line, and otherwise
// a blank-line-delimited paragraph, each of which is then split into sentences. A sentence that names Codex
// (word-bounded) and holds the slash spelling `/grugops` but not the dollar spelling `$grugops` is a finding, reported
// as file:line. A sentence that gives both (for example "Codex users type `$grugops`; another agent offers
// `/grugops`") states the difference and is not a finding.
//
// PROOF BY MUTATION. A scratch copy of install/README.md with one planted Codex `/grugops` sentence is run through
// the same scanner function, and the finding names the planted line; controls show a correct sentence and a sentence
// about another agent are not findings.
//
// THE PER-AGENT USAGE SECTIONS (plan 34.1-13, task 2). install/README.md has exactly one "Using grugops on <name>"
// heading per sequential registry row (derived, count asserted), and each section names that agent's entries (hostPointers:
// the kind's entry and the row's launch agent, quick task 261018-hs8) and every backticked token of its `invoke`.
//
// Windows-safe: files are listed with `git ls-files -z` through spawnSync and split on NUL, paths are joined per
// segment, and lines are split on `\r?\n`.
//
// Vitest `globals: false` (the repo default) → the test functions are imported explicitly.

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { HOST_TOOLS, ROUTE_POINTERS, agentFlag, hostPointers, launchLiveNote } from "./host-tools.js";

const REPO = join(import.meta.dirname, "..");
const GUIDE_REL = "install/README.md";

// ── Declared exclusions (the host-prose scan's, with its reasons) ───────────────────────────────────────────────────
const EXCLUDED_PREFIXES: readonly { prefix: string; reason: string }[] = [
  { prefix: ".planning/", reason: "planning history: past plans and summaries record what was true then" },
  { prefix: "docs/audit/", reason: "audit records: dated entries quote text as it read when audited" },
  { prefix: "docs/initial/", reason: "the frozen product spec and brand inputs, kept as received" },
];
const EXCLUDED_FILES: readonly { file: string; reason: string }[] = [
  { file: "CHANGELOG.md", reason: "release history: each entry records what a past release shipped" },
];

// ── The registry vocabulary ─────────────────────────────────────────────────────────────────────────────────────────
const CODEX = HOST_TOOLS.find((t) => t.id === "codex");
const CODEX_NAMES = CODEX === undefined ? [] : [...new Set([CODEX.name, CODEX.shortName])];
const escapeRe = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const CODEX_RES = CODEX_NAMES.map((n) => new RegExp(`(?<![\\w])${escapeRe(n)}(?![\\w])`));

/** The slash spelling: `/grugops` not preceded by a path or word character and not followed by one (so not `.claude/skills/grugops/`). */
const SLASH_RE = /(?<![\w.\/~$-])\/grugops(?![\w\/])/;
/** The dollar spelling Codex uses. */
const DOLLAR_RE = /\$grugops(?![\w])/;

// ── Units and sentences ─────────────────────────────────────────────────────────────────────────────────────────────
interface Unit {
  /** Each part's text and its 1-based source line. */
  readonly parts: readonly { readonly text: string; readonly line: number }[];
}

const HEADING = /^\s*#{1,6}\s/;
const TABLE_ROW = /^\s*\|/;
const LIST_ITEM = /^\s*(?:[-*+]|\d+[.)])\s+/;
const FENCE = /^\s*(?:```|~~~)/;

/** Split a markdown body into units: headings, table cells, list items, fenced lines and paragraphs. */
function markdownUnits(body: string): Unit[] {
  const lines = body.split(/\r?\n/);
  const out: Unit[] = [];
  let cur: { text: string; line: number }[] | null = null;
  let fenced = false;
  const close = (): void => {
    if (cur !== null && cur.length > 0) out.push({ parts: cur });
    cur = null;
  };
  lines.forEach((raw, i) => {
    const line = i + 1;
    const t = raw.replace(/^\s*(?:>\s*)*/, "").trim();
    if (FENCE.test(t)) {
      close();
      fenced = !fenced;
      return;
    }
    if (fenced) {
      if (t !== "") out.push({ parts: [{ text: t, line }] });
      return;
    }
    if (t === "") {
      close();
      return;
    }
    if (HEADING.test(t)) {
      close();
      out.push({ parts: [{ text: t, line }] });
      return;
    }
    if (TABLE_ROW.test(t)) {
      close();
      // Each cell of a row is its own unit; `\|` inside a cell is an escaped bar, not a separator.
      for (const cell of t.split(/(?<!\\)\|/)) {
        const c = cell.trim();
        if (c !== "") out.push({ parts: [{ text: c, line }] });
      }
      return;
    }
    if (LIST_ITEM.test(t)) close();
    if (cur === null) cur = [];
    cur.push({ text: t, line });
  });
  close();
  return out;
}

/** Abbreviations after which a period does not end a sentence. */
const ABBREVIATIONS = ["e.g", "i.e", "etc", "vs", "cf"];

interface Sentence {
  readonly text: string;
  /** The 1-based line the sentence starts on. */
  readonly line: number;
}

/** Split one unit into sentences: a `.`, `!` or `?` followed by whitespace ends one, unless an abbreviation precedes it. */
function sentences(unit: Unit): Sentence[] {
  const starts: number[] = [];
  let text = "";
  unit.parts.forEach((p, k) => {
    if (k > 0) text += " ";
    starts.push(text.length);
    text += p.text;
  });
  const lineAt = (offset: number): number => {
    let k = 0;
    for (let j = 0; j < starts.length; j++) if (starts[j] <= offset) k = j;
    return unit.parts[k].line;
  };
  const out: Sentence[] = [];
  let from = 0;
  for (const m of text.matchAll(/[.!?]\s+/g)) {
    const end = (m.index ?? 0) + 1;
    const before = text.slice(from, end - 1);
    if (ABBREVIATIONS.some((a) => new RegExp(`(?:^|\\W)${escapeRe(a)}$`, "i").test(before))) continue;
    out.push({ text: text.slice(from, end), line: lineAt(from) });
    from = (m.index ?? 0) + m[0].length;
  }
  if (from < text.length) out.push({ text: text.slice(from), line: lineAt(from) });
  return out;
}

interface Finding {
  readonly file: string;
  readonly line: number;
  readonly sentence: string;
}

/** THE SCANNER: every sentence of `body` that names Codex and gives `/grugops` without `$grugops`. */
function scanMarkdown(file: string, body: string): Finding[] {
  const out: Finding[] = [];
  for (const unit of markdownUnits(body)) {
    for (const s of sentences(unit)) {
      if (!CODEX_RES.some((re) => re.test(s.text))) continue;
      if (SLASH_RE.test(s.text) && !DOLLAR_RE.test(s.text)) out.push({ file, line: s.line, sentence: s.text });
    }
  }
  return out;
}

function trackedMarkdown(root: string): string[] {
  const r = spawnSync("git", ["ls-files", "-z"], { cwd: root, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  expect(r.error, `git ls-files could not run: ${String(r.error)}`).toBeUndefined();
  expect(r.status, `git ls-files failed: ${r.stderr}`).toBe(0);
  return r.stdout
    .split("\0")
    .filter((p) => p.endsWith(".md"))
    .filter((p) => !EXCLUDED_PREFIXES.some((x) => p.startsWith(x.prefix)) && !EXCLUDED_FILES.some((x) => x.file === p));
}

const readRel = (rel: string): string => readFileSync(join(REPO, ...rel.split("/")), "utf8");
const show = (f: Finding): string => `${f.file}:${f.line}: ${f.sentence}`;

describe("the Codex invocation rule's premises (phase 34.1, D-21)", () => {
  it("the registry has a Codex row whose invoke gives `$grugops` and `/skills`, and never `/grugops`", () => {
    expect(CODEX, "HOST_TOOLS has no row with id `codex`").toBeDefined();
    expect(CODEX_NAMES.length).toBeGreaterThanOrEqual(1);
    expect(CODEX!.invoke).toMatch(DOLLAR_RE);
    expect(CODEX!.invoke).toContain("`/skills`");
    expect(CODEX!.invoke).not.toMatch(SLASH_RE);
  });

  it("the exclusions are the host-prose scan's (each reasoned), and the scan set holds the install guide and the top-level README", () => {
    for (const x of [...EXCLUDED_PREFIXES.map((p) => p.reason), ...EXCLUDED_FILES.map((f) => f.reason)]) {
      expect(x.length).toBeGreaterThan(30);
    }
    const files = trackedMarkdown(REPO);
    expect(files).toContain(GUIDE_REL);
    expect(files).toContain("README.md");
    expect(files).toContain("AGENTS.md");
    expect(files.some((f) => f.startsWith(".planning/")), "the scan set holds a .planning/ file").toBe(false);
    expect(files).not.toContain("CHANGELOG.md");
  });
});

describe("no shipped document tells a Codex reader to type `/grugops` (phase 34.1, D-21)", () => {
  it("the tracked markdown scan set has zero findings", () => {
    const findings = trackedMarkdown(REPO).flatMap((f) => scanMarkdown(f, readRel(f)));
    expect(findings.map(show)).toEqual([]);
  });

  it("the scan is not vacuous: the install guide has a Codex sentence that gives `$grugops`", () => {
    const guide = readRel(GUIDE_REL);
    const codexDollar = markdownUnits(guide)
      .flatMap((u) => sentences(u))
      .filter((s) => CODEX_RES.some((re) => re.test(s.text)) && DOLLAR_RE.test(s.text));
    expect(codexDollar.length, "no Codex sentence in the guide gives `$grugops`").toBeGreaterThan(0);
  });
});

describe("the Codex invocation scan catches the class, by mutation (phase 34.1, D-21)", () => {
  const PLANT = `${CODEX?.name ?? "?"} users type \`/grugops\`.`;

  it("a planted Codex `/grugops` sentence in a scratch copy of the install guide is reported at its line", () => {
    const lines = readRel(GUIDE_REL).split(/\r?\n/);
    const at = lines.findIndex((l) => l.trim() === "### Using grugops on " + CODEX!.name);
    expect(at, "the guide has no Codex usage heading to plant under").toBeGreaterThanOrEqual(0);
    const planted = [...lines.slice(0, at + 1), "", PLANT, "", ...lines.slice(at + 1)].join("\n");
    const findings = scanMarkdown(GUIDE_REL, planted);
    expect(findings.map(show)).toEqual([`${GUIDE_REL}:${at + 3}: ${PLANT}`]);
  });

  it("a planted sentence that wraps across lines inside a paragraph is reported at the line it starts on", () => {
    const body = `# T\n\nIntro sentence here. On ${CODEX!.shortName} the\ncommand is \`/grugops <request>\`.\n`;
    expect(scanMarkdown("t.md", body).map((f) => f.line)).toEqual([3]);
  });

  it("a planted table cell and a planted list item are reported", () => {
    const body = `| Agent | Type |\n|---|---|\n| ${CODEX!.name}: \`/grugops\` | x |\n\n- On ${CODEX!.shortName}, type /grugops.\n`;
    expect(scanMarkdown("t.md", body).map((f) => f.line)).toEqual([3, 5]);
  });

  it("controls: the dollar spelling, a sentence about another agent, and a skill path are not findings", () => {
    const other = HOST_TOOLS.find((t) => t.id !== CODEX!.id && !CODEX_RES.some((re) => re.test(t.name)))!;
    const body =
      `# C\n\n${CODEX!.name} users type \`$grugops <request>\`. ${other.name} users type \`/grugops <request>\`.\n\n` +
      `The skill \`.claude/skills/grugops/SKILL.md\` is not read by ${CODEX!.shortName}.\n\n` +
      `${CODEX!.shortName} takes \`$grugops\`; ${other.shortName} takes \`/grugops\`.\n`;
    expect(scanMarkdown("c.md", body).map(show)).toEqual([]);
  });

  it("an abbreviation does not end a sentence, so `e.g.` cannot hide the slash spelling from the Codex name", () => {
    const body = `# A\n\nOn ${CODEX!.shortName} type a command, e.g. \`/grugops\`.\n`;
    expect(scanMarkdown("a.md", body).map((f) => f.line)).toEqual([3]);
  });
});

// ── The per-agent usage sections and the command-line contract (plan 34.1-13, task 2; D-21, D-25) ──────────────────
//
// Sections are found by heading text and bounded at the next heading of the same or a higher level, as
// install/host-tools.test.ts bounds its sections.
const USAGE_PREFIX = "Using grugops on ";
const CONTRACT_HEADING = "Command-line contract — choosing agents";
const SEQUENTIAL_ROWS = HOST_TOOLS.filter((t) => t.dispatch === "sequential");

interface Heading {
  readonly index: number;
  readonly level: number;
  readonly text: string;
}

function guideHeadings(lines: readonly string[]): Heading[] {
  const out: Heading[] = [];
  let fenced = false;
  lines.forEach((l, index) => {
    if (FENCE.test(l)) fenced = !fenced;
    const m = fenced ? null : /^(#{1,6})\s+(.*)$/.exec(l);
    if (m !== null) out.push({ index, level: m[1].length, text: m[2].trim() });
  });
  return out;
}

function guideSection(headingText: string): string {
  const lines = readRel(GUIDE_REL).split(/\r?\n/);
  const heads = guideHeadings(lines);
  const hits = heads.filter((h) => h.text === headingText);
  expect(hits.length, `the guide must carry exactly one "${headingText}" heading`).toBe(1);
  const next = heads.find((h) => h.index > hits[0].index && h.level <= hits[0].level);
  return lines.slice(hits[0].index + 1, next === undefined ? lines.length : next.index).join("\n").replace(/\s+/g, " ");
}

describe("the install guide has one usage section per sequential agent (plan 34.1-13, D-21)", () => {
  it("premise: the registry has sequential rows, and every one has a route pointer and an invoke", () => {
    expect(SEQUENTIAL_ROWS.length).toBeGreaterThanOrEqual(2);
    for (const t of SEQUENTIAL_ROWS) {
      expect(hostPointers(t).length, `${t.id}: no route pointer`).toBeGreaterThan(0);
      expect(t.invoke.length, `${t.id}: empty invoke`).toBeGreaterThan(0);
    }
  });

  it("the guide's usage headings are exactly one per sequential registry row (count asserted)", () => {
    const heads = guideHeadings(readRel(GUIDE_REL).split(/\r?\n/)).filter((h) => h.text.startsWith(USAGE_PREFIX));
    const named = heads.map((h) => h.text.slice(USAGE_PREFIX.length));
    expect(heads.length, "usage heading count").toBe(SEQUENTIAL_ROWS.length);
    expect([...named].sort()).toEqual(SEQUENTIAL_ROWS.map((t) => t.name).sort());
  });

  for (const t of SEQUENTIAL_ROWS) {
    it(`"${USAGE_PREFIX}${t.name}" names its entry, every backticked token of its invoke and launch form, a dated source, and an \`UNKNOWN - verify\``, () => {
      const sec = guideSection(USAGE_PREFIX + t.name);
      // hostPointers (quick task 261018-hs8): the kind's entries, then the row's launch agent, so each section must name
      // its launch file too.
      for (const rel of hostPointers(t)) expect(sec, `${t.name}: entry \`${rel}\` not named`).toContain(`\`${rel}\``);
      const tokens = [...t.invoke.matchAll(/`[^`]+`/g)].map((m) => m[0]);
      expect(tokens.length, `${t.id}: invoke has no backticked token`).toBeGreaterThan(0);
      for (const tok of tokens) expect(sec, `${t.name}: invoke token ${tok} not named`).toContain(tok);
      // The launch form (quick task 261018-hs8, review WR-03 split it out of invoke): every backticked token of it.
      // Its text since quick task 261018-vfm typed the form (LaunchForm), never the object itself.
      for (const tok of [...(t.launchForm?.text ?? "").matchAll(/`[^`]+`/g)].map((m) => m[0])) {
        expect(sec, `${t.name}: launch-form token ${tok} not named`).toContain(tok);
      }
      // Two-sided (quick task 261018-vfm, the human's live-run report of 2026-10-18): a section carries its row's dated
      // note exactly when the row's launch form was verified live, and a section whose row has none says nothing was.
      const note = launchLiveNote(t);
      if (note !== null) expect(sec, `${t.name}: the verified-live note is missing`).toContain(note);
      else expect(sec, `${t.name}: a verified-live note for a form nobody ran live`).not.toContain("verified live by a human");
      expect(sec, `${t.name}: no dated source`).toMatch(/retrieved 20\d\d-\d\d-\d\d/);
      expect(sec, `${t.name}: nothing marked unknown`).toContain("`UNKNOWN - verify`");
    });
  }

  it("the sections of the agents that share the agent skill name the agents that also read `.agents/skills/`", () => {
    const shared = SEQUENTIAL_ROWS.filter((t) => t.adapter === "agent-skill");
    expect(shared.length, "premise: two rows share the agent skill").toBe(2);
    const route = guideSection("How a host finds the kit after a scripted install");
    for (const rel of ROUTE_POINTERS["agent-skill"]) expect(route).toContain(`\`${rel}\``);
    for (const t of SEQUENTIAL_ROWS.filter((r) => r.adapter !== "agent-skill")) {
      expect(route, `the kit-route section does not name ${t.name} as a reader of the shared skill`).toContain(t.name);
    }
    expect(route).toContain("`.claude/skills/grugops/`");
    expect(route).toContain("`UNKNOWN - verify`");
  });
});

describe("the install guide states the command-line contract (plan 34.1-13, D-25)", () => {
  it("the contract section names every agent flag the registry derives, no all-agents flag, the exit-2 rule and uninstall", () => {
    const sec = guideSection(CONTRACT_HEADING);
    for (const t of HOST_TOOLS) expect(sec, `the contract does not name ${agentFlag(t)}`).toContain(`\`${agentFlag(t)}\``);
    for (const token of ["no all-agents flag", "`--check`", "`--update`", "`--prune-old-kit`", "exit `2`", "exits `1`", "uninstall.js", "`.grugops/install.json`", "checkbox list"]) {
      expect(sec, `the contract does not carry ${token}`).toContain(token);
    }
  });
});

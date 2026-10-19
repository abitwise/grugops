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
// VERIFIED-LIVE CLAIMS AND LAUNCH FORMS (quick task 261019-ktd, 261018-vfm review WR-06, WR-05). Which launch forms
// a human ran live is held once, in each registry row's launchForm.verifiedLive, and every doc that repeats it is
// read against the registry, two-sided. For these rules a table-row line is one unit, whole, and every other unit is
// split into sentences. A unit's context host is the launch host whose "Using grugops on <name>" heading opens the
// section it sits in. Three rules hold the scan set:
//   LIVE-1: a unit that says "verified live" speaks of at most one launch host (the hosts it names, plus its context
//           host). With one host, that host has a live run and the unit holds its exact launchLiveNote; with none, it
//           gives no date. So no doc lists the verified host set, or its date, by hand.
//   LIVE-2: a unit that gives a backticked token of the launch form of a row nobody ran live also says
//           `UNKNOWN - verify`.
//   LIVE-3: in each per-host table that names a launch form (derived, count asserted), a host's row holds its
//           launchLiveNote exactly when the registry has one, and an unverified launch row holds `UNKNOWN - verify`.
//           agent-factory/README.md also carries one bold row per host, but its rows name no launch form or launch
//           file, so it is not a per-host launch table. CLAUDE.md's per-tool table names each host's launch file
//           since quick task 261019-mq1 (261018-hs8 review IN-09), so it is one.
// Each rule has a mutation proof built from registry values, run through the same scanner function.
//
// PATH LISTS, START FORMS AND THE LAUNCH CAUTION (quick task 261019-mq1, 261018-hs8 review WR-04, WR-02). Four more
// rules bind hand-typed doc text to the registry, each with a mutation proof through the same scanner function:
//   ROUTE-DOC-1: install/README.md's one list item that opens with "**The files each host reads here.**" names, in its
//                first sentence, exactly the backticked paths of routeCarriers over HOST_TOOLS (two-sided, count
//                asserted).
//   ROUTE-DOC-2: its one list item that opens with "**The launch files.**" names, in its first sentence, exactly the
//                paths of launchCarriers over HOST_TOOLS (two-sided, count asserted).
//   START-1:     README.md's "Start a session" table: a launch row holds every backticked token of its launch form, no
//                row holds another row's launch file, a row with no launch file (other than Claude Code's kit) names
//                no launch agent, a `panel` row names no flag of a `command` form, and a sequential row holds each
//                backticked token of its invoke that starts with `/` or `$`.
//   CAUTION-1:   over the scan set, a unit (a table row whole, or a paragraph, list item, heading or fenced line,
//                with its whitespace collapsed; never split into sentences) that gives a launch token of a form with
//                a caution (LaunchForm.caution) holds that caution; only its first letter is compared without case.
//                It is one-sided: a unit that gives the caution with no command is not asked about.
// Residuals: Claude Code's row is held only by LIVE-3, and the repository-root condition in free prose has no
// mechanical check.
//
// Windows-safe: files are listed with `git ls-files -z` through spawnSync and split on NUL, paths are joined per
// segment, and lines are split on `\r?\n`.
//
// Vitest `globals: false` (the repo default) → the test functions are imported explicitly.

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { HOST_TOOLS, LAUNCH_AGENT_NAME, ROUTE_POINTERS, agentFlag, hostPointers, launchCarriers, launchLiveNote, routeCarriers, type LaunchHost } from "./host-tools.js";

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
  /** True for a whole table-row line (markdownUnits with wholeRows; quick task 261019-ktd). */
  readonly row?: boolean;
}

const HEADING = /^\s*#{1,6}\s/;
const TABLE_ROW = /^\s*\|/;
const LIST_ITEM = /^\s*(?:[-*+]|\d+[.)])\s+/;
const FENCE = /^\s*(?:```|~~~)/;

/**
 * Split a markdown body into units: headings, table cells, list items, fenced lines and paragraphs. With wholeRows
 * (the verified-live rules, quick task 261019-ktd), a table row is one unit, whole, instead of one unit per cell.
 */
function markdownUnits(body: string, wholeRows = false): Unit[] {
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
      if (wholeRows) {
        out.push({ parts: [{ text: t, line }], row: true });
        return;
      }
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

// ── VERIFIED-LIVE CLAIMS AND LAUNCH FORMS (quick task 261019-ktd, 261018-vfm review WR-06, WR-05) ───────────────────
//
// The rules LIVE-1..3 of the header. Every expectation is derived from HOST_TOOLS and launchLiveNote; no host name,
// note or launch command is spelled here.
const LAUNCH_HOSTS: readonly LaunchHost[] = HOST_TOOLS.filter((t): t is LaunchHost => t.launchAgent !== null);
const LAUNCH_HOST_RES = LAUNCH_HOSTS.map((host) => ({
  host,
  res: [...new Set([host.name, host.shortName])].map((n) => new RegExp(`(?<![\\w])${escapeRe(n)}(?![\\w])`)),
}));
const VERIFIED_LIVE_RE = /verified live/i;
const DATE_RE = /\b20\d\d-\d\d-\d\d\b/;
const UNKNOWN_MARK = "UNKNOWN - verify";

/** The backticked tokens of a launch form's text that name LAUNCH_AGENT_NAME or the row's launch path. */
function launchTokens(h: LaunchHost): string[] {
  return [...h.launchForm.text.matchAll(/`[^`]+`/g)].map((m) => m[0]).filter((tok) => tok.includes(LAUNCH_AGENT_NAME) || tok.includes(h.launchAgent));
}

interface LiveUnit {
  readonly text: string;
  readonly line: number;
  /** The launch host whose "Using grugops on <name>" section holds the unit, or null. */
  readonly context: LaunchHost | null;
}

interface LiveFinding extends Finding {
  readonly why: string;
}
const showLive = (f: LiveFinding): string => `${f.file}:${f.line}: ${f.why}`;

/** The context host of each 0-based line: the launch host whose usage section the line sits in, or null. */
function contextHosts(lines: readonly string[]): (LaunchHost | null)[] {
  const heads = guideHeadings(lines);
  const out: (LaunchHost | null)[] = [];
  let cur: { level: number; host: LaunchHost | null } | null = null;
  let k = 0;
  for (let i = 0; i < lines.length; i++) {
    while (k < heads.length && heads[k].index === i) {
      const head = heads[k];
      if (cur !== null && head.level <= cur.level) cur = null;
      const host = LAUNCH_HOSTS.find((t) => head.text === USAGE_PREFIX + t.name);
      if (host !== undefined) cur = { level: head.level, host };
      k++;
    }
    out.push(cur === null ? null : cur.host);
  }
  return out;
}

/** The units of the verified-live rules: each table-row line whole, every other unit split into sentences. */
function liveUnits(body: string): LiveUnit[] {
  const ctx = contextHosts(body.split(/\r?\n/));
  return markdownUnits(body, true)
    .flatMap((u) => (u.row === true ? [{ text: u.parts[0].text, line: u.parts[0].line }] : sentences(u)))
    .map((s) => ({ text: s.text, line: s.line, context: ctx[s.line - 1] ?? null }));
}

/** LIVE-1: a "verified live" unit speaks of at most one launch host and holds its exact note, or names none and gives no date. */
function scanLiveClaims(file: string, body: string): { findings: LiveFinding[]; examined: number } {
  const findings: LiveFinding[] = [];
  let examined = 0;
  for (const u of liveUnits(body)) {
    if (!VERIFIED_LIVE_RE.test(u.text)) continue;
    examined++;
    const hosts = new Set(LAUNCH_HOST_RES.filter((x) => x.res.some((re) => re.test(u.text))).map((x) => x.host));
    if (u.context !== null) hosts.add(u.context);
    const named = [...hosts];
    const at = { file, line: u.line, sentence: u.text };
    if (named.length > 1) {
      findings.push({ ...at, why: `a "verified live" unit speaks of more than one host (${named.map((t) => t.name).join(", ")})` });
    } else if (named.length === 1) {
      const note = launchLiveNote(named[0]);
      if (note === null) findings.push({ ...at, why: `"verified live" for ${named[0].name}, whose launch form nobody ran live` });
      else if (!u.text.includes(note)) findings.push({ ...at, why: `"verified live" for ${named[0].name} without its note "${note}"` });
    } else if (DATE_RE.test(u.text)) {
      findings.push({ ...at, why: `a dated "verified live" unit that names no host` });
    }
  }
  return { findings, examined };
}

/** LIVE-2: a unit that gives a token of an unverified launch form also says `UNKNOWN - verify`. */
function scanUnverifiedForms(file: string, body: string): { findings: LiveFinding[]; examined: number } {
  const findings: LiveFinding[] = [];
  let examined = 0;
  const unverified = LAUNCH_HOSTS.filter((h) => h.launchForm.verifiedLive === null);
  for (const u of liveUnits(body)) {
    for (const h of unverified) {
      for (const tok of launchTokens(h)) {
        if (!u.text.includes(tok)) continue;
        examined++;
        if (!u.text.includes(UNKNOWN_MARK)) {
          findings.push({ file, line: u.line, sentence: u.text, why: `${h.name}'s launch form ${tok}, which nobody ran live, without ${UNKNOWN_MARK}` });
        }
      }
    }
  }
  return { findings, examined };
}

/** The lines of a per-host table row for `name`: `| **<name>** |` at the start of a line. */
function hostRowLines(body: string, name: string): { line: number; text: string }[] {
  const re = new RegExp(`^\\|\\s*\\*\\*${escapeRe(name)}\\*\\*\\s*\\|`);
  return body
    .split(/\r?\n/)
    .map((text, i) => ({ line: i + 1, text }))
    .filter((l) => re.test(l.text));
}

/** Whether `body` is a per-host launch table: one row per registry host, and some launch host's row names its launch form or file. */
function isLaunchTable(body: string): boolean {
  if (!HOST_TOOLS.every((h) => hostRowLines(body, h.name).length === 1)) return false;
  return LAUNCH_HOSTS.some((h) => {
    const row = hostRowLines(body, h.name)[0].text;
    return row.includes(h.launchAgent) || launchTokens(h).some((tok) => row.includes(tok));
  });
}

/** LIVE-3: each host's row holds its note exactly when it has one, and an unverified launch row says `UNKNOWN - verify`. */
function scanHostTable(file: string, body: string): { findings: LiveFinding[]; examined: number } {
  const findings: LiveFinding[] = [];
  let examined = 0;
  for (const h of HOST_TOOLS) {
    const rows = hostRowLines(body, h.name);
    if (rows.length !== 1) {
      findings.push({ file, line: rows[0]?.line ?? 0, sentence: "", why: `${h.name} has ${rows.length} rows, not one` });
      continue;
    }
    examined++;
    const { line, text } = rows[0];
    const note = launchLiveNote(h);
    if (note !== null && !text.includes(note)) findings.push({ file, line, sentence: text, why: `${h.name}'s row lacks its note "${note}"` });
    if (note === null && VERIFIED_LIVE_RE.test(text)) findings.push({ file, line, sentence: text, why: `${h.name}'s row says "verified live", and nobody ran its launch form live` });
    if (h.launchForm !== null && h.launchForm.verifiedLive === null && !text.includes("`" + UNKNOWN_MARK + "`")) {
      findings.push({ file, line, sentence: text, why: `${h.name}'s row gives a launch form nobody ran live without \`${UNKNOWN_MARK}\`` });
    }
  }
  return { findings, examined };
}

describe("verified-live claims and launch forms are bound to the registry (quick task 261019-ktd, review WR-06, WR-05)", () => {
  const VERIFIED = LAUNCH_HOSTS.filter((h) => h.launchForm.verifiedLive !== null);
  const UNVERIFIED = LAUNCH_HOSTS.filter((h) => h.launchForm.verifiedLive === null);

  it("premises: the launch hosts are derived, some were run live and some were not, and each has a launch token", () => {
    expect(LAUNCH_HOSTS.length, "premise: the registry has launch hosts").toBeGreaterThan(0);
    expect(VERIFIED.length, "premise: at least two launch forms were run live (the LIVE-1 mutation that pairs them needs it)").toBeGreaterThanOrEqual(2);
    expect(UNVERIFIED.length, "premise: a launch form nobody ran live").toBeGreaterThanOrEqual(1);
    for (const h of LAUNCH_HOSTS) expect(launchTokens(h).length, `${h.id}: no launch token`).toBeGreaterThan(0);
  });

  it("LIVE-1: the tracked markdown scan set has zero findings, and the scan examined some unit", () => {
    let examined = 0;
    const findings = trackedMarkdown(REPO).flatMap((f) => {
      const r = scanLiveClaims(f, readRel(f));
      examined += r.examined;
      return r.findings;
    });
    expect(findings.map(showLive)).toEqual([]);
    expect(examined, "LIVE-1 examined no unit").toBeGreaterThanOrEqual(1);
  });

  it("LIVE-2: the tracked markdown scan set has zero findings, and the scan examined some unit", () => {
    let examined = 0;
    const findings = trackedMarkdown(REPO).flatMap((f) => {
      const r = scanUnverifiedForms(f, readRel(f));
      examined += r.examined;
      return r.findings;
    });
    expect(findings.map(showLive)).toEqual([]);
    expect(examined, "LIVE-2 examined no unit").toBeGreaterThanOrEqual(1);
  });

  it("LIVE-3: the per-host launch tables are derived (CLAUDE.md, README.md and adapters.md, count 3), and each has zero findings", () => {
    const tables = trackedMarkdown(REPO).filter((f) => isLaunchTable(readRel(f)));
    // Measured 2026-10-19: agent-factory/README.md carries one bold row per host, and none of its launch hosts' rows
    // names a launch form or file.
    // Re-pinned 2026-10-19 by quick task 261019-mq1 (261018-hs8 review IN-09): CLAUDE.md's per-tool table now names
    // each host's launch file, so it is a per-host launch table and its rows are held to the registry.
    expect([...tables].sort(), "the per-host launch tables").toEqual(["CLAUDE.md", "README.md", "agent-factory/packaging/adapters.md"]);
    expect(tables.length).toBe(3);
    let examined = 0;
    const findings = tables.flatMap((f) => {
      const r = scanHostTable(f, readRel(f));
      examined += r.examined;
      return r.findings;
    });
    expect(findings.map(showLive)).toEqual([]);
    expect(examined, "LIVE-3 examined no row").toBeGreaterThanOrEqual(1);
  });

  it("LIVE-1 by mutation: two verified hosts in one unit, an unverified host, and a dated unit with no host are findings; an undated one is not", () => {
    const [a, b] = VERIFIED;
    const u = UNVERIFIED[0];
    const date = a.launchForm.verifiedLive!.date;
    const two = `# T\n\n${a.name} and ${b.name} were verified live by a human on ${date}.\n`;
    expect(scanLiveClaims("t.md", two).findings.map((f) => f.line)).toEqual([3]);
    expect(scanLiveClaims("t.md", two).findings[0].why).toContain("more than one host");
    const unv = `# T\n\n${u.name}'s launch form was verified live.\n`;
    expect(scanLiveClaims("t.md", unv).findings.map(showLive)).toEqual([`t.md:3: "verified live" for ${u.name}, whose launch form nobody ran live`]);
    const dated = `# T\n\nEvery launch form here was verified live by a human on ${date}.\n`;
    expect(scanLiveClaims("t.md", dated).findings.map(showLive)).toEqual([`t.md:3: a dated "verified live" unit that names no host`]);
    const undated = `# T\n\nA launch form marked verified live was run by a human on the live host.\n`;
    const r = scanLiveClaims("t.md", undated);
    expect(r.findings).toEqual([]);
    expect(r.examined).toBe(1);
  });

  it("LIVE-1 by mutation, inside a usage section: the exact note is not a finding; the old dated-only note is, and the section ends at the next heading", () => {
    const h = VERIFIED[0];
    const note = launchLiveNote(h)!;
    const date = h.launchForm.verifiedLive!.date;
    const head = `### ${USAGE_PREFIX}${h.name}\n\n`;
    const exact = `# G\n\n${head}Picking it was ${note}.\n`;
    const r = scanLiveClaims("g.md", exact);
    expect(r.findings).toEqual([]);
    expect(r.examined).toBe(1);
    const old = `# G\n\n${head}Picking it was verified live by a human on ${date}.\n`;
    expect(scanLiveClaims("g.md", old).findings.map(showLive)).toEqual([`g.md:5: "verified live" for ${h.name} without its note "${note}"`]);
    const after = `# G\n\n${head}Picking it was ${note}.\n\n### Next\n\nIt was verified live by a human on ${date}.\n`;
    expect(scanLiveClaims("g.md", after).findings.map(showLive)).toEqual([`g.md:9: a dated "verified live" unit that names no host`]);
  });

  it("LIVE-2 by mutation: an unverified launch token without `UNKNOWN - verify` is a finding; with it, or a verified host's token, it is not", () => {
    const u = UNVERIFIED[0];
    const tok = launchTokens(u)[0];
    expect(scanUnverifiedForms("t.md", `# T\n\nStart it with ${tok}.\n`).findings.map((f) => f.line)).toEqual([3]);
    const marked = scanUnverifiedForms("t.md", `# T\n\nStart it with ${tok} (\`${UNKNOWN_MARK}\`).\n`);
    expect(marked.findings).toEqual([]);
    expect(marked.examined).toBe(1);
    const vtok = launchTokens(VERIFIED[0]).find((t) => !launchTokens(u).some((x) => x.includes(t) || t.includes(x)));
    expect(vtok, "premise: a verified host's launch token that is not the unverified one").toBeDefined();
    expect(scanUnverifiedForms("t.md", `# T\n\nStart it with ${vtok}.\n`).findings).toEqual([]);
  });

  it("LIVE-3 by mutation: a scratch README copy with a note removed, \"verified live\" planted, or `UNKNOWN - verify` removed gives a finding naming the file and the host", () => {
    const body = readRel("README.md");
    expect(scanHostTable("README.md", body).findings, "premise: the real README has no LIVE-3 finding").toEqual([]);
    const v = VERIFIED[0];
    const u = UNVERIFIED[0];
    const mutate = (h: LaunchHost, edit: (row: string) => string): { text: string; line: number } => {
      const row = hostRowLines(body, h.name)[0];
      const edited = edit(row.text);
      expect(edited, `premise: the mutation changed ${h.name}'s row`).not.toBe(row.text);
      const lines = body.split(/\r?\n/);
      lines[row.line - 1] = edited;
      return { text: lines.join("\n"), line: row.line };
    };
    const cases: { host: LaunchHost; edit: (row: string) => string }[] = [
      { host: v, edit: (row) => row.split(launchLiveNote(v)!).join("") },
      { host: u, edit: (row) => row.replace(/\|\s*$/, " verified live |") },
      { host: u, edit: (row) => row.split("`" + UNKNOWN_MARK + "`").join("") },
    ];
    for (const c of cases) {
      const m = mutate(c.host, c.edit);
      const got = scanHostTable("README.md", m.text).findings;
      expect(got.map((f) => f.line), showLive(got[0] ?? { file: "", line: 0, sentence: "", why: "no finding" })).toEqual([m.line]);
      expect(got[0].file).toBe("README.md");
      expect(got[0].why).toContain(c.host.name);
    }
  });
});

// ── PATH LISTS, START FORMS AND THE LAUNCH CAUTION (quick task 261019-mq1, 261018-hs8 review WR-04, WR-02) ──────────
//
// The rules ROUTE-DOC-1, ROUTE-DOC-2, START-1 and CAUTION-1 of the header. Every expectation is derived from
// HOST_TOOLS, routeCarriers, launchCarriers, launchTokens and LaunchForm.caution; no host name, path or command is
// spelled in the rules.
const backticked = (text: string): string[] => [...text.matchAll(/`([^`]+)`/g)].map((m) => m[1]);
const ROUTE_LIST_OPENER = "**The files each host reads here.**";
const LAUNCH_LIST_OPENER = "**The launch files.**";
// Measured 2026-10-19 (quick task 261019-mq1): 6 distinct route carriers and 4 launch files over HOST_TOOLS; the
// launch count is host-tools.test.ts LAUNCH_AGENT_COUNT.
const ROUTE_CARRIER_COUNT = 6;
const LAUNCH_FILE_COUNT = 4;
const ROUTE_SET = [...new Set(HOST_TOOLS.flatMap((h) => [...routeCarriers(h)]))];
const LAUNCH_SET = [...new Set(HOST_TOOLS.flatMap((h) => [...launchCarriers(h)]))];

/** ROUTE-DOC-1/2: the one list item opening with `opener` names, in its first sentence, exactly the paths in `expected`. */
function scanPathList(file: string, body: string, opener: string, expected: readonly string[]): { findings: LiveFinding[]; examined: number } {
  const items = markdownUnits(body).filter((u) => LIST_ITEM.test(u.parts[0].text) && u.parts[0].text.replace(LIST_ITEM, "").startsWith(opener));
  if (items.length !== 1) return { findings: [{ file, line: items[0]?.parts[0].line ?? 0, sentence: "", why: `${items.length} list items open with ${opener}, not one` }], examined: 0 };
  const first = sentences(items[0])[0];
  const named = new Set(backticked(first.text));
  const findings: LiveFinding[] = [];
  for (const p of expected) if (!named.has(p)) findings.push({ file, line: first.line, sentence: first.text, why: `${opener} does not name ${p} (missing)` });
  for (const p of named) if (!expected.includes(p)) findings.push({ file, line: first.line, sentence: first.text, why: `${opener} names ${p}, which the registry set does not hold (extra)` });
  return { findings, examined: 1 };
}

/**
 * A command token of an invoke: a backticked token that starts with `/` or `$` (a slash command or Codex's `$` mention).
 * A pattern, not `.startsWith("/")`: this asks for a command sigil, never whether a path is absolute (the WIN-1
 * path-spelling census, install/path-spelling-census.test.ts, rule t4, reads a leading-`/` test as an absoluteness rule).
 */
const COMMAND_SIGIL = /^[/$]/;
/** The flag words of the `command` launch forms: whitespace-separated words starting with `--` inside a backticked token. */
const COMMAND_FLAGS = [...new Set(LAUNCH_HOSTS.filter((h) => h.launchForm.kind === "command").flatMap((h) => backticked(h.launchForm.text).flatMap((t) => t.split(/\s+/).filter((w) => w.startsWith("--")))))];

/** START-1: README.md's start-a-session rows against the registry rows. */
function scanStartTable(file: string, body: string): { findings: LiveFinding[]; examined: number } {
  const findings: LiveFinding[] = [];
  let examined = 0;
  for (const h of HOST_TOOLS) {
    const rows = hostRowLines(body, h.name);
    if (rows.length !== 1) {
      findings.push({ file, line: rows[0]?.line ?? 0, sentence: "", why: `${h.name} has ${rows.length} rows, not one` });
      continue;
    }
    examined++;
    const { line, text } = rows[0];
    const at = { file, line, sentence: text };
    if (h.launchForm !== null) {
      for (const tok of backticked(h.launchForm.text)) if (!text.includes("`" + tok + "`")) findings.push({ ...at, why: `${h.name}'s row does not give \`${tok}\` of its launch form` });
    }
    for (const o of HOST_TOOLS) {
      if (o !== h && o.launchAgent !== null && text.includes(o.launchAgent)) findings.push({ ...at, why: `${h.name}'s row names ${o.name}'s launch file ${o.launchAgent}` });
    }
    if (h.launchAgent === null && h.adapter !== "claude-kit" && text.includes(LAUNCH_AGENT_NAME)) findings.push({ ...at, why: `${h.name}'s row names ${LAUNCH_AGENT_NAME}, and ${h.name} has no launch file` });
    if (h.launchForm !== null && h.launchForm.kind === "panel") {
      for (const flag of COMMAND_FLAGS) {
        if (new RegExp(`(?<![\\w-])${escapeRe(flag)}(?![\\w-])`).test(text)) findings.push({ ...at, why: `${h.name}'s row, a panel pick, names the command-line flag ${flag}` });
      }
    }
    if (h.dispatch === "sequential") {
      for (const tok of backticked(h.invoke).filter((t) => COMMAND_SIGIL.test(t))) {
        if (!text.includes("`" + tok + "`")) findings.push({ ...at, why: `${h.name}'s row does not give \`${tok}\` of its invoke` });
      }
    }
  }
  return { findings, examined };
}

/** CAUTION-1: a unit that gives a launch token of a form with a caution holds the caution (first letter in any case). */
function scanCautions(file: string, body: string): { findings: LiveFinding[]; examined: number } {
  const findings: LiveFinding[] = [];
  let examined = 0;
  const cautioned = LAUNCH_HOSTS.filter((h) => h.launchForm.caution !== null);
  for (const u of markdownUnits(body, true)) {
    const text = u.parts.map((p) => p.text).join(" ").replace(/\s+/g, " ");
    for (const h of cautioned) {
      const c = h.launchForm.caution!;
      if (!launchTokens(h).some((tok) => text.includes(tok))) continue;
      examined++;
      const variants = [c, c.charAt(0).toUpperCase() + c.slice(1), c.charAt(0).toLowerCase() + c.slice(1)];
      if (!variants.some((v) => text.includes(v))) findings.push({ file, line: u.parts[0].line, sentence: text, why: `${h.name}'s launch command without its caution "${c}"` });
    }
  }
  return { findings, examined };
}

describe("doc path lists, start forms and the launch caution are bound to the registry (quick task 261019-mq1, review WR-04, WR-02)", () => {
  it(`ROUTE-DOC-1: the "files each host reads here" item names exactly the route carriers (derived, ${ROUTE_CARRIER_COUNT})`, () => {
    expect(ROUTE_SET.length, `the route carriers over HOST_TOOLS: ${ROUTE_SET.join(", ")}`).toBe(ROUTE_CARRIER_COUNT);
    const r = scanPathList(GUIDE_REL, readRel(GUIDE_REL), ROUTE_LIST_OPENER, ROUTE_SET);
    expect(r.findings.map(showLive)).toEqual([]);
    expect(r.examined).toBe(1);
  });

  it(`ROUTE-DOC-2: the "launch files" item names exactly the launch files (derived, ${LAUNCH_FILE_COUNT})`, () => {
    expect(LAUNCH_SET.length, `the launch files over HOST_TOOLS: ${LAUNCH_SET.join(", ")}`).toBe(LAUNCH_FILE_COUNT);
    const r = scanPathList(GUIDE_REL, readRel(GUIDE_REL), LAUNCH_LIST_OPENER, LAUNCH_SET);
    expect(r.findings.map(showLive)).toEqual([]);
    expect(r.examined).toBe(1);
  });

  it("ROUTE-DOC-1/2 by mutation: a scratch guide copy with one path removed names the missing path; one with a foreign path added names the extra path", () => {
    const body = readRel(GUIDE_REL);
    const lines = body.split(/\r?\n/);
    for (const [opener, set] of [[ROUTE_LIST_OPENER, ROUTE_SET], [LAUNCH_LIST_OPENER, LAUNCH_SET]] as const) {
      expect(scanPathList(GUIDE_REL, body, opener, set).findings, `premise: the real guide's ${opener} item is clean`).toEqual([]);
      const item = markdownUnits(body).find((u) => u.parts[0].text.replace(LIST_ITEM, "").startsWith(opener))!;
      const gone = set[set.length - 1];
      const removed = [...lines];
      const k = item.parts.findIndex((p) => p.text.includes("`" + gone + "`"));
      expect(k, `premise: the item names ${gone}`).toBeGreaterThanOrEqual(0);
      removed[item.parts[k].line - 1] = removed[item.parts[k].line - 1].replace("`" + gone + "`", "a file");
      const miss = scanPathList(GUIDE_REL, removed.join("\n"), opener, set).findings;
      expect(miss.map((f) => f.why), opener).toEqual([`${opener} does not name ${gone} (missing)`]);
      const added = [...lines];
      added[item.parts[0].line - 1] = added[item.parts[0].line - 1] + " (and `foreign/planted.md`)";
      const extra = scanPathList(GUIDE_REL, added.join("\n"), opener, set).findings;
      expect(extra.map((f) => f.why), opener).toEqual([`${opener} names foreign/planted.md, which the registry set does not hold (extra)`]);
    }
  });

  it("START-1: README.md's start-a-session table has zero findings, and every registry host's row was examined", () => {
    const r = scanStartTable("README.md", readRel("README.md"));
    expect(r.findings.map(showLive)).toEqual([]);
    expect(r.examined).toBe(HOST_TOOLS.length);
    expect(COMMAND_FLAGS.length, "premise: the command forms give flags").toBeGreaterThan(0);
  });

  it("START-1 by mutation: a launch command removed, another host's launch file planted, a command flag planted into a panel row, and an invoke token removed each give a finding naming README.md and the host", () => {
    const body = readRel("README.md");
    const cmd = LAUNCH_HOSTS.find((h) => h.launchForm.kind === "command" && h.launchForm.caution !== null)!;
    const otherCmd = LAUNCH_HOSTS.find((h) => h.launchForm.kind === "command" && h !== cmd)!;
    const panel = LAUNCH_HOSTS.find((h) => h.launchForm.kind === "panel" && backticked(h.invoke).some((t) => COMMAND_SIGIL.test(t)))!;
    expect([cmd, otherCmd, panel].every((h) => h !== undefined), "premise: a cautioned command row, another command row and a panel row").toBe(true);
    const mutate = (h: LaunchHost, edit: (row: string) => string): string => {
      const row = hostRowLines(body, h.name)[0];
      const edited = edit(row.text);
      expect(edited, `premise: the mutation changed ${h.name}'s row`).not.toBe(row.text);
      const ls = body.split(/\r?\n/);
      ls[row.line - 1] = edited;
      return ls.join("\n");
    };
    const invokeTok = "`" + backticked(panel.invoke).find((t) => COMMAND_SIGIL.test(t))! + "`";
    const cases: { host: LaunchHost; edit: (row: string) => string }[] = [
      { host: cmd, edit: (row) => row.split("`" + backticked(cmd.launchForm.text)[0] + "`").join("the flag") },
      { host: cmd, edit: (row) => row.replace(/\|\s*$/, ` ${otherCmd.launchAgent} |`) },
      { host: panel, edit: (row) => row.replace(/\|\s*$/, ` ${COMMAND_FLAGS[0]} |`) },
      { host: panel, edit: (row) => row.split(invokeTok).join("the command") },
    ];
    for (const c of cases) {
      const got = scanStartTable("README.md", mutate(c.host, c.edit)).findings;
      expect(got.length, `no finding for a mutation of ${c.host.name}'s row`).toBeGreaterThan(0);
      for (const f of got) {
        expect(f.file).toBe("README.md");
        expect(f.why).toContain(c.host.name);
      }
    }
  });

  it("CAUTION-1: every scanned unit that gives a cautioned launch command holds the caution, and the scan examined some unit", () => {
    expect(LAUNCH_HOSTS.filter((h) => h.launchForm.caution !== null).length, "premise: a launch form carries a caution").toBeGreaterThan(0);
    let examined = 0;
    const findings = trackedMarkdown(REPO).flatMap((f) => {
      const r = scanCautions(f, readRel(f));
      examined += r.examined;
      return r.findings;
    });
    console.log(`CAUTION-1: ${examined} unit(s) give a cautioned launch command`);
    expect(findings.map(showLive)).toEqual([]);
    expect(examined, "CAUTION-1 examined no unit").toBeGreaterThanOrEqual(1);
  });

  it("CAUTION-1 by mutation: README.md with the cautioned row's caution removed gives a finding naming README.md and the host", () => {
    const body = readRel("README.md");
    expect(scanCautions("README.md", body).findings, "premise: the real README has no CAUTION-1 finding").toEqual([]);
    const h = LAUNCH_HOSTS.find((x) => x.launchForm.caution !== null)!;
    const c = h.launchForm.caution!;
    const row = hostRowLines(body, h.name)[0];
    const ls = body.split(/\r?\n/);
    const cut = ls[row.line - 1].split(c.charAt(0).toUpperCase() + c.slice(1)).join("").split(c).join("");
    expect(cut, "premise: the mutation removed the caution").not.toBe(ls[row.line - 1]);
    ls[row.line - 1] = cut;
    const got = scanCautions("README.md", ls.join("\n")).findings;
    expect(got.map((f) => f.line)).toEqual([row.line]);
    expect(got[0].file).toBe("README.md");
    expect(got[0].why).toContain(h.name);
  });
});

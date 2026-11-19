// check-story-docs.test.ts — the cases for the story-docs gate (plan 43-03; D-22, D-23, D-11).
//
// Pure functions are imported from the committed `.js`; the refusal paths are run by spawning the
// committed `.js` against a hermetic CHECK_ROOT mirror under the OS temp dir, so the red is the
// shipped gate's own red and not a re-implementation of it here.

import { describe, it, expect, afterAll } from "vitest";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import {
  GAP_D1_SENTENCE,
  GRUG_AGENT_WORD,
  GRUG_COMMAND_WORD,
  gapD1Findings,
  gapD1ScanSet,
  grugAgentFindings,
  grugCommandFindings,
  linkFindings,
  readmeStoryFindings,
  TAGLINE,
  type LinkContext,
} from "./check-story-docs.js";
import { publicDocsCorpus } from "./check-public-docs-vocabulary.js";

const ROOT = join(import.meta.dirname, "..");
const GATE_JS = join(ROOT, "scripts", "check-story-docs.js");

// The commit phase 43 measured its baseline at (43-BASELINE.md, `base:`), before any phase-43 edit.
// CI checks out with `fetch-depth: 0`, so the object is reachable there too.
const BASE_COMMIT = "a067c6e6e7eb2090eb44b47a0d001e622248402e";

const tmpDirs: string[] = [];
function freshTmp(prefix: string): string {
  const d = mkdtempSync(join(tmpdir(), prefix));
  tmpDirs.push(d);
  return d;
}
afterAll(() => {
  for (const d of tmpDirs) rmSync(d, { recursive: true, force: true });
});

function writeIn(root: string, rel: string, text: string): void {
  const p = join(root, ...rel.split("/"));
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, text);
}

function runGate(checkRoot: string): { status: number; out: string } {
  const r = spawnSync("node", [GATE_JS], { encoding: "utf8", env: { ...process.env, CHECK_ROOT: checkRoot } });
  return { status: r.status ?? -1, out: (r.stdout ?? "") + (r.stderr ?? "") };
}

// The FAIL/PASS line of one check, picked out of the gate's output by its label.
function checkLine(out: string, labelStart: string): string {
  const line = out.split("\n").find((l) => /^\s+(PASS|FAIL)\s+/.test(l) && l.includes(labelStart));
  return line ?? "";
}

describe("check 1 — the /grug command word (D-23)", () => {
  it.each(["/grug", "`/grug`", "/grug:plan", "/grug-map", "/grug-release", "types /grug, and", "(literal `/grug`)"])(
    "matches %s",
    (s) => {
      expect(GRUG_COMMAND_WORD.test(s)).toBe(true);
    },
  );

  it.each([
    "/grugops",
    "/grugops:plan",
    "/grugops-map",
    "commands/grug.md",
    ".claude/skills/grug/SKILL.md",
    "grug:",
    "the grug plugin",
    "https://example.com/grug",
  ])("does not match %s", (s) => {
    expect(GRUG_COMMAND_WORD.test(s)).toBe(false);
  });

  it("finds the 13 /grug lines in CLAUDE.md at the phase-43 base commit", () => {
    const base = execFileSync("git", ["show", `${BASE_COMMIT}:CLAUDE.md`], { cwd: ROOT, encoding: "utf8" });
    expect(grugCommandFindings(base).map((f) => f.line)).toEqual([
      10, 22, 47, 65, 69, 91, 102, 111, 112, 129, 131, 133, 150,
    ]);
  });

  it("finds no /grug command word in the live CLAUDE.md", () => {
    const live = readFileSync(join(ROOT, "CLAUDE.md"), "utf8");
    const found = grugCommandFindings(live);
    expect(found.length, `CLAUDE.md lines naming /grug: ${found.map((f) => f.line).join(", ")}`).toBe(0);
  });

  it("refuses a mirror whose CLAUDE.md carries one planted /grug, naming the line", () => {
    const mirror = freshTmp("gops-story-grug-");
    writeIn(mirror, "CLAUDE.md", "# Project\n\nTypes `/grugops`.\nThen type `/grug` to start.\n");
    const { status, out } = runGate(mirror);
    expect(status).toBe(1);
    const line = checkLine(out, "STORY-05 /grug command word");
    expect(line).toContain("FAIL");
    expect(out).toContain("CLAUDE.md:4:");
    expect(out).not.toContain("CLAUDE.md:3:");
  });

  it("refuses a mirror with no CLAUDE.md as a check that visited nothing", () => {
    const mirror = freshTmp("gops-story-empty-");
    const { status, out } = runGate(mirror);
    expect(status).toBe(1);
    expect(checkLine(out, "STORY-05 /grug command word")).toContain("ZERO elements visited");
  });
});

describe("check 1 — the removed grug- agent name (WR-03, plan 43.1-04)", () => {
  // The commit plan 43.1-04 measured CLAUDE.md at, before its edit: line 134 still named the
  // removed agent in a plugin `settings.json` route that does not exist.
  const WR03_COMMIT = "8136dafe302a18dd7a6562004711304c9644e90d";

  it.each(["grug-orchestrator", '{ "agent": "grug-orchestrator" }', "`grug-map`", "the grug-release agent"])(
    "matches %s",
    (s) => {
      expect(GRUG_AGENT_WORD.test(s)).toBe(true);
    },
  );

  it.each([
    "grugops-orchestrator",
    "claude --agent grugops-orchestrator",
    ".claude/agents/grug-orchestrator.md",
    "agents/grug-map.md",
    "my-grug-orchestrator",
    "xgrug-orchestrator",
    "grug-",
    "grug-Map",
    "/grug-map",
  ])("does not match %s", (s) => {
    expect(GRUG_AGENT_WORD.test(s)).toBe(false);
  });

  it("a planted CLAUDE.md line with the old agent setting is one finding naming the line", () => {
    const text = '# Project\n\n- Orchestrator = main thread via plugin `settings.json` `{ "agent": "grug-orchestrator" }`.\n';
    expect(grugAgentFindings(text).map((f) => f.line)).toEqual([3]);
    expect(grugCommandFindings(text)).toEqual([]);
  });

  it("a line naming grugops-orchestrator is no finding", () => {
    expect(grugAgentFindings("- Orchestrator = main thread via `claude --agent grugops-orchestrator`.\n")).toEqual([]);
  });

  it("the CLAUDE.md at commit 8136dafe gives exactly one agent finding, at line 134", () => {
    const old = execFileSync("git", ["show", `${WR03_COMMIT}:CLAUDE.md`], { cwd: ROOT, encoding: "utf8" });
    expect(grugAgentFindings(old).map((f) => f.line)).toEqual([134]);
  });

  it("finds no grug- agent name in the live CLAUDE.md", () => {
    const live = readFileSync(join(ROOT, "CLAUDE.md"), "utf8");
    const found = grugAgentFindings(live);
    expect(found.length, `CLAUDE.md lines naming a grug- agent: ${found.map((f) => f.line).join(", ")}`).toBe(0);
  });

  it("refuses a mirror whose CLAUDE.md names the old agent, naming the line", () => {
    const mirror = freshTmp("gops-story-agent-");
    writeIn(mirror, "CLAUDE.md", "# Project\n\nRun `claude --agent grugops-orchestrator`.\nOr set `grug-orchestrator`.\n");
    const { status, out } = runGate(mirror);
    expect(status).toBe(1);
    expect(checkLine(out, "STORY-05 /grug command word")).toContain("FAIL");
    expect(out).toContain("CLAUDE.md:4:");
    expect(out).not.toContain("CLAUDE.md:3:");
  });
});

describe("check 2 — the GAP-D1 sentence on pages that mention parallel work (D-22)", () => {
  const page = (text: string): { file: string; text: string }[] => [{ file: "docs/page.md", text }];

  it("the sentence is the exact agreed text", () => {
    expect(GAP_D1_SENTENCE).toBe(
      "parallel on hosts with a spawn tool; the own-session capture is `UNKNOWN - verify` (GAP-D1)",
    );
  });

  it("a page that says agents run in parallel without the sentence is a finding naming the file", () => {
    const f = gapD1Findings(page("Role agents run in parallel.\n"));
    expect(f.map((x) => x.file)).toEqual(["docs/page.md"]);
  });

  it("the same page with the sentence is not a finding", () => {
    expect(gapD1Findings(page(`Role agents run in ${GAP_D1_SENTENCE}.\n`))).toEqual([]);
  });

  it("an en dash in `UNKNOWN – verify` is still a finding", () => {
    const dashed = GAP_D1_SENTENCE.replace("UNKNOWN - verify", "UNKNOWN \u2013 verify");
    expect(dashed).not.toBe(GAP_D1_SENTENCE);
    expect(gapD1Findings(page(`Role agents run in ${dashed}.\n`))).toHaveLength(1);
  });

  it("the sentence without its backticks is still a finding", () => {
    const bare = GAP_D1_SENTENCE.replaceAll("`", "");
    expect(gapD1Findings(page(`Role agents run in ${bare}.\n`))).toHaveLength(1);
  });

  it("`Parallel` capitalized triggers; `parallelism` and `unparalleled` do not", () => {
    expect(gapD1Findings(page("Parallel scheduling is used.\n"))).toHaveLength(1);
    expect(gapD1Findings(page("Some parallelism, an unparalleled kit.\n"))).toEqual([]);
  });

  it("a page with no `parallel` needs no sentence", () => {
    expect(gapD1Findings(page("The Orchestrator claims one ticket at a time.\n"))).toEqual([]);
  });

  it("the scan set is the public-docs corpus plus the install guide", () => {
    const corpus = publicDocsCorpus();
    expect(corpus.length).toBeGreaterThan(5);
    expect(corpus).not.toContain("install/README.md");
    expect(gapD1ScanSet()).toEqual([...corpus, "install/README.md"]);
  });

  it("the live tree: 0 findings over the corpus plus one, every page visited", () => {
    // Each live case reads its own check's line; the gate's exit code is the CI step's to judge.
    const { out } = runGate(ROOT);
    const line = checkLine(out, "STORY-05 GAP-D1");
    const n = publicDocsCorpus().length + 1;
    const flat = out.replaceAll("\n", " | ");
    expect(line, flat).toContain(`PASS  STORY-05 GAP-D1`);
    expect(line).toContain(`0 findings over ${n}/${n} elements`);
  });
});

describe("check 3 — shipped docs links resolve in a kit home (D-11)", () => {
  const REPO = "https://github.com/example/kit";
  // A small tree: agent-factory/, two shipped docs pages, and checkout-only files.
  const TREE = new Set([
    "agent-factory",
    "agent-factory/roles",
    "agent-factory/roles/orchestrator.md",
    "agent-factory/README.md",
    "docs/page.md",
    "docs/other.md",
    "install/README.md",
    "README.md",
    ".planning/x.md",
  ]);
  const ctx: LinkContext = {
    exists: (rel) => TREE.has(rel),
    shipped: new Set(["docs/page.md", "docs/other.md"]),
    repository: REPO,
  };
  const targets = (text: string, file = "docs/page.md", rule: "ship" | "checkout" = "ship"): string[] =>
    linkFindings(file, text, rule, ctx).map((f) => `${f.file}:${f.line}:${f.target}`);

  it.each(["../.planning/x.md", "../install/README.md", "../README.md"])(
    "a shipped page linking %s is a finding naming file and target",
    (t) => {
      expect(targets(`See [it](${t}).\n`)).toEqual([`docs/page.md:1:${t}`]);
    },
  );

  it("a shipped page linking into agent-factory/ or a shipped sibling page is not a finding", () => {
    expect(targets("[a](../agent-factory/roles/orchestrator.md) and [b](other.md) and [c](./other.md#part)\n")).toEqual(
      [],
    );
  });

  it("a link to a missing file is a finding, even under agent-factory/", () => {
    expect(targets("[a](../agent-factory/roles/nope.md)\n")).toEqual(["docs/page.md:1:../agent-factory/roles/nope.md"]);
  });

  it("a link inside a fenced block is ignored", () => {
    expect(targets("```md\n[x](../install/README.md)\n```\n")).toEqual([]);
  });

  it("a #fragment is dropped before resolving, and a bare #fragment is skipped", () => {
    expect(targets("[a](other.md#top) [b](#here)\n")).toEqual([]);
    expect(targets("[a](../install/README.md#flags)\n")).toEqual(["docs/page.md:1:../install/README.md#flags"]);
  });

  it("a reference definition is read like an inline link", () => {
    expect(targets("Text.\n\n[x]: ../install/README.md\n")).toEqual(["docs/page.md:3:../install/README.md"]);
  });

  it("a link written inside an inline code span is text, not a link", () => {
    expect(targets("Write `[x](../install/README.md)` to link it.\n")).toEqual([]);
  });

  it("a repository URL naming a missing path is a finding; an existing path is not; another host is skipped", () => {
    expect(targets(`[a](${REPO}/blob/main/no-such-file.md)\n`)).toEqual([
      `docs/page.md:1:${REPO}/blob/main/no-such-file.md`,
    ]);
    expect(targets(`[a](${REPO}/blob/main/install/README.md) [b](${REPO}/tree/main/agent-factory/)\n`)).toEqual([]);
    expect(targets("[a](https://example.org/x.md) [m](mailto:a@example.org)\n")).toEqual([]);
  });

  it("README.md (checkout rule) may link a checkout-only file, but not a missing one", () => {
    expect(targets("[i](install/README.md)\n", "README.md", "checkout")).toEqual([]);
    expect(targets("[m](missing.md)\n", "README.md", "checkout")).toEqual(["README.md:1:missing.md"]);
  });

  // IN-04 (plan 43.1-04): the link forms the reader skipped. Each form gets a dead case and a live one.
  describe("the link forms IN-04 named", () => {
    const WIDE_TREE = new Set([...TREE, "docs/existing page.md", "docs/existing_(1).md", "docs/img.png"]);
    const wide: LinkContext = {
      exists: (rel) => WIDE_TREE.has(rel),
      shipped: new Set([...ctx.shipped, "docs/existing page.md", "docs/existing_(1).md", "docs/img.png"]),
      repository: REPO,
    };
    const found = (text: string): string[] =>
      linkFindings("docs/page.md", text, "ship", wide).map((f) => `${f.line}:${f.target}`);

    it("an angle-bracket target with a space is read whole: a missing one is a finding, an existing one is not", () => {
      expect(found("[x](<missing page.md>)\n")).toEqual(["1:missing page.md"]);
      expect(found("[x](<existing page.md>)\n")).toEqual([]);
      expect(found('[x](<existing page.md> "Title")\n')).toEqual([]);
    });

    it("a target holding balanced parentheses is read whole, not cut at the first )", () => {
      expect(found("[x](missing_(1).md)\n")).toEqual(["1:missing_(1).md"]);
      expect(found("[x](existing_(1).md)\n")).toEqual([]);
      expect(found("[x](existing_(1).md 'Title') and [y](other.md)\n")).toEqual([]);
    });

    it("an HTML href or src attribute is read: a missing target is a finding, an existing one is not", () => {
      expect(found('<a href="missing.md">x</a>\n')).toEqual(["1:missing.md"]);
      expect(found("<img src='missing.png' alt=\"x\">\n")).toEqual(["1:missing.png"]);
      expect(found('<a href="other.md">x</a> <img src="img.png">\n')).toEqual([]);
    });

    it("an HTML href follows the scheme rule: another host is skipped, a dead repository URL is a finding", () => {
      expect(found('<a href="https://example.org/x.md">x</a>\n')).toEqual([]);
      expect(found(`<a href="${REPO}/blob/main/no-such-file.md">x</a>\n`)).toEqual([
        `1:${REPO}/blob/main/no-such-file.md`,
      ]);
    });

    it("the new forms inside an inline code span or a fenced block are still ignored", () => {
      expect(found('Write `[x](<missing page.md>)`, `[y](missing_(1).md)` or `<a href="missing.md">`.\n')).toEqual([]);
      expect(found('```html\n<a href="missing.md">x</a>\n<img src="missing.png">\n[x](<missing page.md>)\n```\n')).toEqual(
        [],
      );
    });

    it("several forms on one line are read in the order they appear", () => {
      expect(found('<img src="gone.png"> then [x](<gone page.md>) then [y](gone_(2).md)\n')).toEqual([
        "1:gone.png",
        "1:gone page.md",
        "1:gone_(2).md",
      ]);
    });
  });

  it("the live tree: every shipped docs link resolves in a kit home", () => {
    const { out } = runGate(ROOT);
    const line = checkLine(out, "STORY-05 shipped links");
    expect(line, out.replaceAll("\n", " | ")).toContain("PASS  STORY-05 shipped links");
    expect(line).toMatch(/0 findings over (\d+)\/\1 elements/);
  });
});

describe("check 4 — the README opens with the tagline (plan 43-11; D-01, STORY-01)", () => {
  const ART = ["```text", "  ____ art", "```"];
  // The verdict word (PASS or FAIL) of the README check's line, or "" when the gate printed none.
  const verdictOf = (out: string): string => checkLine(out, "STORY-01 README tagline").trim().split(/\s+/)[0] ?? "";

  it("the tagline is the exact agreed H1", () => {
    expect(TAGLINE).toBe("# grugops — Specialist agents. Shared context. Coordinated work.");
  });

  it("the base commit's README gives two findings: the opening line and `simple software factory`", () => {
    const base = execFileSync("git", ["show", `${BASE_COMMIT}:README.md`], { cwd: ROOT, encoding: "utf8" });
    const f = readmeStoryFindings(base);
    expect(f).toHaveLength(2);
    expect(f[0].line).toBe(1);
    expect(f[0].text).toMatch(/does not open with the tagline/);
    expect(f[1].text).toMatch(/simple software factory/i);
  });

  it("the live README gives no finding", () => {
    expect(readmeStoryFindings(readFileSync(join(ROOT, "README.md"), "utf8"))).toEqual([]);
  });

  it("an art fence and a claim comment before the tagline pass", () => {
    const text = [...ART, "", "<!-- claim: C-28-069 -->", TAGLINE, "", "A plain story."].join("\n");
    expect(readmeStoryFindings(text)).toEqual([]);
  });

  it("a multi-line HTML comment before the tagline is skipped too", () => {
    const text = ["<!--", "a note", "-->", TAGLINE].join("\n");
    expect(readmeStoryFindings(text)).toEqual([]);
  });

  it("a prose line before the tagline H1 is a finding naming its line", () => {
    const text = [...ART, "", "Welcome to grugops.", TAGLINE].join("\n");
    const f = readmeStoryFindings(text);
    expect(f).toHaveLength(1);
    expect(f[0].line).toBe(5);
    expect(f[0].text).toMatch(/does not open with the tagline/);
  });

  it("an empty H1 before the tagline is a finding", () => {
    const f = readmeStoryFindings(["#", TAGLINE].join("\n"));
    expect(f).toHaveLength(1);
    expect(f[0].line).toBe(1);
  });

  it("a README with no line outside fences and comments is a finding", () => {
    expect(readmeStoryFindings([...ART, "<!-- only a comment -->"].join("\n"))).toHaveLength(1);
  });

  it.each(["simple software factory", "Simple Software Factory", "The SIMPLE SOFTWARE FACTORY."])(
    "`%s` anywhere is a finding, in any case",
    (phrase) => {
      const f = readmeStoryFindings([TAGLINE, "", phrase].join("\n"));
      expect(f).toHaveLength(1);
      expect(f[0].line).toBe(3);
    },
  );

  it("refuses a mirror whose README.md opens with the old H1, naming the line", () => {
    const root = freshTmp("story-docs-readme-");
    writeIn(root, "README.md", "# grugops\n\nA story.\n");
    const r = runGate(root);
    expect(r.status).toBe(1);
    expect(verdictOf(r.out)).toBe("FAIL");
    expect(r.out).toMatch(/README\.md:1: /);
  });

  it("refuses a mirror with no README.md as a check that visited nothing", () => {
    const root = freshTmp("story-docs-readme-");
    const r = runGate(root);
    expect(verdictOf(r.out)).toBe("FAIL");
  });

  it("the live tree: the README check passes", () => {
    const r = runGate(ROOT);
    expect(verdictOf(r.out)).toBe("PASS");
  });
});

describe("wiring", () => {
  it("package.json runs the gate as `check:story-docs`", () => {
    const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8")) as { scripts: Record<string, string> };
    expect(pkg.scripts["check:story-docs"]).toBe("tsc --outDir .tmp-build && node scripts/check-story-docs.js");
  });

  it("CI runs the same gate module as `check:story-docs`, on a command line rather than in a comment", () => {
    // CI names gate modules directly (`node scripts/<gate>.js`); check-foundation-guards.test.ts derives
    // reachability from that spelling. The comment beside it names the npm script for a local run.
    const ci = readFileSync(join(ROOT, ".github", "workflows", "ci.yml"), "utf8");
    const lines = ci.split("\n");
    const runLines = lines.filter((l) => !l.trim().startsWith("#") && l.trim() === "node scripts/check-story-docs.js");
    expect(runLines.length).toBe(1);
    expect(lines.some((l) => l.trim().startsWith("#") && l.includes("check:story-docs"))).toBe(true);
  });
});

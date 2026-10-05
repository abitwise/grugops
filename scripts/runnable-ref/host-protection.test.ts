// host-protection.test.ts — the read-only git-host check (Phase 33.1, D-19).
//
// Every case spawns the COMMITTED host-protection.js (never the .ts) and drives it through its
// `--gh-script` test seam with fixtures/gh-stub.mjs, so no case calls the real `gh` or the network.
// The stub answers from a per-case fixture map (space-joined argv → response) and appends every
// argv it receives to a per-case log, which the read-only proof at the end aggregates.
//
// Vitest globals:false (the repo default) → import test fns explicitly.

import { describe, it, expect, afterEach } from "vitest";
import { spawn, spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync, existsSync, lstatSync, symlinkSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";
import ts from "typescript";
import { skipLine, stageShapeOrSkip } from "../check-platform-shapes.js";

const HERE = import.meta.dirname;
const CHECK_JS = join(HERE, "host-protection.js");
const GH_STUB = join(HERE, "fixtures", "gh-stub.mjs");

const tmpDirs: string[] = [];
function mkTmp(): string {
  const d = mkdtempSync(join(tmpdir(), "grugops-host-check-"));
  tmpDirs.push(d);
  return d;
}
afterEach(() => {
  while (tmpDirs.length) rmSync(tmpDirs.pop()!, { recursive: true, force: true });
});

// Every argv line any case's stub recorded, for the aggregated read-only proof.
const ALL_CALLS: string[][] = [];

type Fixture = Record<string, unknown>;
const api = (path: string): string => `api --method GET -i ${path}`;

function runCheck(
  fixture: Fixture,
  args: string[] = [],
  opts: { cwd?: string; ghScript?: string } = {},
): { status: number | null; stdout: string; stderr: string; calls: string[][] } {
  const scratch = mkTmp();
  const fixturePath = join(scratch, "fixture.json");
  const logPath = join(scratch, "calls.log");
  writeFileSync(fixturePath, JSON.stringify(fixture));
  const r = spawnSync("node", [CHECK_JS, "--gh-script", opts.ghScript ?? GH_STUB, ...args], {
    encoding: "utf8",
    cwd: opts.cwd ?? mkTmp(),
    env: { ...process.env, GH_STUB_FIXTURE: fixturePath, GH_STUB_LOG: logPath },
  });
  const calls = existsSync(logPath)
    ? readFileSync(logPath, "utf8")
        .split("\n")
        .filter((l) => l.length > 0)
        .map((l) => JSON.parse(l) as string[])
    : [];
  ALL_CALLS.push(...calls);
  return { status: r.status, stdout: r.stdout ?? "", stderr: r.stderr ?? "", calls };
}

// THE ONE ALL-PROTECTED FIXTURE (plan 33.1-17). Shared with install/install.test.ts, whose
// materialized-copy case reads the same file, so the kit source and the installed copy are judged
// against one definition of "every target protected": default branch `main` covered by one active
// ruleset whose rules show every BRANCH_FLOOR row (`pull_request` with one required approval,
// `non_fast_forward`, `deletion`), and no `master`. The fixture serves no environment answer and no
// protected-branch list: since plan 33.1-41 (33.1 D-31 Q4) the check asks for neither.
const STRONG_FIXTURE = join(HERE, "fixtures", "host-strong.fixture.json");
const STRONG = JSON.parse(readFileSync(STRONG_FIXTURE, "utf8")) as Fixture;
const STRONG_RULES_KEY = api("repos/{owner}/{repo}/rules/branches/main?per_page=100");
const RULESET_PROTECTED = (STRONG[STRONG_RULES_KEY] as { body: unknown[] }).body;

describe("host-protection.js — branch verdicts", () => {
  it("the strong fixture: one active ruleset shows every floor row → protected, and the run exits 0", () => {
    const r = runCheck(STRONG);
    expect(r.stdout).toMatch(/^branch main: protected — every branch floor item is shown: /m);
    expect(r.stdout).toMatch(summaryLine(1, 0, 0));
    expect(r.status).toBe(0);
  });
});

// ── Task 2 fixtures ─────────────────────────────────────────────────────────────────────────────
// base() is the shared strong fixture (host-strong.fixture.json): every target `protected`. Each
// case overrides only the keys its behaviour is about.
const REPO = api("repos/{owner}/{repo}");
const RULES = (b: string): string => api(`repos/{owner}/{repo}/rules/branches/${b}?per_page=100`);
const PROTECTION = (b: string): string => api(`repos/{owner}/{repo}/branches/${b}/protection`);
const BRANCH = (b: string): string => api(`repos/{owner}/{repo}/branches/${b}`);
// The environments list the check read before plan 33.1-41; a case serves it to show it is never asked.
const ENVS = api("repos/{owner}/{repo}/environments?per_page=100");
// An explicit, empty pull request bypass allowance (D-30): a classic body that omits the key is not
// readable (plan 33.1-22), so every classic body a case expects to be `protected` carries this.
const NO_ALLOWANCES = { users: [], teams: [], apps: [] };
// The two stale-approval settings on (33.1 D-33 (d)): every strong pull_request rule carries
// STALE_ON in its parameters, and every strong classic required_pull_request_reviews carries
// CLASSIC_STALE_ON. A branch needs both rows to read `protected`.
const STALE_ON = { dismiss_stale_reviews_on_push: true, require_last_push_approval: true };
const CLASSIC_STALE_ON = { dismiss_stale_reviews: true, require_last_push_approval: true };
function base(over: Fixture = {}): Fixture {
  // A fresh parse per call, so no case can mutate what another case reads.
  return { ...(JSON.parse(readFileSync(STRONG_FIXTURE, "utf8")) as Fixture), ...over };
}
// A branch with no qualifying ruleset: rules 200 and empty, so the classic endpoints decide.
const NO_RULES = { status: 200, body: [] };
const TARGET_LINE = /^(branch|environment) (.+): (protected|unprotected|UNKNOWN - verify) — (.+)$/;
function targetLines(stdout: string): string[] {
  return stdout.split("\n").filter((l) => l.startsWith("branch ") || l.startsWith("environment "));
}
function verdictOf(stdout: string, kind: string, name: string): string | undefined {
  for (const l of targetLines(stdout)) {
    const m = TARGET_LINE.exec(l);
    if (m !== null && m[1] === kind && m[2] === name) return m[3];
  }
  return undefined;
}

describe("host-protection.js — the full evidence rules (D-19)", () => {
  it("every target line carries exactly one verdict word, and the all-protected run exits 0", () => {
    const r = runCheck(base());
    const lines = targetLines(r.stdout);
    expect(lines.length).toBe(2); // branch main + environment production (master is absent)
    for (const l of lines) expect(l).toMatch(TARGET_LINE);
    expect(verdictOf(r.stdout, "branch", "main")).toBe("protected");
    expect(verdictOf(r.stdout, "environment", "production")).toBe("UNKNOWN - verify");
    expect(r.stdout).toMatch(summaryLine(1, 0, 0));
    expect(r.status).toBe(0);
  });

  it("classic protection with one required approval, force pushes and deletions disabled → protected", () => {
    const r = runCheck(
      base({
        [RULES("main")]: NO_RULES,
        [PROTECTION("main")]: {
          status: 200,
          body: {
            enforce_admins: { enabled: true },
            required_pull_request_reviews: { required_approving_review_count: 1, ...CLASSIC_STALE_ON, bypass_pull_request_allowances: NO_ALLOWANCES },
            allow_force_pushes: { enabled: false },
            allow_deletions: { enabled: false },
          },
        },
      }),
    );
    expect(verdictOf(r.stdout, "branch", "main")).toBe("protected");
    expect(r.status).toBe(0);
  });

  it("classic protection lacking a requirement → unprotected, naming what is missing, exit 1", () => {
    const r = runCheck(
      base({
        [RULES("main")]: NO_RULES,
        // A protection record (enforce_admins present; red-team finding 1 of plan 33.1-23: a body
        // without it is not a record and reads UNKNOWN - verify) that lacks the requirements.
        [PROTECTION("main")]: { status: 200, body: { enforce_admins: { enabled: true }, allow_force_pushes: { enabled: true } } },
      }),
    );
    expect(verdictOf(r.stdout, "branch", "main")).toBe("unprotected");
    const line = targetLines(r.stdout).find((l) => l.startsWith("branch main:"))!;
    expect(line).toContain("pull request");
    expect(line).toContain("force push");
    expect(r.status).toBe(1);
  });

  it("classic protection lacking a requirement, but the rules call was not a 200 → UNKNOWN - verify", () => {
    const r = runCheck(
      base({
        [RULES("main")]: { status: 500, body: { message: "Server Error" } },
        [PROTECTION("main")]: { status: 200, body: { allow_force_pushes: { enabled: false } } },
      }),
    );
    expect(verdictOf(r.stdout, "branch", "main")).toBe("UNKNOWN - verify");
    expect(r.status).toBe(2);
  });

  it("404 `Branch not protected` with a readable, non-qualifying rule set → unprotected", () => {
    const r = runCheck(
      base({
        [RULES("main")]: { status: 200, body: [{ type: "deletion" }] },
        [PROTECTION("main")]: { status: 404, body: { message: "Branch not protected" } },
      }),
    );
    expect(verdictOf(r.stdout, "branch", "main")).toBe("unprotected");
    expect(r.status).toBe(1);
  });

  it("404 `Branch not protected` when the rules call was not a 200 → UNKNOWN - verify", () => {
    const r = runCheck(
      base({
        [RULES("main")]: { status: 403, body: { message: "Resource not accessible by integration" } },
        [PROTECTION("main")]: { status: 404, body: { message: "Branch not protected" } },
      }),
    );
    expect(verdictOf(r.stdout, "branch", "main")).toBe("UNKNOWN - verify");
    expect(r.status).toBe(2);
  });

  it("404 `Not Found` while the branch reports classic protection → UNKNOWN - verify (rules not readable)", () => {
    const r = runCheck(
      base({
        [RULES("main")]: NO_RULES,
        [PROTECTION("main")]: { status: 404, body: { message: "Not Found" } },
        [BRANCH("main")]: { status: 200, body: { name: "main", protected: true } },
      }),
    );
    expect(verdictOf(r.stdout, "branch", "main")).toBe("UNKNOWN - verify");
    expect(r.stdout).toContain("classic protection present; its rules are not readable with this token");
    expect(r.status).toBe(2);
  });

  it("404 `Not Found` while the branch reports no protection and the rules call was a 200 → unprotected", () => {
    const r = runCheck(
      base({
        [RULES("main")]: NO_RULES,
        [PROTECTION("main")]: { status: 404, body: { message: "Not Found" } },
        [BRANCH("main")]: { status: 200, body: { name: "main", protected: false } },
      }),
    );
    expect(verdictOf(r.stdout, "branch", "main")).toBe("unprotected");
    expect(r.status).toBe(1);
  });

  it("a paginated rule list with no qualifying rule on the first page is never read as unprotected", () => {
    const r = runCheck(
      base({
        [RULES("main")]: { status: 200, body: [], link: '<https://api.github.com/x?page=2>; rel="next"' },
        [PROTECTION("main")]: { status: 404, body: { message: "Branch not protected" } },
      }),
    );
    expect(verdictOf(r.stdout, "branch", "main")).toBe("UNKNOWN - verify");
  });

  it("a status this check never measured → UNKNOWN - verify quoting the status", () => {
    const r = runCheck(
      base({
        [RULES("main")]: NO_RULES,
        [PROTECTION("main")]: { status: 403, body: { message: "Resource not accessible by integration" } },
      }),
    );
    expect(verdictOf(r.stdout, "branch", "main")).toBe("UNKNOWN - verify");
    expect(targetLines(r.stdout).find((l) => l.startsWith("branch main:"))).toContain("403");
  });

  it("CRLF output is parsed like LF output", () => {
    const r = runCheck(base({ [RULES("main")]: { status: 200, body: RULESET_PROTECTED, crlf: true } }));
    expect(verdictOf(r.stdout, "branch", "main")).toBe("protected");
  });

  it("output with no HTTP status line → UNKNOWN - verify", () => {
    const r = runCheck(base({ [RULES("main")]: { raw: "not an http response" } }));
    expect(verdictOf(r.stdout, "branch", "main")).toBe("UNKNOWN - verify");
    expect(r.status).toBe(2);
  });

  it("main and master are added when they exist; a 404 omits the extra branch", () => {
    const r = runCheck(
      base({
        [REPO]: { status: 200, body: { default_branch: "develop", full_name: "octo/repo", url: "https://api.github.com/repos/octo/repo" } },
        [RULES("develop")]: { status: 200, body: RULESET_PROTECTED },
        [BRANCH("main")]: { status: 200, body: { name: "main", protected: false } },
        [RULES("main")]: { status: 200, body: RULESET_PROTECTED },
        [BRANCH("master")]: { status: 404, body: { message: "Branch not found" } },
      }),
    );
    expect(verdictOf(r.stdout, "branch", "develop")).toBe("protected");
    expect(verdictOf(r.stdout, "branch", "main")).toBe("protected");
    expect(verdictOf(r.stdout, "branch", "master")).toBeUndefined();
    expect(r.status).toBe(0);
  });

  it("a renamed-branch answer (branches/master answers 200 describing `main`) does not add master", () => {
    // Measured against a real repository whose master was renamed to main: the old name answers
    // 200 with the new branch's record. That is not evidence that `master` exists.
    const r = runCheck(base({ [BRANCH("master")]: { status: 200, body: { name: "main", protected: false } } }));
    expect(verdictOf(r.stdout, "branch", "master")).toBeUndefined();
    expect(r.status).toBe(0);
  });

  it("404 `Not Found` where the branch endpoint answers about a DIFFERENT branch → UNKNOWN - verify", () => {
    const r = runCheck(
      base({
        [RULES("main")]: NO_RULES,
        [PROTECTION("main")]: { status: 404, body: { message: "Not Found" } },
        [BRANCH("main")]: { status: 200, body: { name: "trunk", protected: false } },
      }),
    );
    expect(verdictOf(r.stdout, "branch", "main")).toBe("UNKNOWN - verify");
  });

  it("an extra branch whose existence cannot be read is reported UNKNOWN - verify, not dropped", () => {
    const r = runCheck(base({ [BRANCH("master")]: { status: 500, body: { message: "Server Error" } } }));
    expect(verdictOf(r.stdout, "branch", "master")).toBe("UNKNOWN - verify");
    expect(r.status).toBe(2);
  });

  it("--branch adds each named branch (repeatable), with `/` kept literal in the path", () => {
    const r = runCheck(
      base({
        [RULES("release/1.0")]: { status: 200, body: RULESET_PROTECTED },
        [RULES("hotfix")]: NO_RULES,
        [PROTECTION("hotfix")]: { status: 404, body: { message: "Branch not protected" } },
      }),
      ["--branch", "release/1.0", "--branch", "hotfix"],
    );
    expect(verdictOf(r.stdout, "branch", "release/1.0")).toBe("protected");
    expect(verdictOf(r.stdout, "branch", "hotfix")).toBe("unprotected");
    expect(r.status).toBe(1);
  });
});

// ── CR-01 (plan 33.1-17): one canonical branch floor decides the verdict ────────────────────────
// Rules in the shape `GET rules/branches/<b>` returns (type, parameters, ruleset source, ruleset id).
const RULE = (type: string, parameters?: Record<string, unknown>): Record<string, unknown> => ({
  type,
  ...(parameters === undefined ? {} : { parameters }),
  ruleset_source_type: "Repository",
  ruleset_source: "octo/repo",
  ruleset_id: 1,
});
const PR_RULE = (count: unknown): Record<string, unknown> => RULE("pull_request", { required_approving_review_count: count, ...STALE_ON });
const rulesOf = (...list: unknown[]): unknown => ({ status: 200, body: list });
// Classic protection that shows every floor row: it applies to administrators and grants no pull
// request bypass allowance (D-30). NO_ALLOWANCES is declared with the shared fixtures near the top.
const CLASSIC_STRONG = {
  enforce_admins: { enabled: true },
  required_pull_request_reviews: { required_approving_review_count: 1, ...CLASSIC_STALE_ON, bypass_pull_request_allowances: NO_ALLOWANCES },
  allow_force_pushes: { enabled: false },
  allow_deletions: { enabled: false },
};
const classicOf = (body: Record<string, unknown>): unknown => ({ status: 200, body });
const NOT_PROTECTED_404 = { status: 404, body: { message: "Branch not protected" } };
// The qualifier row of the branch floor (D-30), last in the table.
const NO_BYPASS = "does not let the account the agent works under bypass it";
// `GET repos/{owner}/{repo}/rulesets/<id>` and a 200 answer carrying `current_user_can_bypass`.
const RULESET = (id: number | string): string => api(`repos/{owner}/{repo}/rulesets/${id}`);
// A ruleset answer that models a real host carries `enforcement: "active"` and `target: "branch"`:
// from plan 33.1-22's red-team round on, a ruleset binds a branch only when its own body says both
// (an absent value is not readable, D-30).
const rulesetAnswer = (id: number, bypass?: unknown): unknown => ({
  status: 200,
  body: {
    id,
    enforcement: "active",
    target: "branch",
    source: "octo/repo",
    source_type: "Repository",
    ...(bypass === undefined ? {} : { current_user_can_bypass: bypass }),
  },
});
// A rule from a named ruleset (or with a raw `ruleset_id` value, including a hostile one).
const RULE_IN = (id: unknown, type: string, parameters?: Record<string, unknown>): Record<string, unknown> => ({
  type,
  ...(parameters === undefined ? {} : { parameters }),
  ruleset_source_type: "Repository",
  ruleset_source: "octo/repo",
  ...(id === undefined ? {} : { ruleset_id: id }),
});
// Every branch floor item from one ruleset.
const ALL_ROWS_IN = (id: unknown): Record<string, unknown>[] => [
  RULE_IN(id, "pull_request", { required_approving_review_count: 1, ...STALE_ON }),
  RULE_IN(id, "non_fast_forward"),
  RULE_IN(id, "deletion"),
];
const rulesetCalls = (calls: string[][]): string[] =>
  calls.map((c) => c.join(" ")).filter((c) => c.includes("rulesets/"));
const branchLine = (stdout: string, name = "main"): string =>
  targetLines(stdout).find((l) => l.startsWith(`branch ${name}:`)) ?? "";

type JsonBlock = {
  ok: boolean;
  floor: { branch: string[]; environment: string[] };
  targets: Array<{
    kind: string;
    name: string;
    verdict: string;
    reason: string;
    facts?: Array<{ id: string; requirement: string; state: string; evidence: string }>;
  }>;
  calls: string[][];
};
// Every `- [ ] ` list between `#### Git-host setup checklist` and the next heading, each item with
// its `- [ ] ` prefix and one trailing `;` or `.` removed. install/README.md §5 is the one published
// enumeration of the floor (plan 33.1-20): the first list is the branch floor, the second the
// production floor. An item wrapped onto a second line would be cut short here and fail equality.
function checklistLists(): string[][] {
  const readme = readFileSync(join(HERE, "..", "..", "install", "README.md"), "utf8").split(/\r?\n/);
  const heading = readme.findIndex((l) => l === "#### Git-host setup checklist");
  expect(heading, "the checklist heading exists").toBeGreaterThan(-1);
  const lists: string[][] = [];
  let current: string[] | undefined;
  for (let i = heading + 1; i < readme.length && !readme[i].startsWith("#"); i++) {
    if (readme[i].startsWith("- [ ] ")) {
      if (current === undefined) {
        current = [];
        lists.push(current);
      }
      current.push(readme[i].slice("- [ ] ".length).replace(/[;.]$/, ""));
    } else {
      current = undefined;
    }
  }
  expect(lists.length, "the checklist has exactly two lists: branches, then production").toBe(2);
  return lists;
}
function jsonBlock(stdout: string): JsonBlock {
  const lines = stdout.trim().split("\n");
  const at = lines.findIndex((l) => l.startsWith("HOST-PROTECTION:"));
  return JSON.parse(lines.slice(at + 1).join("\n")) as JsonBlock;
}
function factOf(stdout: string, branch: string, requirement: string): string | undefined {
  const t = jsonBlock(stdout).targets.find((x) => x.kind === "branch" && x.name === branch);
  return t?.facts?.find((f) => f.requirement === requirement)?.state;
}
// The first row of the production floor (plan 33.1-20).
const ENV_EXISTS = "has the name your deploy jobs use";
function envFacts(stdout: string, name: string): Array<{ id: string; requirement: string; state: string; evidence: string }> {
  const t = jsonBlock(stdout).targets.find((x) => x.kind === "environment" && x.name === name);
  expect(t?.facts, `facts on environment ${name}`).toBeDefined();
  return t!.facts!;
}
const envLine = (stdout: string, name = "production"): string =>
  targetLines(stdout).find((l) => l.startsWith(`environment ${name}:`)) ?? "";

describe("host-protection.js — the branch floor table (CR-01, D-19)", () => {
  it("weak ruleset: a pull_request rule with 0 required approvals, list read in full, no classic protection → unprotected", () => {
    const r = runCheck(
      base({
        [RULES("main")]: rulesOf(PR_RULE(0), RULE("non_fast_forward"), RULE("deletion")),
        [PROTECTION("main")]: NOT_PROTECTED_404,
      }),
    );
    expect(verdictOf(r.stdout, "branch", "main")).toBe("unprotected");
    expect(branchLine(r.stdout)).toContain("requires at least one approving review");
    expect(r.status).toBe(1);
  });

  it("missing ruleset count: a pull_request rule without required_approving_review_count → UNKNOWN - verify", () => {
    const r = runCheck(
      base({
        [RULES("main")]: rulesOf(RULE("pull_request", {}), RULE("non_fast_forward"), RULE("deletion")),
        [PROTECTION("main")]: NOT_PROTECTED_404,
      }),
    );
    expect(verdictOf(r.stdout, "branch", "main")).toBe("UNKNOWN - verify");
    expect(r.status).toBe(2);
  });

  it("missing ruleset count: a pull_request rule carrying the count as a string → UNKNOWN - verify", () => {
    const r = runCheck(
      base({
        [RULES("main")]: rulesOf(PR_RULE("1"), RULE("non_fast_forward"), RULE("deletion")),
        [PROTECTION("main")]: NOT_PROTECTED_404,
      }),
    );
    expect(verdictOf(r.stdout, "branch", "main")).toBe("UNKNOWN - verify");
  });

  it("classic count 0: no qualifying rules, classic protection requiring 0 approvals → unprotected", () => {
    const r = runCheck(
      base({
        [RULES("main")]: NO_RULES,
        [PROTECTION("main")]: classicOf({
          ...CLASSIC_STRONG,
          required_pull_request_reviews: { required_approving_review_count: 0, ...CLASSIC_STALE_ON },
        }),
      }),
    );
    expect(verdictOf(r.stdout, "branch", "main")).toBe("unprotected");
    expect(branchLine(r.stdout)).toContain("requires at least one approving review");
  });

  it("classic deletions allowed: allow_deletions.enabled true → unprotected, naming restricts deletions", () => {
    const r = runCheck(
      base({
        [RULES("main")]: NO_RULES,
        [PROTECTION("main")]: classicOf({ ...CLASSIC_STRONG, allow_deletions: { enabled: true } }),
      }),
    );
    expect(verdictOf(r.stdout, "branch", "main")).toBe("unprotected");
    expect(branchLine(r.stdout)).toContain("restricts deletions");
  });

  it("classic deletions absent: a classic body with no allow_deletions key → UNKNOWN - verify", () => {
    const noDeletionsKey: Record<string, unknown> = { ...CLASSIC_STRONG };
    delete noDeletionsKey.allow_deletions;
    const r = runCheck(base({ [RULES("main")]: NO_RULES, [PROTECTION("main")]: classicOf(noDeletionsKey) }));
    expect(verdictOf(r.stdout, "branch", "main")).toBe("UNKNOWN - verify");
    expect(r.status).toBe(2);
  });

  it("ruleset without deletion: list read in full, no classic protection → unprotected, naming restricts deletions", () => {
    const r = runCheck(
      base({
        [RULES("main")]: rulesOf(PR_RULE(1), RULE("non_fast_forward")),
        [PROTECTION("main")]: NOT_PROTECTED_404,
      }),
    );
    expect(verdictOf(r.stdout, "branch", "main")).toBe("unprotected");
    expect(branchLine(r.stdout)).toContain("restricts deletions");
  });

  it("union, strong across arms: the ruleset shows the pull request and approval, classic blocks force pushes and deletions → protected", () => {
    const r = runCheck(
      base({
        [RULES("main")]: rulesOf(PR_RULE(1)),
        [PROTECTION("main")]: classicOf({ enforce_admins: { enabled: true }, allow_force_pushes: { enabled: false }, allow_deletions: { enabled: false } }),
      }),
    );
    expect(verdictOf(r.stdout, "branch", "main")).toBe("protected");
    expect(r.status).toBe(0);
  });

  it("union, a weak arm does not weaken a strong one: ruleset count 0, classic count 1 → protected", () => {
    const r = runCheck(
      base({
        [RULES("main")]: rulesOf(PR_RULE(0), RULE("non_fast_forward"), RULE("deletion")),
        [PROTECTION("main")]: classicOf(CLASSIC_STRONG),
      }),
    );
    expect(verdictOf(r.stdout, "branch", "main")).toBe("protected");
    expect(r.status).toBe(0);
  });

  it("union, both arms at count 0 → unprotected", () => {
    const r = runCheck(
      base({
        [RULES("main")]: rulesOf(PR_RULE(0), RULE("non_fast_forward"), RULE("deletion")),
        [PROTECTION("main")]: classicOf({
          ...CLASSIC_STRONG,
          required_pull_request_reviews: { required_approving_review_count: 0, ...CLASSIC_STALE_ON },
        }),
      }),
    );
    expect(verdictOf(r.stdout, "branch", "main")).toBe("unprotected");
    expect(branchLine(r.stdout)).toContain("requires at least one approving review");
  });

  it("a ruleset that shows every row → protected, and the classic protection endpoint is never called", () => {
    const r = runCheck(base());
    expect(verdictOf(r.stdout, "branch", "main")).toBe("protected");
    expect(r.calls.length).toBeGreaterThan(0);
    for (const c of r.calls) expect(c.join(" ")).not.toContain("branches/main/protection");
  });

  it("a paginated rule list whose first page lacks `deletion`, no classic protection → UNKNOWN - verify, never unprotected", () => {
    const r = runCheck(
      base({
        [RULES("main")]: {
          status: 200,
          body: [PR_RULE(1), RULE("non_fast_forward")],
          link: '<https://api.github.com/x?page=2>; rel="next"',
        },
        [PROTECTION("main")]: NOT_PROTECTED_404,
      }),
    );
    expect(verdictOf(r.stdout, "branch", "main")).toBe("UNKNOWN - verify");
    expect(r.status).toBe(2);
  });

  it("--json publishes floor.branch in table order and one facts entry per row on every branch target", () => {
    const r = runCheck(base({ [BRANCH("master")]: { status: 500, body: { message: "Server Error" } } }), ["--json"]);
    const block = jsonBlock(r.stdout);
    expect(block.floor.branch).toEqual([
      "requires a pull request before merging",
      "requires at least one approving review",
      "dismisses stale approvals when new commits are pushed",
      "requires approval of the most recent push",
      "blocks force pushes",
      "restricts deletions",
      NO_BYPASS,
    ]);
    const branches = block.targets.filter((t) => t.kind === "branch");
    expect(branches.map((t) => t.name).sort()).toEqual(["main", "master"]);
    for (const t of branches) {
      expect(t.facts, `facts on branch ${t.name}`).toBeDefined();
      expect(t.facts!.map((f) => f.requirement)).toEqual(block.floor.branch);
      expect(t.facts!.map((f) => f.id)).toEqual([
        "pull_request",
        "approving_review",
        "stale_dismissal",
        "last_push_approval",
        "no_force_push",
        "no_deletion",
        "no_bypass",
      ]);
      for (const f of t.facts!) {
        expect(["held", "failed", "unknown"]).toContain(f.state);
        expect(typeof f.evidence).toBe("string");
        expect(f.evidence.length).toBeGreaterThan(0);
      }
    }
    // main is protected: every row held. master could not be read: no row held.
    expect(branches.find((t) => t.name === "main")!.facts!.every((f) => f.state === "held")).toBe(true);
    expect(branches.find((t) => t.name === "master")!.facts!.every((f) => f.state === "unknown")).toBe(true);
  });

  it("README drift: the first checklist list under `#### Git-host setup checklist` equals --json floor.branch, both ways", () => {
    const lists = checklistLists();
    const floor = jsonBlock(runCheck(base(), ["--json"]).stdout).floor.branch;
    expect(lists[0].length).toBeGreaterThan(0);
    expect(lists[0]).toEqual(floor);
    expect(floor).toEqual(lists[0]);
  });

  // Each entry weakens ONE floor row on BOTH arms (the ruleset list is read in full and classic
  // protection is otherwise strong, so neither arm can cover for the other). The pull-request row
  // cannot be removed without also removing the approval it carries; the case asserts only on the
  // weakened row, so that coupling does not hide a mutation.
  const STRONG_BOTH_ARMS = (): Fixture =>
    base({
      [RULES("main")]: rulesOf(PR_RULE(1), RULE("non_fast_forward"), RULE("deletion")),
      [PROTECTION("main")]: classicOf(CLASSIC_STRONG),
    });
  const WEAKEN_BRANCH: Record<string, Fixture> = {
    "requires a pull request before merging": {
      [RULES("main")]: rulesOf(RULE("non_fast_forward"), RULE("deletion")),
      [PROTECTION("main")]: classicOf({ enforce_admins: { enabled: true }, allow_force_pushes: { enabled: false }, allow_deletions: { enabled: false } }),
    },
    "requires at least one approving review": {
      [RULES("main")]: rulesOf(PR_RULE(0), RULE("non_fast_forward"), RULE("deletion")),
      [PROTECTION("main")]: classicOf({
        ...CLASSIC_STRONG,
        required_pull_request_reviews: { required_approving_review_count: 0, ...CLASSIC_STALE_ON },
      }),
    },
    // 33.1 D-33 (d): each stale-approval setting off on both arms.
    "dismisses stale approvals when new commits are pushed": {
      [RULES("main")]: rulesOf(
        RULE("pull_request", { required_approving_review_count: 1, ...STALE_ON, dismiss_stale_reviews_on_push: false }),
        RULE("non_fast_forward"),
        RULE("deletion"),
      ),
      [PROTECTION("main")]: classicOf({
        ...CLASSIC_STRONG,
        required_pull_request_reviews: {
          required_approving_review_count: 1,
          ...CLASSIC_STALE_ON,
          dismiss_stale_reviews: false,
          bypass_pull_request_allowances: NO_ALLOWANCES,
        },
      }),
    },
    "requires approval of the most recent push": {
      [RULES("main")]: rulesOf(
        RULE("pull_request", { required_approving_review_count: 1, ...STALE_ON, require_last_push_approval: false }),
        RULE("non_fast_forward"),
        RULE("deletion"),
      ),
      [PROTECTION("main")]: classicOf({
        ...CLASSIC_STRONG,
        required_pull_request_reviews: {
          required_approving_review_count: 1,
          ...CLASSIC_STALE_ON,
          require_last_push_approval: false,
          bypass_pull_request_allowances: NO_ALLOWANCES,
        },
      }),
    },
    "blocks force pushes": {
      [RULES("main")]: rulesOf(PR_RULE(1), RULE("deletion")),
      [PROTECTION("main")]: classicOf({ ...CLASSIC_STRONG, allow_force_pushes: { enabled: true } }),
    },
    "restricts deletions": {
      [RULES("main")]: rulesOf(PR_RULE(1), RULE("non_fast_forward")),
      [PROTECTION("main")]: classicOf({ ...CLASSIC_STRONG, allow_deletions: { enabled: true } }),
    },
    [NO_BYPASS]: {
      [RULESET(1)]: rulesetAnswer(1, "always"),
      [PROTECTION("main")]: classicOf({ ...CLASSIC_STRONG, enforce_admins: { enabled: false } }),
    },
  };

  it("WEAKEN_BRANCH: the both-arms-strong baseline is protected (the weakenings start from a passing state)", () => {
    const r = runCheck(STRONG_BOTH_ARMS(), ["--json"]);
    expect(verdictOf(r.stdout, "branch", "main")).toBe("protected");
  });

  it("WEAKEN_BRANCH: its keys are exactly floor.branch, and weakening any one row turns main away from protected", () => {
    const floor = jsonBlock(runCheck(base(), ["--json"]).stdout).floor.branch;
    expect(Object.keys(WEAKEN_BRANCH).sort()).toEqual([...floor].sort());
    expect(floor.length).toBe(Object.keys(WEAKEN_BRANCH).length);
    for (const requirement of floor) {
      const r = runCheck({ ...STRONG_BOTH_ARMS(), ...WEAKEN_BRANCH[requirement] }, ["--json"]);
      expect(verdictOf(r.stdout, "branch", "main"), `weakened: ${requirement}`).not.toBe("protected");
      expect(factOf(r.stdout, "main", requirement), `fact for weakened row: ${requirement}`).not.toBe("held");
    }
  });
});

// ── CR-01 (plan 33.1-19, D-30): a rule the checked account can bypass shows no row ─────────────
describe("host-protection.js — ruleset bypass (CR-01, D-30)", () => {
  it("the strong fixture reads ruleset 1 once, finds current_user_can_bypass \"never\" → protected, exit 0", () => {
    const r = runCheck(base(), ["--json"]);
    expect(verdictOf(r.stdout, "branch", "main")).toBe("protected");
    expect(rulesetCalls(r.calls)).toEqual([RULESET(1)]);
    expect(factOf(r.stdout, "main", NO_BYPASS)).toBe("held");
    expect(r.status).toBe(0);
  });

  for (const value of ["always", "pull_requests_only", "exempt"]) {
    it(`a ruleset showing every row with current_user_can_bypass "${value}", no classic protection → unprotected, quoting the value`, () => {
      const r = runCheck(
        base({
          [RULES("main")]: rulesOf(...ALL_ROWS_IN(1)),
          [RULESET(1)]: rulesetAnswer(1, value),
          [PROTECTION("main")]: NOT_PROTECTED_404,
        }),
        ["--json"],
      );
      expect(verdictOf(r.stdout, "branch", "main")).toBe("unprotected");
      expect(branchLine(r.stdout)).toContain(NO_BYPASS);
      expect(branchLine(r.stdout)).toContain(`"${value}"`);
      expect(factOf(r.stdout, "main", NO_BYPASS)).toBe("failed");
      expect(factOf(r.stdout, "main", "requires a pull request before merging")).toBe("failed");
      expect(r.status).toBe(1);
    });
  }

  const UNREADABLE_BYPASS: Record<string, unknown> = {
    "the ruleset read answering 404": { status: 404, body: { message: "Not Found" } },
    "a 200 without current_user_can_bypass": rulesetAnswer(1),
    "a 200 with an unrecognized current_user_can_bypass": rulesetAnswer(1, "sometimes"),
    "a 200 with a non-string current_user_can_bypass": rulesetAnswer(1, false),
    "a 200 describing a different ruleset": rulesetAnswer(2, "never"),
    "a 200 that is not an object": { status: 200, body: ["never"] },
  };
  for (const [name, answer] of Object.entries(UNREADABLE_BYPASS)) {
    it(`${name} → UNKNOWN - verify, never protected`, () => {
      const r = runCheck(
        base({
          [RULES("main")]: rulesOf(...ALL_ROWS_IN(1)),
          [RULESET(1)]: answer,
          [PROTECTION("main")]: NOT_PROTECTED_404,
        }),
        ["--json"],
      );
      expect(verdictOf(r.stdout, "branch", "main")).toBe("UNKNOWN - verify");
      expect(factOf(r.stdout, "main", NO_BYPASS)).toBe("unknown");
      expect(r.status).toBe(2);
    });
  }

  const BAD_IDS: Record<string, unknown> = {
    "no ruleset_id": undefined,
    'ruleset_id "1/../x"': "1/../x",
    'ruleset_id "1" (a string)': "1",
    "ruleset_id 0": 0,
    "ruleset_id -1": -1,
    "ruleset_id 1.5": 1.5,
    "ruleset_id 9007199254740993 (not a safe integer)": 9007199254740993,
    "ruleset_id null": null,
  };
  for (const [name, id] of Object.entries(BAD_IDS)) {
    it(`a rule with ${name} shows no row and never becomes a request path`, () => {
      const r = runCheck(
        base({
          [RULES("main")]: rulesOf(...ALL_ROWS_IN(id)),
          [PROTECTION("main")]: NOT_PROTECTED_404,
        }),
        ["--json"],
      );
      expect(verdictOf(r.stdout, "branch", "main")).toBe("UNKNOWN - verify");
      for (const requirement of jsonBlock(r.stdout).floor.branch) {
        expect(factOf(r.stdout, "main", requirement), requirement).toBe("unknown");
      }
      expect(rulesetCalls(r.calls)).toEqual([]);
      for (const c of r.calls) expect(c.join(" ")).not.toMatch(/rulesets\/(?![0-9]+$)/);
      expect(r.status).toBe(2);
    });
  }

  for (const order of [
    [1, 2],
    [2, 1],
  ]) {
    it(`two rulesets with a pull_request rule requiring 1 approval, ${order[0]} first, one "always" and one "never" → the unbypassable one binds`, () => {
      const r = runCheck(
        base({
          [RULES("main")]: rulesOf(
            RULE_IN(order[0], "pull_request", { required_approving_review_count: 1, ...STALE_ON }),
            RULE_IN(order[1], "pull_request", { required_approving_review_count: 1, ...STALE_ON }),
            RULE_IN(2, "non_fast_forward"),
            RULE_IN(2, "deletion"),
          ),
          [RULESET(1)]: rulesetAnswer(1, "always"),
          [RULESET(2)]: rulesetAnswer(2, "never"),
          [PROTECTION("main")]: NOT_PROTECTED_404,
        }),
        ["--json"],
      );
      expect(factOf(r.stdout, "main", "requires a pull request before merging")).toBe("held");
      expect(factOf(r.stdout, "main", "requires at least one approving review")).toBe("held");
      expect(verdictOf(r.stdout, "branch", "main")).toBe("protected");
      expect(r.status).toBe(0);
    });
  }

  it("a binding ruleset requiring 0 approvals and a bypassable one requiring 1 → the approval row fails", () => {
    const r = runCheck(
      base({
        [RULES("main")]: rulesOf(
          RULE_IN(2, "pull_request", { required_approving_review_count: 0, ...STALE_ON }),
          RULE_IN(1, "pull_request", { required_approving_review_count: 1, ...STALE_ON }),
          RULE_IN(2, "non_fast_forward"),
          RULE_IN(2, "deletion"),
        ),
        [RULESET(1)]: rulesetAnswer(1, "always"),
        [RULESET(2)]: rulesetAnswer(2, "never"),
        [PROTECTION("main")]: NOT_PROTECTED_404,
      }),
      ["--json"],
    );
    expect(factOf(r.stdout, "main", "requires at least one approving review")).toBe("failed");
    expect(factOf(r.stdout, "main", NO_BYPASS)).toBe("failed");
    expect(verdictOf(r.stdout, "branch", "main")).toBe("unprotected");
  });

  it("more than 20 distinct rulesets: at most 20 are read, and a row shown only by an unread one is unknown", () => {
    const fx: Fixture = {};
    const rules: Record<string, unknown>[] = [RULE_IN(1, "pull_request", { required_approving_review_count: 1, ...STALE_ON })];
    for (let id = 1; id <= 25; id++) {
      rules.push(RULE_IN(id, "non_fast_forward"));
      fx[RULESET(id)] = rulesetAnswer(id, "never");
    }
    rules.push(RULE_IN(25, "deletion")); // shown only by the 25th ruleset, beyond the cap
    const r = runCheck(base({ ...fx, [RULES("main")]: rulesOf(...rules), [PROTECTION("main")]: NOT_PROTECTED_404 }), ["--json"]);
    expect(rulesetCalls(r.calls).length).toBe(20);
    expect(rulesetCalls(r.calls)).not.toContain(RULESET(21));
    expect(factOf(r.stdout, "main", "blocks force pushes")).toBe("held");
    expect(factOf(r.stdout, "main", "restricts deletions")).toBe("unknown");
    expect(verdictOf(r.stdout, "branch", "main")).toBe("UNKNOWN - verify");
    expect(r.status).toBe(2);
  });

  it("a ruleset shared by two branches is read once per run", () => {
    const r = runCheck(
      base({ [RULES("release")]: { status: 200, body: RULESET_PROTECTED } }),
      ["--branch", "release"],
    );
    expect(verdictOf(r.stdout, "branch", "main")).toBe("protected");
    expect(verdictOf(r.stdout, "branch", "release")).toBe("protected");
    expect(rulesetCalls(r.calls)).toEqual([RULESET(1)]);
  });

  it("floor.branch ends with the qualifier row, and the README checklist names it", () => {
    const floor = jsonBlock(runCheck(base(), ["--json"]).stdout).floor.branch;
    expect(floor[floor.length - 1]).toBe(NO_BYPASS);
    const readme = readFileSync(join(HERE, "..", "..", "install", "README.md"), "utf8");
    expect(readme).toContain(`- [ ] ${NO_BYPASS}.`);
  });
});

// ── CR-01 (plan 33.1-19, D-30): classic protection must bind administrators ─────────────────────
describe("host-protection.js — classic protection bypass (CR-01, D-30)", () => {
  it("classic protection meeting every item but enforce_admins.enabled false, no rules → unprotected, naming administrators", () => {
    const r = runCheck(
      base({ [RULES("main")]: NO_RULES, [PROTECTION("main")]: classicOf({ ...CLASSIC_STRONG, enforce_admins: { enabled: false } }) }),
      ["--json"],
    );
    expect(verdictOf(r.stdout, "branch", "main")).toBe("unprotected");
    expect(branchLine(r.stdout)).toContain("classic protection does not apply to administrators");
    expect(factOf(r.stdout, "main", NO_BYPASS)).toBe("failed");
    for (const requirement of jsonBlock(r.stdout).floor.branch) {
      expect(factOf(r.stdout, "main", requirement), requirement).toBe("failed");
    }
    expect(r.status).toBe(1);
  });

  const UNREADABLE_ADMINS: Record<string, unknown> = {
    "enforce_admins absent": undefined,
    "enforce_admins.enabled a string": { enabled: "true" },
    "enforce_admins.enabled absent": {},
    "enforce_admins a bare boolean": true,
    "enforce_admins null": null,
  };
  for (const [name, value] of Object.entries(UNREADABLE_ADMINS)) {
    it(`classic protection with ${name} → UNKNOWN - verify`, () => {
      const body: Record<string, unknown> = { ...CLASSIC_STRONG };
      if (value === undefined) delete body.enforce_admins;
      else body.enforce_admins = value;
      const r = runCheck(base({ [RULES("main")]: NO_RULES, [PROTECTION("main")]: classicOf(body) }), ["--json"]);
      expect(verdictOf(r.stdout, "branch", "main")).toBe("UNKNOWN - verify");
      expect(factOf(r.stdout, "main", NO_BYPASS)).toBe("unknown");
      expect(r.status).toBe(2);
    });
  }

  const withAllowances = (allowances: unknown): Record<string, unknown> => ({
    ...CLASSIC_STRONG,
    required_pull_request_reviews: { required_approving_review_count: 1, ...CLASSIC_STALE_ON, bypass_pull_request_allowances: allowances },
  });
  const LISTED: Record<string, unknown> = {
    "a listed user": { users: [{ login: "octo-agent" }], teams: [], apps: [] },
    "a listed team": { users: [], teams: [{ slug: "octo-team" }], apps: [] },
    "a listed app": { users: [], teams: [], apps: [{ slug: "octo-app" }] },
    "an allowance object missing `apps`": { users: [], teams: [] },
    "an allowance list that is not an array": { users: "octo-agent", teams: [], apps: [] },
    "an allowance that is an array": [],
    "an allowance that is null": null,
  };
  for (const [name, allowances] of Object.entries(LISTED)) {
    it(`classic protection with ${name} in bypass_pull_request_allowances → UNKNOWN - verify, printing no actor name`, () => {
      const r = runCheck(base({ [RULES("main")]: NO_RULES, [PROTECTION("main")]: classicOf(withAllowances(allowances)) }), ["--json"]);
      expect(verdictOf(r.stdout, "branch", "main")).toBe("UNKNOWN - verify");
      expect(factOf(r.stdout, "main", "requires a pull request before merging")).toBe("unknown");
      expect(factOf(r.stdout, "main", "requires at least one approving review")).toBe("unknown");
      expect(factOf(r.stdout, "main", "blocks force pushes")).toBe("held");
      expect(r.stdout).not.toMatch(/octo-(agent|team|app)/);
      expect(r.status).toBe(2);
    });
  }

  it("classic protection whose bypass allowance lists are all empty → protected", () => {
    const r = runCheck(base({ [RULES("main")]: NO_RULES, [PROTECTION("main")]: classicOf(withAllowances(NO_ALLOWANCES)) }));
    expect(verdictOf(r.stdout, "branch", "main")).toBe("protected");
    expect(r.status).toBe(0);
  });

  // Re-review CR-01 (plan 33.1-22, D-30): an absent allowance key is not readable. It is never
  // evidence that the protection grants no allowance, so the branch is never `protected` on it.
  it("classic protection with no bypass_pull_request_allowances key → UNKNOWN - verify, never protected", () => {
    const r = runCheck(
      base({
        [RULES("main")]: NO_RULES,
        [PROTECTION("main")]: classicOf({ ...CLASSIC_STRONG, required_pull_request_reviews: { required_approving_review_count: 1, ...CLASSIC_STALE_ON } }),
      }),
      ["--json"],
    );
    expect(verdictOf(r.stdout, "branch", "main")).toBe("UNKNOWN - verify");
    expect(factOf(r.stdout, "main", "requires a pull request before merging")).toBe("unknown");
    expect(factOf(r.stdout, "main", "requires at least one approving review")).toBe("unknown");
    expect(factOf(r.stdout, "main", NO_BYPASS)).toBe("unknown");
    expect(factOf(r.stdout, "main", "blocks force pushes")).toBe("held");
    expect(factOf(r.stdout, "main", "restricts deletions")).toBe("held");
    // The evidence says the allowance could not be read, never that the protection grants none.
    expect(branchLine(r.stdout)).toContain("classic protection carries no readable bypass_pull_request_allowances");
    expect(branchLine(r.stdout)).not.toContain("grants no pull request bypass allowance");
    expect(r.status).toBe(2);
  });

  it("a listed allowance counts actors in the evidence, never names them", () => {
    const r = runCheck(
      base({
        [RULES("main")]: NO_RULES,
        [PROTECTION("main")]: classicOf(withAllowances({ users: [{ login: "octo-agent" }, { login: "octo-two" }], teams: [], apps: [] })),
      }),
    );
    expect(branchLine(r.stdout)).toContain("2 actor(s)");
    expect(r.stdout).not.toContain("octo-");
  });
});

// ── 33.1 D-33 (d) and D-31 Q1 (plan 33.1-42): the stale-approval rows and the narrowed line ──────
// Each stale-approval setting is read through ACCEPT.enabledFlag: true held, false failed, anything
// else (absent, null, the string "true", a number) unknown. A branch needs both rows to read
// `protected`. The ruleset arm reads the pull_request rule's parameters; the classic arm reads
// required_pull_request_reviews.
describe("host-protection.js — stale approvals are dismissed and the last push is approved (33.1 D-33 (d))", () => {
  const STALE_ROW = "dismisses stale approvals when new commits are pushed";
  const LAST_PUSH_ROW = "requires approval of the most recent push";
  // [row, ruleset parameter, classic field].
  const SETTINGS: Array<[string, string, string]> = [
    [STALE_ROW, "dismiss_stale_reviews_on_push", "dismiss_stale_reviews"],
    [LAST_PUSH_ROW, "require_last_push_approval", "require_last_push_approval"],
  ];
  const ABSENT = Symbol("absent");
  // [label, value, the row's state, the verdict, the exit code].
  const VALUES: Array<[string, unknown, string, string, number]> = [
    ["false", false, "failed", "unprotected", 1],
    ["absent", ABSENT, "unknown", "UNKNOWN - verify", 2],
    ['the string "true"', "true", "unknown", "UNKNOWN - verify", 2],
    ["null", null, "unknown", "UNKNOWN - verify", 2],
    ["the number 1", 1, "unknown", "UNKNOWN - verify", 2],
  ];
  const withValue = (fields: Record<string, unknown>, key: string, value: unknown): Record<string, unknown> => {
    const out = { ...fields };
    if (value === ABSENT) delete out[key];
    else out[key] = value;
    return out;
  };
  // Ruleset only: the strong rule list with the parameter set, and no classic protection.
  const rulesetOnly = (param: string, value: unknown): Fixture =>
    base({
      [RULES("main")]: rulesOf(
        RULE("pull_request", withValue({ required_approving_review_count: 1, ...STALE_ON }, param, value)),
        RULE("non_fast_forward"),
        RULE("deletion"),
      ),
      [PROTECTION("main")]: NOT_PROTECTED_404,
    });
  // Classic only: no ruleset rule, and strong classic protection with the field set.
  const classicOnly = (field: string, value: unknown, allowances: unknown = NO_ALLOWANCES): Fixture =>
    base({
      [RULES("main")]: NO_RULES,
      [PROTECTION("main")]: classicOf({
        ...CLASSIC_STRONG,
        required_pull_request_reviews: withValue(
          { required_approving_review_count: 1, ...CLASSIC_STALE_ON, bypass_pull_request_allowances: allowances },
          field,
          value,
        ),
      }),
    });

  it("both settings on, on each arm alone → protected, exit 0", () => {
    for (const fx of [base(), rulesetOnly("dismiss_stale_reviews_on_push", true), classicOnly("dismiss_stale_reviews", true)]) {
      const r = runCheck(fx, ["--json"]);
      expect(verdictOf(r.stdout, "branch", "main"), r.stdout).toBe("protected");
      expect(factOf(r.stdout, "main", STALE_ROW)).toBe("held");
      expect(factOf(r.stdout, "main", LAST_PUSH_ROW)).toBe("held");
      expect(r.status).toBe(0);
    }
  });

  for (const [row, param, field] of SETTINGS) {
    for (const [label, value, state, verdict, exit] of VALUES) {
      it(`ruleset only, ${param} ${label} → ${row}: ${state}, main ${verdict}, exit ${exit}`, () => {
        const r = runCheck(rulesetOnly(param, value), ["--json"]);
        expect(factOf(r.stdout, "main", row), r.stdout).toBe(state);
        expect(verdictOf(r.stdout, "branch", "main")).toBe(verdict);
        expect(r.status).toBe(exit);
        for (const [other] of SETTINGS.filter(([o]) => o !== row)) expect(factOf(r.stdout, "main", other), other).toBe("held");
      });
      it(`classic only, required_pull_request_reviews.${field} ${label} → ${row}: ${state}, main ${verdict}, exit ${exit}`, () => {
        const r = runCheck(classicOnly(field, value), ["--json"]);
        expect(factOf(r.stdout, "main", row), r.stdout).toBe(state);
        expect(verdictOf(r.stdout, "branch", "main")).toBe(verdict);
        expect(r.status).toBe(exit);
        for (const [other] of SETTINGS.filter(([o]) => o !== row)) expect(factOf(r.stdout, "main", other), other).toBe("held");
      });
    }
  }

  it("classic only, required_pull_request_reviews absent → both rows failed, like the approval row, exit 1", () => {
    const body: Record<string, unknown> = { ...CLASSIC_STRONG };
    delete body.required_pull_request_reviews;
    const r = runCheck(base({ [RULES("main")]: NO_RULES, [PROTECTION("main")]: classicOf(body) }), ["--json"]);
    expect(factOf(r.stdout, "main", STALE_ROW)).toBe("failed");
    expect(factOf(r.stdout, "main", LAST_PUSH_ROW)).toBe("failed");
    expect(factOf(r.stdout, "main", "requires at least one approving review")).toBe("failed");
    expect(verdictOf(r.stdout, "branch", "main")).toBe("unprotected");
    expect(r.status).toBe(1);
  });

  it("classic only, a bypass allowance listing an actor → both rows unknown (the review-item binding rule), UNKNOWN - verify", () => {
    const r = runCheck(classicOnly("dismiss_stale_reviews", true, { users: [{ login: "octo-agent" }], teams: [], apps: [] }), ["--json"]);
    expect(factOf(r.stdout, "main", STALE_ROW)).toBe("unknown");
    expect(factOf(r.stdout, "main", LAST_PUSH_ROW)).toBe("unknown");
    expect(factOf(r.stdout, "main", "blocks force pushes")).toBe("held");
    expect(verdictOf(r.stdout, "branch", "main")).toBe("UNKNOWN - verify");
    expect(r.stdout).not.toContain("octo-agent");
    expect(r.status).toBe(2);
  });

  it("classic only, enforce_admins.enabled false → both rows failed (bypassable), unprotected", () => {
    const r = runCheck(
      base({ [RULES("main")]: NO_RULES, [PROTECTION("main")]: classicOf({ ...CLASSIC_STRONG, enforce_admins: { enabled: false } }) }),
      ["--json"],
    );
    expect(factOf(r.stdout, "main", STALE_ROW)).toBe("failed");
    expect(factOf(r.stdout, "main", LAST_PUSH_ROW)).toBe("failed");
    expect(verdictOf(r.stdout, "branch", "main")).toBe("unprotected");
  });

  it("union: the ruleset shows stale dismissal only and classic shows last-push approval only → both held, protected", () => {
    const r = runCheck(
      base({
        [RULES("main")]: rulesOf(
          RULE("pull_request", { required_approving_review_count: 1, dismiss_stale_reviews_on_push: true, require_last_push_approval: false }),
          RULE("non_fast_forward"),
          RULE("deletion"),
        ),
        [PROTECTION("main")]: classicOf({
          ...CLASSIC_STRONG,
          required_pull_request_reviews: {
            required_approving_review_count: 1,
            dismiss_stale_reviews: false,
            require_last_push_approval: true,
            bypass_pull_request_allowances: NO_ALLOWANCES,
          },
        }),
      }),
      ["--json"],
    );
    expect(factOf(r.stdout, "main", STALE_ROW)).toBe("held");
    expect(factOf(r.stdout, "main", LAST_PUSH_ROW)).toBe("held");
    expect(verdictOf(r.stdout, "branch", "main"), r.stdout).toBe("protected");
    expect(branchLine(r.stdout)).toContain(`${STALE_ROW} (ruleset)`);
    expect(branchLine(r.stdout)).toContain(`${LAST_PUSH_ROW} (classic protection)`);
    expect(r.status).toBe(0);
  });

  it("union: a bypassable ruleset showing both rows does not show them; classic with both off → unprotected", () => {
    const r = runCheck(
      base({
        [RULESET(1)]: rulesetAnswer(1, "always"),
        [PROTECTION("main")]: classicOf({
          ...CLASSIC_STRONG,
          required_pull_request_reviews: {
            required_approving_review_count: 1,
            dismiss_stale_reviews: false,
            require_last_push_approval: false,
            bypass_pull_request_allowances: NO_ALLOWANCES,
          },
        }),
      }),
      ["--json"],
    );
    expect(factOf(r.stdout, "main", STALE_ROW)).toBe("failed");
    expect(factOf(r.stdout, "main", LAST_PUSH_ROW)).toBe("failed");
    expect(verdictOf(r.stdout, "branch", "main")).toBe("unprotected");
  });

  it("the no-bypass line reads what both arms measure (33.1 D-31 Q1), and floor.branch lists 7 strings equal to README's 7 branch lines", () => {
    const floor = jsonBlock(runCheck(base(), ["--json"]).stdout).floor.branch;
    expect(NO_BYPASS).toBe("does not let the account the agent works under bypass it");
    expect(floor).toHaveLength(7);
    expect(floor[floor.length - 1]).toBe(NO_BYPASS);
    expect(floor.indexOf(STALE_ROW)).toBe(2);
    expect(floor.indexOf(LAST_PUSH_ROW)).toBe(3);
    expect(checklistLists()[0]).toEqual(floor);
    expect(floor.join("\n")).not.toContain("administrators");
  });
});

// The union with bypass taken into account, in both directions (D-30).
describe("host-protection.js — the union matrix with bypass (CR-01, D-30)", () => {
  const CLASSIC_404_NOT_FOUND = { status: 404, body: { message: "Not Found" } };

  it("(a) a binding ruleset shows the pull request and approval, classic (admins enforced) blocks force pushes and deletions → protected", () => {
    const r = runCheck(
      base({
        [RULES("main")]: rulesOf(PR_RULE(1)),
        [PROTECTION("main")]: classicOf({ enforce_admins: { enabled: true }, allow_force_pushes: { enabled: false }, allow_deletions: { enabled: false } }),
      }),
    );
    expect(verdictOf(r.stdout, "branch", "main")).toBe("protected");
    expect(r.status).toBe(0);
  });

  it("(b) a bypassable ruleset showing every item never weakens classic protection that binds → protected", () => {
    const r = runCheck(
      base({
        [RULES("main")]: rulesOf(...ALL_ROWS_IN(1)),
        [RULESET(1)]: rulesetAnswer(1, "always"),
        [PROTECTION("main")]: classicOf(CLASSIC_STRONG),
      }),
      ["--json"],
    );
    expect(verdictOf(r.stdout, "branch", "main")).toBe("protected");
    expect(factOf(r.stdout, "main", NO_BYPASS)).toBe("held");
    expect(r.status).toBe(0);
  });

  it("(c) a binding ruleset showing every item → protected, and the classic protection endpoint is never called", () => {
    const r = runCheck(base({ [RULES("main")]: rulesOf(...ALL_ROWS_IN(1)) }));
    expect(verdictOf(r.stdout, "branch", "main")).toBe("protected");
    // Branch main's classic endpoint is never asked. The environment's branch-policy evidence
    // (plan 33.1-23) reads the listed branch's protection (`branches/hotfix/protection`), not main's.
    for (const c of r.calls) expect(c.join(" ")).not.toContain("branches/main/protection");
    expect(r.status).toBe(0);
  });

  it("(d) a bypassable ruleset showing every item, classic 404 `Branch not protected` → unprotected", () => {
    const r = runCheck(
      base({
        [RULES("main")]: rulesOf(...ALL_ROWS_IN(1)),
        [RULESET(1)]: rulesetAnswer(1, "always"),
        [PROTECTION("main")]: NOT_PROTECTED_404,
      }),
    );
    expect(verdictOf(r.stdout, "branch", "main")).toBe("unprotected");
    expect(r.status).toBe(1);
  });

  it("(e) a binding ruleset with 0 approvals, classic with 1 approval but enforce_admins.enabled false → unprotected", () => {
    const r = runCheck(
      base({
        [RULES("main")]: rulesOf(PR_RULE(0), RULE("non_fast_forward"), RULE("deletion")),
        [PROTECTION("main")]: classicOf({ ...CLASSIC_STRONG, enforce_admins: { enabled: false } }),
      }),
      ["--json"],
    );
    expect(factOf(r.stdout, "main", "requires at least one approving review")).toBe("failed");
    expect(verdictOf(r.stdout, "branch", "main")).toBe("unprotected");
    expect(r.status).toBe(1);
  });

  it("(f) a binding ruleset with 0 approvals, classic 404 `Not Found` and the branch reporting protected → UNKNOWN - verify", () => {
    const r = runCheck(
      base({
        [RULES("main")]: rulesOf(PR_RULE(0), RULE("non_fast_forward"), RULE("deletion")),
        [PROTECTION("main")]: CLASSIC_404_NOT_FOUND,
        [BRANCH("main")]: { status: 200, body: { name: "main", protected: true } },
      }),
    );
    expect(verdictOf(r.stdout, "branch", "main")).toBe("UNKNOWN - verify");
    expect(r.status).toBe(2);
  });

  it("(g) a paginated list whose first page binds every item but deletion, classic 404 `Branch not protected` → UNKNOWN - verify", () => {
    const r = runCheck(
      base({
        [RULES("main")]: { status: 200, body: [PR_RULE(1), RULE("non_fast_forward")], link: '<https://api.github.com/x?page=2>; rel="next"' },
        [PROTECTION("main")]: NOT_PROTECTED_404,
      }),
    );
    expect(verdictOf(r.stdout, "branch", "main")).toBe("UNKNOWN - verify");
    expect(r.status).toBe(2);
  });
});

// ── 33.1 D-31 Q4 (plan 33.1-41): the production environment is not read, by design ──────────────
// The named human chose to narrow the check (q4-narrow-scope): it answers `protected` only for the
// branch checklist, and its environment line always reads `UNKNOWN - verify`, by design, pointing at
// the production checklist in install/README.md §5. The line is not a verdict: the summary and the
// exit code count branch targets only (the exit-code mapping is listed for the human in
// 33.1-41-SUMMARY.md).
const summaryLine = (p: number, u: number, k: number): RegExp =>
  new RegExp(`^HOST-PROTECTION: ${p} protected, ${u} unprotected, ${k} UNKNOWN - verify; production environment not checked \\(UNKNOWN - verify by design\\)$`, "m");
const BY_DESIGN_EVIDENCE = "not read by design (33.1 D-31)";
// The environment answers and the protected-branch list the check read before plan 33.1-41, in the
// shape GitHub returns them. A case serves them to show the check never asks for them.
const OLD_ENVIRONMENTS = {
  status: 200,
  body: {
    total_count: 1,
    environments: [
      {
        name: "production",
        can_admins_bypass: false,
        deployment_branch_policy: { protected_branches: true, custom_branch_policies: false },
        protection_rules: [{ type: "required_reviewers", prevent_self_review: true, reviewers: [{ type: "User", reviewer: { id: 1 } }] }],
      },
    ],
  },
};
const OLD_PROTECTED_LIST = { status: 200, body: [{ name: "main", protected: true }] };
// A path the check no longer asks for: the environments list or the protected-branch list.
const notReadPath = (call: string): boolean => /environments/.test(call) || /branches\?protected=/.test(call);

describe("host-protection.js — the production environment is not read, by design (33.1 D-31 Q4)", () => {
  it("the strong fixture: main protected, the environment line reads UNKNOWN - verify by design, the summary counts the branch only, exit 0", () => {
    const r = runCheck(base());
    expect(verdictOf(r.stdout, "branch", "main")).toBe("protected");
    expect(verdictOf(r.stdout, "environment", "production")).toBe("UNKNOWN - verify");
    const line = envLine(r.stdout);
    expect(line).toContain("not checked by design");
    expect(line).toContain("33.1 D-31");
    expect(line).toContain("install/README.md §5");
    expect(line).toContain("named human");
    expect(r.stdout).toMatch(summaryLine(1, 0, 0));
    // The environment line comes before the summary line.
    const lines = r.stdout.split("\n");
    expect(lines.findIndex((l) => l.startsWith("environment production:"))).toBeLessThan(lines.findIndex((l) => l.startsWith("HOST-PROTECTION:")));
    expect(r.status).toBe(0);
  });

  it("no gh call names the environments list or the protected-branch list, even when the stub would answer them", () => {
    const fx = base({ [ENVS]: OLD_ENVIRONMENTS, [api("repos/{owner}/{repo}/branches?protected=true&per_page=1")]: OLD_PROTECTED_LIST });
    const r = runCheck(fx, ["--json"]);
    const block = jsonBlock(r.stdout);
    const published = block.calls.map((c) => c.join(" "));
    const recorded = r.calls.map((c) => c.join(" "));
    expect(published.length, "the run made gh calls").toBeGreaterThan(0);
    expect(published).toEqual(recorded);
    expect(published.filter(notReadPath), published.join("\n")).toEqual([]);
    expect(verdictOf(r.stdout, "environment", "production")).toBe("UNKNOWN - verify");
    expect(r.status).toBe(0);
  });

  it("the exit code counts branches: unprotected → 1, UNKNOWN - verify → 2, and the environment line is the same in all three", () => {
    const strong = runCheck(base());
    const weak = runCheck(base({ [RULES("main")]: NO_RULES, [PROTECTION("main")]: { status: 404, body: { message: "Branch not protected" } } }));
    const unread = runCheck(base({ [RULES("main")]: { status: 500, body: { message: "Server Error" } }, [PROTECTION("main")]: { status: 500, body: { message: "Server Error" } } }));
    expect(verdictOf(weak.stdout, "branch", "main")).toBe("unprotected");
    expect(weak.stdout).toMatch(summaryLine(0, 1, 0));
    expect(weak.status).toBe(1);
    expect(verdictOf(unread.stdout, "branch", "main")).toBe("UNKNOWN - verify");
    expect(unread.stdout).toMatch(summaryLine(0, 0, 1));
    expect(unread.status).toBe(2);
    expect(strong.status).toBe(0);
    expect(envLine(weak.stdout)).toBe(envLine(strong.stdout));
    expect(envLine(unread.stdout)).toBe(envLine(strong.stdout));
  });

  it("when the host cannot be asked, every branch is UNKNOWN - verify (exit 2) and the environment line is still the by-design line", () => {
    const strong = runCheck(base());
    const r = runCheck(base({ "auth status": { exit: 1 } }));
    expect(r.stdout).toMatch(summaryLine(0, 0, 1));
    expect(envLine(r.stdout)).toBe(envLine(strong.stdout));
    expect(r.status).toBe(2);
  });

  it("--json keeps floor.environment and gives the environment target UNKNOWN - verify with one unknown, by-design fact per row", () => {
    const block = jsonBlock(runCheck(base(), ["--json"]).stdout);
    expect(block.ok).toBe(true);
    expect(block.floor.environment).toEqual([
      ENV_EXISTS,
      "requires at least one reviewer",
      "prevents self-review",
      "does not let administrators bypass its protection rules",
      "allows deployments only from protected branches",
    ]);
    const t = block.targets.find((x) => x.kind === "environment")!;
    expect(t.name).toBe("production");
    expect(t.verdict).toBe("UNKNOWN - verify");
    expect(t.reason).toContain("not checked by design");
    expect(t.facts!.map((f) => f.requirement)).toEqual(block.floor.environment);
    expect(t.facts!.map((f) => f.id)).toEqual(["environment_exists", "required_reviewer", "no_self_review", "no_admin_bypass", "branch_policy"]);
    for (const f of t.facts!) {
      expect(f.state).toBe("unknown");
      expect(f.evidence).toBe(BY_DESIGN_EVIDENCE);
    }
  });

  it("README drift: the second checklist list under `#### Git-host setup checklist` equals --json floor.environment, both ways", () => {
    const lists = checklistLists();
    const floor = jsonBlock(runCheck(base(), ["--json"]).stdout).floor.environment;
    expect(lists[1].length).toBeGreaterThan(0);
    expect(lists[1]).toEqual(floor);
    expect(floor).toEqual(lists[1]);
  });

  it("environment name: --env wins over the config and the default, and the line names the source", () => {
    const cwd = mkTmp();
    mkdirSync(join(cwd, ".grugops"), { recursive: true });
    writeFileSync(join(cwd, ".grugops", "factory.config.json"), JSON.stringify({ environments: ["dev", "prod"] }));
    const r = runCheck(base(), ["--env", "live"], { cwd });
    expect(verdictOf(r.stdout, "environment", "live")).toBe("UNKNOWN - verify");
    expect(envLine(r.stdout, "live")).toContain("--env");
    expect(r.status).toBe(0);
  });

  it("environment name: --env staging names the line, and no gh call asks about it", () => {
    const r = runCheck(base(), ["--env", "staging", "--json"]);
    expect(verdictOf(r.stdout, "environment", "staging")).toBe("UNKNOWN - verify");
    expect(r.calls.map((c) => c.join(" ")).filter(notReadPath)).toEqual([]);
    expect(r.calls.map((c) => c.join(" ")).filter((c) => c.includes("staging"))).toEqual([]);
  });

  it("environment name: the last `environments` entry of .grugops/factory.config.json, before agent-factory/config/factory.config.json", () => {
    const cwd = mkTmp();
    mkdirSync(join(cwd, ".grugops"), { recursive: true });
    mkdirSync(join(cwd, "agent-factory", "config"), { recursive: true });
    writeFileSync(join(cwd, ".grugops", "factory.config.json"), JSON.stringify({ environments: ["dev", "staging", "prod"] }));
    writeFileSync(join(cwd, "agent-factory", "config", "factory.config.json"), JSON.stringify({ environments: ["kit-env"] }));
    const r = runCheck(base(), [], { cwd });
    expect(verdictOf(r.stdout, "environment", "prod")).toBe("UNKNOWN - verify");
    expect(envLine(r.stdout, "prod")).toContain(".grugops/factory.config.json");
  });

  it("environment name: an unparseable first config falls through to agent-factory/config/factory.config.json", () => {
    const cwd = mkTmp();
    mkdirSync(join(cwd, ".grugops"), { recursive: true });
    mkdirSync(join(cwd, "agent-factory", "config"), { recursive: true });
    writeFileSync(join(cwd, ".grugops", "factory.config.json"), "{ not json");
    writeFileSync(join(cwd, "agent-factory", "config", "factory.config.json"), JSON.stringify({ environments: ["dev", "prod"] }));
    const r = runCheck(base(), [], { cwd });
    expect(verdictOf(r.stdout, "environment", "prod")).toBe("UNKNOWN - verify");
    expect(envLine(r.stdout, "prod")).toContain("agent-factory/config/factory.config.json");
  });

  it("environment name: no usable config → the documented default `production`", () => {
    const cwd = mkTmp();
    mkdirSync(join(cwd, ".grugops"), { recursive: true });
    writeFileSync(join(cwd, ".grugops", "factory.config.json"), JSON.stringify({ environments: "prod" }));
    const r = runCheck(base(), [], { cwd });
    expect(verdictOf(r.stdout, "environment", "production")).toBe("UNKNOWN - verify");
    expect(envLine(r.stdout)).toContain("default");
  });
});

describe("host-protection.js — rule list garbage and approval counts (D-30)", () => {
  const PR_ROW = "requires a pull request before merging";
  const APPROVAL_ROW = "requires at least one approving review";

  // Plan 33.1-24 (found by the evidence-field pairs): the null entry names no ruleset and no
  // source, so it may be ruleset 1's rule, and ruleset 1's source agreement cannot be shown. Every
  // row the ruleset shows is unknown now, where plan 33.1-22 kept force pushes held.
  it("a rule list [null, non_fast_forward, deletion] read in full, classic 404 `Branch not protected` → every branch row unknown, UNKNOWN - verify", () => {
    const r = runCheck(
      base({ [RULES("main")]: rulesOf(null, RULE("non_fast_forward"), RULE("deletion")), [PROTECTION("main")]: NOT_PROTECTED_404 }),
      ["--json"],
    );
    expect(factOf(r.stdout, "main", PR_ROW)).toBe("unknown");
    expect(factOf(r.stdout, "main", APPROVAL_ROW)).toBe("unknown");
    expect(factOf(r.stdout, "main", "blocks force pushes")).toBe("unknown");
    expect(factOf(r.stdout, "main", "restricts deletions")).toBe("unknown");
    expect(verdictOf(r.stdout, "branch", "main")).toBe("UNKNOWN - verify");
    expect(branchLine(r.stdout)).toContain("an entry of the rule list is not a readable rule");
    expect(r.status).toBe(2);
  });

  it("a rule list holding an entry whose type is not a string → the rows it could show are unknown, not failed", () => {
    const r = runCheck(
      base({ [RULES("main")]: rulesOf({ type: 7 }, RULE("non_fast_forward"), RULE("deletion")), [PROTECTION("main")]: NOT_PROTECTED_404 }),
      ["--json"],
    );
    expect(factOf(r.stdout, "main", PR_ROW)).toBe("unknown");
    expect(verdictOf(r.stdout, "branch", "main")).toBe("UNKNOWN - verify");
  });

  // [count, approval-row state] on the ruleset arm, with no classic protection.
  const COUNTS: Array<[unknown, string]> = [
    [-1, "unknown"],
    [2 ** 60, "unknown"],
    [0, "failed"],
    [1, "held"],
  ];
  for (const [count, state] of COUNTS) {
    it(`a ruleset approval count of ${String(count)} → the approval row is ${state}`, () => {
      const r = runCheck(
        base({ [RULES("main")]: rulesOf(PR_RULE(count), RULE("non_fast_forward"), RULE("deletion")), [PROTECTION("main")]: NOT_PROTECTED_404 }),
        ["--json"],
      );
      expect(factOf(r.stdout, "main", APPROVAL_ROW)).toBe(state);
    });
  }

  it("a classic approval count of -1 (explicit empty allowance, no rules) → the approval row is unknown, UNKNOWN - verify", () => {
    const r = runCheck(
      base({
        [RULES("main")]: NO_RULES,
        [PROTECTION("main")]: classicOf({
          ...CLASSIC_STRONG,
          required_pull_request_reviews: { required_approving_review_count: -1, ...CLASSIC_STALE_ON, bypass_pull_request_allowances: NO_ALLOWANCES },
        }),
      }),
      ["--json"],
    );
    expect(factOf(r.stdout, "main", APPROVAL_ROW)).toBe("unknown");
    expect(verdictOf(r.stdout, "branch", "main")).toBe("UNKNOWN - verify");
    expect(r.status).toBe(2);
  });

  it("the strong fixture still gives 1 protected, 0 unprotected, 0 UNKNOWN - verify (branches only), exit 0", () => {
    const r = runCheck(base());
    expect(r.stdout).toMatch(summaryLine(1, 0, 0));
    expect(r.status).toBe(0);
  });
});

// ── Plan 33.1-22 red-team round (brief 33.1-GAP-PLANNING-BRIEF.md §3, DC-1, D-30) ──────────────
// A separate agent attacked the committed .js with only the class rules. Each finding below is
// tested as a class, not only at the site it was found: absent, oddly shaped or contradicted by the
// same run is `UNKNOWN - verify`, never `protected`.
const HOSTILE = { toString: 1 }; // JSON-safe; String(HOSTILE) and `${HOSTILE}` throw a TypeError
// A second branch, `weak`, with no ruleset rule and no classic protection: `unprotected`.
const WEAK_BRANCH = { [RULES("weak")]: NO_RULES, [PROTECTION("weak")]: NOT_PROTECTED_404 };
const MAIN_PROTECTION_URL = "https://api.github.com/repos/octo/repo/branches/main/protection";
// A 200 answer from `GET rulesets/1` built from the strong body; `undefined` removes a key.
function rulesetBodyWith(over: Record<string, unknown>): unknown {
  const body: Record<string, unknown> = {
    id: 1,
    target: "branch",
    enforcement: "active",
    source: "octo/repo",
    source_type: "Repository",
    current_user_can_bypass: "never",
  };
  for (const [k, v] of Object.entries(over)) {
    if (v === undefined) delete body[k];
    else body[k] = v;
  }
  return { status: 200, body };
}

describe("host-protection.js — red-team: a ruleset binds only when its body says it is active and targets branches (D-30)", () => {
  it("the strong fixture's ruleset answer carries enforcement \"active\" and target \"branch\", and reads protected", () => {
    const body = (base()[RULESET(1)] as { body: Record<string, unknown> }).body;
    expect(body.enforcement).toBe("active");
    expect(body.target).toBe("branch");
    const r = runCheck(base(), ["--json"]);
    expect(verdictOf(r.stdout, "branch", "main")).toBe("protected");
    expect(r.status).toBe(0);
  });

  // Every enforcement value other than the string "active": the documented other two, other
  // spellings, and absent, null and garbled values.
  const ENFORCEMENT_NOT_ACTIVE: Array<[string, unknown]> = [
    ['"disabled"', "disabled"],
    ['"evaluate"', "evaluate"],
    ['"Active" (other case)', "Active"],
    ['"active " (trailing space)', "active "],
    ['"" (empty)', ""],
    ["absent", undefined],
    ["null", null],
    ["true", true],
    ["1", 1],
    ["{}", {}],
    ['["active"]', ["active"]],
  ];
  for (const [name, value] of ENFORCEMENT_NOT_ACTIVE) {
    it(`a ruleset whose body says enforcement ${name} binds nothing → UNKNOWN - verify, never protected`, () => {
      const r = runCheck(
        base({ [RULESET(1)]: rulesetBodyWith({ enforcement: value }), [PROTECTION("main")]: NOT_PROTECTED_404 }),
        ["--json"],
      );
      expect(verdictOf(r.stdout, "branch", "main")).toBe("UNKNOWN - verify");
      for (const requirement of jsonBlock(r.stdout).floor.branch) {
        expect(factOf(r.stdout, "main", requirement), requirement).toBe("unknown");
      }
      expect(branchLine(r.stdout)).toContain("enforcement");
      expect(r.status).toBe(2);
    });
  }

  const TARGET_NOT_BRANCH: Array<[string, unknown]> = [
    ['"tag"', "tag"],
    ['"push"', "push"],
    ['"repository"', "repository"],
    ['"Branch" (other case)', "Branch"],
    ["absent", undefined],
    ["null", null],
    ["1", 1],
    ['["branch"]', ["branch"]],
  ];
  for (const [name, value] of TARGET_NOT_BRANCH) {
    it(`a ruleset whose body says target ${name} cannot bind for a branch → UNKNOWN - verify, never protected`, () => {
      const r = runCheck(
        base({ [RULESET(1)]: rulesetBodyWith({ target: value }), [PROTECTION("main")]: NOT_PROTECTED_404 }),
        ["--json"],
      );
      expect(verdictOf(r.stdout, "branch", "main")).toBe("UNKNOWN - verify");
      expect(factOf(r.stdout, "main", NO_BYPASS)).toBe("unknown");
      expect(branchLine(r.stdout)).toContain("target");
      expect(r.status).toBe(2);
    });
  }

  it('the red-team case A2: target "tag" with an empty rules list → UNKNOWN - verify', () => {
    const r = runCheck(base({ [RULESET(1)]: rulesetBodyWith({ target: "tag", rules: [] }) }), ["--json"]);
    expect(verdictOf(r.stdout, "branch", "main")).toBe("UNKNOWN - verify");
    expect(r.status).toBe(2);
  });

  it('a bypassable ruleset ("always") that is not active is not read as bypassable either → UNKNOWN - verify, not unprotected', () => {
    const r = runCheck(
      base({
        [RULESET(1)]: rulesetBodyWith({ enforcement: "evaluate", current_user_can_bypass: "always" }),
        [PROTECTION("main")]: NOT_PROTECTED_404,
      }),
      ["--json"],
    );
    expect(verdictOf(r.stdout, "branch", "main")).toBe("UNKNOWN - verify");
    expect(factOf(r.stdout, "main", NO_BYPASS)).toBe("unknown");
  });
});

// Every rule of ruleset 1 (the strong fixture's three) with the given fields changed; `undefined`
// removes a key.
function rulesWithSource(over: Record<string, unknown>, only?: number): unknown {
  return rulesOf(
    ...ALL_ROWS_IN(1).map((rule, i) => {
      if (only !== undefined && i !== only) return rule;
      const out: Record<string, unknown> = { ...rule };
      for (const [k, v] of Object.entries(over)) {
        if (v === undefined) delete out[k];
        else out[k] = v;
      }
      return out;
    }),
  );
}

describe("host-protection.js — red-team: a ruleset binds only when its body's source agrees with the rule list (D-30)", () => {
  it("the strong fixture's ruleset body names the same source and source type as its rules, and reads protected", () => {
    const body = (base()[RULESET(1)] as { body: Record<string, unknown> }).body;
    expect(body.source).toBe("octo/repo");
    expect(body.source_type).toBe("Repository");
    const r = runCheck(base());
    expect(verdictOf(r.stdout, "branch", "main")).toBe("protected");
    expect(r.status).toBe(0);
  });

  it("the red-team case P: the body says source \"someone/else\" (Organization), the rules say octo/repo (Repository) → UNKNOWN - verify", () => {
    const r = runCheck(
      base({ [RULESET(1)]: rulesetBodyWith({ source: "someone/else", source_type: "Organization" }), [PROTECTION("main")]: NOT_PROTECTED_404 }),
      ["--json"],
    );
    expect(verdictOf(r.stdout, "branch", "main")).toBe("UNKNOWN - verify");
    for (const requirement of jsonBlock(r.stdout).floor.branch) {
      expect(factOf(r.stdout, "main", requirement), requirement).toBe("unknown");
    }
    expect(branchLine(r.stdout)).toContain("source");
    expect(r.status).toBe(2);
  });

  // [case, fixture override]: each one side of the pair disagrees, is absent or is garbled.
  const DISAGREE: Array<[string, Fixture]> = [
    ['body source "someone/else"', { [RULESET(1)]: rulesetBodyWith({ source: "someone/else" }) }],
    ["body source absent", { [RULESET(1)]: rulesetBodyWith({ source: undefined }) }],
    ["body source null", { [RULESET(1)]: rulesetBodyWith({ source: null }) }],
    ['body source ""', { [RULESET(1)]: rulesetBodyWith({ source: "" }) }],
    ["body source 1", { [RULESET(1)]: rulesetBodyWith({ source: 1 }) }],
    ["body source {}", { [RULESET(1)]: rulesetBodyWith({ source: {} }) }],
    ['body source_type "Organization"', { [RULESET(1)]: rulesetBodyWith({ source_type: "Organization" }) }],
    ["body source_type null", { [RULESET(1)]: rulesetBodyWith({ source_type: null }) }],
    ["body source_type 1", { [RULESET(1)]: rulesetBodyWith({ source_type: 1 }) }],
    ["body source_type absent while the rules carry one", { [RULESET(1)]: rulesetBodyWith({ source_type: undefined }) }],
    ['rules ruleset_source "someone/else"', { [RULES("main")]: rulesWithSource({ ruleset_source: "someone/else" }) }],
    ["rules ruleset_source absent", { [RULES("main")]: rulesWithSource({ ruleset_source: undefined }) }],
    ["rules ruleset_source null", { [RULES("main")]: rulesWithSource({ ruleset_source: null }) }],
    ['rules ruleset_source_type "Organization"', { [RULES("main")]: rulesWithSource({ ruleset_source_type: "Organization" }) }],
    ["rules ruleset_source_type absent while the body carries one", { [RULES("main")]: rulesWithSource({ ruleset_source_type: undefined }) }],
    ["one rule of the ruleset naming another source than its siblings", { [RULES("main")]: rulesWithSource({ ruleset_source: "someone/else" }, 2) }],
  ];
  for (const [name, over] of DISAGREE) {
    it(`${name} → the ruleset binds nothing, UNKNOWN - verify, never protected`, () => {
      const r = runCheck(base({ ...over, [PROTECTION("main")]: NOT_PROTECTED_404 }), ["--json"]);
      expect(verdictOf(r.stdout, "branch", "main")).toBe("UNKNOWN - verify");
      expect(factOf(r.stdout, "main", NO_BYPASS)).toBe("unknown");
      expect(r.status).toBe(2);
    });
  }

  it("source_type absent on both sides, sources agreeing → still protected (source_type is compared only when present)", () => {
    const r = runCheck(
      base({ [RULESET(1)]: rulesetBodyWith({ source_type: undefined }), [RULES("main")]: rulesWithSource({ ruleset_source_type: undefined }) }),
    );
    expect(verdictOf(r.stdout, "branch", "main")).toBe("protected");
    expect(r.status).toBe(0);
  });

  it('a bypassable ruleset ("always") whose source disagrees is not read as bypassable → UNKNOWN - verify, not unprotected', () => {
    const r = runCheck(
      base({
        [RULESET(1)]: rulesetBodyWith({ source: "someone/else", current_user_can_bypass: "always" }),
        [PROTECTION("main")]: NOT_PROTECTED_404,
      }),
      ["--json"],
    );
    expect(verdictOf(r.stdout, "branch", "main")).toBe("UNKNOWN - verify");
    expect(factOf(r.stdout, "main", NO_BYPASS)).toBe("unknown");
  });

  // Sibling (same class, two endpoints naming one fact): the main/master probe's `protected` and
  // the classic protection endpoint of the same branch.
  it("the probe reports master `protected: false` but its classic protection endpoint answers 200 → master UNKNOWN - verify", () => {
    const r = runCheck(
      base({
        [BRANCH("master")]: { status: 200, body: { name: "master", protected: false } },
        [RULES("master")]: NO_RULES,
        [PROTECTION("master")]: classicOf(CLASSIC_STRONG),
      }),
      ["--json"],
    );
    expect(verdictOf(r.stdout, "branch", "master")).toBe("UNKNOWN - verify");
    for (const requirement of jsonBlock(r.stdout).floor.branch) {
      expect(factOf(r.stdout, "master", requirement), requirement).toBe("unknown");
    }
    expect(r.status).toBe(2);
  });

  it("the probe reports master `protected: true` and its classic protection endpoint answers 200 → master protected", () => {
    const r = runCheck(
      base({
        [BRANCH("master")]: { status: 200, body: { name: "master", protected: true } },
        [RULES("master")]: NO_RULES,
        [PROTECTION("master")]: classicOf(CLASSIC_STRONG),
      }),
    );
    expect(verdictOf(r.stdout, "branch", "master")).toBe("protected");
    expect(r.status).toBe(0);
  });
});

// Plan 33.1-24, found by the evidence-field pairs (host-protection-floor.test.ts section 6, DC-1).
// Breaking a rule entry's `ruleset_source` alone makes the ruleset bind nothing (every branch row
// unknown). Breaking it TOGETHER with the entry's `type` (the entry is then not a readable rule) or
// its `ruleset_id` (the entry then names no ruleset) used to drop the entry from the source check,
// so the ruleset's other rules bound again: more broken input gave a stronger reading. The rule
// now covers every entry of the rule list that does not name another ruleset by a usable id.
describe("host-protection.js — pairs: an entry that may belong to the ruleset must name its source (DC-1, plan 33.1-24)", () => {
  // [case, the one entry's override]: two broken fields together, and the whole-entry shapes.
  const PAIRED: Array<[string, Record<string, unknown>]> = [
    ["type absent + ruleset_source absent", { type: undefined, ruleset_source: undefined }],
    ["type absent + ruleset_source_type absent", { type: undefined, ruleset_source_type: undefined }],
    ["ruleset_id absent + ruleset_source absent", { ruleset_id: undefined, ruleset_source: undefined }],
    ["ruleset_id absent + ruleset_source_type absent", { ruleset_id: undefined, ruleset_source_type: undefined }],
    ['type 7 + ruleset_source 7', { type: 7, ruleset_source: 7 }],
    ['ruleset_id "x" + ruleset_source 7', { ruleset_id: "x", ruleset_source: 7 }],
  ];
  for (const only of [0, 1, 2]) {
    for (const [name, over] of PAIRED) {
      it(`rule ${only}: ${name} → every branch row unknown, UNKNOWN - verify`, () => {
        const r = runCheck(base({ [RULES("main")]: rulesWithSource(over, only), [PROTECTION("main")]: NOT_PROTECTED_404 }), ["--json"]);
        for (const requirement of jsonBlock(r.stdout).floor.branch) {
          expect(factOf(r.stdout, "main", requirement), `${name}: ${requirement}`).toBe("unknown");
        }
        expect(verdictOf(r.stdout, "branch", "main")).toBe("UNKNOWN - verify");
        expect(r.status).toBe(2);
      });
    }
  }

  // An entry that is not an object names no ruleset and no source, like `{}`.
  const WHOLE: Array<[string, unknown]> = [
    ["{}", {}],
    ["null", null],
    ['"x"', "x"],
  ];
  for (const [name, entry] of WHOLE) {
    it(`an entry ${name} beside the ruleset's three rules → every branch row unknown, UNKNOWN - verify`, () => {
      const r = runCheck(base({ [RULES("main")]: rulesOf(...ALL_ROWS_IN(1), entry), [PROTECTION("main")]: NOT_PROTECTED_404 }), ["--json"]);
      for (const requirement of jsonBlock(r.stdout).floor.branch) {
        expect(factOf(r.stdout, "main", requirement), `${name}: ${requirement}`).toBe("unknown");
      }
      expect(r.status).toBe(2);
    });
  }

  // Controls: each field alone keeps its plan 33.1-23 reading.
  it("control: ruleset_id absent alone, source present and agreeing → only the entry's own rows are unknown", () => {
    const r = runCheck(base({ [RULES("main")]: rulesWithSource({ ruleset_id: undefined }, 1), [PROTECTION("main")]: NOT_PROTECTED_404 }), ["--json"]);
    const block = jsonBlock(r.stdout).floor.branch;
    const held = block.filter((req) => factOf(r.stdout, "main", req) === "held");
    // 3 → 5 (plan 33.1-42, 33.1 D-33 (d)): the broken entry is rule 1 (non_fast_forward), so only
    // its row and the qualifier are not held; the pull_request rule now also shows the two
    // stale-approval rows, and deletion its own row.
    expect(held.length, `rows held: ${held.join(", ")}`).toBe(5);
    expect(r.status).toBe(2);
  });

  it("control: the three rules as the strong fixture has them → protected", () => {
    const r = runCheck(base({ [RULES("main")]: rulesWithSource({}), [PROTECTION("main")]: NOT_PROTECTED_404 }));
    expect(verdictOf(r.stdout, "branch", "main")).toBe("protected");
    expect(r.status).toBe(0);
  });

  it("the case table has the pinned size (6 pair shapes × 3 rules, 3 whole-entry shapes)", () => {
    expect(PAIRED.length * 3 + WHOLE.length).toBe(21);
  });
});

// Plan 33.1-24, sibling search for the same shape (DC-1): a check that asks "is there exactly one?"
// over a host list dropped the entries it could not read, so garbling one field of a duplicate
// turned "which one applies is not readable" into a pass. An entry that cannot be read may be the
// duplicate: it is counted unless it provably names something else.
describe("host-protection.js — red-team: a branch the same run saw under another name is UNKNOWN - verify (D-30)", () => {
  it("the red-team case E: master renamed to main (branches/master answers `main`), --branch master → master UNKNOWN - verify, never re-added as a target", () => {
    const r = runCheck(
      base({
        [RULES("main")]: NO_RULES,
        [PROTECTION("main")]: classicOf({ ...CLASSIC_STRONG, url: MAIN_PROTECTION_URL }),
        [BRANCH("master")]: { status: 200, body: { name: "main", protected: true } },
        [RULES("master")]: NO_RULES,
        // No `url` here, so only the same-run rename evidence can keep master from protected.
        [PROTECTION("master")]: classicOf(CLASSIC_STRONG),
      }),
      ["--branch", "master", "--json"],
    );
    expect(verdictOf(r.stdout, "branch", "main")).toBe("protected");
    expect(verdictOf(r.stdout, "branch", "master")).toBe("UNKNOWN - verify");
    expect(branchLine(r.stdout, "master")).toContain("main");
    for (const requirement of jsonBlock(r.stdout).floor.branch) {
      expect(factOf(r.stdout, "master", requirement), requirement).toBe("unknown");
    }
    expect(r.status).toBe(2);
  });

  it("a classic protection body whose url names a different branch's protection endpoint → every row of that branch unknown", () => {
    const r = runCheck(
      base({ [RULES("release")]: NO_RULES, [PROTECTION("release")]: classicOf({ ...CLASSIC_STRONG, url: MAIN_PROTECTION_URL }) }),
      ["--branch", "release", "--json"],
    );
    expect(verdictOf(r.stdout, "branch", "release")).toBe("UNKNOWN - verify");
    for (const requirement of jsonBlock(r.stdout).floor.branch) {
      expect(factOf(r.stdout, "release", requirement), requirement).toBe("unknown");
    }
    expect(r.status).toBe(2);
  });

  // A url that is present but of another shape is not about this branch either.
  const BAD_URLS: Array<[string, unknown]> = [
    ["a number", 5],
    ["null", null],
    ["not a URL", "not a url"],
    ["a protection endpoint with a trailing segment", "https://api.github.com/repos/octo/repo/branches/release/protection/extra"],
    ["the branch endpoint, not its protection", "https://api.github.com/repos/octo/repo/branches/release"],
    ["a malformed percent escape", "https://api.github.com/repos/octo/repo/branches/rel%E0%A4%A/protection"],
  ];
  for (const [name, url] of BAD_URLS) {
    it(`a classic protection body whose url is ${name} → UNKNOWN - verify, never protected`, () => {
      const r = runCheck(
        base({ [RULES("release")]: NO_RULES, [PROTECTION("release")]: classicOf({ ...CLASSIC_STRONG, url }) }),
        ["--branch", "release"],
      );
      expect(verdictOf(r.stdout, "branch", "release")).toBe("UNKNOWN - verify");
    });
  }

  // The comparison is made after percent-decoding, so a branch with `/` or a special character
  // is not falsely made unknown.
  // The fourth element is the `url` the repository answer carries: from the red-team round of plan
  // 33.1-23 on, a protection url must sit under the repository this run asked about (same host,
  // same `/repos/<owner>/<repo>` path, any GHES prefix included).
  const GOOD_URLS: Array<[string, string, string, string]> = [
    ["release/1.0", "release/1.0", "https://api.github.com/repos/octo/repo/branches/release/1.0/protection", "https://api.github.com/repos/octo/repo"],
    ["release/1.0", "release/1.0", "https://api.github.com/repos/octo/repo/branches/release%2F1.0/protection", "https://api.github.com/repos/octo/repo"],
    ["feat#1", "feat%231", "https://api.github.com/repos/octo/repo/branches/feat%231/protection", "https://api.github.com/repos/octo/repo"],
    ["release", "release", "https://ghe.example.com/api/v3/repos/octo/repo/branches/release/protection", "https://ghe.example.com/api/v3/repos/octo/repo"],
  ];
  for (const [name, pathName, url, repoUrl] of GOOD_URLS) {
    it(`a classic protection body whose url names ${url.slice(url.indexOf("/branches/"))} for branch ${name} → protected`, () => {
      const r = runCheck(
        base({
          [REPO]: { status: 200, body: { default_branch: "main", full_name: "octo/repo", url: repoUrl } },
          [RULES(pathName)]: NO_RULES,
          [PROTECTION(pathName)]: classicOf({ ...CLASSIC_STRONG, url }),
        }),
        ["--branch", name],
      );
      expect(verdictOf(r.stdout, "branch", name)).toBe("protected");
      expect(r.status).toBe(0);
    });
  }

  // An ABSENT url is not required: absence says nothing about which branch the body describes, and
  // the check's rename evidence comes from the branches/<b> answer (the main/master probe and the
  // 404 `Not Found` path). Only a url that is present and disagrees is contradicting evidence.
  it("a classic protection body with no url key → still protected (absence of url is not required evidence)", () => {
    const r = runCheck(base({ [RULES("release")]: NO_RULES, [PROTECTION("release")]: classicOf(CLASSIC_STRONG) }), ["--branch", "release"]);
    expect(verdictOf(r.stdout, "branch", "release")).toBe("protected");
    expect(r.status).toBe(0);
  });

  it("404 `Not Found` and branches/<b> answering about another name → every row unknown, including rows the ruleset arm shows", () => {
    const r = runCheck(
      base({
        [RULES("main")]: rulesOf(PR_RULE(1)),
        [PROTECTION("main")]: { status: 404, body: { message: "Not Found" } },
        [BRANCH("main")]: { status: 200, body: { name: "trunk", protected: true } },
      }),
      ["--json"],
    );
    expect(verdictOf(r.stdout, "branch", "main")).toBe("UNKNOWN - verify");
    for (const requirement of jsonBlock(r.stdout).floor.branch) {
      expect(factOf(r.stdout, "main", requirement), requirement).toBe("unknown");
    }
  });
});

describe("host-protection.js — red-team: more than one match in a host list is UNKNOWN - verify, never first-match-wins (D-30)", () => {
  // The environments list and an environment's required_reviewers rules were the two host lists the
  // check selected one entry from; since plan 33.1-41 (33.1 D-31 Q4) it reads neither. What is left
  // of the class is one answer carrying two status lines.
  it("a header block with two HTTP status lines is not read by its first line → UNKNOWN - verify", () => {
    const body = JSON.stringify(RULESET_PROTECTED);
    const r = runCheck(base({ [RULES("main")]: { raw: `HTTP/2.0 200 X\nHTTP/2.0 404 X\nContent-Type: application/json\n\n${body}` } }));
    expect(verdictOf(r.stdout, "branch", "main")).toBe("UNKNOWN - verify");
    expect(r.status).toBe(2);
  });
});

describe("host-protection.js — red-team: a host value that cannot be printed never hides another target's verdict", () => {
  // Every host value the evidence text quotes, set to an object whose toString is not callable.
  // A second branch, `weak`, is unprotected, so the run must exit 1, never the "could not run"
  // exit 2 that would hide it. (Before plan 33.1-41 the unprotected target was the environment,
  // which the check no longer reads, 33.1 D-31.)
  // [where, override, the branch that placement weakens].
  const PLACES: Array<[string, Fixture, string]> = [
    ["a ruleset approval count", { [RULES("main")]: rulesOf(PR_RULE(HOSTILE), RULE("non_fast_forward"), RULE("deletion")) }, "main"],
    ["current_user_can_bypass", { [RULESET(1)]: rulesetBodyWith({ current_user_can_bypass: HOSTILE }) }, "main"],
    ["the ruleset enforcement", { [RULESET(1)]: rulesetBodyWith({ enforcement: HOSTILE }) }, "main"],
    ["the ruleset target", { [RULESET(1)]: rulesetBodyWith({ target: HOSTILE }) }, "main"],
    [
      "a classic approval count",
      {
        [RULES("main")]: NO_RULES,
        [PROTECTION("main")]: classicOf({
          ...CLASSIC_STRONG,
          required_pull_request_reviews: { required_approving_review_count: HOSTILE, ...CLASSIC_STALE_ON, bypass_pull_request_allowances: NO_ALLOWANCES },
        }),
      },
      "main",
    ],
    ["a classic url", { [RULES("main")]: NO_RULES, [PROTECTION("main")]: classicOf({ ...CLASSIC_STRONG, url: HOSTILE }) }, "main"],
    ["classic enforce_admins.enabled", { [RULES("main")]: NO_RULES, [PROTECTION("main")]: classicOf({ ...CLASSIC_STRONG, enforce_admins: { enabled: HOSTILE } }) }, "main"],
    ["a host message", { [RULES("main")]: { status: 500, body: { message: HOSTILE } } }, "main"],
    ["a rule's ruleset_id", { [RULES("main")]: rulesOf(...ALL_ROWS_IN(HOSTILE)) }, "main"],
    ["a branch name answered by the branch endpoint", { [BRANCH("master")]: { status: 200, body: { name: HOSTILE } } }, "master"],
  ];
  for (const [name, over, branch] of PLACES) {
    it(`${name} set to { toString: 1 } → the run still reports the unprotected branch weak, exit 1`, () => {
      const r = runCheck(base({ ...over, ...WEAK_BRANCH }), ["--branch", "weak"]);
      expect(r.stdout).not.toContain("could not run");
      expect(verdictOf(r.stdout, "branch", "weak")).toBe("unprotected");
      expect(verdictOf(r.stdout, "branch", branch)).toBe("UNKNOWN - verify");
      expect(r.status).toBe(1);
    });
  }
});

describe("host-protection.js — red-team: gh's exit status must agree with the HTTP status it printed (D-30)", () => {
  it("the red-team case O: the ruleset read prints a 200 but gh exits 1 → UNKNOWN - verify, never protected", () => {
    const r = runCheck(base({ [RULESET(1)]: { ...(rulesetAnswer(1, "never") as object), exit: 1 } }), ["--json"]);
    expect(verdictOf(r.stdout, "branch", "main")).toBe("UNKNOWN - verify");
    expect(factOf(r.stdout, "main", NO_BYPASS)).toBe("unknown");
    expect(r.status).toBe(2);
  });

  // Every endpoint of the strong fixture, one at a time, with gh's exit status flipped against the
  // HTTP status it printed (a 200 with exit 1, the master 404 with exit 0). Never protected-all.
  const endpoints = Object.keys(base()).filter((k) => k.startsWith("api "));
  // Seven before plan 33.1-41; the protected-branch list, the listed branch's protection and the
  // environments list are no longer asked (33.1 D-31 Q4), so the fixture no longer serves them.
  it("the strong fixture has the four endpoints this class covers (repository, rules, ruleset, master probe)", () => {
    expect(endpoints.length).toBe(4);
  });
  for (const key of endpoints) {
    it(`${key.slice("api --method GET -i ".length)} answering with gh's exit status contradicting its HTTP status → exit 2, never all protected`, () => {
      const fx = base();
      const entry = fx[key] as { status: number };
      fx[key] = { ...entry, exit: entry.status < 400 ? 1 : 0 };
      const r = runCheck(fx);
      expect(r.stdout).toMatch(/UNKNOWN - verify — /);
      expect(r.stdout).not.toMatch(/^HOST-PROTECTION: \d+ protected, 0 unprotected, 0 UNKNOWN - verify;/m);
      expect(r.status).toBe(2);
    });
  }

  it("a 404 printed with gh's usual exit 1 is still read (the master probe omits the branch), exit 0", () => {
    const r = runCheck(base());
    expect(verdictOf(r.stdout, "branch", "master")).toBeUndefined();
    expect(r.status).toBe(0);
  });
});

describe("host-protection.js — when the host cannot be asked, and the result contract", () => {
  it("missing gh (the --gh-script path does not exist) → every target UNKNOWN - verify, exit 2", () => {
    const r = runCheck(base(), [], { ghScript: join(mkTmp(), "no-such-gh.mjs") });
    const lines = targetLines(r.stdout);
    expect(lines.length).toBeGreaterThan(0);
    for (const l of lines) expect(TARGET_LINE.exec(l)?.[3]).toBe("UNKNOWN - verify");
    expect(r.stdout).toContain("gh is not available");
    expect(r.status).toBe(2);
  });

  it("`gh auth status` failing → every target UNKNOWN - verify (the environment line by design), exit 2", () => {
    const r = runCheck(base({ "auth status": { exit: 1 } }), ["--branch", "release"]);
    expect(verdictOf(r.stdout, "environment", "production")).toBe("UNKNOWN - verify");
    expect(verdictOf(r.stdout, "branch", "release")).toBe("UNKNOWN - verify");
    for (const l of targetLines(r.stdout)) expect(TARGET_LINE.exec(l)?.[3]).toBe("UNKNOWN - verify");
    expect(r.stdout).toMatch(summaryLine(0, 0, 2));
    expect(r.status).toBe(2);
  });

  it("`gh auth status` failing → the environment target still carries one unknown fact per floor row", () => {
    const r = runCheck(base({ "auth status": { exit: 1 } }), ["--json"]);
    const block = jsonBlock(r.stdout);
    const facts = envFacts(r.stdout, "production");
    expect(facts.map((f) => f.requirement)).toEqual(block.floor.environment);
    expect(facts.every((f) => f.state === "unknown")).toBe(true);
    expect(r.status).toBe(2);
  });

  it("every call answering HTTP 500 → only UNKNOWN - verify verdicts, exit 2", () => {
    const fx: Fixture = { "auth status": { exit: 0 } };
    for (const k of Object.keys(base())) if (k !== "auth status") fx[k] = { status: 500, body: { message: "Server Error" } };
    for (const b of ["main", "master"]) {
      fx[RULES(b)] = { status: 500, body: {} };
      fx[PROTECTION(b)] = { status: 500, body: {} };
      fx[BRANCH(b)] = { status: 500, body: {} };
    }
    const r = runCheck(fx);
    const lines = targetLines(r.stdout);
    expect(lines.length).toBeGreaterThan(0);
    for (const l of lines) expect(TARGET_LINE.exec(l)?.[3]).toBe("UNKNOWN - verify");
    expect(r.stdout).not.toMatch(/: (protected|unprotected) — /);
    expect(r.status).toBe(2);
  });

  it("a run through the --gh-script test seam says so on stderr, every time", () => {
    const r = runCheck(base());
    expect(r.stderr).toContain("--gh-script test seam in use");
    expect(r.stderr).toContain("these verdicts do not come from gh");
  });

  it("--json adds { ok, targets: [{ kind, name, verdict, reason }], calls } after the human lines", () => {
    const r = runCheck(base(), ["--json"]);
    const lines = r.stdout.trim().split("\n");
    const summaryAt = lines.findIndex((l) => l.startsWith("HOST-PROTECTION:"));
    expect(summaryAt).toBeGreaterThan(-1);
    const block = JSON.parse(lines.slice(summaryAt + 1).join("\n")) as {
      ok: boolean;
      targets: Array<{ kind: string; name: string; verdict: string; reason: string }>;
      calls: string[][];
    };
    expect(block.ok).toBe(true);
    expect(block.targets.map((t) => `${t.kind}:${t.name}:${t.verdict}`)).toEqual([
      "branch:main:protected",
      "environment:production:UNKNOWN - verify",
    ]);
    for (const t of block.targets) expect(typeof t.reason).toBe("string");
    expect(block.calls).toEqual(r.calls);
    expect(r.status).toBe(0);

    const bad = runCheck(base({ [RULES("main")]: NO_RULES, [PROTECTION("main")]: NOT_PROTECTED_404 }), ["--json"]);
    const badLines = bad.stdout.trim().split("\n");
    const at = badLines.findIndex((l) => l.startsWith("HOST-PROTECTION:"));
    expect((JSON.parse(badLines.slice(at + 1).join("\n")) as { ok: boolean }).ok).toBe(false);
    expect(bad.status).toBe(1);
  });
});

// ── Re-review WR-04 (plan 33.1-25, D-19) ────────────────────────────────────────────────────────
// A recorded `protected` must name the repository it is about: gh resolves `{owner}/{repo}` from
// GH_REPO, `gh repo set-default` or the git remotes, so in a fork clone it can be another repository
// than the one the agent pushes to. The check prints `repository <owner>/<name>` from the `full_name`
// of the `repos/{owner}/{repo}` answer, and that name must agree with the same answer's `url`, which
// the protection-url check already compares against (one authority for "which repository this run
// is about"). A run that cannot name the repository, or whose two names disagree, claims nothing
// about any target and asks no further endpoint.
const THIS_REPOSITORY = "https://api.github.com/repos/octo/repo";
const UNNAMED_WHY = "so the check cannot say which repository it inspected";
function firstLine(stdout: string): string {
  return stdout.split("\n")[0] ?? "";
}
function repositoryField(stdout: string): unknown {
  const lines = stdout.trim().split("\n");
  const at = lines.findIndex((l) => l.startsWith("HOST-PROTECTION:"));
  const block = JSON.parse(lines.slice(at + 1).join("\n")) as Record<string, unknown>;
  expect(Object.keys(block).slice(0, 2), "`repository` sits right after `ok`").toEqual(["ok", "repository"]);
  return block.repository;
}

describe("host-protection.js — the report names the repository it inspected (re-review WR-04, D-19)", () => {
  it("the strong fixture: `repository octo/repo` is the first line, before every target line; --json carries it; verdicts and exit 0 unchanged", () => {
    const r = runCheck(base(), ["--json"]);
    const lines = r.stdout.split("\n");
    expect(lines[0]).toBe("repository octo/repo");
    const firstTarget = lines.findIndex((l) => l.startsWith("branch ") || l.startsWith("environment "));
    expect(firstTarget).toBeGreaterThan(0);
    expect(lines.filter((l) => l.startsWith("repository "))).toHaveLength(1);
    expect(repositoryField(r.stdout)).toBe("octo/repo");
    expect(verdictOf(r.stdout, "branch", "main")).toBe("protected");
    expect(verdictOf(r.stdout, "environment", "production")).toBe("UNKNOWN - verify");
    expect(r.stdout).toMatch(summaryLine(1, 0, 0));
    expect(r.status).toBe(0);
  });

  it("a GitHub Enterprise Server url whose path names the same owner/name → named (control)", () => {
    const r = runCheck(base({ [REPO]: { status: 200, body: { default_branch: "main", full_name: "octo/repo", url: "https://ghe.example.com/api/v3/repos/octo/repo" } } }));
    expect(firstLine(r.stdout)).toBe("repository octo/repo");
    expect(r.status).toBe(0);
  });

  // Each is a repository answer from which the check cannot name, with agreement, the repository
  // it answered for. The count is pinned below.
  const UNNAMED: Array<[string, unknown]> = [
    ["full_name absent", { status: 200, body: { default_branch: "main", url: THIS_REPOSITORY } }],
    ["full_name null", { status: 200, body: { default_branch: "main", full_name: null, url: THIS_REPOSITORY } }],
    ["full_name 7", { status: 200, body: { default_branch: "main", full_name: 7, url: THIS_REPOSITORY } }],
    ["full_name an object", { status: 200, body: { default_branch: "main", full_name: {}, url: THIS_REPOSITORY } }],
    ['full_name "a/b/c"', { status: 200, body: { default_branch: "main", full_name: "a/b/c", url: THIS_REPOSITORY } }],
    ['full_name "octo"', { status: 200, body: { default_branch: "main", full_name: "octo", url: THIS_REPOSITORY } }],
    ['full_name ""', { status: 200, body: { default_branch: "main", full_name: "", url: THIS_REPOSITORY } }],
    ["full_name holding a control character", { status: 200, body: { default_branch: "main", full_name: "octo/re\u0007po", url: THIS_REPOSITORY } }],
    ["full_name holding an invisible character", { status: 200, body: { default_branch: "main", full_name: "octo/repo​", url: THIS_REPOSITORY } }],
    ["full_name holding a space", { status: 200, body: { default_branch: "main", full_name: "octo/re po", url: THIS_REPOSITORY } }],
    ['full_name "octo/.."', { status: 200, body: { default_branch: "main", full_name: "octo/..", url: THIS_REPOSITORY } }],
    ["full_name over 200 characters", { status: 200, body: { default_branch: "main", full_name: `o/${"r".repeat(199)}`, url: THIS_REPOSITORY } }],
    ["url absent beside a usable full_name", { status: 200, body: { default_branch: "main", full_name: "octo/repo" } }],
    ["url not a URL beside a usable full_name", { status: 200, body: { default_branch: "main", full_name: "octo/repo", url: "octo/repo" } }],
    ["url naming another repository", { status: 200, body: { default_branch: "main", full_name: "octo/repo", url: "https://api.github.com/repos/other/repo" } }],
    ["url naming another owner", { status: 200, body: { default_branch: "main", full_name: "octo/repo", url: "https://api.github.com/repos/octo/fork" } }],
    ["full_name differing from the url only in case", { status: 200, body: { default_branch: "main", full_name: "Octo/repo", url: THIS_REPOSITORY } }],
    ["a 200 whose body is an array", { status: 200, body: [{ full_name: "octo/repo", url: THIS_REPOSITORY }] }],
    ["HTTP 500", { status: 500, body: { message: "Server Error" } }],
    ["HTTP 404", { status: 404, body: { message: "Not Found" } }],
  ];
  it("the unnamed-repository table has 20 shapes", () => {
    expect(UNNAMED).toHaveLength(20);
  });
  it.each(UNNAMED)("the repository answer: %s → every target UNKNOWN - verify, exit 2, no further endpoint asked", (_label, repoAnswer) => {
    const r = runCheck(base({ [REPO]: repoAnswer }), ["--branch", "release", "--json"]);
    const lines = targetLines(r.stdout);
    expect(lines.map((l) => TARGET_LINE.exec(l)?.slice(1, 3).join(" "))).toEqual([
      "branch (default branch)",
      "branch release",
      "environment production",
    ]);
    for (const l of lines) {
      const m = TARGET_LINE.exec(l);
      expect(m?.[3], l).toBe("UNKNOWN - verify");
      // The branch lines carry the reason; the environment line is the by-design line (33.1 D-31).
      expect(m?.[4], l).toContain(m?.[1] === "branch" ? UNNAMED_WHY : "not checked by design");
    }
    expect(r.stdout).toMatch(summaryLine(0, 0, 2));
    expect(r.status).toBe(2);
    expect(r.calls).toEqual([
      ["auth", "status"],
      ["api", "--method", "GET", "-i", "repos/{owner}/{repo}"],
    ]);
    expect(firstLine(r.stdout)).toMatch(new RegExp(`^repository UNKNOWN - verify — .*${UNNAMED_WHY}`));
    expect(repositoryField(r.stdout)).toBeNull();
    const block = jsonBlock(r.stdout);
    for (const t of block.targets) {
      const floor = t.kind === "branch" ? block.floor.branch : block.floor.environment;
      expect(t.facts?.map((f) => f.requirement), `${t.kind} ${t.name}`).toEqual(floor);
      expect(t.facts?.every((f) => f.state === "unknown"), `${t.kind} ${t.name}`).toBe(true);
    }
  });

  it("`gh auth status` failing → `repository UNKNOWN - verify — <reason>` first, targets unchanged, --json repository null", () => {
    const r = runCheck(base({ "auth status": { exit: 1 } }), ["--json"]);
    expect(firstLine(r.stdout)).toBe("repository UNKNOWN - verify — `gh auth status` failed, so the host could not be asked");
    expect(verdictOf(r.stdout, "branch", "(default branch)")).toBe("UNKNOWN - verify");
    expect(verdictOf(r.stdout, "environment", "production")).toBe("UNKNOWN - verify");
    expect(repositoryField(r.stdout)).toBeNull();
    expect(r.status).toBe(2);
  });

  it("gh missing → `repository UNKNOWN - verify — gh is not available …` first", () => {
    const r = runCheck(base(), [], { ghScript: join(mkTmp(), "no-such-gh.mjs") });
    expect(firstLine(r.stdout)).toBe("repository UNKNOWN - verify — gh is not available on this machine, so the host could not be asked");
    expect(r.status).toBe(2);
  });

  it("a usable, agreeing name but no default_branch → the repository line is printed, and main is still checked", () => {
    const r = runCheck(
      base({
        [REPO]: { status: 200, body: { full_name: "octo/repo", url: THIS_REPOSITORY } },
        [BRANCH("main")]: { status: 200, body: { name: "main" } },
      }),
    );
    expect(firstLine(r.stdout)).toBe("repository octo/repo");
    expect(verdictOf(r.stdout, "branch", "(default branch)")).toBe("UNKNOWN - verify");
    expect(verdictOf(r.stdout, "branch", "main")).toBe("protected");
    expect(verdictOf(r.stdout, "environment", "production")).toBe("UNKNOWN - verify");
    expect(r.status).toBe(2);
  });
});

// Re-review CR-02 (plan 33.1-23) tested the environment's branch-policy row against classic branch
// protection shown in the same run. Plan 33.1-41 (33.1 D-31 Q4) removed that row's reading with the
// rest of the environment evidence, so those cases are gone; the branch floor's own cases stay.
const callsTo = (calls: string[][], fragment: string): number => calls.filter((c) => c.join(" ").includes(fragment)).length;

// ── Red-team round of plan 33.1-23 (brief §3, D-30, DC-1) ───────────────────────────────────────
// Five breaks against the committed .js, each tested here as a class, not as the one case found.
// A fixture with one key removed (the stub then prints nothing and exits 1: not readable).
function without(fx: Fixture, ...keys: string[]): Fixture {
  for (const k of keys) delete fx[k];
  return fx;
}
const answer = (body: unknown, status = 200): unknown => ({ status, body });
const factsOf = (stdout: string, kind: string, name: string): Array<{ id: string; state: string; evidence: string }> =>
  jsonBlock(stdout).targets.find((t) => t.kind === kind && t.name === name)?.facts ?? [];
const NOT_A_RECORD = "is not a branch protection record";
const { enforce_admins: _enforceAdmins, ...STRONG_WITHOUT_ADMINS } = CLASSIC_STRONG;

// Finding 1: every 200 answer of `branches/<b>/protection` that is not a branch protection record.
const NON_RECORDS: Array<[string, unknown]> = [
  ["an empty object", {}],
  ["GitHub's error envelope `Branch not protected`", { message: "Branch not protected" }],
  ["GitHub's error envelope `Not Found`", { message: "Not Found", documentation_url: "https://docs.github.com" }],
  ["a branch object that says protected false", { name: "feat", protected: false }],
  ["a branch object that says protected true", { name: "feat", protected: true, commit: { sha: "abc" } }],
  ["a strong body that also carries an error message", { ...CLASSIC_STRONG, message: "Branch not protected" }],
  ["a strong body that also carries a branch's protected flag", { ...CLASSIC_STRONG, protected: false }],
  ["a strong body without enforce_admins", STRONG_WITHOUT_ADMINS],
  ["enforce_admins null", { ...CLASSIC_STRONG, enforce_admins: null }],
  ["enforce_admins true (not an object)", { ...CLASSIC_STRONG, enforce_admins: true }],
  ["enforce_admins an empty object", { ...CLASSIC_STRONG, enforce_admins: {} }],
  ["enforce_admins.enabled a string", { ...CLASSIC_STRONG, enforce_admins: { enabled: "true" } }],
  ["enforce_admins.enabled null", { ...CLASSIC_STRONG, enforce_admins: { enabled: null } }],
  ["only required_status_checks", { required_status_checks: { strict: true, contexts: [] } }],
  ["only a url", { url: "https://api.github.com/repos/octo/repo/branches/feat/protection" }],
  ["an array holding a strong body", [CLASSIC_STRONG]],
  ["a JSON string", "protected"],
  ["null", null],
  ["a number", 1],
  ["true", true],
];
// Bodies that ARE protection records (GitHub's documented example carries enforce_admins; the schema
// marks no property required, so enforce_admins { enabled: boolean } is what the check requires).
const RECORDS: Array<[string, unknown]> = [
  ["the strong body", CLASSIC_STRONG],
  ["a body with only enforce_admins", { enforce_admins: { enabled: true } }],
  ["a body whose enforce_admins is false", { ...CLASSIC_STRONG, enforce_admins: { enabled: false } }],
  ["a body with the documented name and protection_url fields", { ...CLASSIC_STRONG, name: "feat", protection_url: "https://api.github.com/repos/octo/repo/branches/feat/protection" }],
  ["a body whose url names this branch in this repository", { ...CLASSIC_STRONG, url: "https://api.github.com/repos/octo/repo/branches/feat/protection" }],
];
// --branch feat: no ruleset rule, and `shape` from feat's protection endpoint.
const featRun = (shape: unknown): ReturnType<typeof runCheck> =>
  runCheck(base({ [RULES("feat")]: NO_RULES, [PROTECTION("feat")]: answer(shape) }), ["--branch", "feat", "--json"]);

describe("host-protection.js — red-team 33.1-23 finding 1: classic protection is shown only by a protection record (D-30)", () => {
  it("the shape tables are the pinned size (20 non-records, 5 records)", () => {
    expect(NON_RECORDS.length).toBe(20);
    expect(RECORDS.length).toBe(5);
  });

  it.each(NON_RECORDS)("a --branch's own protection answers %s → every row of that branch unknown (never unprotected)", (_label, shape) => {
    const r = featRun(shape);
    expect(verdictOf(r.stdout, "branch", "feat")).toBe("UNKNOWN - verify");
    const facts = factsOf(r.stdout, "branch", "feat");
    expect(facts.length).toBe(jsonBlock(r.stdout).floor.branch.length);
    for (const f of facts) {
      expect(f.state, f.id).toBe("unknown");
      // The qualifier row carries its own evidence (no item is shown); the item rows quote the arm.
      if (f.id !== "no_bypass") expect(f.evidence, f.id).toContain(NOT_A_RECORD);
    }
  });

  // The branch floor reads a body as a record exactly when ACCEPT.classicProtectionRecord holds it.
  // (Before plan 33.1-41 the environment's branch-policy row read the same predicate; it is no longer
  // read, 33.1 D-31 Q4.)
  it.each([...NON_RECORDS.map(([l, s]) => [`non-record: ${l}`, s, false] as const), ...RECORDS.map(([l, s]) => [`record: ${l}`, s, true] as const)])(
    "record, %s: the branch floor reads it as a record exactly when it is one",
    (_label, shape, isRecord) => {
      const r = featRun(shape);
      const items = factsOf(r.stdout, "branch", "feat").filter((f) => f.id !== "no_bypass");
      // 4 → 6 (plan 33.1-42, 33.1 D-33 (d)): the branch floor's item rows, the two stale-approval
      // rows added.
      expect(items.length).toBe(6);
      expect(items.length).toBe(jsonBlock(r.stdout).floor.branch.length - 1);
      const floorSawRecord = !items.every((f) => f.evidence.includes(NOT_A_RECORD));
      expect(floorSawRecord).toBe(isRecord);
    },
  );

  it("the red-team case c11b: feat's 200 `Branch not protected` envelope is not a record, so feat is not unprotected", () => {
    const r = featRun({ message: "Branch not protected" });
    expect(verdictOf(r.stdout, "branch", "feat")).toBe("UNKNOWN - verify");
    expect(r.status).toBe(2);
  });
});

// Sibling of finding 3: the 404 `Not Found` path's branches/<b> `protected`, read through the same
// ACCEPT entry. A garbled value about THIS branch is not readable; it is not an answer about
// another branch, so the evidence must not say so.
describe("host-protection.js — red-team 33.1-23 sibling: the non-admin path's protected value is read through the one reader (D-30)", () => {
  it.each([["a string", "true"], ["null", null], ["a number", 1]])("branches/main answers protected as %s → main UNKNOWN - verify, not read as another branch", (_label, v) => {
    const r = runCheck(
      base({
        [RULES("main")]: NO_RULES,
        [PROTECTION("main")]: answer({ message: "Not Found" }, 404),
        [BRANCH("main")]: answer({ name: "main", protected: v }),
      }),
      ["--json"],
    );
    expect(verdictOf(r.stdout, "branch", "main")).toBe("UNKNOWN - verify");
    expect(branchLine(r.stdout)).toContain("a protected value this check cannot read");
    expect(branchLine(r.stdout)).not.toContain("not this one");
  });
});

// Sibling of finding 5 (a false `unprotected` the same run contradicts): the probe reads a branch
// protected true, yet its rule list is read in full and empty and its classic endpoint says
// `Branch not protected`. The run disagrees with itself, so the branch is UNKNOWN - verify.
describe("host-protection.js — red-team 33.1-23 sibling: a probed protected-true branch whose arms show nothing is not unprotected (D-30)", () => {
  it("master probed protected true, rules [] and classic 404 `Branch not protected` → master UNKNOWN - verify, not unprotected", () => {
    const r = runCheck(
      base({
        [BRANCH("master")]: answer({ name: "master", protected: true }),
        [RULES("master")]: NO_RULES,
        [PROTECTION("master")]: NOT_PROTECTED_404,
      }),
      ["--json"],
    );
    expect(verdictOf(r.stdout, "branch", "master")).toBe("UNKNOWN - verify");
    expect(branchLine(r.stdout, "master")).toContain("reports protected true");
    expect(r.status).toBe(2);
  });

  it("control: master probed protected false with the same arms → master unprotected", () => {
    const r = runCheck(
      base({
        [BRANCH("master")]: answer({ name: "master", protected: false }),
        [RULES("master")]: NO_RULES,
        [PROTECTION("master")]: NOT_PROTECTED_404,
      }),
      ["--json"],
    );
    expect(verdictOf(r.stdout, "branch", "master")).toBe("unprotected");
    expect(r.status).toBe(1);
  });
});

// Finding 2: every way the main/master probe can fail to show that `master` is a branch.
const MASTER_NOT_SHOWN: Array<[string, unknown]> = [
  ["404 `Branch not found`", answer({ message: "Branch not found" }, 404)],
  ["404 `Not Found`", answer({ message: "Not Found" }, 404)],
  ["404 with no message", answer(null, 404)],
  ["500", answer({ message: "Server Error" }, 500)],
  ["200 naming no branch", answer({ protected: true })],
  ["200 with a numeric name", answer({ name: 5, protected: true })],
  ["200 about another branch (renamed)", answer({ name: "main", protected: true })],
];

describe("host-protection.js — red-team 33.1-23 finding 2: a name the same run did not show to exist is never evidence (D-30)", () => {
  it("the table is the pinned size (7)", () => {
    expect(MASTER_NOT_SHOWN.length).toBe(7);
  });

  it.each(MASTER_NOT_SHOWN)("the probe answers %s, then --branch master (strong rules and body) → master UNKNOWN - verify, nothing asked under that name", (_label, probe) => {
    const r = runCheck(
      base({
        [BRANCH("master")]: probe,
        [RULES("master")]: rulesOf(...ALL_ROWS_IN(1)),
        [PROTECTION("master")]: classicOf(CLASSIC_STRONG),
      }),
      ["--branch", "master", "--json"],
    );
    expect(verdictOf(r.stdout, "branch", "master")).toBe("UNKNOWN - verify");
    for (const f of factsOf(r.stdout, "branch", "master")) expect(f.state, f.id).toBe("unknown");
    expect(callsTo(r.calls, "rules/branches/master")).toBe(0);
    expect(callsTo(r.calls, "branches/master/protection")).toBe(0);
    expect(r.status).toBe(2);
  });

  it("the red-team case d01: master 404 `Branch not found`, --branch master with no rules and a strong body → never protected, never evidence", () => {
    const r = runCheck(base({ [RULES("master")]: NO_RULES, [PROTECTION("master")]: classicOf(CLASSIC_STRONG) }), ["--branch", "master", "--json"]);
    expect(verdictOf(r.stdout, "branch", "master")).toBe("UNKNOWN - verify");
    expect(branchLine(r.stdout, "master")).toContain("HTTP 404 (Branch not found)");
    expect(callsTo(r.calls, "branches/master/protection")).toBe(0);
  });
});

// Finding 3: the probe's own `protected` value, read through one ACCEPT entry. The default branch
// is `trunk` (strong rules), so `main` is judged only because the probe showed it exists.
function trunkWithProbedMain(probe: Record<string, unknown>): Fixture {
  return without(
    base({
      [REPO]: { status: 200, body: { default_branch: "trunk", full_name: "octo/repo", url: "https://api.github.com/repos/octo/repo" } },
      [RULES("trunk")]: rulesOf(...ALL_ROWS_IN(1)),
      [BRANCH("main")]: answer({ name: "main", ...probe }),
      [RULES("main")]: NO_RULES,
      [PROTECTION("main")]: classicOf(CLASSIC_STRONG),
    }),
    STRONG_RULES_KEY,
  );
}
const GARBLED_PROBE: Array<[string, unknown]> = [
  ["false", false],
  ['"false"', "false"],
  ['"true"', "true"],
  ["null", null],
  ["0", 0],
  ["1", 1],
  ["{}", {}],
  ["[]", []],
  ['""', ""],
];

describe("host-protection.js — red-team 33.1-23 finding 3: the probe's protected value is read through the one reader (D-30)", () => {
  it("the table is the pinned size (9)", () => {
    expect(GARBLED_PROBE.length).toBe(9);
  });

  it.each(GARBLED_PROBE)("the probe says main protected %s while main's protection answers a body → main UNKNOWN - verify", (_label, v) => {
    const r = runCheck(trunkWithProbedMain({ protected: v }), ["--json"]);
    expect(verdictOf(r.stdout, "branch", "trunk")).toBe("protected");
    expect(verdictOf(r.stdout, "branch", "main")).toBe("UNKNOWN - verify");
    for (const f of factsOf(r.stdout, "branch", "main")) expect(f.state, f.id).toBe("unknown");
    expect(r.status).toBe(2);
  });

  it("the probe says main protected true → main protected from its classic body", () => {
    const r = runCheck(trunkWithProbedMain({ protected: true }), ["--json"]);
    expect(verdictOf(r.stdout, "branch", "main")).toBe("protected");
    expect(r.status).toBe(0);
  });

  // ABSENT stays neutral: every branch the probe never asked (the default branch, each --branch)
  // has no probe value either, so absence cannot be read as a contradiction
  // without making every such branch unknown. The probe value is only ever a contradiction check,
  // never evidence that a branch is protected.
  it("the probe's answer carries no protected key → neutral: main protected", () => {
    const r = runCheck(trunkWithProbedMain({}), ["--json"]);
    expect(verdictOf(r.stdout, "branch", "main")).toBe("protected");
    expect(r.status).toBe(0);
  });
});

// Finding 4: a protection url must sit under the repository this run asked about. The check's
// paths carry gh's `{owner}/{repo}` placeholders, so the repository is the one the repository
// answer's own `url` names (the same run), never a name the check invents.
const OTHER_PLACE_URLS: Array<[string, string]> = [
  ["another repository", "https://api.github.com/repos/evil/other/branches/B/protection"],
  ["another owner", "https://api.github.com/repos/evil/repo/branches/B/protection"],
  ["another repository name", "https://api.github.com/repos/octo/other/branches/B/protection"],
  ["another host", "http://evil.example/repos/octo/repo/branches/B/protection"],
  ["another scheme", "http://api.github.com/repos/octo/repo/branches/B/protection"],
  ["another port", "https://api.github.com:8443/repos/octo/repo/branches/B/protection"],
  ["a GHES prefix the repository does not have", "https://api.github.com/api/v3/repos/octo/repo/branches/B/protection"],
  ["a query string", "https://api.github.com/repos/octo/repo/branches/B/protection?x=1"],
  ["a fragment", "https://api.github.com/repos/octo/repo/branches/B/protection#x"],
  ["credentials", "https://u:p@api.github.com/repos/octo/repo/branches/B/protection"],
];
const THIS_REPO_URL = (b: string): string => `https://api.github.com/repos/octo/repo/branches/${b}/protection`;

describe("host-protection.js — red-team 33.1-23 finding 4: a protection url must name this run's repository (D-30)", () => {
  it("the table is the pinned size (10)", () => {
    expect(OTHER_PLACE_URLS.length).toBe(10);
  });

  it.each(OTHER_PLACE_URLS)("--branch release whose protection url names %s → UNKNOWN - verify", (_label, url) => {
    const r = runCheck(
      base({ [RULES("release")]: NO_RULES, [PROTECTION("release")]: classicOf({ ...CLASSIC_STRONG, url: url.replace("/B/", "/release/") }) }),
      ["--branch", "release", "--json"],
    );
    expect(verdictOf(r.stdout, "branch", "release")).toBe("UNKNOWN - verify");
    for (const f of factsOf(r.stdout, "branch", "release")) expect(f.state, f.id).toBe("unknown");
  });

  const UNREADABLE_REPO_URLS: Array<[string, unknown]> = [
    ["absent", undefined],
    ["null", null],
    ["a number", 5],
    ["not a URL", "octo/repo"],
    ["not a repository endpoint", "https://api.github.com/users/octo"],
    ["a repository endpoint with a trailing segment", "https://api.github.com/repos/octo/repo/extra"],
  ];
  it.each(UNREADABLE_REPO_URLS)("the repository answer's url is %s and a protection url is present → UNKNOWN - verify", (_label, repoUrl) => {
    const r = runCheck(
      base({
        [REPO]: { status: 200, body: { default_branch: "main", full_name: "octo/repo", ...(repoUrl === undefined ? {} : { url: repoUrl }) } },
        [RULES("release")]: NO_RULES,
        [PROTECTION("release")]: classicOf({ ...CLASSIC_STRONG, url: THIS_REPO_URL("release") }),
      }),
      ["--branch", "release"],
    );
    expect(verdictOf(r.stdout, "branch", "release")).toBe("UNKNOWN - verify");
  });

  // Changed by plan 33.1-25 (re-review WR-04): this case read `protected` while the repository
  // answer carried no url. The run now names its repository only when `full_name` and `url` agree,
  // so a repository answer with no url claims nothing about any target, even when no protection url
  // is present (an absent PROTECTION url stays neutral: "a classic protection body with no url key").
  it("the repository answer carries no url → the run cannot name its repository, so every target is UNKNOWN - verify even with no protection url", () => {
    const r = runCheck(
      base({ [REPO]: { status: 200, body: { default_branch: "main", full_name: "octo/repo" } }, [RULES("release")]: NO_RULES, [PROTECTION("release")]: classicOf(CLASSIC_STRONG) }),
      ["--branch", "release"],
    );
    for (const l of targetLines(r.stdout)) expect(TARGET_LINE.exec(l)?.[3], l).toBe("UNKNOWN - verify");
    expect(verdictOf(r.stdout, "branch", "release")).toBe("UNKNOWN - verify");
    expect(r.status).toBe(2);
  });
});

// ── Red-team of plan 33.1-24 (brief 33.1-GAP-PLANNING-BRIEF.md §3, DC-1) ──────────────────────────
// Three breaks, each tested as a class. B1: a garbled value that is still a string counted as
// "provably another" entry beside the one the check selects (a protection rule's `type`, an
// environment's `name`). B2: first-page-only evidence (a `Link` naming a further page, or an
// environments `total_count` that disagrees with the list). B3: the main/master probe took any
// string name as a rename. B1 and B2's environment cases went with the environment evidence in plan
// 33.1-41 (33.1 D-31 Q4); B2's rule-list case and B3 stay.

// B2: every list endpoint the check reads, taken from its own source (every path literal that asks
// for a page size), each with the effect a further page must have on it.
const HOST_SOURCE = readFileSync(join(HERE, "host-protection.ts"), "utf8");
const LIST_ENDPOINTS: string[] = [...HOST_SOURCE.matchAll(/["`](repos\/\{owner\}\/\{repo\}\/[^"`]*per_page=[^"`]*)["`]/g)].map((m) => m[1]);
const NEXT = "<https://api.github.com/x?page=2>";
const LAST = "<https://api.github.com/x?page=9>";
const NEXT_SPELLINGS: string[] = [
  `${NEXT}; rel="next"`,
  `${NEXT}; rel=next`,
  `${NEXT}; REL="NEXT"`,
  `${NEXT}; rel="prev next"`,
  `${NEXT}; rel="next", ${LAST}; rel="last"`,
  `${LAST}; rel="last", ${NEXT}; rel=next`,
];
const NO_NEXT_SPELLINGS: Array<string | undefined> = [undefined, `${LAST}; rel="last"`, `${LAST}; rel=prev`];
interface ListCase {
  fixture: (link: string | undefined) => Fixture;
  // What a further page must do, and what no further page leaves as it is.
  more: (r: ReturnType<typeof runCheck>) => void;
  none: (r: ReturnType<typeof runCheck>) => void;
}
const withLink = (answer: unknown, link: string | undefined): unknown =>
  link === undefined ? answer : { ...(answer as Record<string, unknown>), link };
const LIST_CASES: Record<string, ListCase> = {
  "repos/{owner}/{repo}/rules/branches/${bp}?per_page=100": {
    // A further page may carry a rule of ruleset 1 whose source disagrees: agreement is not shown.
    fixture: (link) => base({ [RULES("main")]: withLink(STRONG[STRONG_RULES_KEY], link) }),
    more: (r) => {
      expect(verdictOf(r.stdout, "branch", "main")).toBe("UNKNOWN - verify");
      for (const f of factsOf(r.stdout, "branch", "main")) expect(f.state, f.id).toBe("unknown");
      expect(r.status).toBe(2);
    },
    none: (r) => {
      expect(verdictOf(r.stdout, "branch", "main")).toBe("protected");
      expect(r.status).toBe(0);
    },
  },
};

describe("host-protection.js — red-team 33.1-24 B2: a list with a further page is not read whole (DC-1)", () => {
  // Three before plan 33.1-41: the environments list and the protected-branch list are no longer read
  // (33.1 D-31 Q4), so the rule list is the one list endpoint left.
  it("every list endpoint in host-protection.ts has a further-page case (1, derived from the source), and the spelling tables have the pinned sizes", () => {
    console.log(`host-protection list endpoints: ${LIST_ENDPOINTS.join(", ")}`);
    expect(LIST_ENDPOINTS.length).toBe(1);
    expect([...LIST_ENDPOINTS].sort()).toEqual(Object.keys(LIST_CASES).sort());
    expect(NEXT_SPELLINGS.length).toBe(6);
    expect(NO_NEXT_SPELLINGS.length).toBe(3);
  });

  for (const [endpoint, c] of Object.entries(LIST_CASES)) {
    for (const link of NEXT_SPELLINGS) {
      it(`${endpoint} with Link ${JSON.stringify(link)} → not read whole`, () => {
        c.more(runCheck(c.fixture(link), ["--json"]));
      });
    }
    for (const link of NO_NEXT_SPELLINGS) {
      it(`control: ${endpoint} with ${link === undefined ? "no Link" : `Link ${JSON.stringify(link)}`} → read whole`, () => {
        c.none(runCheck(c.fixture(link), ["--json"]));
      });
    }
  }

  it("the red-team case p01: a rule list with a further page, and a strong classic record on main → protected by the classic arm alone", () => {
    const r = runCheck(
      base({ [RULES("main")]: withLink(STRONG[STRONG_RULES_KEY], `${NEXT}; rel="next"`), [PROTECTION("main")]: classicOf(CLASSIC_STRONG) }),
      ["--json"],
    );
    expect(verdictOf(r.stdout, "branch", "main")).toBe("protected");
    expect(branchLine(r.stdout)).not.toContain("(ruleset)");
    expect(r.status).toBe(0);
  });

});

// B3: the main/master probe. Only an answer naming a usable branch that is provably another name
// (not the probed name in another case, no invisible character) is a rename; anything else leaves
// the probed branch not shown to exist, and it is reported UNKNOWN - verify.
const PROBE_NAME_GARBAGE: Array<[string, (b: string) => string]> = [
  ["empty (the red-team case r02)", () => ""],
  ["`..` (r03)", () => ".."],
  ["`-x` (r04)", () => "-x"],
  ["`a b` (r05)", () => "a b"],
  ["a NUL inside the name (r06)", (b) => `${b.slice(0, 2)}\u0000${b.slice(2)}`],
  ["the name capitalised (r07)", (b) => `${b[0].toUpperCase()}${b.slice(1)}`],
  ["the name in upper case", (b) => b.toUpperCase()],
  ["the name with a zero-width space", (b) => `${b}\u200b`],
  ["the name with a trailing slash", (b) => `${b}/`],
  ["the name with a `..` segment", (b) => `${b}/../x`],
];
describe("host-protection.js — red-team 33.1-24 B3: the probe's answered name is a rename only when it is a usable, provably other name (DC-1)", () => {
  it("the table has the pinned size (10)", () => {
    expect(PROBE_NAME_GARBAGE.length).toBe(10);
  });
  it.each(PROBE_NAME_GARBAGE)("branches/master answers 200 with a name that is %s → master UNKNOWN - verify, never dropped as renamed", (_label, garble) => {
    const r = runCheck(base({ [BRANCH("master")]: answer({ name: garble("master"), protected: false }) }), ["--json"]);
    expect(verdictOf(r.stdout, "branch", "master")).toBe("UNKNOWN - verify");
    expect(branchLine(r.stdout, "master")).not.toContain("answered as branch");
    expect(r.status).toBe(2);
  });
  it.each(PROBE_NAME_GARBAGE)("the probe of main (default branch trunk) answers 200 with a name that is %s → main UNKNOWN - verify", (_label, garble) => {
    const r = runCheck(
      without(
        base({
          [REPO]: { status: 200, body: { default_branch: "trunk", full_name: "octo/repo", url: "https://api.github.com/repos/octo/repo" } },
          [RULES("trunk")]: rulesOf(...ALL_ROWS_IN(1)),
          [BRANCH("main")]: answer({ name: garble("main"), protected: false }),
        }),
        STRONG_RULES_KEY,
      ),
      ["--json"],
    );
    expect(verdictOf(r.stdout, "branch", "main")).toBe("UNKNOWN - verify");
    expect(r.status).toBe(2);
  });
  it("control: branches/master answers 200 about main (a real rename) → master is not a target, exit 0", () => {
    const r = runCheck(base({ [BRANCH("master")]: answer({ name: "main", protected: true }) }));
    expect(verdictOf(r.stdout, "branch", "master")).toBeUndefined();
    expect(r.status).toBe(0);
  });
});

// Sibling of B1/B3 (the sibling search of the red-team fixes): every other host-supplied branch name
// the check names in a verdict or puts in a REST path goes through usableBranch(), which refused
// control characters and spaces but let an invisible or format character through. A branch name
// with one is not a plain name: the default branch's name and the protected-branch list's element
// are never judged or taken as evidence under it.
const INVISIBLE_IN_BRANCH: Array<[string, string]> = [
  ["a zero-width space", "\u200b"],
  ["a soft hyphen", "\u00ad"],
  ["a byte-order mark", "\ufeff"],
  ["a right-to-left override", "\u202e"],
  ["a word joiner", "\u2060"],
  ["a private-use character", "\ue000"],
];
const encodedBranch = (name: string): string => name.split("/").map(encodeURIComponent).join("/");
function trunkNamed(name: string): Fixture {
  return without(
    base({
      [REPO]: { status: 200, body: { default_branch: name, full_name: "octo/repo", url: "https://api.github.com/repos/octo/repo" } },
      [RULES(encodedBranch(name))]: rulesOf(...ALL_ROWS_IN(1)),
      [BRANCH("main")]: answer({ message: "Branch not found" }, 404),
    }),
    STRONG_RULES_KEY,
  );
}
describe("host-protection.js — red-team 33.1-24 sibling: a host branch name with an invisible or format character is not a plain name (DC-1)", () => {
  it("the table has the pinned size (6)", () => {
    expect(INVISIBLE_IN_BRANCH.length).toBe(6);
  });
  it.each(INVISIBLE_IN_BRANCH)("the default branch is named trunk with %s, and that name's rules show every row → that target UNKNOWN - verify, exit 2", (_label, ch) => {
    const r = runCheck(trunkNamed(`trunk${ch}`), ["--json"]);
    // Changed by the red-team round of plan 33.1-25 (B4): the printed name writes a format or
    // invisible character as a visible escape, so the one trunk line is found by its plain prefix.
    const trunkLines = targetLines(r.stdout).filter((l) => l.startsWith("branch trunk"));
    expect(trunkLines).toHaveLength(1);
    expect(TARGET_LINE.exec(trunkLines[0])?.[3]).toBe("UNKNOWN - verify");
    expect(callsTo(r.calls, "rules/branches/trunk%")).toBe(0);
    expect(r.status).toBe(2);
  });
  it("control: a plain default branch name, ASCII or not (trunk, tr\u00fcnk) → protected, exit 0", () => {
    for (const name of ["trunk", "tr\u00fcnk"]) {
      const r = runCheck(trunkNamed(name));
      expect(verdictOf(r.stdout, "branch", name), name).toBe("protected");
      expect(r.status, name).toBe(0);
    }
  });
});

// ── Brief DC-3 (plan 33.1-25): the config read is bounded to regular files ───────────────────────
// environmentName reads the user's factory.config.json candidates, the host check's only reads of a
// user-controlled path. A FIFO, a directory or a character device at a candidate must be skipped as
// unreadable (the name falls through to the next source), never block the run; a regular file above
// the size bound is skipped too. The path set is taken from environmentName's own candidate list in
// the syntax tree, never typed here.
const CHECK_TS = join(HERE, "host-protection.ts");
function configCandidates(): string[] {
  const sf = ts.createSourceFile(CHECK_TS, readFileSync(CHECK_TS, "utf8"), ts.ScriptTarget.Latest, true);
  const found: string[][] = [];
  const visit = (node: ts.Node, inside: boolean): void => {
    const here = inside || (ts.isFunctionDeclaration(node) && node.name?.text === "environmentName");
    if (here && ts.isForOfStatement(node) && ts.isArrayLiteralExpression(node.expression)) {
      const els = node.expression.elements;
      if (els.every((e) => ts.isStringLiteral(e))) found.push(els.map((e) => (e as ts.StringLiteral).text));
    }
    ts.forEachChild(node, (c) => visit(c, here));
  };
  visit(sf, false);
  expect(found, "environmentName has exactly one for…of over a literal list of candidate paths").toHaveLength(1);
  return found[0];
}
const CONFIG_CANDIDATES = configCandidates();
const DEFAULT_SOURCE = "the documented default";
const sourceOf = (rel: string): string => `the last "environments" entry of ${rel}`;
const CONFIG_BOUND = 1024 * 1024;

// Like runCheck, with a 20 s bound: a hang is a finding, never a stalled suite.
function runBounded(cwd: string): { error: Error | undefined; signal: NodeJS.Signals | null; status: number | null; stdout: string } {
  const scratch = mkTmp();
  const fixturePath = join(scratch, "fixture.json");
  const logPath = join(scratch, "calls.log");
  writeFileSync(fixturePath, JSON.stringify(base()));
  const r = spawnSync("node", [CHECK_JS, "--gh-script", GH_STUB], {
    encoding: "utf8",
    cwd,
    timeout: 20_000,
    killSignal: "SIGKILL",
    env: { ...process.env, GH_STUB_FIXTURE: fixturePath, GH_STUB_LOG: logPath },
  });
  if (existsSync(logPath)) {
    for (const l of readFileSync(logPath, "utf8").split("\n")) if (l.length > 0) ALL_CALLS.push(JSON.parse(l) as string[]);
  }
  return { error: r.error, signal: r.signal, status: r.status, stdout: r.stdout ?? "" };
}
function environmentLine(stdout: string): string {
  return targetLines(stdout).find((l) => l.startsWith("environment ")) ?? "";
}
function writeConfig(cwd: string, rel: string, name: string): void {
  mkdirSync(dirname(join(cwd, rel)), { recursive: true });
  writeFileSync(join(cwd, rel), JSON.stringify({ environments: [name] }));
}
// The kind of what sits at a path, without following a symlink.
function kindAt(p: string): string {
  const st = lstatSync(p);
  return st.isFIFO() ? "fifo" : st.isDirectory() ? "directory" : st.isSymbolicLink() ? "symlink" : st.isFile() ? "file" : "other";
}

// Each special shape: how to make it (or why this platform cannot), and its kind once made.
interface SpecialShape {
  name: string;
  kind: string;
  make: (at: string) => string | undefined; // undefined when made, else the skip reason
}
const SPECIAL_SHAPES: SpecialShape[] = [
  {
    name: "a FIFO",
    kind: "fifo",
    // Through the platform-shape corpus's own constructor (plan 33-05): `mkfifo` followed by
    // `isFIFO()`, so a host that cannot make one (win32, no mkfifo) prints a counted skip.
    make: (at) => {
      const skipped = stageShapeOrSkip("FIFO", at, `scripts/runnable-ref/host-protection.test.ts: ${at}`);
      return skipped === null ? undefined : skipLine(skipped, "the directory and character-device cases at the same path");
    },
  },
  { name: "a directory", kind: "directory", make: (at) => (mkdirSync(at, { recursive: true }), undefined) },
  {
    name: "a symlink to a character device (/dev/zero)",
    kind: "symlink",
    make: (at) => {
      if (process.platform === "win32" || !existsSync("/dev/zero")) return "/dev/zero is not present on this platform";
      symlinkSync("/dev/zero", at);
      return undefined;
    },
  },
];

describe("host-protection.js — brief DC-3: a config candidate that is not a regular file is skipped, never read (plan 33.1-25)", () => {
  it("the candidate paths come from environmentName's own list, and there are exactly 2", () => {
    console.log(`environmentName config candidates (from the syntax tree): ${CONFIG_CANDIDATES.join(", ")}`);
    expect(CONFIG_CANDIDATES).toHaveLength(2);
  });

  // For the candidate at index i, every LATER candidate holds a valid config naming `production`,
  // and no earlier one exists, so the unreadable path is the one the check reaches first and the
  // environment line names the next source (the later candidate, or the documented default).
  const expectedSource = (i: number): string => (i + 1 < CONFIG_CANDIDATES.length ? sourceOf(CONFIG_CANDIDATES[i + 1]) : DEFAULT_SOURCE);
  const stage = (i: number): string => {
    const cwd = mkTmp();
    for (const later of CONFIG_CANDIDATES.slice(i + 1)) writeConfig(cwd, later, "production");
    mkdirSync(dirname(join(cwd, CONFIG_CANDIDATES[i])), { recursive: true });
    return cwd;
  };
  const cases = CONFIG_CANDIDATES.flatMap((rel, i) => SPECIAL_SHAPES.map((shape) => [rel, i, shape] as const));
  it("the special-file table covers every derived path with every shape (2 × 3)", () => {
    expect(cases).toHaveLength(CONFIG_CANDIDATES.length * 3);
  });
  for (const [rel, i, shape] of cases) {
    it(`${rel} holding ${shape.name}: the run finishes within 20 s, the file is untouched, and the name falls through`, (ctx) => {
      const cwd = stage(i);
      const at = join(cwd, rel);
      const skip = shape.make(at);
      if (skip !== undefined) {
        console.log(`SKIP ${shape.name} at ${rel}: ${skip}`);
        ctx.skip();
        return;
      }
      const r = runBounded(cwd);
      expect(r.error, `the check did not finish: ${r.error?.message}`).toBeUndefined();
      expect(r.signal).toBeNull();
      expect(kindAt(at), "the special file is still there, and unchanged in kind").toBe(shape.kind);
      expect(environmentLine(r.stdout)).toContain(`environment name from ${expectedSource(i)}`);
      expect(r.status).toBe(0);
    }, 30_000);
  }

  it.each(CONFIG_CANDIDATES.map((rel, i) => [rel, i] as const))("%s holding a regular file above the 1 MiB bound: skipped as unreadable, the name falls through", (rel, i) => {
    const cwd = stage(i);
    const at = join(cwd, rel);
    // Valid JSON naming `big`: read, it would name the environment `big`.
    const body = JSON.stringify({ environments: ["big"], pad: "x".repeat(CONFIG_BOUND) });
    writeFileSync(at, body);
    expect(statSync(at).size).toBeGreaterThan(CONFIG_BOUND);
    const r = runBounded(cwd);
    expect(r.error).toBeUndefined();
    expect(environmentLine(r.stdout)).toContain(`environment name from ${expectedSource(i)}`);
    expect(environmentLine(r.stdout)).not.toMatch(/^environment big:/);
    expect(statSync(at).size).toBe(Buffer.byteLength(body));
  }, 30_000);

  // Controls: a regular file, and a symlink to one, within the bound ARE read, so the skips above
  // are about the file's kind and size and nothing else.
  it.each(CONFIG_CANDIDATES.map((rel, i) => [rel, i] as const))("%s holding a regular config within the bound → read (control)", (rel, i) => {
    const cwd = stage(i);
    writeConfig(cwd, rel, "production");
    const r = runBounded(cwd);
    expect(environmentLine(r.stdout)).toContain(`environment name from ${sourceOf(rel)}`);
    expect(r.status).toBe(0);
  }, 30_000);
  it.each(CONFIG_CANDIDATES.map((rel, i) => [rel, i] as const))("%s as a symlink to a regular config → read (control)", (rel, i) => {
    const cwd = stage(i);
    const target = join(cwd, "real-config.json");
    writeFileSync(target, JSON.stringify({ environments: ["production"] }));
    symlinkSync(target, join(cwd, rel));
    const r = runBounded(cwd);
    expect(environmentLine(r.stdout)).toContain(`environment name from ${sourceOf(rel)}`);
    expect(r.status).toBe(0);
  }, 30_000);
});

// ── Red-team round of plan 33.1-25 (brief §3, DC-1, DC-3) ────────────────────────────────────────
// Four breaks against the committed .js, each tested here as a class, not as the one case found:
// B1  a ruleset's `source` was only compared between the rule list and the ruleset body, never with
//     the repository the run proved (repositoryIdentity), and no other host field that names a
//     repository (an environment's url and html_url, the protected-branch list's protection_url)
//     was compared with it either;
// B3  the repository url was compared only in its WHATWG-normalised form, so a garbled string that
//     normalises to this repository (tabs, controls, backslashes, dot segments, a bare `?`) or one
//     on any host, under any path prefix, over http, named the repository;
// B4  printable() let format characters (bidi controls) and line/paragraph separators through;
// B2  the config read opened a path before it knew its type, so a writer blocked on a FIFO there
//     was released (and then died).

// Every rule of ruleset 1 and the ruleset's own body naming `source` and `source_type` (undefined
// removes the key on both sides), with main's classic arm reporting no classic protection, so only
// the ruleset can show main's rows.
function sourcedAs(source: string, type: string | undefined): Fixture {
  return base({
    [RULES("main")]: rulesWithSource({ ruleset_source: source, ruleset_source_type: type }),
    [RULESET(1)]: rulesetBodyWith({ source, source_type: type }),
    [PROTECTION("main")]: NOT_PROTECTED_404,
  });
}
// [case, source, source_type]: both sides agree, and the agreed source does not name the repository
// this run proved (octo/repo, owner octo).
const SOURCE_NOT_THIS_REPOSITORY: Array<[string, string, string | undefined]> = [
  ["another repository (the red-team case)", "evil/other", "Repository"],
  ["this repository in another case", "Octo/Repo", "Repository"],
  ["this repository's owner alone, typed Repository", "octo", "Repository"],
  ["this repository with a trailing segment", "octo/repo/x", "Repository"],
  ["this repository with a trailing space", "octo/repo ", "Repository"],
  ["this repository with a right-to-left override", "octo/repo‮", "Repository"],
  ["another organization", "evil", "Organization"],
  ["this owner in another case, typed Organization", "Octo", "Organization"],
  ["this repository's full name, typed Organization", "octo/repo", "Organization"],
  ["an Enterprise source naming this owner", "octo", "Enterprise"],
  ["an Enterprise source naming this repository", "octo/repo", "Enterprise"],
  ["a source type in another case", "octo/repo", "repository"],
  ["an undocumented source type", "octo/repo", "User"],
  ["no source type on either side, naming this owner alone", "octo", undefined],
  ["no source type on either side, naming another repository", "evil/other", undefined],
];
const SOURCE_THIS_REPOSITORY: Array<[string, string, string | undefined]> = [
  ["this repository", "octo/repo", "Repository"],
  ["this repository's owner, typed Organization", "octo", "Organization"],
  ["this repository, no source type on either side", "octo/repo", undefined],
];

describe("host-protection.js — red-team 33.1-25 B1: a ruleset's source must name the repository this run proved (DC-1)", () => {
  it("the tables have the pinned sizes (15 contradicting, 3 controls)", () => {
    expect(SOURCE_NOT_THIS_REPOSITORY).toHaveLength(15);
    expect(SOURCE_THIS_REPOSITORY).toHaveLength(3);
  });

  it("the red-team case as found: every rule and the body name evil/other (Repository), main has no classic answer → main UNKNOWN - verify, exit 2", () => {
    const fx = base({
      [RULES("main")]: rulesWithSource({ ruleset_source: "evil/other" }),
      [RULESET(1)]: rulesetBodyWith({ source: "evil/other" }),
    });
    const r = runCheck(fx, ["--json"]);
    expect(firstLine(r.stdout)).toBe("repository octo/repo");
    expect(verdictOf(r.stdout, "branch", "main")).toBe("UNKNOWN - verify");
    for (const f of factsOf(r.stdout, "branch", "main")) expect(f.state, f.id).toBe("unknown");
    expect(r.status).toBe(2);
  });

  it.each(SOURCE_NOT_THIS_REPOSITORY)("the ruleset's source is %s (%s, %s) on both sides → UNKNOWN - verify, every main row unknown, exit 2", (_label, source, type) => {
    const r = runCheck(sourcedAs(source, type), ["--json"]);
    expect(firstLine(r.stdout)).toBe("repository octo/repo");
    expect(verdictOf(r.stdout, "branch", "main")).toBe("UNKNOWN - verify");
    for (const f of factsOf(r.stdout, "branch", "main")) expect(f.state, f.id).toBe("unknown");
    expect(r.status).toBe(2);
  });

  it.each(SOURCE_THIS_REPOSITORY)("control: the ruleset's source is %s (%s, %s) → main protected, exit 0", (_label, source, type) => {
    const r = runCheck(sourcedAs(source, type));
    expect(verdictOf(r.stdout, "branch", "main")).toBe("protected");
    expect(r.status).toBe(0);
  });

  it("the strong ruleset (source octo/repo) under a run that proved ANOTHER repository (acme/app) → main UNKNOWN - verify", () => {
    const r = runCheck(
      base({ [REPO]: { status: 200, body: { default_branch: "main", full_name: "acme/app", url: "https://api.github.com/repos/acme/app" } } }),
      ["--json"],
    );
    expect(firstLine(r.stdout)).toBe("repository acme/app");
    expect(verdictOf(r.stdout, "branch", "main")).toBe("UNKNOWN - verify");
    expect(r.status).toBe(2);
  });

  it("control: the same run proving acme/app with a ruleset whose source is acme/app → main protected", () => {
    const r = runCheck({
      ...sourcedAs("acme/app", "Repository"),
      [REPO]: { status: 200, body: { default_branch: "main", full_name: "acme/app", url: "https://api.github.com/repos/acme/app" } },
    });
    expect(verdictOf(r.stdout, "branch", "main")).toBe("protected");
    expect(r.status).toBe(0);
  });
});

// B1 siblings: every other host field that names a repository. The environment entries' `url` and
// `html_url` and the protected-branch list's `protection_url` were compared here until plan 33.1-41;
// the check no longer reads those answers (33.1 D-31 Q4). The repository answer's own names and the
// branch answers' `protection_url` stay, below.

// B1 siblings found by the executor's own search of the answers the check reads: the repository
// answer's `name`, `owner.login` and `html_url` restate the identity; a branch answer's
// `protection_url` (the main/master probe, and the non-admin path's `branches/<b>`) names the branch's
// protection endpoint. Absent is neutral; present and naming another repository, owner or branch, or
// unreadable, contradicts the same run.
const REPO_ANSWER_CONTRADICTING: Array<[string, Record<string, unknown>]> = [
  ["name naming another repository", { name: "other" }],
  ["name in another case", { name: "Repo" }],
  ["name a number", { name: 7 }],
  ["owner.login naming another owner", { owner: { login: "evil" } }],
  ["owner.login in another case", { owner: { login: "Octo" } }],
  ["owner not an object", { owner: "octo" }],
  ["html_url naming another repository", { html_url: "https://github.com/evil/other" }],
  ["html_url on the API host", { html_url: "https://api.github.com/octo/repo" }],
  ["html_url not canonical (a tab inside)", { html_url: "https://github.com/octo/re\tpo" }],
];
const OTHER_PROTECTION = (b: string): string => `https://api.github.com/repos/evil/other/branches/${b}/protection`;

describe("host-protection.js — red-team 33.1-25 B1 siblings: the repository answer's other names and the branch answers' protection_url (DC-1)", () => {
  it("the table has the pinned size (9)", () => {
    expect(REPO_ANSWER_CONTRADICTING).toHaveLength(9);
  });

  it.each(REPO_ANSWER_CONTRADICTING)("the repository answer's %s → the repository is not named, every target UNKNOWN - verify", (_label, over) => {
    const r = runCheck(base({ [REPO]: { status: 200, body: { default_branch: "main", full_name: "octo/repo", url: THIS_REPOSITORY, ...over } } }), ["--json"]);
    expect(firstLine(r.stdout)).toMatch(new RegExp(`^repository UNKNOWN - verify — .*${UNNAMED_WHY}`));
    for (const l of targetLines(r.stdout)) expect(TARGET_LINE.exec(l)?.[3], l).toBe("UNKNOWN - verify");
    expect(r.status).toBe(2);
  });

  it("controls: name, owner.login and html_url restating octo/repo (and a GHES html_url on its own host) → named, exit 0", () => {
    const agreeing = { name: "repo", owner: { login: "octo" }, html_url: "https://github.com/octo/repo" };
    const ghes = { url: "https://ghe.example.com/api/v3/repos/octo/repo", html_url: "https://ghe.example.com/octo/repo" };
    for (const over of [agreeing, ghes]) {
      const r = runCheck(base({ [REPO]: { status: 200, body: { default_branch: "main", full_name: "octo/repo", url: THIS_REPOSITORY, ...over } } }));
      expect(firstLine(r.stdout), JSON.stringify(over)).toBe("repository octo/repo");
      expect(r.status, JSON.stringify(over)).toBe(0);
    }
  });

  const probedMaster = (protectionUrl: unknown): Fixture =>
    base({
      [BRANCH("master")]: { status: 200, body: { name: "master", protected: true, protection_url: protectionUrl } },
      [RULES("master")]: NO_RULES,
      [PROTECTION("master")]: classicOf(CLASSIC_STRONG),
    });
  it.each([
    ["another repository", OTHER_PROTECTION("master")],
    ["another branch", "https://api.github.com/repos/octo/repo/branches/main/protection"],
    ["a number", 7],
  ])("the master probe's protection_url names %s → master UNKNOWN - verify, never judged", (_label, url) => {
    const r = runCheck(probedMaster(url), ["--json"]);
    expect(verdictOf(r.stdout, "branch", "master")).toBe("UNKNOWN - verify");
    expect(callsTo(r.calls, "branches/master/protection")).toBe(0);
    expect(r.status).toBe(2);
  });
  it("control: the master probe's protection_url names master's protection endpoint here → master protected", () => {
    const r = runCheck(probedMaster("https://api.github.com/repos/octo/repo/branches/master/protection"));
    expect(verdictOf(r.stdout, "branch", "master")).toBe("protected");
    expect(r.status).toBe(0);
  });

  // The non-admin path: the protection endpoint answers 404 `Not Found`, and branches/<b> answers
  // about this branch with protected false (no classic protection). A pull_request rule shows only
  // two rows, so the branch reads unprotected on that answer; a protection_url naming another
  // repository makes the answer not about this branch.
  const nonAdmin = (protectionUrl: unknown): Fixture =>
    base({
      [RULES("release")]: rulesOf(PR_RULE(1)),
      [PROTECTION("release")]: { status: 404, body: { message: "Not Found" } },
      [BRANCH("release")]: { status: 200, body: { name: "release", protected: false, protection_url: protectionUrl } },
    });
  it("the non-admin path's branch answer carries a protection_url naming another repository → release UNKNOWN - verify, not unprotected", () => {
    const r = runCheck(nonAdmin(OTHER_PROTECTION("release")), ["--branch", "release"]);
    expect(verdictOf(r.stdout, "branch", "release")).toBe("UNKNOWN - verify");
  });
  it("control: the non-admin path's protection_url names release's endpoint here → release unprotected, exit 1", () => {
    const r = runCheck(nonAdmin("https://api.github.com/repos/octo/repo/branches/release/protection"), ["--branch", "release"]);
    expect(verdictOf(r.stdout, "branch", "release")).toBe("unprotected");
    expect(r.status).toBe(1);
  });
});

// B3: one url authority. The raw string must BE the canonical form (it equals its own parsed
// `href`), https, no credentials, no query or fragment (an empty one included), a path prefix before
// `/repos/` that is empty or exactly `/api/v3`, a host that is api.github.com unless that GHES prefix
// is present, and owner and name segments with no percent-encoding.
const NOT_CANONICAL_REPOSITORY_URLS: Array<[string, string]> = [
  ["a tab inside", "https://api.github.com/re\tpos/octo/repo"],
  ["a newline inside", "https://api.github.com/repos/oc\nto/repo"],
  ["a leading control character", "\u0001https://api.github.com/repos/octo/repo"],
  ["a trailing control character", "https://api.github.com/repos/octo/repo\u001f"],
  ["a leading space", " https://api.github.com/repos/octo/repo"],
  ["backslashes", "https://api.github.com\\repos\\octo\\repo"],
  ["dot segments", "https://api.github.com/repos/evil/x/../../octo/repo"],
  ["percent-encoded dot segments (the raw string names evil/x)", "https://api.github.com/repos/evil/x/%2e%2e/%2E%2e/octo/repo"],
  ["a bare ?", "https://api.github.com/repos/octo/repo?"],
  ["a bare #", "https://api.github.com/repos/octo/repo#"],
  ["an arbitrary path prefix", "https://api.github.com/foo/repos/x/repos/octo/repo"],
  ["a prefix other than /api/v3", "https://ghe.example.com/api/v4/repos/octo/repo"],
  ["another host without the GHES prefix", "https://evil.example/repos/octo/repo"],
  ["http", "http://api.github.com/repos/octo/repo"],
  ["an upper-case host", "https://API.github.com/repos/octo/repo"],
  ["the default port spelled out", "https://api.github.com:443/repos/octo/repo"],
  ["a percent-encoded repository name", "https://api.github.com/repos/octo/%72epo"],
  ["a percent-encoded owner", "https://api.github.com/repos/%6fcto/repo"],
  ["a trailing slash", "https://api.github.com/repos/octo/repo/"],
  ["the web url", "https://github.com/octo/repo"],
];
const NOT_CANONICAL_PROTECTION_URLS: Array<[string, string]> = [
  ["a tab inside", "https://api.github.com/repos/octo/re\tpo/branches/release/protection"],
  ["a leading control character", "\u0001https://api.github.com/repos/octo/repo/branches/release/protection"],
  ["a trailing control character", "https://api.github.com/repos/octo/repo/branches/release/protection\u001f"],
  ["backslashes", "https://api.github.com\\repos\\octo\\repo\\branches\\release\\protection"],
  ["dot segments", "https://api.github.com/repos/evil/x/../../octo/repo/branches/release/protection"],
  ["percent-encoded dot segments", "https://api.github.com/repos/evil/x/%2e%2e/%2E%2e/octo/repo/branches/release/protection"],
  ["a bare ?", "https://api.github.com/repos/octo/repo/branches/release/protection?"],
  ["a bare #", "https://api.github.com/repos/octo/repo/branches/release/protection#"],
  ["an upper-case host", "https://API.github.com/repos/octo/repo/branches/release/protection"],
  ["a percent-encoded repository name", "https://api.github.com/repos/octo/%72epo/branches/release/protection"],
  ["a percent-encoded owner", "https://api.github.com/repos/%6fcto/repo/branches/release/protection"],
];

describe("host-protection.js — red-team 33.1-25 B3: one url authority, canonical form only (DC-1)", () => {
  it("the tables have the pinned sizes (20 repository urls, 11 protection urls)", () => {
    expect(NOT_CANONICAL_REPOSITORY_URLS).toHaveLength(20);
    expect(NOT_CANONICAL_PROTECTION_URLS).toHaveLength(11);
  });

  it.each(NOT_CANONICAL_REPOSITORY_URLS)("the repository url has %s → the repository is not named, every target UNKNOWN - verify, no further endpoint", (_label, url) => {
    const r = runCheck(base({ [REPO]: { status: 200, body: { default_branch: "main", full_name: "octo/repo", url } } }), ["--json"]);
    expect(firstLine(r.stdout)).toMatch(new RegExp(`^repository UNKNOWN - verify — .*${UNNAMED_WHY}`));
    for (const l of targetLines(r.stdout)) expect(TARGET_LINE.exec(l)?.[3], l).toBe("UNKNOWN - verify");
    expect(repositoryField(r.stdout)).toBeNull();
    expect(r.calls).toEqual([
      ["auth", "status"],
      ["api", "--method", "GET", "-i", "repos/{owner}/{repo}"],
    ]);
    expect(r.status).toBe(2);
  });

  it.each(NOT_CANONICAL_PROTECTION_URLS)("--branch release whose protection url has %s → release UNKNOWN - verify", (_label, url) => {
    const r = runCheck(base({ [RULES("release")]: NO_RULES, [PROTECTION("release")]: classicOf({ ...CLASSIC_STRONG, url }) }), ["--branch", "release", "--json"]);
    expect(verdictOf(r.stdout, "branch", "release")).toBe("UNKNOWN - verify");
    for (const f of factsOf(r.stdout, "branch", "release")) expect(f.state, f.id).toBe("unknown");
  });

  it("the two checks agree on percent-encoding: octo/%72epo is refused as the repository url AND as a protection url", () => {
    const asRepo = runCheck(base({ [REPO]: { status: 200, body: { default_branch: "main", full_name: "octo/repo", url: "https://api.github.com/repos/octo/%72epo" } } }));
    expect(firstLine(asRepo.stdout)).toMatch(/^repository UNKNOWN - verify/);
    const asProtection = runCheck(
      base({ [RULES("release")]: NO_RULES, [PROTECTION("release")]: classicOf({ ...CLASSIC_STRONG, url: "https://api.github.com/repos/octo/%72epo/branches/release/protection" }) }),
      ["--branch", "release"],
    );
    expect(verdictOf(asProtection.stdout, "branch", "release")).toBe("UNKNOWN - verify");
  });

  it("controls: canonical api.github.com and GHES /api/v3 repository urls (a GHES port included) name the repository", () => {
    for (const url of [THIS_REPOSITORY, "https://ghe.example.com/api/v3/repos/octo/repo", "https://ghe.example.com:8443/api/v3/repos/octo/repo"]) {
      const r = runCheck(base({ [REPO]: { status: 200, body: { default_branch: "main", full_name: "octo/repo", url } } }));
      expect(firstLine(r.stdout), url).toBe("repository octo/repo");
      expect(r.status, url).toBe(0);
    }
  });
});

// B4: printable() is the one text authority. A format character (bidi controls, zero-width
// characters) or a line/paragraph separator in host text or a user argument is escaped visibly on
// every printed line, never written raw.
const INVISIBLE_PRINTED: Array<[string, string]> = [
  ["a right-to-left override", "‮"],
  ["a left-to-right isolate", "⁦"],
  ["a right-to-left isolate", "⁧"],
  ["a first-strong isolate", "⁨"],
  ["a pop directional isolate", "⁩"],
  ["a line separator", " "],
  ["a paragraph separator", " "],
  ["a zero-width space", "​"],
  ["a byte-order mark", "﻿"],
  ["an Arabic letter mark", "؜"],
];
const RAW_UNPRINTABLE = /[\p{Cf}\p{Zl}\p{Zp}]/u;
const visibleEscape = (ch: string): string => `\\u{${ch.codePointAt(0)!.toString(16)}}`;
function expectNoRawUnprintable(stdout: string): void {
  for (const line of stdout.split("\n")) expect(RAW_UNPRINTABLE.test(line), `a printed line carries a raw format or separator character: ${JSON.stringify(line)}`).toBe(false);
}

describe("host-protection.js — red-team 33.1-25 B4: format characters and line/paragraph separators are escaped on every printed line", () => {
  it("the table has the pinned size (10)", () => {
    expect(INVISIBLE_PRINTED).toHaveLength(10);
  });

  it.each(INVISIBLE_PRINTED)("%s in a 404 message → the repository line escapes it", (_label, ch) => {
    const r = runCheck(base({ [REPO]: { status: 404, body: { message: `Not Found ${ch} yfirev - NWONKU` } } }), ["--json"]);
    expectNoRawUnprintable(r.stdout);
    expect(firstLine(r.stdout)).toContain(visibleEscape(ch));
  });

  it.each(INVISIBLE_PRINTED)("%s in an unreadable repository url → the repository line escapes it", (_label, ch) => {
    const r = runCheck(base({ [REPO]: { status: 200, body: { default_branch: "main", full_name: "octo/repo", url: `https://api.github.com/repos/x/${ch} repository octo/repo` } } }), ["--json"]);
    expectNoRawUnprintable(r.stdout);
    expect(firstLine(r.stdout)).toContain(visibleEscape(ch));
  });

  it.each(INVISIBLE_PRINTED)("%s in a --branch name, a host message on a branch and an --env name → every line escapes it", (_label, ch) => {
    const r = runCheck(
      base({
        [RULES("main")]: { status: 500, body: { message: `rules broke ${ch} here` } },
        [PROTECTION("main")]: NOT_PROTECTED_404,
      }),
      ["--branch", `rel${ch}ease`, "--env", `prod${ch}uction`, "--json"],
    );
    expectNoRawUnprintable(r.stdout);
    const esc = visibleEscape(ch);
    expect(targetLines(r.stdout).find((l) => l.startsWith(`branch rel${esc}ease:`)), "the --branch line").toBeDefined();
    expect(branchLine(r.stdout)).toContain(`rules broke ${esc} here`);
    const env = targetLines(r.stdout).find((l) => l.startsWith("environment "));
    expect(env).toContain(`environment prod${esc}uction:`);
  });
});

// B2: the config read decides a candidate's type BEFORE it opens it. A writer blocked in open() on
// a FIFO at a candidate path stays blocked: opening the FIFO to read, even non-blocking, would
// release it (and it then dies writing to a closed pipe), so "the special file is untouched" would
// be false.
const BLOCKED_WRITER = "process.stderr.write('ready\\n'); const fs = require('node:fs'); const fd = fs.openSync(process.argv[1], 'w'); fs.writeSync(fd, 'x'); fs.closeSync(fd);";
const pause = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

describe("host-protection.js — red-team 33.1-25 B2: a writer blocked on a FIFO at a config candidate stays blocked (DC-3)", () => {
  for (const [i, rel] of CONFIG_CANDIDATES.entries()) {
    it(`${rel} is a FIFO with a writer blocked in open(): the check finishes, the name falls through, and the writer is still blocked`, async (ctx) => {
      const cwd = mkTmp();
      for (const later of CONFIG_CANDIDATES.slice(i + 1)) writeConfig(cwd, later, "production");
      const at = join(cwd, rel);
      mkdirSync(dirname(at), { recursive: true });
      const skipped = stageShapeOrSkip("FIFO", at, `scripts/runnable-ref/host-protection.test.ts: ${at} (blocked writer)`);
      if (skipped !== null) {
        console.log(skipLine(skipped, "the DC-3 FIFO, directory and device cases at the same path"));
        ctx.skip();
        return;
      }
      const writer = spawn(process.execPath, ["-e", BLOCKED_WRITER, at], { stdio: ["ignore", "ignore", "pipe"] });
      const exited = new Promise<void>((resolve) => writer.once("exit", () => resolve()));
      try {
        await new Promise<void>((resolve, reject) => {
          writer.stderr.on("data", (d: Buffer) => (d.toString().includes("ready") ? resolve() : undefined));
          writer.once("exit", () => reject(new Error("the writer exited before it blocked")));
        });
        await pause(400); // the writer is now inside open(), waiting for a reader
        const r = runBounded(cwd);
        expect(r.error, `the check did not finish: ${r.error?.message}`).toBeUndefined();
        const expected = i + 1 < CONFIG_CANDIDATES.length ? sourceOf(CONFIG_CANDIDATES[i + 1]) : DEFAULT_SOURCE;
        expect(environmentLine(r.stdout)).toContain(`environment name from ${expected}`);
        await pause(500); // time for a released writer to finish or die
        expect(writer.exitCode, "the writer was released by the check").toBeNull();
        expect(writer.signalCode, "the writer was released by the check").toBeNull();
        expect(kindAt(at)).toBe("fifo");
      } finally {
        if (writer.exitCode === null && writer.signalCode === null) writer.kill("SIGKILL");
        await exited;
      }
    }, 30_000);
  }
});

// ── WR-04 and IN-04 (plan 33.1-41) ─────────────────────────────────────────────────────────────────
// WR-04: the D-12 block must reach its reader whole. stdout to a pipe is asynchronous on darwin, and
// an immediate exit drops what is still queued there; the tail now sets process.exitCode instead.
// Measured on the immediate-exit tail before this plan: 30 `--branch` flags with `--json`, piped
// through `(sleep 2; wc -c)`, arrived as 65536 bytes against 122691 written to a file, in 5 of 5 runs.
// IN-04: a command line the check cannot read is refused with exit 2 before any gh call.
const SLOW_PIPE_BRANCHES = 30;
const SLOW_PIPE_DELAY_S = 2;
const SLOW_PIPE_RUNS = 3;
const shQuote = (s: string): string => `'${s.replace(/'/g, "'\\''")}'`;
// The same command through sh, once into a file and once through a reader that waits before it reads.
function slowPipeBytes(extraEnv: Record<string, string> = {}): { file: number; piped: number[] } {
  const scratch = mkTmp();
  const fixture = join(scratch, "fixture.json");
  writeFileSync(fixture, JSON.stringify(base()));
  const branches = Array.from({ length: SLOW_PIPE_BRANCHES }, (_, i) => `--branch b${i + 1}`).join(" ");
  const cmd = `${shQuote(process.execPath)} ${shQuote(CHECK_JS)} --gh-script ${shQuote(GH_STUB)} --json ${branches}`;
  const env = { ...process.env, GH_STUB_FIXTURE: fixture, GH_STUB_LOG: "", ...extraEnv };
  const out = join(scratch, "out.txt");
  spawnSync("sh", ["-c", `${cmd} > ${shQuote(out)} 2>/dev/null`], { env, encoding: "utf8" });
  const file = readFileSync(out).length;
  const piped: number[] = [];
  for (let i = 0; i < SLOW_PIPE_RUNS; i++) {
    const r = spawnSync("sh", ["-c", `${cmd} 2>/dev/null | (sleep ${SLOW_PIPE_DELAY_S}; wc -c)`], { env, encoding: "utf8" });
    piped.push(Number((r.stdout ?? "").trim()));
  }
  return { file, piped };
}

describe("host-protection.js — WR-04: the D-12 output reaches a slow reader whole (plan 33.1-41)", () => {
  it.skipIf(process.platform === "win32")(
    `--json with ${SLOW_PIPE_BRANCHES} --branch flags through a reader that waits ${SLOW_PIPE_DELAY_S} s: every run delivers the byte count the same run writes to a file (skipped on win32: no sh)`,
    { timeout: 120_000 },
    () => {
      const { file, piped } = slowPipeBytes();
      // Large enough that the old tail truncated it: more than one 64 KiB pipe buffer.
      expect(file, "the run writes more than a pipe buffer").toBeGreaterThan(65536);
      expect(piped).toEqual(Array.from({ length: SLOW_PIPE_RUNS }, () => file));
    },
  );

  it.skipIf(process.platform === "win32")(
    "an exception during the run prints its one could-not-run line in full through a slow pipe and exits 2 (skipped on win32: no sh)",
    { timeout: 60_000 },
    () => {
      const scratch = mkTmp();
      // A preload that makes the ruleset read throw, so the uncaughtException handler answers.
      const inject = join(scratch, "inject.cjs");
      writeFileSync(
        inject,
        'const cp = require("node:child_process"); const real = cp.spawnSync; cp.spawnSync = function (c, a) { if (Array.isArray(a) && a.some((x) => typeof x === "string" && x.includes("rulesets/"))) throw new Error("injected failure in the ruleset read"); return real.apply(this, arguments); };\n',
      );
      const fixture = join(scratch, "fixture.json");
      writeFileSync(fixture, JSON.stringify(base()));
      const cmd = `${shQuote(process.execPath)} ${shQuote(CHECK_JS)} --gh-script ${shQuote(GH_STUB)} --json`;
      const r = spawnSync("sh", ["-c", `${cmd} 2>/dev/null | (sleep 1; cat); exit $(( $? ))`], {
        env: { ...process.env, GH_STUB_FIXTURE: fixture, GH_STUB_LOG: "", NODE_OPTIONS: `--require ${inject}` },
        encoding: "utf8",
      });
      expect(r.stdout).toBe("HOST-PROTECTION: the check could not run (injected failure in the ruleset read) — UNKNOWN - verify\n");
      const status = spawnSync("node", [CHECK_JS, "--gh-script", GH_STUB], {
        env: { ...process.env, GH_STUB_FIXTURE: fixture, GH_STUB_LOG: "", NODE_OPTIONS: `--require ${inject}` },
        encoding: "utf8",
      }).status;
      expect(status).toBe(2);
    },
  );

  it("source and committed: the last statement sets process.exitCode, and exactly two immediate-exit calls remain", () => {
    for (const [label, path] of [
      ["host-protection.ts", join(HERE, "host-protection.ts")],
      ["host-protection.js", CHECK_JS],
    ] as const) {
      const src = readFileSync(path, "utf8");
      const code = src.split("\n").filter((l) => !/^\s*\/\//.test(l) && l.trim() !== "");
      expect(`${label}: ${code[code.length - 1].trim()}`).toBe(`${label}: process.exitCode = exitCode;`);
      // The defect, by name, anywhere in the file (prose included): the tail never exits with the code.
      expect(`${label}: ${src.includes("process.exit(exitCode)")}`).toBe(`${label}: false`);
      // TWO, pinned: the uncaughtException handler and the bad-usage check (IN-04). Each writes its
      // one line synchronously first, and each runs when nothing larger than that line is queued.
      const exits = code.filter((l) => l.includes("process.exit(")).length;
      expect(`${label} immediate-exit calls: ${exits}`).toBe(`${label} immediate-exit calls: 2`);
    }
  });
});

describe("host-protection.js — IN-04: a command line the check cannot read exits 2 before any gh call (plan 33.1-41)", () => {
  const BAD_USAGE: Array<[string, string[], string]> = [
    ["a misspelled flag (--brnach release)", ["--brnach", "release"], "unknown argument: --brnach"],
    ["--branch as the last argument", ["--branch"], "--branch needs a value"],
    ["--branch followed by --json", ["--branch", "--json"], "--branch needs a value"],
    ["--branch -x", ["--branch", "-x"], "--branch needs a value"],
    ["--env with no value", ["--env"], "--env needs a value"],
    ["--env -x (the review's case)", ["--env", "-x"], "--env needs a value"],
    ["--env= (empty)", ["--env="], "--env needs a value"],
    ["--branch= (empty)", ["--branch="], "--branch needs a value"],
    ["--gh-script with no value", ["--gh-script"], "--gh-script needs a value"],
    ["--json=1 (--json takes no value)", ["--json=1"], "unknown argument: --json=1"],
    ["a bare word", ["release"], "unknown argument: release"],
  ];
  it("the bad-usage table has the pinned size (11)", () => {
    expect(BAD_USAGE).toHaveLength(11);
  });
  it.each(BAD_USAGE)("%s → exit 2, no gh call, the reason on stderr and one bad-usage line on stdout", (_label, args, reason) => {
    const r = runCheck(base(), args);
    expect(r.status).toBe(2);
    expect(r.calls).toEqual([]);
    expect(r.stdout).toBe(`HOST-PROTECTION: the check could not run (bad usage: ${reason}${reason.includes("needs a value") ? ` (${reason.split(" ")[0]} <value>, or ${reason.split(" ")[0]}=<value> for a value that begins with -)` : ""}) — UNKNOWN - verify\n`);
    expect(r.stderr).toContain(reason);
    expect(r.stderr).toContain("usage: node tools/grugops/host-protection.js");
  });

  it("controls: --branch=release, --env=staging, repeated --branch and --json anywhere still work", () => {
    const fx = base({ [RULES("release")]: { status: 200, body: RULESET_PROTECTED }, [RULES("hotfix")]: { status: 200, body: RULESET_PROTECTED } });
    const eq = runCheck(fx, ["--branch=release", "--env=staging"]);
    expect(verdictOf(eq.stdout, "branch", "release")).toBe("protected");
    expect(verdictOf(eq.stdout, "environment", "staging")).toBe("UNKNOWN - verify");
    expect(eq.status).toBe(0);
    for (const args of [
      ["--json", "--branch", "release", "--branch", "hotfix"],
      ["--branch", "release", "--json", "--branch", "hotfix"],
      ["--branch", "release", "--branch", "hotfix", "--json"],
    ]) {
      const r = runCheck(fx, args);
      expect(verdictOf(r.stdout, "branch", "release"), args.join(" ")).toBe("protected");
      expect(verdictOf(r.stdout, "branch", "hotfix"), args.join(" ")).toBe("protected");
      expect(jsonBlock(r.stdout).ok, args.join(" ")).toBe(true);
      expect(r.status, args.join(" ")).toBe(0);
    }
  });
});

// Runs LAST (vitest runs a file's tests in declaration order): aggregates the stub log of every
// case above. This is the read-only proof (T-33.1-41): the check has two argv shapes and no other.
describe("host-protection.js — read-only by construction", () => {
  it("every recorded gh argv is `auth status` or `api --method GET -i <path>`, with no field flag", () => {
    expect(ALL_CALLS.length, "the proof must have calls to inspect").toBeGreaterThan(50);
    const FORBIDDEN = new Set(["-f", "-F", "--field", "--raw-field", "--input", "-X"]);
    for (const argv of ALL_CALLS) {
      const isAuth = argv.length === 2 && argv[0] === "auth" && argv[1] === "status";
      const isGet =
        argv.length === 5 && argv[0] === "api" && argv[1] === "--method" && argv[2] === "GET" && argv[3] === "-i";
      expect(isAuth || isGet, `unexpected gh argv ${JSON.stringify(argv)}`).toBe(true);
      for (const a of argv) {
        expect(FORBIDDEN.has(a), `field or method flag in ${JSON.stringify(argv)}`).toBe(false);
        expect(a.startsWith("--method=") || a.startsWith("--field=") || a.startsWith("--raw-field=")).toBe(false);
      }
      if (isGet) expect(argv[4].startsWith("repos/{owner}/{repo}")).toBe(true);
    }
  });

  // The closed list of endpoint shapes (T-33.1-191, T-33.1-194): every GET path, with any
  // `?per_page=100` removed, matches exactly one shape, and each shape is used at least once.
  // Seven shapes before plan 33.1-41; the environments list and the protected-branch list are no
  // longer asked (33.1 D-31 Q4), so a call to either now matches no shape and turns this red.
  it("every recorded GET path matches exactly one of five endpoint shapes, and each shape is used", () => {
    const BR = "[^?]+"; // a branch name as it appears in a path; `/` is kept literal
    const SHAPES: Record<string, RegExp> = {
      repository: /^repos\/\{owner\}\/\{repo\}$/,
      rules: new RegExp(`^repos/\\{owner\\}/\\{repo\\}/rules/branches/${BR}$`),
      branch: new RegExp(`^repos/\\{owner\\}/\\{repo\\}/branches/(?!${BR}/protection$)${BR}$`),
      protection: new RegExp(`^repos/\\{owner\\}/\\{repo\\}/branches/${BR}/protection$`),
      ruleset: /^repos\/\{owner\}\/\{repo\}\/rulesets\/[0-9]+$/,
    };
    const used = new Set<string>();
    const gets = ALL_CALLS.filter((a) => a[0] === "api");
    expect(gets.length).toBeGreaterThan(50);
    for (const argv of gets) {
      const path = argv[4].replace(/\?per_page=100$/, "");
      const hits = Object.entries(SHAPES).filter(([, re]) => re.test(path));
      expect(hits.map(([n]) => n), `path ${JSON.stringify(argv[4])}`).toHaveLength(1);
      used.add(hits[0][0]);
    }
    expect([...used].sort()).toEqual(Object.keys(SHAPES).sort());
  });
});

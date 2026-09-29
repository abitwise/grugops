// host-protection.test.ts — the read-only git-host check (Phase 33.1, D-19).
//
// Every case spawns the COMMITTED host-protection.js (never the .ts) and drives it through its
// `--gh-script` test seam with fixtures/gh-stub.mjs, so no case calls the real `gh` or the network.
// The stub answers from a per-case fixture map (space-joined argv → response) and appends every
// argv it receives to a per-case log, which the read-only proof at the end aggregates.
//
// Vitest globals:false (the repo default) → import test fns explicitly.

import { describe, it, expect, afterEach } from "vitest";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

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
// `non_fast_forward`, `deletion`), no `master`, and a `production` environment with a named
// reviewer (its self-review, admin-bypass and branch-policy fields are read from plan 33.1-20 on).
const STRONG_FIXTURE = join(HERE, "fixtures", "host-strong.fixture.json");
const STRONG = JSON.parse(readFileSync(STRONG_FIXTURE, "utf8")) as Fixture;
const STRONG_RULES_KEY = api("repos/{owner}/{repo}/rules/branches/main?per_page=100");
const RULESET_PROTECTED = (STRONG[STRONG_RULES_KEY] as { body: unknown[] }).body;

describe("host-protection.js — branch verdicts", () => {
  it("the strong fixture: one active ruleset shows every floor row → protected, and the run exits 0", () => {
    const r = runCheck(STRONG);
    expect(r.stdout).toMatch(/^branch main: protected — every branch floor item is shown: /m);
    expect(r.stdout).toMatch(/^HOST-PROTECTION: 2 protected, 0 unprotected, 0 UNKNOWN - verify$/m);
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
const ENVS = api("repos/{owner}/{repo}/environments?per_page=100");
const REVIEWERS = [{ type: "User", reviewer: { login: "release-owner" } }];
// An explicit, empty pull request bypass allowance (D-30): a classic body that omits the key is not
// readable (plan 33.1-22), so every classic body a case expects to be `protected` carries this.
const NO_ALLOWANCES = { users: [], teams: [], apps: [] };
function base(over: Fixture = {}): Fixture {
  // A fresh parse per call, so no case can mutate what another case reads.
  return { ...(JSON.parse(readFileSync(STRONG_FIXTURE, "utf8")) as Fixture), ...over };
}
// The strong fixture's `production` environment (plan 33.1-20): a named reviewer, self-review
// prevented, no administrator bypass, deployments only from protected branches.
function strongEnv(): Record<string, unknown> {
  return (base()[ENVS] as { body: { environments: Record<string, unknown>[] } }).body.environments[0];
}
// Each environment is built from the strong `production` shape unless a case overrides a field; an
// override of `undefined` removes the key (JSON drops it), so a case can make a field absent.
function envs(...list: Array<Record<string, unknown> & { name: string }>): unknown {
  return { status: 200, body: { total_count: list.length, environments: list.map((e) => ({ ...strongEnv(), ...e })) } };
}
// A `required_reviewers` rule in the shape `GET environments` returns, strong unless overridden.
const REVIEWER_RULE = (over: Record<string, unknown> = {}): Record<string, unknown> => ({
  type: "required_reviewers",
  prevent_self_review: true,
  reviewers: REVIEWERS,
  ...over,
});
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
    expect(verdictOf(r.stdout, "environment", "production")).toBe("protected");
    expect(r.stdout).toMatch(/^HOST-PROTECTION: 2 protected, 0 unprotected, 0 UNKNOWN - verify$/m);
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
            required_pull_request_reviews: { required_approving_review_count: 1, bypass_pull_request_allowances: NO_ALLOWANCES },
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
        [PROTECTION("main")]: { status: 200, body: { allow_force_pushes: { enabled: true } } },
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
        [REPO]: { status: 200, body: { default_branch: "develop" } },
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
const PR_RULE = (count: unknown): Record<string, unknown> => RULE("pull_request", { required_approving_review_count: count });
const rulesOf = (...list: unknown[]): unknown => ({ status: 200, body: list });
// Classic protection that shows every floor row: it applies to administrators and grants no pull
// request bypass allowance (D-30). NO_ALLOWANCES is declared with the shared fixtures near the top.
const CLASSIC_STRONG = {
  enforce_admins: { enabled: true },
  required_pull_request_reviews: { required_approving_review_count: 1, bypass_pull_request_allowances: NO_ALLOWANCES },
  allow_force_pushes: { enabled: false },
  allow_deletions: { enabled: false },
};
const classicOf = (body: Record<string, unknown>): unknown => ({ status: 200, body });
const NOT_PROTECTED_404 = { status: 404, body: { message: "Branch not protected" } };
// The qualifier row of the branch floor (D-30), last in the table.
const NO_BYPASS = "does not let administrators or the account the agent works under bypass it";
// `GET repos/{owner}/{repo}/rulesets/<id>` and a 200 answer carrying `current_user_can_bypass`.
const RULESET = (id: number | string): string => api(`repos/{owner}/{repo}/rulesets/${id}`);
const rulesetAnswer = (id: number, bypass?: unknown): unknown => ({
  status: 200,
  body: { id, ...(bypass === undefined ? {} : { current_user_can_bypass: bypass }) },
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
  RULE_IN(id, "pull_request", { required_approving_review_count: 1 }),
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
function envFactOf(stdout: string, name: string, requirement: string): string | undefined {
  return envFacts(stdout, name).find((f) => f.requirement === requirement)?.state;
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
          required_pull_request_reviews: { required_approving_review_count: 0 },
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
          required_pull_request_reviews: { required_approving_review_count: 0 },
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
      "blocks force pushes",
      "restricts deletions",
      NO_BYPASS,
    ]);
    const branches = block.targets.filter((t) => t.kind === "branch");
    expect(branches.map((t) => t.name).sort()).toEqual(["main", "master"]);
    for (const t of branches) {
      expect(t.facts, `facts on branch ${t.name}`).toBeDefined();
      expect(t.facts!.map((f) => f.requirement)).toEqual(block.floor.branch);
      expect(t.facts!.map((f) => f.id)).toEqual(["pull_request", "approving_review", "no_force_push", "no_deletion", "no_bypass"]);
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
        required_pull_request_reviews: { required_approving_review_count: 0 },
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
            RULE_IN(order[0], "pull_request", { required_approving_review_count: 1 }),
            RULE_IN(order[1], "pull_request", { required_approving_review_count: 1 }),
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
          RULE_IN(2, "pull_request", { required_approving_review_count: 0 }),
          RULE_IN(1, "pull_request", { required_approving_review_count: 1 }),
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
    const rules: Record<string, unknown>[] = [RULE_IN(1, "pull_request", { required_approving_review_count: 1 })];
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
    required_pull_request_reviews: { required_approving_review_count: 1, bypass_pull_request_allowances: allowances },
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
        [PROTECTION("main")]: classicOf({ ...CLASSIC_STRONG, required_pull_request_reviews: { required_approving_review_count: 1 } }),
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
    for (const c of r.calls) expect(c.join(" ")).not.toContain("/protection");
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

describe("host-protection.js — the production environment (D-19)", () => {
  it("the strong fixture's production (reviewer, self-review prevented, no admin bypass, protected-branch policy) → protected", () => {
    const r = runCheck(base(), ["--json"]);
    expect(verdictOf(r.stdout, "environment", "production")).toBe("protected");
    expect(envFacts(r.stdout, "production").every((f) => f.state === "held")).toBe(true);
    expect(r.status).toBe(0);
  });

  it("an environment without a reviewer-naming rule → unprotected, exit 1", () => {
    const r = runCheck(
      base({
        [ENVS]: envs({ name: "production", protection_rules: [{ type: "wait_timer", wait_timer: 5 }, REVIEWER_RULE({ reviewers: [] })] }),
      }),
    );
    expect(verdictOf(r.stdout, "environment", "production")).toBe("unprotected");
    expect(r.status).toBe(1);
  });

  it("no environment of that name → UNKNOWN - verify, saying grugops cannot tell how production deploys run", () => {
    const r = runCheck(base({ [ENVS]: envs({ name: "staging" }) }), ["--json"]);
    expect(verdictOf(r.stdout, "environment", "production")).toBe("UNKNOWN - verify");
    expect(r.stdout).toContain("no environment named production; grugops cannot tell how production deploys run");
    // An absent environment is not readable, never read-and-not-met.
    expect(envFactOf(r.stdout, "production", ENV_EXISTS)).toBe("unknown");
    expect(envFacts(r.stdout, "production").every((f) => f.state === "unknown")).toBe(true);
    expect(r.status).toBe(2);
  });

  it("an environments call that is not a 200 → UNKNOWN - verify, every environment fact unknown", () => {
    const r = runCheck(base({ [ENVS]: { status: 404, body: { message: "Not Found" } } }), ["--json"]);
    expect(verdictOf(r.stdout, "environment", "production")).toBe("UNKNOWN - verify");
    expect(envFacts(r.stdout, "production").every((f) => f.state === "unknown")).toBe(true);
    expect(r.status).toBe(2);
  });

  // One row at a time, from the strong environment: [case, override, verdict, requirement named].
  const ENV_CASES: Array<[string, Record<string, unknown>, string, string]> = [
    ["prevent_self_review false", { protection_rules: [REVIEWER_RULE({ prevent_self_review: false })] }, "unprotected", "prevents self-review"],
    ["prevent_self_review absent", { protection_rules: [REVIEWER_RULE({ prevent_self_review: undefined })] }, "UNKNOWN - verify", "prevents self-review"],
    ['prevent_self_review "true" (a string)', { protection_rules: [REVIEWER_RULE({ prevent_self_review: "true" })] }, "UNKNOWN - verify", "prevents self-review"],
    ["can_admins_bypass true", { can_admins_bypass: true }, "unprotected", "does not let administrators bypass its protection rules"],
    ["can_admins_bypass absent", { can_admins_bypass: undefined }, "UNKNOWN - verify", "does not let administrators bypass its protection rules"],
    ["can_admins_bypass null", { can_admins_bypass: null }, "UNKNOWN - verify", "does not let administrators bypass its protection rules"],
    ["deployment_branch_policy null", { deployment_branch_policy: null }, "unprotected", "allows deployments only from protected branches"],
    [
      "a custom deployment branch policy",
      { deployment_branch_policy: { protected_branches: false, custom_branch_policies: true } },
      "UNKNOWN - verify",
      "allows deployments only from protected branches",
    ],
    ["deployment_branch_policy absent", { deployment_branch_policy: undefined }, "UNKNOWN - verify", "allows deployments only from protected branches"],
    [
      "deployment_branch_policy.protected_branches a string",
      { deployment_branch_policy: { protected_branches: "true", custom_branch_policies: false } },
      "UNKNOWN - verify",
      "allows deployments only from protected branches",
    ],
    ["protection_rules empty", { protection_rules: [] }, "unprotected", "requires at least one reviewer"],
    ["protection_rules absent", { protection_rules: undefined }, "UNKNOWN - verify", "requires at least one reviewer"],
    ["protection_rules not an array", { protection_rules: { type: "required_reviewers" } }, "UNKNOWN - verify", "requires at least one reviewer"],
    ["a required_reviewers rule with reviewers []", { protection_rules: [REVIEWER_RULE({ reviewers: [] })] }, "unprotected", "requires at least one reviewer"],
    ["a required_reviewers rule with reviewers absent", { protection_rules: [REVIEWER_RULE({ reviewers: undefined })] }, "UNKNOWN - verify", "requires at least one reviewer"],
  ];
  for (const [name, over, verdict, requirement] of ENV_CASES) {
    it(`${name} → ${verdict}, naming "${requirement}"`, () => {
      const r = runCheck(base({ [ENVS]: envs({ name: "production", ...over }) }), ["--json"]);
      expect(verdictOf(r.stdout, "environment", "production")).toBe(verdict);
      expect(envLine(r.stdout)).toContain(requirement);
      expect(envFactOf(r.stdout, "production", requirement)).toBe(verdict === "unprotected" ? "failed" : "unknown");
      expect(r.status).toBe(verdict === "unprotected" ? 1 : 2);
    });
  }

  it("no reviewer rule at all → the self-review row is read and not met (failed), never held", () => {
    const r = runCheck(base({ [ENVS]: envs({ name: "production", protection_rules: [{ type: "wait_timer", wait_timer: 5 }] }) }), ["--json"]);
    expect(envFactOf(r.stdout, "production", "prevents self-review")).toBe("failed");
    expect(verdictOf(r.stdout, "environment", "production")).toBe("unprotected");
  });

  it("reviewer identities are never printed: the evidence counts reviewers", () => {
    const r = runCheck(base(), ["--json"]);
    expect(r.stdout).not.toContain("release-owner");
    expect(envLine(r.stdout)).toContain("1 reviewer");
  });

  it("--json publishes floor.environment in table order and one facts entry per row on the environment target", () => {
    const block = jsonBlock(runCheck(base(), ["--json"]).stdout);
    expect(block.floor.environment).toEqual([
      ENV_EXISTS,
      "requires at least one reviewer",
      "prevents self-review",
      "does not let administrators bypass its protection rules",
      "allows deployments only from protected branches",
    ]);
    const t = block.targets.find((x) => x.kind === "environment")!;
    expect(t.facts!.map((f) => f.requirement)).toEqual(block.floor.environment);
    expect(t.facts!.map((f) => f.id)).toEqual(["environment_exists", "required_reviewer", "no_self_review", "no_admin_bypass", "branch_policy"]);
    for (const f of t.facts!) expect(f.evidence.length).toBeGreaterThan(0);
  });

  it("README drift: the second checklist list under `#### Git-host setup checklist` equals --json floor.environment, both ways", () => {
    const lists = checklistLists();
    const floor = jsonBlock(runCheck(base(), ["--json"]).stdout).floor.environment;
    expect(lists[1].length).toBeGreaterThan(0);
    expect(lists[1]).toEqual(floor);
    expect(floor).toEqual(lists[1]);
  });

  // One weakening per ENVIRONMENT_FLOOR row, each from the strong environment.
  const WEAKEN_ENV: Record<string, Fixture> = {
    [ENV_EXISTS]: { [ENVS]: envs({ name: "staging" }) },
    "requires at least one reviewer": { [ENVS]: envs({ name: "production", protection_rules: [REVIEWER_RULE({ reviewers: [] })] }) },
    "prevents self-review": { [ENVS]: envs({ name: "production", protection_rules: [REVIEWER_RULE({ prevent_self_review: false })] }) },
    "does not let administrators bypass its protection rules": { [ENVS]: envs({ name: "production", can_admins_bypass: true }) },
    "allows deployments only from protected branches": { [ENVS]: envs({ name: "production", deployment_branch_policy: null }) },
  };

  it("WEAKEN_ENV: its keys are exactly floor.environment, and weakening any one row turns production away from protected", () => {
    const floor = jsonBlock(runCheck(base(), ["--json"]).stdout).floor.environment;
    expect(Object.keys(WEAKEN_ENV).sort()).toEqual([...floor].sort());
    expect(floor.length).toBe(Object.keys(WEAKEN_ENV).length);
    for (const requirement of floor) {
      const r = runCheck(base(WEAKEN_ENV[requirement]), ["--json"]);
      expect(verdictOf(r.stdout, "environment", "production"), `weakened: ${requirement}`).not.toBe("protected");
      expect(envFactOf(r.stdout, "production", requirement), `fact for weakened row: ${requirement}`).not.toBe("held");
    }
  });

  it("environment name: --env wins over the config and the default, and the line names the source", () => {
    const cwd = mkTmp();
    mkdirSync(join(cwd, ".grugops"), { recursive: true });
    writeFileSync(join(cwd, ".grugops", "factory.config.json"), JSON.stringify({ environments: ["dev", "prod"] }));
    const r = runCheck(base({ [ENVS]: envs({ name: "live" }) }), ["--env", "live"], { cwd });
    expect(verdictOf(r.stdout, "environment", "live")).toBe("protected");
    expect(targetLines(r.stdout).find((l) => l.startsWith("environment live:"))).toContain("--env");
  });

  it("environment name: the last `environments` entry of .grugops/factory.config.json, before agent-factory/config/factory.config.json", () => {
    const cwd = mkTmp();
    mkdirSync(join(cwd, ".grugops"), { recursive: true });
    mkdirSync(join(cwd, "agent-factory", "config"), { recursive: true });
    writeFileSync(join(cwd, ".grugops", "factory.config.json"), JSON.stringify({ environments: ["dev", "staging", "prod"] }));
    writeFileSync(join(cwd, "agent-factory", "config", "factory.config.json"), JSON.stringify({ environments: ["kit-env"] }));
    const r = runCheck(base({ [ENVS]: envs({ name: "prod" }) }), [], { cwd });
    expect(verdictOf(r.stdout, "environment", "prod")).toBe("protected");
    expect(targetLines(r.stdout).find((l) => l.startsWith("environment prod:"))).toContain(".grugops/factory.config.json");
  });

  it("environment name: an unparseable first config falls through to agent-factory/config/factory.config.json", () => {
    const cwd = mkTmp();
    mkdirSync(join(cwd, ".grugops"), { recursive: true });
    mkdirSync(join(cwd, "agent-factory", "config"), { recursive: true });
    writeFileSync(join(cwd, ".grugops", "factory.config.json"), "{ not json");
    writeFileSync(join(cwd, "agent-factory", "config", "factory.config.json"), JSON.stringify({ environments: ["dev", "prod"] }));
    const r = runCheck(base({ [ENVS]: envs({ name: "prod", protection_rules: [] }) }), [], { cwd });
    expect(verdictOf(r.stdout, "environment", "prod")).toBe("unprotected");
    expect(targetLines(r.stdout).find((l) => l.startsWith("environment prod:"))).toContain("agent-factory/config/factory.config.json");
  });

  it("environment name: no usable config → the documented default `production`", () => {
    const cwd = mkTmp();
    mkdirSync(join(cwd, ".grugops"), { recursive: true });
    writeFileSync(join(cwd, ".grugops", "factory.config.json"), JSON.stringify({ environments: "prod" }));
    const r = runCheck(base(), [], { cwd });
    expect(verdictOf(r.stdout, "environment", "production")).toBe("protected");
    expect(targetLines(r.stdout).find((l) => l.startsWith("environment production:"))).toContain("default");
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

  it("`gh auth status` failing → every target UNKNOWN - verify (including the environment), exit 2", () => {
    const r = runCheck(base({ "auth status": { exit: 1 } }), ["--branch", "release"]);
    expect(verdictOf(r.stdout, "environment", "production")).toBe("UNKNOWN - verify");
    expect(verdictOf(r.stdout, "branch", "release")).toBe("UNKNOWN - verify");
    for (const l of targetLines(r.stdout)) expect(TARGET_LINE.exec(l)?.[3]).toBe("UNKNOWN - verify");
    expect(r.stdout).toMatch(/^HOST-PROTECTION: 0 protected, 0 unprotected, \d+ UNKNOWN - verify$/m);
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
      "environment:production:protected",
    ]);
    for (const t of block.targets) expect(typeof t.reason).toBe("string");
    expect(block.calls).toEqual(r.calls);
    expect(r.status).toBe(0);

    const bad = runCheck(base({ [ENVS]: envs({ name: "production", protection_rules: [] }) }), ["--json"]);
    const badLines = bad.stdout.trim().split("\n");
    const at = badLines.findIndex((l) => l.startsWith("HOST-PROTECTION:"));
    expect((JSON.parse(badLines.slice(at + 1).join("\n")) as { ok: boolean }).ok).toBe(false);
    expect(bad.status).toBe(1);
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
  it("every recorded GET path matches exactly one of six endpoint shapes, and each shape is used", () => {
    const BR = "[^?]+"; // a branch name as it appears in a path; `/` is kept literal
    const SHAPES: Record<string, RegExp> = {
      repository: /^repos\/\{owner\}\/\{repo\}$/,
      rules: new RegExp(`^repos/\\{owner\\}/\\{repo\\}/rules/branches/${BR}$`),
      branch: new RegExp(`^repos/\\{owner\\}/\\{repo\\}/branches/(?!${BR}/protection$)${BR}$`),
      protection: new RegExp(`^repos/\\{owner\\}/\\{repo\\}/branches/${BR}/protection$`),
      ruleset: /^repos\/\{owner\}\/\{repo\}\/rulesets\/[0-9]+$/,
      environments: /^repos\/\{owner\}\/\{repo\}\/environments$/,
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

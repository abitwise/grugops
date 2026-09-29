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
// The documented reviewer element shape (WR-01): `type` User or Team, and a `reviewer` whose `id`
// is a positive integer. `login` stays so the "identities are never printed" case has a name to miss.
const REVIEWERS = [{ type: "User", reviewer: { login: "release-owner", id: 1 } }];
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

// ── Plan 33.1-22 (D-30, re-review WR-01): garbage and oddly shaped host values ────────────────
// Every case starts from the strong fixture and changes one value. An absent, null, wrong-typed or
// garbage value may lower a row to `unknown`; it never makes a row `held`.
describe("host-protection.js — reviewer element shape (WR-01, D-30)", () => {
  const SELF_REVIEW = "prevents self-review";
  const REVIEWER_ROW = "requires at least one reviewer";
  const VALID = { type: "User", reviewer: { login: "release-owner", id: 1 } };
  const GARBAGE_REVIEWERS: Array<[string, unknown[]]> = [
    ["[null]", [null]],
    ["[{}]", [{}]],
    ['["x"]', ["x"]],
    ['[{ type: "User" }] (no reviewer)', [{ type: "User" }]],
    ['[{ type: "User", reviewer: {} }] (no id)', [{ type: "User", reviewer: {} }]],
    ['[{ type: "Bot", reviewer: { id: 1 } }] (an undocumented type)', [{ type: "Bot", reviewer: { id: 1 } }]],
    ['[{ type: "User", reviewer: { id: "1" } }] (a string id)', [{ type: "User", reviewer: { id: "1" } }]],
    ['[{ type: "User", reviewer: { id: 0 } }] (a zero id)', [{ type: "User", reviewer: { id: 0 } }]],
    ['[{ type: "User", reviewer: { id: 1.5 } }] (a fractional id)', [{ type: "User", reviewer: { id: 1.5 } }]],
    ["[<a valid element>, null] (a mix)", [VALID, null]],
  ];
  for (const [name, reviewers] of GARBAGE_REVIEWERS) {
    it(`reviewers ${name} → the reviewer row is unknown, self-review is not held, UNKNOWN - verify, exit 2`, () => {
      const r = runCheck(base({ [ENVS]: envs({ name: "production", protection_rules: [REVIEWER_RULE({ reviewers })] }) }), ["--json"]);
      expect(envFactOf(r.stdout, "production", REVIEWER_ROW)).toBe("unknown");
      expect(envFactOf(r.stdout, "production", SELF_REVIEW)).not.toBe("held");
      expect(verdictOf(r.stdout, "environment", "production")).toBe("UNKNOWN - verify");
      expect(r.status).toBe(2);
    });
  }

  it('reviewers [{ type: "Team", reviewer: { id: 7 } }] → the reviewer row is held', () => {
    const r = runCheck(
      base({ [ENVS]: envs({ name: "production", protection_rules: [REVIEWER_RULE({ reviewers: [{ type: "Team", reviewer: { id: 7 } }] })] }) }),
      ["--json"],
    );
    expect(envFactOf(r.stdout, "production", REVIEWER_ROW)).toBe("held");
    expect(verdictOf(r.stdout, "environment", "production")).toBe("protected");
  });

  it("reviewers [] → the reviewer row is failed (unchanged)", () => {
    const r = runCheck(base({ [ENVS]: envs({ name: "production", protection_rules: [REVIEWER_RULE({ reviewers: [] })] }) }), ["--json"]);
    expect(envFactOf(r.stdout, "production", REVIEWER_ROW)).toBe("failed");
    expect(r.status).toBe(1);
  });

  it("protection_rules [null, <strong reviewer rule>] → the reviewer rows stay held", () => {
    const r = runCheck(base({ [ENVS]: envs({ name: "production", protection_rules: [null, REVIEWER_RULE()] }) }), ["--json"]);
    expect(envFactOf(r.stdout, "production", REVIEWER_ROW)).toBe("held");
    expect(envFactOf(r.stdout, "production", SELF_REVIEW)).toBe("held");
  });

  it("protection_rules [null] → the reviewer rows are unknown, not failed", () => {
    const r = runCheck(base({ [ENVS]: envs({ name: "production", protection_rules: [null] }) }), ["--json"]);
    expect(envFactOf(r.stdout, "production", REVIEWER_ROW)).toBe("unknown");
    expect(envFactOf(r.stdout, "production", SELF_REVIEW)).toBe("unknown");
    expect(verdictOf(r.stdout, "environment", "production")).toBe("UNKNOWN - verify");
    expect(r.status).toBe(2);
  });

  it("protection_rules [{ type: 5 }] (an entry without a string type) → the reviewer rows are unknown, not failed", () => {
    const r = runCheck(base({ [ENVS]: envs({ name: "production", protection_rules: [{ type: 5 }] }) }), ["--json"]);
    expect(envFactOf(r.stdout, "production", REVIEWER_ROW)).toBe("unknown");
    expect(envFactOf(r.stdout, "production", SELF_REVIEW)).toBe("unknown");
    expect(r.status).toBe(2);
  });
});

describe("host-protection.js — rule list garbage, the branch-policy pair and approval counts (D-30)", () => {
  const PR_ROW = "requires a pull request before merging";
  const APPROVAL_ROW = "requires at least one approving review";
  const POLICY_ROW = "allows deployments only from protected branches";

  it("a rule list [null, non_fast_forward, deletion] read in full, classic 404 `Branch not protected` → pull request and approval unknown, UNKNOWN - verify", () => {
    const r = runCheck(
      base({ [RULES("main")]: rulesOf(null, RULE("non_fast_forward"), RULE("deletion")), [PROTECTION("main")]: NOT_PROTECTED_404 }),
      ["--json"],
    );
    expect(factOf(r.stdout, "main", PR_ROW)).toBe("unknown");
    expect(factOf(r.stdout, "main", APPROVAL_ROW)).toBe("unknown");
    expect(factOf(r.stdout, "main", "blocks force pushes")).toBe("held");
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

  const POLICIES: Array<[string, unknown, string]> = [
    ["{ protected_branches: true } (no custom key)", { protected_branches: true }, "unknown"],
    ["{ protected_branches: true, custom_branch_policies: true }", { protected_branches: true, custom_branch_policies: true }, "unknown"],
    ['{ protected_branches: true, custom_branch_policies: "false" }', { protected_branches: true, custom_branch_policies: "false" }, "unknown"],
    ["{ protected_branches: true, custom_branch_policies: false }", { protected_branches: true, custom_branch_policies: false }, "held"],
  ];
  for (const [name, policy, state] of POLICIES) {
    it(`deployment_branch_policy ${name} → the branch-policy row is ${state}`, () => {
      const r = runCheck(base({ [ENVS]: envs({ name: "production", deployment_branch_policy: policy }) }), ["--json"]);
      expect(envFactOf(r.stdout, "production", POLICY_ROW)).toBe(state);
      expect(verdictOf(r.stdout, "environment", "production")).toBe(state === "held" ? "protected" : "UNKNOWN - verify");
    });
  }

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
          required_pull_request_reviews: { required_approving_review_count: -1, bypass_pull_request_allowances: NO_ALLOWANCES },
        }),
      }),
      ["--json"],
    );
    expect(factOf(r.stdout, "main", APPROVAL_ROW)).toBe("unknown");
    expect(verdictOf(r.stdout, "branch", "main")).toBe("UNKNOWN - verify");
    expect(r.status).toBe(2);
  });

  it("the strong fixture still gives 2 protected, 0 unprotected, 0 UNKNOWN - verify, exit 0", () => {
    const r = runCheck(base());
    expect(r.stdout).toMatch(/^HOST-PROTECTION: 2 protected, 0 unprotected, 0 UNKNOWN - verify$/m);
    expect(r.status).toBe(0);
  });
});

// ── Plan 33.1-22 red-team round (brief 33.1-GAP-PLANNING-BRIEF.md §3, DC-1, D-30) ──────────────
// A separate agent attacked the committed .js with only the class rules. Each finding below is
// tested as a class, not only at the site it was found: absent, oddly shaped or contradicted by the
// same run is `UNKNOWN - verify`, never `protected`.
const HOSTILE = { toString: 1 }; // JSON-safe; String(HOSTILE) and `${HOSTILE}` throw a TypeError
const ADMIN_BYPASS_ENV = (): unknown => envs({ name: "production", can_admins_bypass: true });
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
          [REPO]: { status: 200, body: { default_branch: "main", url: repoUrl } },
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
  const WEAK_PRODUCTION = { name: "production", can_admins_bypass: true, deployment_branch_policy: null, protection_rules: [] };
  // Every host list the check selects one entry from, each given two matching entries in both
  // orders: the environments list (by name) and an environment's required_reviewers rules.
  const DUPLICATES: Array<[string, Fixture, string[]]> = [
    ["two environments named production, strong first", { [ENVS]: envs({ name: "production" }, WEAK_PRODUCTION) }, []],
    ["two environments named production, weak first", { [ENVS]: envs(WEAK_PRODUCTION, { name: "production" }) }, []],
    ["two identical strong environments named production", { [ENVS]: envs({ name: "production" }, { name: "production" }) }, []],
    [
      "two required_reviewers rules, strong first",
      { [ENVS]: envs({ name: "production", protection_rules: [REVIEWER_RULE(), REVIEWER_RULE({ prevent_self_review: false, reviewers: [] })] }) },
      ["requires at least one reviewer", "prevents self-review"],
    ],
    [
      "two required_reviewers rules, weak first",
      { [ENVS]: envs({ name: "production", protection_rules: [REVIEWER_RULE({ prevent_self_review: false, reviewers: [] }), REVIEWER_RULE()] }) },
      ["requires at least one reviewer", "prevents self-review"],
    ],
    [
      "two identical strong required_reviewers rules",
      { [ENVS]: envs({ name: "production", protection_rules: [REVIEWER_RULE(), REVIEWER_RULE()] }) },
      ["requires at least one reviewer", "prevents self-review"],
    ],
  ];
  for (const [name, over, rows] of DUPLICATES) {
    it(`${name} → UNKNOWN - verify, the affected rows unknown`, () => {
      const r = runCheck(base(over), ["--json"]);
      expect(verdictOf(r.stdout, "environment", "production")).toBe("UNKNOWN - verify");
      const facts = envFacts(r.stdout, "production");
      const affected = rows.length === 0 ? facts.map((f) => f.requirement) : rows;
      for (const requirement of affected) expect(envFactOf(r.stdout, "production", requirement), requirement).toBe("unknown");
      expect(r.status).toBe(2);
    });
  }

  it("a header block with two HTTP status lines is not read by its first line → UNKNOWN - verify", () => {
    const body = JSON.stringify(RULESET_PROTECTED);
    const r = runCheck(base({ [RULES("main")]: { raw: `HTTP/2.0 200 X\nHTTP/2.0 404 X\nContent-Type: application/json\n\n${body}` } }));
    expect(verdictOf(r.stdout, "branch", "main")).toBe("UNKNOWN - verify");
    expect(r.status).toBe(2);
  });
});

describe("host-protection.js — red-team: a host value that cannot be printed never hides another target's verdict", () => {
  // Every host value the evidence text quotes, set to an object whose toString is not callable.
  // The environment is unprotected (can_admins_bypass true), so the run must exit 1, never the
  // "could not run" exit 2 that would hide it.
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
          required_pull_request_reviews: { required_approving_review_count: HOSTILE, bypass_pull_request_allowances: NO_ALLOWANCES },
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
    it(`${name} set to { toString: 1 } → the run still reports the unprotected environment, exit 1`, () => {
      const r = runCheck(base({ ...over, [ENVS]: ADMIN_BYPASS_ENV() }));
      expect(r.stdout).not.toContain("could not run");
      expect(verdictOf(r.stdout, "environment", "production")).toBe("unprotected");
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
  it("the strong fixture has the seven endpoints this class covers (repository, rules, ruleset, master probe, protected-branch list, listed branch protection, environments)", () => {
    expect(endpoints.length).toBe(7);
  });
  for (const key of endpoints) {
    it(`${key.slice("api --method GET -i ".length)} answering with gh's exit status contradicting its HTTP status → exit 2, never all protected`, () => {
      const fx = base();
      const entry = fx[key] as { status: number };
      fx[key] = { ...entry, exit: entry.status < 400 ? 1 : 0 };
      const r = runCheck(fx);
      expect(r.stdout).toMatch(/UNKNOWN - verify — /);
      expect(r.stdout).not.toMatch(/^HOST-PROTECTION: \d+ protected, 0 unprotected, 0 UNKNOWN - verify$/m);
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

// ── Re-review CR-02 (plan 33.1-23, D-30) ────────────────────────────────────────────────────────
// "Protected branches only" lets every branch deploy when no branch has branch protection rules
// (docs.github.com/en/actions/reference/workflows-and-actions/deployments-and-environments), so the
// environment's branch-policy row is `held` only when the same run shows CLASSIC branch protection
// somewhere: a 200 object body from `branches/<b>/protection`, for a branch the run already read or
// for the first branch the host lists under `branches?protected=true&per_page=1`. That list also
// names ruleset-protected branches (docs.github.com/en/rest/branches/branches), so it is never
// evidence by itself.
const PROTECTED_LIST = api("repos/{owner}/{repo}/branches?protected=true&per_page=1");
const BRANCH_POLICY = "allows deployments only from protected branches";
const listOf = (...items: unknown[]): unknown => ({ status: 200, body: items });
// Branch main with no ruleset rule and no classic protection: `unprotected`.
const MAIN_UNPROTECTED = { [RULES("main")]: NO_RULES, [PROTECTION("main")]: NOT_PROTECTED_404 };
const branchPolicyFact = (stdout: string): { state: string; evidence: string } | undefined =>
  envFacts(stdout, "production").find((f) => f.requirement === BRANCH_POLICY);
const callsTo = (calls: string[][], fragment: string): number => calls.filter((c) => c.join(" ").includes(fragment)).length;

describe("host-protection.js — the production branch policy needs classic protection shown in the same run (re-review CR-02, D-30)", () => {
  it("the 33.1-VERIFICATION.md reproduction: main unprotected and the host lists no protected branch → production unprotected, branch policy failed", () => {
    const r = runCheck(base({ ...MAIN_UNPROTECTED, [PROTECTED_LIST]: listOf() }), ["--json"]);
    expect(verdictOf(r.stdout, "branch", "main")).toBe("unprotected");
    expect(verdictOf(r.stdout, "environment", "production")).toBe("unprotected");
    expect(branchPolicyFact(r.stdout)?.state).toBe("failed");
    expect(envLine(r.stdout)).toContain(`${BRANCH_POLICY}: not shown`);
    expect(r.status).toBe(1);
  });

  it("the list names main, whose classic arm this run already read as not protected → branch policy unknown, and main's protection is asked once", () => {
    const r = runCheck(base({ ...MAIN_UNPROTECTED, [PROTECTED_LIST]: listOf({ name: "main", protected: true }) }), ["--json"]);
    expect(branchPolicyFact(r.stdout)?.state).toBe("unknown");
    expect(verdictOf(r.stdout, "environment", "production")).toBe("UNKNOWN - verify");
    expect(callsTo(r.calls, "branches/main/protection")).toBe(1);
  });

  const UNREADABLE_LISTS: Array<[string, unknown]> = [
    ["a 500 answer", { status: 500, body: { message: "Server Error" } }],
    ["a hostile branch name", listOf({ name: "../x", protected: true })],
    ["an element that says protected false", listOf({ name: "hotfix", protected: false })],
    ["a null element", listOf(null)],
    ["two elements (the check asked for one)", listOf({ name: "hotfix", protected: true }, { name: "main", protected: true })],
    ["an empty list that names a further page", { status: 200, body: [], link: '<https://api.github.com/x?page=2>; rel="next"' }],
  ];
  it.each(UNREADABLE_LISTS)("the protected-branch list is %s → branch policy unknown, and no requested path holds `..`", (_label, answer) => {
    const r = runCheck(base({ ...MAIN_UNPROTECTED, [PROTECTED_LIST]: answer }), ["--json"]);
    expect(branchPolicyFact(r.stdout)?.state).toBe("unknown");
    expect(verdictOf(r.stdout, "environment", "production")).toBe("UNKNOWN - verify");
    for (const c of r.calls) expect(c.join(" ")).not.toContain("..");
  });

  it("the first listed branch is protected only by a ruleset (classic 404 `Branch not protected`) → unknown, citing what GitHub documents", () => {
    const r = runCheck(
      base({ ...MAIN_UNPROTECTED, [PROTECTED_LIST]: listOf({ name: "hotfix", protected: true }), [PROTECTION("hotfix")]: NOT_PROTECTED_404 }),
      ["--json"],
    );
    const fact = branchPolicyFact(r.stdout);
    expect(fact?.state).toBe("unknown");
    expect(fact?.evidence).toContain('"Protected branches only"');
    expect(fact?.evidence).toContain("branch protection rules");
    expect(fact?.evidence).toContain("rulesets");
    expect(callsTo(r.calls, "branches/hotfix/protection")).toBe(1);
  });

  it("classic-only strong main → branch policy held from main's classic body, and the protected-branch list is never asked", () => {
    const r = runCheck(base({ [RULES("main")]: NO_RULES, [PROTECTION("main")]: classicOf(CLASSIC_STRONG) }), ["--json"]);
    const fact = branchPolicyFact(r.stdout);
    expect(fact?.state).toBe("held");
    expect(fact?.evidence).toContain('"main"');
    expect(verdictOf(r.stdout, "environment", "production")).toBe("protected");
    expect(callsTo(r.calls, "branches?protected=true")).toBe(0);
    expect(r.status).toBe(0);
  });

  it("a non-admin reading (protection 404 `Not Found`, branches/main protected true) → branch policy unknown: a protected flag also counts rulesets", () => {
    const r = runCheck(
      base({
        [RULES("main")]: NO_RULES,
        [PROTECTION("main")]: { status: 404, body: { message: "Not Found" } },
        [BRANCH("main")]: { status: 200, body: { name: "main", protected: true } },
        [PROTECTED_LIST]: listOf({ name: "main", protected: true }),
      }),
      ["--json"],
    );
    expect(branchPolicyFact(r.stdout)?.state).toBe("unknown");
    expect(verdictOf(r.stdout, "environment", "production")).toBe("UNKNOWN - verify");
  });

  // Since the red-team round of plan 33.1-23 (finding 5), an empty list is `failed` only when the
  // same run shows protection on no branch. Here main's ruleset rules (from base()) and master's
  // protection body both contradict the empty list, so it reads unknown, not failed.
  it("a probed branch that reads protected false while its protection endpoint answers a body is not evidence; an empty list the same run contradicts reads unknown", () => {
    const r = runCheck(
      base({
        [BRANCH("master")]: { status: 200, body: { name: "master", protected: false } },
        [RULES("master")]: NO_RULES,
        [PROTECTION("master")]: classicOf(CLASSIC_STRONG),
        [PROTECTED_LIST]: listOf(),
      }),
      ["--json"],
    );
    expect(verdictOf(r.stdout, "branch", "master")).toBe("UNKNOWN - verify");
    const fact = branchPolicyFact(r.stdout);
    expect(fact?.state).toBe("unknown");
    expect(fact?.evidence).toContain("the host lists no protected branch, yet the same run shows");
    expect(verdictOf(r.stdout, "environment", "production")).toBe("UNKNOWN - verify");
  });

  it("the list names a branch the same run saw answered as another branch → unknown, and its protection is never asked", () => {
    const r = runCheck(
      base({
        [BRANCH("master")]: { status: 200, body: { name: "main", protected: true } },
        [PROTECTED_LIST]: listOf({ name: "master", protected: true }),
        [PROTECTION("master")]: classicOf(CLASSIC_STRONG),
      }),
      ["--json"],
    );
    expect(branchPolicyFact(r.stdout)?.state).toBe("unknown");
    expect(callsTo(r.calls, "branches/master/protection")).toBe(0);
  });

  it.each([
    ["a null policy", null, "failed"],
    ["the custom pair", { protected_branches: false, custom_branch_policies: true }, "unknown"],
  ])("an environment with %s never asks for the protected-branch list", (_label, policy, state) => {
    const r = runCheck(base({ ...MAIN_UNPROTECTED, [ENVS]: envs({ name: "production", deployment_branch_policy: policy }) }), ["--json"]);
    expect(branchPolicyFact(r.stdout)?.state).toBe(state);
    expect(callsTo(r.calls, "branches?protected=true")).toBe(0);
  });

  it("the strong fixture stays all protected: its branch-policy evidence comes from the listed branch hotfix", () => {
    const r = runCheck(base(), ["--json"]);
    expect(r.stdout).toMatch(/^HOST-PROTECTION: 2 protected, 0 unprotected, 0 UNKNOWN - verify$/m);
    const fact = branchPolicyFact(r.stdout);
    expect(fact?.state).toBe("held");
    expect(fact?.evidence).toContain('"hotfix"');
    expect(callsTo(r.calls, "branches?protected=true&per_page=1")).toBe(1);
    expect(callsTo(r.calls, "branches/hotfix/protection")).toBe(1);
    expect(r.status).toBe(0);
  });
});

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
// --branch feat: no ruleset rule, `shape` from feat's protection endpoint, and no protected-branch
// list, so the environment's branch-policy evidence can come only from the classic arm cache.
const featRun = (shape: unknown): ReturnType<typeof runCheck> =>
  runCheck(without(base({ [RULES("feat")]: NO_RULES, [PROTECTION("feat")]: answer(shape) }), PROTECTED_LIST), ["--branch", "feat", "--json"]);

describe("host-protection.js — red-team 33.1-23 finding 1: classic protection is shown only by a protection record (D-30)", () => {
  it("the shape tables are the pinned size (20 non-records, 5 records)", () => {
    expect(NON_RECORDS.length).toBe(20);
    expect(RECORDS.length).toBe(5);
  });

  it.each(NON_RECORDS)("the listed branch's protection answers %s → branch policy unknown, production not protected", (_label, shape) => {
    const r = runCheck(base({ [PROTECTION("hotfix")]: answer(shape) }), ["--json"]);
    expect(branchPolicyFact(r.stdout)?.state).toBe("unknown");
    expect(verdictOf(r.stdout, "environment", "production")).toBe("UNKNOWN - verify");
    expect(verdictOf(r.stdout, "branch", "main")).toBe("protected");
    expect(r.status).toBe(2);
  });

  it.each(NON_RECORDS)("a --branch's own protection answers %s → every row of that branch unknown (never unprotected), and it is not branch-policy evidence", (_label, shape) => {
    const r = featRun(shape);
    expect(verdictOf(r.stdout, "branch", "feat")).toBe("UNKNOWN - verify");
    const facts = factsOf(r.stdout, "branch", "feat");
    expect(facts.length).toBe(jsonBlock(r.stdout).floor.branch.length);
    for (const f of facts) {
      expect(f.state, f.id).toBe("unknown");
      // The qualifier row carries its own evidence (no item is shown); the item rows quote the arm.
      if (f.id !== "no_bypass") expect(f.evidence, f.id).toContain(NOT_A_RECORD);
    }
    expect(branchPolicyFact(r.stdout)?.state).not.toBe("held");
  });

  // The branch floor and the branch-policy row read ONE predicate, so they can never disagree: the
  // row is held from feat's cache entry exactly when the floor read feat's body as a record.
  it.each([...NON_RECORDS.map(([l, s]) => [`non-record: ${l}`, s, false] as const), ...RECORDS.map(([l, s]) => [`record: ${l}`, s, true] as const)])(
    "agreement, %s: the branch floor reads it as a record exactly when the branch-policy row counts it",
    (_label, shape, isRecord) => {
      const r = featRun(shape);
      const items = factsOf(r.stdout, "branch", "feat").filter((f) => f.id !== "no_bypass");
      expect(items.length).toBe(4);
      const floorSawRecord = !items.every((f) => f.evidence.includes(NOT_A_RECORD));
      const policyHeld = branchPolicyFact(r.stdout)?.state === "held";
      expect(floorSawRecord).toBe(isRecord);
      expect(policyHeld).toBe(isRecord);
    },
  );

  it("the red-team case c11b: feat's 200 `Branch not protected` envelope is not a record, so feat is not unprotected and production is not protected", () => {
    const r = featRun({ message: "Branch not protected" });
    expect(verdictOf(r.stdout, "branch", "feat")).toBe("UNKNOWN - verify");
    expect(verdictOf(r.stdout, "environment", "production")).not.toBe("protected");
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

  it.each(MASTER_NOT_SHOWN)("the probe answers %s, then the protected-branch list names master → branch policy unknown, master's protection never asked", (_label, probe) => {
    const r = runCheck(
      base({
        [BRANCH("master")]: probe,
        [PROTECTED_LIST]: listOf({ name: "master", protected: true }),
        [PROTECTION("master")]: classicOf(CLASSIC_STRONG),
      }),
      ["--json"],
    );
    expect(branchPolicyFact(r.stdout)?.state).toBe("unknown");
    expect(verdictOf(r.stdout, "environment", "production")).toBe("UNKNOWN - verify");
    expect(callsTo(r.calls, "branches/master/protection")).toBe(0);
  });

  it("the red-team case d01: master 404 `Branch not found`, --branch master with no rules and a strong body → never protected, never evidence", () => {
    const r = runCheck(
      without(base({ [RULES("master")]: NO_RULES, [PROTECTION("master")]: classicOf(CLASSIC_STRONG) }), PROTECTED_LIST),
      ["--branch", "master", "--json"],
    );
    expect(verdictOf(r.stdout, "branch", "master")).toBe("UNKNOWN - verify");
    expect(branchLine(r.stdout, "master")).toContain("HTTP 404 (Branch not found)");
    expect(branchPolicyFact(r.stdout)?.state).not.toBe("held");
  });
});

// Finding 3: the probe's own `protected` value, read through one ACCEPT entry. The default branch
// is `trunk` (strong rules), so `main` is judged only because the probe showed it exists.
function trunkWithProbedMain(probe: Record<string, unknown>): Fixture {
  return without(
    base({
      [REPO]: { status: 200, body: { default_branch: "trunk", url: "https://api.github.com/repos/octo/repo" } },
      [RULES("trunk")]: rulesOf(...ALL_ROWS_IN(1)),
      [BRANCH("main")]: answer({ name: "main", ...probe }),
      [RULES("main")]: NO_RULES,
      [PROTECTION("main")]: classicOf(CLASSIC_STRONG),
      [PROTECTED_LIST]: listOf({ name: "main", protected: true }),
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

  it.each(GARBLED_PROBE)("the probe says main protected %s while main's protection answers a body → main UNKNOWN - verify, branch policy not held", (_label, v) => {
    const r = runCheck(trunkWithProbedMain({ protected: v }), ["--json"]);
    expect(verdictOf(r.stdout, "branch", "trunk")).toBe("protected");
    expect(verdictOf(r.stdout, "branch", "main")).toBe("UNKNOWN - verify");
    for (const f of factsOf(r.stdout, "branch", "main")) expect(f.state, f.id).toBe("unknown");
    expect(branchPolicyFact(r.stdout)?.state).toBe("unknown");
    expect(verdictOf(r.stdout, "environment", "production")).toBe("UNKNOWN - verify");
  });

  it("the probe says main protected true → main protected, branch policy held from main's classic body", () => {
    const r = runCheck(trunkWithProbedMain({ protected: true }), ["--json"]);
    expect(verdictOf(r.stdout, "branch", "main")).toBe("protected");
    expect(branchPolicyFact(r.stdout)?.state).toBe("held");
    expect(r.status).toBe(0);
  });

  // ABSENT stays neutral: every branch the probe never asked (the default branch, each --branch,
  // a listed branch) has no probe value either, so absence cannot be read as a contradiction
  // without making every such branch unknown. The probe value is only ever a contradiction check,
  // never evidence that a branch is protected.
  it("the probe's answer carries no protected key → neutral: main protected, branch policy held", () => {
    const r = runCheck(trunkWithProbedMain({}), ["--json"]);
    expect(verdictOf(r.stdout, "branch", "main")).toBe("protected");
    expect(branchPolicyFact(r.stdout)?.state).toBe("held");
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

  it.each(OTHER_PLACE_URLS)("the listed branch's protection url names %s → branch policy unknown", (_label, url) => {
    const r = runCheck(base({ [PROTECTION("hotfix")]: classicOf({ ...CLASSIC_STRONG, url: url.replace("/B/", "/hotfix/") }) }), ["--json"]);
    expect(branchPolicyFact(r.stdout)?.state).toBe("unknown");
    expect(verdictOf(r.stdout, "environment", "production")).toBe("UNKNOWN - verify");
  });

  it("the listed branch's protection url names this repository → branch policy held (control)", () => {
    const r = runCheck(base({ [PROTECTION("hotfix")]: classicOf({ ...CLASSIC_STRONG, url: THIS_REPO_URL("hotfix") }) }), ["--json"]);
    expect(branchPolicyFact(r.stdout)?.state).toBe("held");
    expect(r.status).toBe(0);
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
        [REPO]: { status: 200, body: { default_branch: "main", ...(repoUrl === undefined ? {} : { url: repoUrl }) } },
        [RULES("release")]: NO_RULES,
        [PROTECTION("release")]: classicOf({ ...CLASSIC_STRONG, url: THIS_REPO_URL("release") }),
      }),
      ["--branch", "release"],
    );
    expect(verdictOf(r.stdout, "branch", "release")).toBe("UNKNOWN - verify");
  });

  it("the repository answer carries no url and no protection url is present → still protected (an absent protection url stays neutral)", () => {
    const r = runCheck(
      base({ [REPO]: { status: 200, body: { default_branch: "main" } }, [RULES("release")]: NO_RULES, [PROTECTION("release")]: classicOf(CLASSIC_STRONG) }),
      ["--branch", "release"],
    );
    expect(verdictOf(r.stdout, "branch", "release")).toBe("protected");
    expect(r.status).toBe(0);
  });
});

// Finding 5: an empty protected-branch list is `failed` only when the same run shows protection on
// no branch; any protection shown elsewhere in the run contradicts it, and it is then unknown.
describe("host-protection.js — red-team 33.1-23 finding 5: an empty protected-branch list the same run contradicts is unknown, not failed (D-30)", () => {
  const CONTRADICTED: Array<[string, Fixture, string[]]> = [
    ["the default branch main has ruleset rules (the red-team case c20)", base({ [PROTECTED_LIST]: listOf() }), []],
    [
      "the probe reads master protected true",
      base({
        ...MAIN_UNPROTECTED,
        [PROTECTED_LIST]: listOf(),
        [BRANCH("master")]: answer({ name: "master", protected: true }),
        [RULES("master")]: NO_RULES,
        [PROTECTION("master")]: NOT_PROTECTED_404,
      }),
      [],
    ],
    [
      "a --branch reads protected true on the non-admin path",
      base({
        ...MAIN_UNPROTECTED,
        [PROTECTED_LIST]: listOf(),
        [RULES("feat")]: NO_RULES,
        [PROTECTION("feat")]: answer({ message: "Not Found" }, 404),
        [BRANCH("feat")]: answer({ name: "feat", protected: true }),
      }),
      ["--branch", "feat"],
    ],
    [
      "a --branch has a ruleset rule",
      base({ ...MAIN_UNPROTECTED, [PROTECTED_LIST]: listOf(), [RULES("feat")]: rulesOf(RULE("non_fast_forward")), [PROTECTION("feat")]: NOT_PROTECTED_404 }),
      ["--branch", "feat"],
    ],
    [
      "master answers a protection record (though its probe says protected false)",
      base({
        ...MAIN_UNPROTECTED,
        [PROTECTED_LIST]: listOf(),
        [BRANCH("master")]: answer({ name: "master", protected: false }),
        [RULES("master")]: NO_RULES,
        [PROTECTION("master")]: classicOf(CLASSIC_STRONG),
      }),
      [],
    ],
  ];
  it("the table is the pinned size (5)", () => {
    expect(CONTRADICTED.length).toBe(5);
  });

  it.each(CONTRADICTED)("empty list, but %s → branch policy unknown, production not unprotected by this row", (_label, fx, args) => {
    const r = runCheck(fx, [...args, "--json"]);
    const fact = branchPolicyFact(r.stdout);
    expect(fact?.state).toBe("unknown");
    expect(fact?.evidence).toContain("the host lists no protected branch, yet the same run shows");
    expect(verdictOf(r.stdout, "environment", "production")).toBe("UNKNOWN - verify");
  });

  it("empty list, and the probe reads master protected false with no protection anywhere → still failed (plan 33.1-23's truth kept)", () => {
    const r = runCheck(
      base({
        ...MAIN_UNPROTECTED,
        [PROTECTED_LIST]: listOf(),
        [BRANCH("master")]: answer({ name: "master", protected: false }),
        [RULES("master")]: NO_RULES,
        [PROTECTION("master")]: NOT_PROTECTED_404,
      }),
      ["--json"],
    );
    expect(branchPolicyFact(r.stdout)?.state).toBe("failed");
    expect(verdictOf(r.stdout, "environment", "production")).toBe("unprotected");
    expect(r.status).toBe(1);
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
  it("every recorded GET path matches exactly one of seven endpoint shapes, and each shape is used", () => {
    const BR = "[^?]+"; // a branch name as it appears in a path; `/` is kept literal
    const SHAPES: Record<string, RegExp> = {
      repository: /^repos\/\{owner\}\/\{repo\}$/,
      rules: new RegExp(`^repos/\\{owner\\}/\\{repo\\}/rules/branches/${BR}$`),
      branch: new RegExp(`^repos/\\{owner\\}/\\{repo\\}/branches/(?!${BR}/protection$)${BR}$`),
      protection: new RegExp(`^repos/\\{owner\\}/\\{repo\\}/branches/${BR}/protection$`),
      ruleset: /^repos\/\{owner\}\/\{repo\}\/rulesets\/[0-9]+$/,
      environments: /^repos\/\{owner\}\/\{repo\}\/environments$/,
      // The branch-policy evidence of plan 33.1-23: exactly this query, nothing else.
      protectedBranches: /^repos\/\{owner\}\/\{repo\}\/branches\?protected=true&per_page=1$/,
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

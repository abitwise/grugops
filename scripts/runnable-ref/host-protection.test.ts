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
function envs(...list: Array<{ name: string; protection_rules?: unknown[] }>): unknown {
  return { status: 200, body: { total_count: list.length, environments: list } };
}
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
            required_pull_request_reviews: { required_approving_review_count: 1 },
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
// Classic protection that shows every floor row.
const CLASSIC_STRONG = {
  required_pull_request_reviews: { required_approving_review_count: 1 },
  allow_force_pushes: { enabled: false },
  allow_deletions: { enabled: false },
};
const classicOf = (body: Record<string, unknown>): unknown => ({ status: 200, body });
const NOT_PROTECTED_404 = { status: 404, body: { message: "Branch not protected" } };
const branchLine = (stdout: string, name = "main"): string =>
  targetLines(stdout).find((l) => l.startsWith(`branch ${name}:`)) ?? "";

type JsonBlock = {
  ok: boolean;
  floor: { branch: string[] };
  targets: Array<{
    kind: string;
    name: string;
    verdict: string;
    reason: string;
    facts?: Array<{ id: string; requirement: string; state: string; evidence: string }>;
  }>;
  calls: string[][];
};
function jsonBlock(stdout: string): JsonBlock {
  const lines = stdout.trim().split("\n");
  const at = lines.findIndex((l) => l.startsWith("HOST-PROTECTION:"));
  return JSON.parse(lines.slice(at + 1).join("\n")) as JsonBlock;
}
function factOf(stdout: string, branch: string, requirement: string): string | undefined {
  const t = jsonBlock(stdout).targets.find((x) => x.kind === "branch" && x.name === branch);
  return t?.facts?.find((f) => f.requirement === requirement)?.state;
}

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
        [PROTECTION("main")]: classicOf({ allow_force_pushes: { enabled: false }, allow_deletions: { enabled: false } }),
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
    ]);
    const branches = block.targets.filter((t) => t.kind === "branch");
    expect(branches.map((t) => t.name).sort()).toEqual(["main", "master"]);
    for (const t of branches) {
      expect(t.facts, `facts on branch ${t.name}`).toBeDefined();
      expect(t.facts!.map((f) => f.requirement)).toEqual(block.floor.branch);
      expect(t.facts!.map((f) => f.id)).toEqual(["pull_request", "approving_review", "no_force_push", "no_deletion"]);
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
    const readme = readFileSync(join(HERE, "..", "..", "install", "README.md"), "utf8").split(/\r?\n/);
    const heading = readme.findIndex((l) => l === "#### Git-host setup checklist");
    expect(heading, "the checklist heading exists").toBeGreaterThan(-1);
    const first = readme.findIndex((l, i) => i > heading && l.startsWith("- [ ] "));
    expect(first, "a checklist list follows the heading").toBeGreaterThan(heading);
    const items: string[] = [];
    for (let i = first; i < readme.length && readme[i].startsWith("- [ ] "); i++) {
      items.push(readme[i].slice("- [ ] ".length).replace(/[;.]$/, ""));
    }
    const floor = jsonBlock(runCheck(base(), ["--json"]).stdout).floor.branch;
    expect(items.length).toBeGreaterThan(0);
    expect(items).toEqual(floor);
    expect(floor).toEqual(items);
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
      [PROTECTION("main")]: classicOf({ allow_force_pushes: { enabled: false }, allow_deletions: { enabled: false } }),
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

describe("host-protection.js — the production environment (D-19)", () => {
  it("an environment with a required-reviewers rule naming a reviewer → protected", () => {
    const r = runCheck(base());
    expect(verdictOf(r.stdout, "environment", "production")).toBe("protected");
  });

  it("an environment without a reviewer-naming rule → unprotected, exit 1", () => {
    const r = runCheck(
      base({
        [ENVS]: envs({ name: "production", protection_rules: [{ type: "wait_timer", wait_timer: 5 }, { type: "required_reviewers", reviewers: [] }] }),
      }),
    );
    expect(verdictOf(r.stdout, "environment", "production")).toBe("unprotected");
    expect(r.status).toBe(1);
  });

  it("no environment of that name → UNKNOWN - verify, saying grugops cannot tell how production deploys run", () => {
    const r = runCheck(base({ [ENVS]: envs({ name: "staging" }) }));
    expect(verdictOf(r.stdout, "environment", "production")).toBe("UNKNOWN - verify");
    expect(r.stdout).toContain("no environment named production; grugops cannot tell how production deploys run");
    expect(r.status).toBe(2);
  });

  it("an environments call that is not a 200 → UNKNOWN - verify", () => {
    const r = runCheck(base({ [ENVS]: { status: 404, body: { message: "Not Found" } } }));
    expect(verdictOf(r.stdout, "environment", "production")).toBe("UNKNOWN - verify");
    expect(r.status).toBe(2);
  });

  it("environment name: --env wins over the config and the default, and the line names the source", () => {
    const cwd = mkTmp();
    mkdirSync(join(cwd, ".grugops"), { recursive: true });
    writeFileSync(join(cwd, ".grugops", "factory.config.json"), JSON.stringify({ environments: ["dev", "prod"] }));
    const r = runCheck(base({ [ENVS]: envs({ name: "live", protection_rules: [{ type: "required_reviewers", reviewers: REVIEWERS }] }) }), ["--env", "live"], { cwd });
    expect(verdictOf(r.stdout, "environment", "live")).toBe("protected");
    expect(targetLines(r.stdout).find((l) => l.startsWith("environment live:"))).toContain("--env");
  });

  it("environment name: the last `environments` entry of .grugops/factory.config.json, before the kit config", () => {
    const cwd = mkTmp();
    mkdirSync(join(cwd, ".grugops"), { recursive: true });
    mkdirSync(join(cwd, "agent-factory", "config"), { recursive: true });
    writeFileSync(join(cwd, ".grugops", "factory.config.json"), JSON.stringify({ environments: ["dev", "staging", "prod"] }));
    writeFileSync(join(cwd, "agent-factory", "config", "factory.config.json"), JSON.stringify({ environments: ["kit-env"] }));
    const r = runCheck(base({ [ENVS]: envs({ name: "prod", protection_rules: [{ type: "required_reviewers", reviewers: REVIEWERS }] }) }), [], { cwd });
    expect(verdictOf(r.stdout, "environment", "prod")).toBe("protected");
    expect(targetLines(r.stdout).find((l) => l.startsWith("environment prod:"))).toContain(".grugops/factory.config.json");
  });

  it("environment name: an unparseable first config falls through to agent-factory/config/factory.config.json", () => {
    const cwd = mkTmp();
    mkdirSync(join(cwd, ".grugops"), { recursive: true });
    mkdirSync(join(cwd, "agent-factory", "config"), { recursive: true });
    writeFileSync(join(cwd, ".grugops", "factory.config.json"), "{ not json");
    writeFileSync(join(cwd, "agent-factory", "config", "factory.config.json"), JSON.stringify({ environments: ["dev", "prod"] }));
    const r = runCheck(base({ [ENVS]: envs({ name: "prod" }) }), [], { cwd });
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

    const bad = runCheck(base({ [ENVS]: envs({ name: "production" }) }), ["--json"]);
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
});

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

const RULESET_PROTECTED = [{ type: "pull_request" }, { type: "non_fast_forward" }];

describe("host-protection.js — branch verdicts", () => {
  it("ruleset evidence: an active ruleset with pull_request and non_fast_forward → protected", () => {
    const r = runCheck({
      "auth status": { exit: 0 },
      [api("repos/{owner}/{repo}")]: { status: 200, body: { default_branch: "main" } },
      [api("repos/{owner}/{repo}/rules/branches/main?per_page=100")]: { status: 200, body: RULESET_PROTECTED },
      // Task 2 widened the targets: `master` is probed (absent here) and the production
      // environment is always inspected (protected here), so the run can still be all-protected.
      [api("repos/{owner}/{repo}/branches/master")]: { status: 404, body: { message: "Branch not found" } },
      [api("repos/{owner}/{repo}/environments?per_page=100")]: {
        status: 200,
        body: {
          total_count: 1,
          environments: [
            { name: "production", protection_rules: [{ type: "required_reviewers", reviewers: [{ type: "User" }] }] },
          ],
        },
      },
    });
    expect(r.stdout).toContain("branch main: protected — an active ruleset requires a pull request and blocks force pushes");
    expect(r.stdout).toMatch(/^HOST-PROTECTION: 2 protected, 0 unprotected, 0 UNKNOWN - verify$/m);
    expect(r.status).toBe(0);
  });
});

// ── Task 2 fixtures ─────────────────────────────────────────────────────────────────────────────
// base() is a repository whose default branch `main` is protected by a ruleset, whose `master`
// does not exist, and whose `production` environment requires a named reviewer — every target
// `protected`. Each case overrides only the keys its behaviour is about.
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
  return {
    "auth status": { exit: 0 },
    [REPO]: { status: 200, body: { default_branch: "main" } },
    [RULES("main")]: { status: 200, body: RULESET_PROTECTED },
    [BRANCH("master")]: { status: 404, body: { message: "Branch not found" } },
    [ENVS]: envs({ name: "production", protection_rules: [{ type: "required_reviewers", reviewers: REVIEWERS }] }),
    ...over,
  };
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

  it("classic protection with required reviews and force pushes disabled → protected", () => {
    const r = runCheck(
      base({
        [RULES("main")]: NO_RULES,
        [PROTECTION("main")]: {
          status: 200,
          body: { required_pull_request_reviews: { required_approving_review_count: 1 }, allow_force_pushes: { enabled: false } },
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

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
import { mkdtempSync, readFileSync, rmSync, writeFileSync, existsSync } from "node:fs";
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
    });
    expect(r.stdout).toContain("branch main: protected — an active ruleset requires a pull request and blocks force pushes");
    expect(r.stdout).toMatch(/^HOST-PROTECTION: 1 protected, 0 unprotected, 0 UNKNOWN - verify$/m);
    expect(r.status).toBe(0);
  });
});

// host-protection.ts — the read-only git-host protection check (Phase 33.1, D-19).
//
// WHY THIS EXISTS. The git host is the hard floor for merge and deploy (D-19): branch protection
// or rulesets on the protected branches, and a production deployment environment with required
// reviewers, are what actually stop an unreviewed merge or an unapproved deploy. grugops does not
// configure the host and never will from this file. It only REPORTS whether that floor is in
// place, so the gate (workflow 05) and the release (workflow 12) can record the answer honestly
// instead of assuming it.
//
// WHAT IT REPORTS. One line per inspected target, each carrying exactly one of three words:
//   `protected`         — positive evidence from the host that the rule is enforced
//   `unprotected`       — positive evidence from the host that it is not
//   `UNKNOWN - verify`  — anything else: no `gh`, no auth, no permission, an unmeasured status,
//                         an ambiguous answer, or output this check cannot parse
// and one summary line, `HOST-PROTECTION: <p> protected, <u> unprotected, <k> UNKNOWN - verify`.
// The check NEVER answers `protected` without positive evidence. When in doubt the answer is
// `UNKNOWN - verify` (project rule: never fabricate a passing gate).
//
// READ-ONLY BY CONSTRUCTION. Every call goes through runGh(), and there are exactly two argv
// shapes: `gh auth status` and `gh api --method GET -i <path>`. No field flag is ever passed
// (`gh api` switches to POST when a field is given), and the method is pinned to GET.
//
// The D-12 contract (uniform across all kit-shipped runnables):
//   node tools/grugops/host-protection.js [--json]
//     exit 0 → every inspected target is `protected`
//     exit 1 → at least one target is `unprotected`
//     exit 2 → none `unprotected`, but at least one `UNKNOWN - verify`, or the check could not run.
//              Exit 2 is never a pass.
//     stdout → human-readable lines in CLEAR PROFESSIONAL VOICE (the audit trail)
//
// TEST SEAM. `--gh-script <path>` runs `node <path> <args…>` in place of `gh`. It exists so the
// test suite can drive a Node stub instead of the network; the gate and release workflows never
// pass it.
//
// This file imports node: builtins ONLY: the installer copies the compiled .js alone into the
// host repository (tools/grugops/host-protection.js), where no node_modules and no central kit
// are present.
//
// VOICE DISCIPLINE (CLAUDE.md hard rule): every string this routine emits is clear professional
// English. This is a safety surface.

import { spawnSync } from "node:child_process";

type Verdict = "protected" | "unprotected" | "UNKNOWN - verify";

interface Target {
  kind: "branch" | "environment";
  name: string;
  verdict: Verdict;
  reason: string;
}

interface ApiResult {
  status: number | undefined; // undefined → the status line could not be read
  body: unknown; // undefined → no parseable JSON body
  problem: string | undefined; // why the call could not be read, when it could not
}

// --- args -------------------------------------------------------------------------------------
const argv = process.argv.slice(2);

function flagValue(name: string): string | undefined {
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === name) return argv[i + 1];
    if (a.startsWith(`${name}=`)) return a.slice(name.length + 1);
  }
  return undefined;
}

const ghScript = flagValue("--gh-script");

// --- the one gh launcher ------------------------------------------------------------------------
function runGh(args: string[]): { status: number | null; stdout: string; spawnError: string | undefined } {
  const options = { shell: false, encoding: "utf8" as const, timeout: 20000 };
  const r =
    ghScript === undefined
      ? spawnSync("gh", args, options)
      : spawnSync(process.execPath, [ghScript, ...args], options);
  return {
    status: r.status,
    stdout: typeof r.stdout === "string" ? r.stdout : "",
    spawnError: r.error === undefined ? undefined : r.error.message,
  };
}

// GET one REST path. The status comes from the first `HTTP/<version> <3 digits>` line of the
// header block, the body is the JSON after the first blank line (CRLF or LF). Any failure to read
// either is reported as a problem, which every caller maps to `UNKNOWN - verify`.
function apiGet(path: string): ApiResult {
  const r = runGh(["api", "--method", "GET", "-i", path]);
  if (r.spawnError !== undefined) {
    return { status: undefined, body: undefined, problem: `gh could not be run (${r.spawnError})` };
  }
  const split = /\r?\n\r?\n/.exec(r.stdout);
  const head = split === null ? r.stdout : r.stdout.slice(0, split.index);
  const rest = split === null ? "" : r.stdout.slice(split.index + split[0].length);
  let status: number | undefined;
  for (const line of head.split(/\r?\n/)) {
    const m = /^HTTP\/[0-9.]+ ([0-9]{3})(?:\s|$)/.exec(line);
    if (m !== null) {
      status = Number(m[1]);
      break;
    }
  }
  if (status === undefined) {
    return { status: undefined, body: undefined, problem: "gh returned no readable HTTP status" };
  }
  let body: unknown;
  try {
    body = JSON.parse(rest);
  } catch {
    body = undefined;
  }
  return { status, body, problem: undefined };
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

// Untrusted text (branch names, host messages) is printed with control characters replaced and
// its length bounded, so a hostile value cannot rewrite the audit line it appears in.
function printable(s: string): string {
  const clean = s.replace(/[\u0000-\u001f\u007f-\u009f]/g, "?");
  return clean.length > 200 ? `${clean.slice(0, 200)}…` : clean;
}

// Encode a branch name for a REST path, keeping `/` literal (branch names may contain it).
function branchPath(name: string): string {
  return name.split("/").map(encodeURIComponent).join("/");
}

// --- the check --------------------------------------------------------------------------------
const targets: Target[] = [];

function branchVerdict(name: string): Target {
  const rules = apiGet(`repos/{owner}/{repo}/rules/branches/${branchPath(name)}?per_page=100`);
  if (rules.status === 200 && Array.isArray(rules.body)) {
    const types = new Set(rules.body.map((r) => (isObject(r) && typeof r.type === "string" ? r.type : "")));
    if (types.has("pull_request") && types.has("non_fast_forward")) {
      return {
        kind: "branch",
        name,
        verdict: "protected",
        reason: "an active ruleset requires a pull request and blocks force pushes",
      };
    }
  }
  return {
    kind: "branch",
    name,
    verdict: "UNKNOWN - verify",
    reason:
      rules.problem ?? `the rules endpoint answered HTTP ${rules.status} without the evidence this check needs`,
  };
}

const auth = runGh(["auth", "status"]);
if (auth.spawnError !== undefined || auth.status !== 0) {
  targets.push({
    kind: "branch",
    name: "(default branch)",
    verdict: "UNKNOWN - verify",
    reason:
      auth.spawnError !== undefined
        ? "gh is not available on this machine, so the host could not be asked"
        : "`gh auth status` failed, so the host could not be asked",
  });
} else {
  const repo = apiGet("repos/{owner}/{repo}");
  if (repo.status === 200 && isObject(repo.body) && typeof repo.body.default_branch === "string") {
    targets.push(branchVerdict(repo.body.default_branch));
  } else {
    targets.push({
      kind: "branch",
      name: "(default branch)",
      verdict: "UNKNOWN - verify",
      reason: repo.problem ?? `the repository endpoint answered HTTP ${repo.status}; the default branch is unknown`,
    });
  }
}

// --- report -----------------------------------------------------------------------------------
let p = 0;
let u = 0;
let k = 0;
for (const t of targets) {
  if (t.verdict === "protected") p++;
  else if (t.verdict === "unprotected") u++;
  else k++;
  console.log(`${t.kind} ${printable(t.name)}: ${t.verdict} — ${printable(t.reason)}`);
}
console.log(`HOST-PROTECTION: ${p} protected, ${u} unprotected, ${k} UNKNOWN - verify`);
process.exit(u > 0 ? 1 : k > 0 ? 2 : 0);

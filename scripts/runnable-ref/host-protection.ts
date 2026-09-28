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
// TARGETS. The default branch always; `main` and `master` when the host says they exist (a 404
// omits them, any other answer reports them as `UNKNOWN - verify`); each `--branch <name>`
// (repeatable); and one production deployment environment.
//
// BRANCH EVIDENCE: ONE CANONICAL TABLE (plan 33.1-17, CR-01). `BRANCH_FLOOR` below is the branch
// floor, one row per item of the branch checklist in install/README.md §5 ("Git-host setup
// checklist"), whose requirement strings it carries byte for byte (a test binds the two). A branch
// is `protected` only when EVERY row is positively shown; no code path outside the table produces
// `protected` for a branch. Each row is read from two arms, each read at most once per branch:
//   - the ruleset arm, `rules/branches/<b>` (the active rules from every ruleset that applies).
//     Read in full (200, a JSON array, no `Link: rel="next"`), read partially (a further page
//     exists), or not read (any other answer, which is quoted).
//   - the classic arm, `branches/<b>/protection`, asked only when the ruleset arm leaves some row
//     not shown. 200 → its body is read field by field. 404 `Branch not protected` (what an admin
//     sees) → the host shows no classic protection. 404 `Not Found` (what a non-admin sees,
//     protected or not) → ask `branches/<b>`: `.protected === false` about the branch asked for →
//     no classic protection; `.protected === true` → classic protection exists but its rules are
//     not readable with this token. Anything else → not readable, quoting the status.
//     (Measured endpoint behaviour: 33.1-RESEARCH.md § Q4.)
// Each arm gives each row one of three states: `held` (positively shown), `failed` (read, and not
// shown) or `unknown` (not readable). THE UNION RULE: GitHub enforces rulesets and classic branch
// protection together, and when rules are aggregated "the most restrictive version of the rule
// applies" (docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/
// managing-rulesets/about-rulesets). So a row is `held` when EITHER arm shows it, `failed` only
// when BOTH arms were read and neither shows it, and `unknown` otherwise. A weak arm never weakens
// a strong one, and a row neither arm can read never counts as shown. On the ruleset arm a row not
// shown is `failed` only when the rule list was read in full (a later page may carry the rule).
// THE ABSENT-FIELD MAPPING: a field that is missing or of an unexpected type is never read as its
// safe default. An approval count must be an integer (`Number.isInteger`) >= 1 to show the
// approval row; an integer 0 does not show it; a missing or non-integer count is `unknown`. On a
// classic 200 body, `allow_force_pushes` / `allow_deletions` must be objects with
// `enabled === false` to show their row (`enabled === true` → `failed`, anything else →
// `unknown`). A classic 200 body with no `required_pull_request_reviews` key is `failed` for the
// pull-request and approval rows: whether GitHub omits the key when reviews are off is observed
// behaviour, not documented, and `failed` is fail-safe because neither `failed` nor `unknown` is
// ever `held`.
// THE VERDICT: every row `held` → protected; any row `failed` → unprotected; otherwise
// UNKNOWN - verify. The reason names each row that is not held with the evidence from both arms;
// a protected reason names which arm showed each row. `--json` publishes the table
// (`floor.branch`) and, per branch target, one `facts` entry per row.
//
// ENVIRONMENT EVIDENCE. `environments` 200: the named environment with a `required_reviewers`
// rule whose `reviewers` list is non-empty → protected; present without one → unprotected;
// absent → UNKNOWN - verify (grugops cannot tell how production deploys run). The name is
// `--env <name>`, else the last entry of `environments` in `.grugops/factory.config.json`, then
// `agent-factory/config/factory.config.json` (relative to the working directory; an unparseable
// file or a non-array value falls through), else `production`. The line names the source.
//
// READ-ONLY BY CONSTRUCTION. Every call goes through runGh(), and there are exactly two argv
// shapes: `gh auth status` and `gh api --method GET -i <path>`. No field flag is ever passed
// (`gh api` switches to POST when a field is given), and the method is pinned to GET.
//
// The D-12 contract (uniform across all kit-shipped runnables):
//   node tools/grugops/host-protection.js [--json] [--branch <name>]... [--env <name>]
//     exit 0 → every inspected target is `protected`
//     exit 1 → at least one target is `unprotected`
//     exit 2 → none `unprotected`, but at least one `UNKNOWN - verify`, or the check could not run.
//              Exit 2 is never a pass.
//     stdout → human-readable lines in CLEAR PROFESSIONAL VOICE (the audit trail)
//     stdout → with --json, a { ok, floor: { branch }, targets: [{ kind, name, verdict, reason,
//              facts? }], calls } block after the human lines; `floor.branch` is the BRANCH_FLOOR
//              requirement strings in table order, every branch target carries `facts` (one
//              { id, requirement, state, evidence } per row), and `calls` is the argv of every gh
//              call, so a recorded note shows how each verdict was reached
//
// TEST SEAM. `--gh-script <path>` runs `node <path> <args…>` in place of `gh`. It exists so the
// test suite can drive a Node stub instead of the network; the gate and release workflows never
// pass it, and --json shows every call it answered.
//
// This file imports node: builtins ONLY: the installer copies the compiled .js alone into the
// host repository (tools/grugops/host-protection.js), where no node_modules and no central kit
// are present.
//
// VOICE DISCIPLINE (CLAUDE.md hard rule): every string this routine emits is clear professional
// English. This is a safety surface.

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

// An unexpected failure must never surface as exit 1, which the contract reserves for "at least
// one target is unprotected". Anything thrown is the "could not run" answer: exit 2.
// The message is printed through printable() (IN-04): it may carry host text.
process.on("uncaughtException", (err) => {
  console.log(`HOST-PROTECTION: the check could not run (${printable(err instanceof Error ? err.message : String(err))}) — UNKNOWN - verify`);
  process.exit(2);
});

type Verdict = "protected" | "unprotected" | "UNKNOWN - verify";

// One row's state on one arm, or combined across both: positively shown, read and not shown, or
// not readable.
type FactState = "held" | "failed" | "unknown";

interface ArmReading {
  state: FactState;
  evidence: string;
}

interface Fact {
  id: string;
  requirement: string;
  state: FactState;
  evidence: string;
}

interface Target {
  kind: "branch" | "environment";
  name: string;
  verdict: Verdict;
  reason: string;
  facts?: Fact[]; // present on every branch target
}

interface ApiResult {
  status: number | undefined; // undefined → the status line could not be read
  body: unknown; // undefined → no parseable JSON body
  next: boolean; // the response names a further page (Link rel="next")
  problem: string | undefined; // why the call could not be read, when it could not
}

// --- args -------------------------------------------------------------------------------------
const argv = process.argv.slice(2);
const wantJson = argv.includes("--json");

// Every value of a "--flag value" or "--flag=value" pair; a value that is itself a flag is not
// taken as a value.
function flagValues(name: string): string[] {
  const out: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === name) {
      const v = argv[i + 1];
      if (v !== undefined && !v.startsWith("-")) out.push(v);
    } else if (a.startsWith(`${name}=`)) {
      out.push(a.slice(name.length + 1));
    }
  }
  return out;
}
function flagValue(name: string): string | undefined {
  const all = flagValues(name);
  return all.length > 0 ? all[all.length - 1] : undefined;
}

const ghScript = flagValue("--gh-script");
if (ghScript !== undefined) {
  // Said on stderr so the stdout line contract is unchanged, and said every time, so a run that
  // took its answers from a script rather than from gh is never mistaken for a host reading.
  process.stderr.write(`host-protection: --gh-script test seam in use (${ghScript}); these verdicts do not come from gh.\n`);
}

// --- the one gh launcher ------------------------------------------------------------------------
const calls: string[][] = [];

function runGh(args: string[]): { status: number | null; stdout: string; spawnError: string | undefined } {
  calls.push([...args]);
  const options = {
    shell: false,
    encoding: "utf8" as const,
    timeout: 20000,
    env: { ...process.env, GH_PROMPT_DISABLED: "1", GH_NO_UPDATE_NOTIFIER: "1" },
  };
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
    return { status: undefined, body: undefined, next: false, problem: `gh could not be run (${r.spawnError})` };
  }
  const split = /\r?\n\r?\n/.exec(r.stdout);
  const head = split === null ? r.stdout : r.stdout.slice(0, split.index);
  const rest = split === null ? "" : r.stdout.slice(split.index + split[0].length);
  let status: number | undefined;
  let next = false;
  for (const line of head.split(/\r?\n/)) {
    const m = /^HTTP\/[0-9.]+ ([0-9]{3})(?:\s|$)/.exec(line);
    if (m !== null && status === undefined) status = Number(m[1]);
    if (/^link:/i.test(line) && /rel="next"/.test(line)) next = true;
  }
  if (status === undefined) {
    return { status: undefined, body: undefined, next: false, problem: "gh returned no readable HTTP status" };
  }
  let body: unknown;
  try {
    body = JSON.parse(rest);
  } catch {
    body = undefined;
  }
  return { status, body, next, problem: undefined };
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

// How a call answered, for an UNKNOWN - verify reason: the problem, or the status and message.
function answered(res: ApiResult): string {
  if (res.problem !== undefined) return res.problem;
  const message = isObject(res.body) && typeof res.body.message === "string" ? ` (${printable(res.body.message)})` : "";
  return `HTTP ${res.status}${message}`;
}

// Untrusted text (branch names, host messages) is printed with control characters replaced and
// its length bounded, so a hostile value cannot rewrite the audit line it appears in. A single host
// value is bounded at 200 characters; a composed reason or fact evidence (our own text around host
// values that were each bounded already) at REASON_MAX, since a branch reason names up to four
// floor rows with the evidence from both arms.
const REASON_MAX = 2000;
function printable(s: string, max = 200): string {
  const clean = s.replace(/[\u0000-\u001f\u007f-\u009f]/g, "?");
  return clean.length > max ? `${clean.slice(0, max)}…` : clean;
}

// A branch name this check will put in a REST path: git's own rules refuse the rest, and refusing
// `.`/`..` segments keeps a crafted name from resolving to a different endpoint.
function usableBranch(name: string): boolean {
  if (name.length === 0 || name.startsWith("-")) return false;
  if (/[\u0000- \u007f-\u009f]/.test(name)) return false;
  return name.split("/").every((seg) => seg !== "" && seg !== "." && seg !== "..");
}

// Encode a branch name for a REST path, keeping `/` literal (branch names may contain it).
function branchPath(name: string): string {
  return name.split("/").map(encodeURIComponent).join("/");
}

// --- the branch floor -------------------------------------------------------------------------
// The rules the ruleset arm read, and whether that was the whole list.
interface RulesetArm {
  read: "full" | "partial" | "none";
  rules: Record<string, unknown>[]; // every rule object with a string `type` on the page read
  why: string; // why the list was not read in full ("" when it was)
}

// What the classic arm read: a protection body, positive evidence that there is no classic
// protection, or nothing readable.
type ClassicArm =
  | { kind: "body"; body: Record<string, unknown> }
  | { kind: "none"; evidence: string }
  | { kind: "unreadable"; evidence: string };

interface FloorRow {
  id: string;
  requirement: string;
  // Over the rules read: `held` when shown, `failed` when not shown on them, `unknown` when a
  // qualifying rule is there but its field cannot be read. rulesetReading() turns `failed` into
  // `unknown` when the list was not read in full.
  fromRuleset: (rules: Record<string, unknown>[]) => ArmReading;
  // Over a classic protection 200 body.
  fromClassic: (body: Record<string, unknown>) => ArmReading;
}

function rulesOfType(rules: Record<string, unknown>[], type: string): Record<string, unknown>[] {
  return rules.filter((r) => r.type === type);
}

// Which ruleset a rule came from, for the evidence line.
function rulesetOf(rule: Record<string, unknown>): string {
  const id = rule.ruleset_id;
  return typeof id === "number" || typeof id === "string" ? `ruleset ${printable(String(id))}` : "an active ruleset";
}

// A rule of `type` on the ruleset arm shows the row by being present.
function rulePresent(type: string): (rules: Record<string, unknown>[]) => ArmReading {
  return (rules) => {
    const found = rulesOfType(rules, type);
    if (found.length > 0) return { state: "held", evidence: `${rulesetOf(found[0])} has a ${type} rule` };
    return { state: "failed", evidence: `no active ruleset has a ${type} rule` };
  };
}

// A classic `{ enabled }` object shows the row only when `enabled === false`.
function classicDisabled(key: string): (body: Record<string, unknown>) => ArmReading {
  return (body) => {
    const v = body[key];
    if (isObject(v) && v.enabled === false) return { state: "held", evidence: `classic ${key}.enabled is false` };
    if (isObject(v) && v.enabled === true) return { state: "failed", evidence: `classic ${key}.enabled is true` };
    return { state: "unknown", evidence: `classic protection carries no readable ${key}.enabled` };
  };
}

// An approval count shows the approval row only as an integer >= 1.
function approvalCount(count: unknown): FactState {
  if (!Number.isInteger(count)) return "unknown";
  return (count as number) >= 1 ? "held" : "failed";
}

// THE CANONICAL BRANCH FLOOR. Each `requirement` is byte-equal to a line of the branch checklist
// in install/README.md §5; host-protection.test.ts binds the two both ways and holds a weakening
// fixture per row. Nothing outside this table decides whether a branch is `protected`.
const BRANCH_FLOOR: readonly FloorRow[] = [
  {
    id: "pull_request",
    requirement: "requires a pull request before merging",
    fromRuleset: rulePresent("pull_request"),
    fromClassic: (body) => {
      const rpr = body.required_pull_request_reviews;
      if (isObject(rpr)) return { state: "held", evidence: "classic protection requires pull request reviews" };
      if (rpr === undefined) return { state: "failed", evidence: "classic protection does not require pull request reviews" };
      return { state: "unknown", evidence: "classic required_pull_request_reviews has an unexpected shape" };
    },
  },
  {
    id: "approving_review",
    requirement: "requires at least one approving review",
    fromRuleset: (rules) => {
      const prs = rulesOfType(rules, "pull_request");
      if (prs.length === 0) return { state: "failed", evidence: "no active ruleset has a pull_request rule" };
      const counts = prs.map((r) => (isObject(r.parameters) ? r.parameters.required_approving_review_count : undefined));
      const at = counts.findIndex((c) => approvalCount(c) === "held");
      if (at >= 0) {
        return { state: "held", evidence: `a pull_request rule in ${rulesetOf(prs[at])} requires ${String(counts[at])} approving review(s)` };
      }
      if (counts.some((c) => approvalCount(c) === "unknown")) {
        return { state: "unknown", evidence: "a pull_request rule carries no integer required_approving_review_count" };
      }
      return { state: "failed", evidence: `every pull_request rule requires ${counts.map(String).join(", ")} approving reviews` };
    },
    fromClassic: (body) => {
      const rpr = body.required_pull_request_reviews;
      if (rpr === undefined) return { state: "failed", evidence: "classic protection does not require pull request reviews" };
      if (!isObject(rpr)) return { state: "unknown", evidence: "classic required_pull_request_reviews has an unexpected shape" };
      const count = rpr.required_approving_review_count;
      const state = approvalCount(count);
      if (state === "unknown") {
        return { state, evidence: "classic protection carries no integer required_approving_review_count" };
      }
      return { state, evidence: `classic protection requires ${String(count)} approving review(s)` };
    },
  },
  {
    id: "no_force_push",
    requirement: "blocks force pushes",
    fromRuleset: rulePresent("non_fast_forward"),
    fromClassic: classicDisabled("allow_force_pushes"),
  },
  {
    id: "no_deletion",
    requirement: "restricts deletions",
    fromRuleset: rulePresent("deletion"),
    fromClassic: classicDisabled("allow_deletions"),
  },
];

function rulesetReading(row: FloorRow, arm: RulesetArm): ArmReading {
  if (arm.read === "none") return { state: "unknown", evidence: arm.why };
  const r = row.fromRuleset(arm.rules);
  if (r.state === "failed" && arm.read === "partial") {
    return { state: "unknown", evidence: `${r.evidence} on the first page, but ${arm.why}` };
  }
  return r;
}

function classicReading(row: FloorRow, arm: ClassicArm): ArmReading {
  if (arm.kind === "body") return row.fromClassic(arm.body);
  return { state: arm.kind === "none" ? "failed" : "unknown", evidence: arm.evidence };
}

// THE UNION RULE: held when either arm shows the row, failed only when both arms read it and
// neither shows it, unknown otherwise.
function combineArms(a: FactState, b: FactState): FactState {
  if (a === "held" || b === "held") return "held";
  if (a === "failed" && b === "failed") return "failed";
  return "unknown";
}

// Every row `unknown`, for a branch target the check could not read at all.
function unreadFacts(why: string): Fact[] {
  return BRANCH_FLOOR.map((row) => ({ id: row.id, requirement: row.requirement, state: "unknown", evidence: why }));
}

function branchUnknown(name: string, reason: string): Target {
  return { kind: "branch", name, verdict: "UNKNOWN - verify", reason, facts: unreadFacts(reason) };
}

function readRulesetArm(bp: string): RulesetArm {
  const res = apiGet(`repos/{owner}/{repo}/rules/branches/${bp}?per_page=100`);
  if (res.status === 200 && Array.isArray(res.body)) {
    const rules = res.body.filter((r): r is Record<string, unknown> => isObject(r) && typeof r.type === "string");
    return res.next
      ? { read: "partial", rules, why: "the rule list runs past one page" }
      : { read: "full", rules, why: "" };
  }
  return { read: "none", rules: [], why: `the rules endpoint answered ${answered(res)}` };
}

function readClassicArm(name: string, bp: string): ClassicArm {
  const prot = apiGet(`repos/{owner}/{repo}/branches/${bp}/protection`);
  if (prot.status === 200 && isObject(prot.body)) return { kind: "body", body: prot.body };
  if (prot.status === 404 && isObject(prot.body) && prot.body.message === "Branch not protected") {
    return { kind: "none", evidence: "the host reports no classic branch protection" };
  }
  if (prot.status === 404 && isObject(prot.body) && prot.body.message === "Not Found") {
    const br = apiGet(`repos/{owner}/{repo}/branches/${bp}`);
    // Only an answer about the branch that was asked for counts (a renamed branch's old name
    // answers with the new branch's record).
    if (br.status === 200 && isObject(br.body) && br.body.name === name) {
      if (br.body.protected === true) {
        return { kind: "unreadable", evidence: "classic protection present; its rules are not readable with this token" };
      }
      if (br.body.protected === false) return { kind: "none", evidence: "the branch reports no classic protection" };
    }
    return {
      kind: "unreadable",
      evidence: `the protection endpoint answered HTTP 404 (Not Found) and the branch endpoint answered ${answered(br)}`,
    };
  }
  return { kind: "unreadable", evidence: `the protection endpoint answered ${answered(prot)}` };
}

// --- branch verdict ---------------------------------------------------------------------------
function branchVerdict(name: string): Target {
  if (!usableBranch(name)) return branchUnknown(name, "this is not a branch name the check can ask the host about");
  const bp = branchPath(name);

  const rulesetArm = readRulesetArm(bp);
  const fromRules = BRANCH_FLOOR.map((row) => rulesetReading(row, rulesetArm));
  // The classic arm is read only when the ruleset arm leaves some row not shown.
  const classicArm: ClassicArm | undefined = fromRules.every((r) => r.state === "held") ? undefined : readClassicArm(name, bp);
  const fromClassic = BRANCH_FLOOR.map((row): ArmReading =>
    classicArm === undefined
      ? { state: "unknown", evidence: "not read (the ruleset arm shows every item)" }
      : classicReading(row, classicArm),
  );

  const facts: Fact[] = BRANCH_FLOOR.map((row, i) => ({
    id: row.id,
    requirement: row.requirement,
    state: combineArms(fromRules[i].state, fromClassic[i].state),
    evidence: `ruleset: ${fromRules[i].evidence}; classic: ${fromClassic[i].evidence}`,
  }));

  if (facts.every((f) => f.state === "held")) {
    const shownBy = facts.map((f, i) => {
      const r = fromRules[i].state === "held";
      const c = fromClassic[i].state === "held";
      const arm = r && c ? "ruleset and classic protection" : r ? "ruleset" : "classic protection";
      return `${f.requirement} (${arm})`;
    });
    return { kind: "branch", name, verdict: "protected", reason: `every branch floor item is shown: ${shownBy.join(", ")}`, facts };
  }
  const verdict: Verdict = facts.some((f) => f.state === "failed") ? "unprotected" : "UNKNOWN - verify";
  const reason = facts
    .filter((f) => f.state !== "held")
    .map((f) => `${f.requirement}: ${f.state === "failed" ? "not shown" : "not readable"} (${f.evidence})`)
    .join("; ");
  return { kind: "branch", name, verdict, reason, facts };
}

// --- environment verdict ----------------------------------------------------------------------
function environmentName(): { name: string; source: string } {
  const flag = flagValue("--env");
  if (flag !== undefined && flag.length > 0) return { name: flag, source: "the --env flag" };
  for (const rel of [".grugops/factory.config.json", "agent-factory/config/factory.config.json"]) {
    const p = join(process.cwd(), rel);
    if (!existsSync(p)) continue;
    try {
      const parsed: unknown = JSON.parse(readFileSync(p, "utf8"));
      if (isObject(parsed) && Array.isArray(parsed.environments) && parsed.environments.length > 0) {
        const last: unknown = parsed.environments[parsed.environments.length - 1];
        if (typeof last === "string" && last.length > 0) {
          return { name: last, source: `the last "environments" entry of ${rel}` };
        }
      }
    } catch {
      // unreadable or unparseable: fall through to the next source
    }
  }
  return { name: "production", source: 'the documented default (no --env flag and no usable "environments" list)' };
}

function environmentVerdict(name: string, source: string): Target {
  const at = `; environment name from ${source}`;
  const res = apiGet("repos/{owner}/{repo}/environments?per_page=100");
  if (res.status === 200 && isObject(res.body) && Array.isArray(res.body.environments)) {
    const env = res.body.environments.find((e) => isObject(e) && e.name === name);
    if (!isObject(env)) {
      const why = res.next
        ? `no environment named ${name} on the first page of a longer list`
        : `no environment named ${name}`;
      return {
        kind: "environment",
        name,
        verdict: "UNKNOWN - verify",
        reason: `${why}; grugops cannot tell how production deploys run${at}`,
      };
    }
    const rules = Array.isArray(env.protection_rules) ? env.protection_rules : [];
    const reviewers = rules.find(
      (r) => isObject(r) && r.type === "required_reviewers" && Array.isArray(r.reviewers) && r.reviewers.length > 0,
    );
    if (isObject(reviewers) && Array.isArray(reviewers.reviewers)) {
      const n = reviewers.reviewers.length;
      return {
        kind: "environment",
        name,
        verdict: "protected",
        reason: `a required-reviewers rule names ${n} reviewer${n === 1 ? "" : "s"}${at}`,
      };
    }
    return {
      kind: "environment",
      name,
      verdict: "unprotected",
      reason: `the environment has no required-reviewers rule that names a reviewer${at}`,
    };
  }
  return {
    kind: "environment",
    name,
    verdict: "UNKNOWN - verify",
    reason: `the environments endpoint answered ${answered(res)}${at}`,
  };
}

// --- the check --------------------------------------------------------------------------------
const targets: Target[] = [];
const extraBranches = flagValues("--branch");
const env = environmentName();

let cannotAsk: string | undefined;
if (ghScript !== undefined && !existsSync(ghScript)) {
  cannotAsk = "gh is not available on this machine, so the host could not be asked";
} else {
  const auth = runGh(["auth", "status"]);
  if (auth.spawnError !== undefined) cannotAsk = "gh is not available on this machine, so the host could not be asked";
  else if (auth.status !== 0) cannotAsk = "`gh auth status` failed, so the host could not be asked";
}

if (cannotAsk !== undefined) {
  for (const name of ["(default branch)", ...extraBranches]) {
    targets.push(branchUnknown(name, cannotAsk));
  }
  targets.push({
    kind: "environment",
    name: env.name,
    verdict: "UNKNOWN - verify",
    reason: `${cannotAsk}; environment name from ${env.source}`,
  });
} else {
  const names: string[] = [];
  const repo = apiGet("repos/{owner}/{repo}");
  if (repo.status === 200 && isObject(repo.body) && typeof repo.body.default_branch === "string") {
    names.push(repo.body.default_branch);
  } else {
    targets.push(branchUnknown("(default branch)", `the repository endpoint answered ${answered(repo)}; the default branch is unknown`));
  }
  for (const b of ["main", "master"]) {
    if (names.includes(b)) continue;
    const res = apiGet(`repos/{owner}/{repo}/branches/${b}`);
    // GitHub answers a RENAMED branch's old name with the branch it was renamed to (measured
    // 2026-09-27: `branches/master` → 200 with `"name": "main"` on a repository whose master was
    // renamed). Only an answer about the branch that was asked for shows the branch exists.
    if (res.status === 200 && isObject(res.body) && res.body.name === b) names.push(b);
    else if (res.status === 200 && isObject(res.body) && typeof res.body.name === "string") continue;
    else if (res.status !== 404) {
      targets.push(branchUnknown(b, `could not tell whether the branch exists: the branch endpoint answered ${answered(res)}`));
    }
  }
  for (const b of extraBranches) if (!names.includes(b)) names.push(b);
  for (const b of names) targets.push(branchVerdict(b));
  targets.push(environmentVerdict(env.name, env.source));
}

// --- report -----------------------------------------------------------------------------------
let p = 0;
let u = 0;
let k = 0;
for (const t of targets) {
  if (t.verdict === "protected") p++;
  else if (t.verdict === "unprotected") u++;
  else k++;
  console.log(`${t.kind} ${printable(t.name)}: ${t.verdict} — ${printable(t.reason, REASON_MAX)}`);
}
console.log(`HOST-PROTECTION: ${p} protected, ${u} unprotected, ${k} UNKNOWN - verify`);
const exitCode = u > 0 ? 1 : k > 0 ? 2 : 0;
if (wantJson) {
  console.log(
    JSON.stringify(
      {
        ok: exitCode === 0,
        floor: { branch: BRANCH_FLOOR.map((row) => row.requirement) },
        targets: targets.map((t) => ({
          kind: t.kind,
          name: printable(t.name),
          verdict: t.verdict,
          reason: printable(t.reason, REASON_MAX),
          ...(t.facts === undefined
            ? {}
            : {
                facts: t.facts.map((f) => ({
                  id: f.id,
                  requirement: f.requirement,
                  state: f.state,
                  evidence: printable(f.evidence, REASON_MAX),
                })),
              }),
        })),
        calls,
      },
      null,
      2,
    ),
  );
}
process.exit(exitCode);

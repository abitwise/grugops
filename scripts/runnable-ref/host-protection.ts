// host-protection.ts — the read-only git-host protection check (Phase 33.1, D-19).
//
// WHY THIS EXISTS. The git host is the hard floor for merge and deploy (D-19): branch protection
// or rulesets on the protected branches, and a production deployment environment with required
// reviewers, are what actually stop an unreviewed merge or an unapproved deploy. grugops does not
// configure the host and never will from this file. It only REPORTS whether that floor is in
// place, so the gate (workflow 05) and the release (workflow 12) can record the answer honestly
// instead of assuming it.
//
// WHAT IT REPORTS. One line per inspected target, and one summary line,
// `HOST-PROTECTION: <p> protected, <u> unprotected, <k> UNKNOWN - verify`. Each target line
// carries exactly one of three words:
//   `protected`         — every row of the canonical table for that target (`BRANCH_FLOOR` for a
//                         branch, `ENVIRONMENT_FLOOR` for the production environment) is positively
//                         shown by the host, from rules the checked account cannot bypass
//   `unprotected`       — the host answered, and at least one row is read and not met
//   `UNKNOWN - verify`  — anything else: no `gh`, no auth, no permission, an unmeasured status,
//                         an ambiguous answer, or output this check cannot parse
// The two tables are the git-host setup checklist in install/README.md §5, one row per checklist
// line, byte for byte (a test binds each table to its list, both ways).
// The check NEVER answers `protected` without positive evidence. When in doubt the answer is
// `UNKNOWN - verify` (project rule: never fabricate a passing gate).
//
// TARGETS. The default branch always; `main` and `master` when the host says they exist (a 404
// omits them, any other answer reports them as `UNKNOWN - verify`); each `--branch <name>`
// (repeatable); and one production deployment environment. A name the same run saw answered as
// ANOTHER branch (a renamed branch's old name), or did not show to exist (the probe's 404 or any
// other answer that names no such branch), is never judged and never evidence: a `--branch` of
// that name, or a branch whose classic answer is about another branch, is `UNKNOWN - verify` on
// every row, and the branch-policy row never counts a read under that name (contradictedName).
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
//     not shown. 200 with a protection record (ACCEPT.classicProtectionRecord: an enforce_admins
//     object with a boolean `enabled`, and no `message` or `protected` key) → its body is read field
//     by field; a 200 that is not a record is not readable (a `url` that is present must name this
//     branch's protection endpoint under the repository the `repos/{owner}/{repo}` answer's own
//     `url` names, same host included; an absent `url` is not required). 404 `Branch not protected`
//     (what an admin sees) → the host shows no classic protection. 404 `Not Found` (what a
//     non-admin sees, protected or not) → ask `branches/<b>`: `.protected === false` about the
//     branch asked for → no classic protection; `.protected === true` → classic protection exists
//     but its rules are not readable with this token; an answer about another branch → the whole
//     branch is `UNKNOWN - verify`. Anything else → not readable, quoting the status. A protection
//     body for a branch the main/master probe read as `protected` false, or as any present value
//     that is not a boolean (ACCEPT.branchProtectedFlag) → the whole branch is `UNKNOWN - verify`
//     (the same run contradicts itself); an absent `protected` stays neutral. A branch the probe
//     read as `protected` true whose rule list, read in full, names no rule and whose classic
//     endpoint reports none is `UNKNOWN - verify` too, never `unprotected`.
//     (Measured endpoint behaviour: 33.1-RESEARCH.md § Q4.)
// Each arm gives each row one of three states: `held` (positively shown), `failed` (read, and not
// shown) or `unknown` (not readable). THE UNION RULE: GitHub enforces rulesets and classic branch
// protection together, and when rules are aggregated "the most restrictive version of the rule
// applies" (docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/
// managing-rulesets/about-rulesets). So a row is `held` when EITHER arm shows it, `failed` only
// when BOTH arms were read and neither shows it, and `unknown` otherwise. A weak arm never weakens
// a strong one, and a row neither arm can read never counts as shown. On the ruleset arm a row not
// shown is `failed` only when the rule list was read in full (a later page may carry the rule).
// THE ONE READER (plan 33.1-22, D-30). Every host value that can make a row `held`, or a source
// `binds`, is read through readFact(value, ACCEPT.<name>), and every other host field through
// hostField(value, key). The ACCEPT table is checked when the module loads: no entry reads an
// absent or null value as `held`, and an entry reads absence as `failed` only with a written reason.
// A test census (host-protection-floor.test.ts) holds that no host field is read anywhere else.
// THE ABSENT-FIELD MAPPING: a field that is missing or of an unexpected type is never read as its
// safe default. An approval count must be a safe integer >= 1 to show the approval row; the integer
// 0 does not show it; a missing, negative, fractional or unsafe count is `unknown`. An entry of the
// rule list that is not an object with a string `type` shows nothing and makes the list read
// partially, so a row no readable rule shows is `unknown`, not `failed`. On a
// classic 200 body, `allow_force_pushes` / `allow_deletions` must be objects with
// `enabled === false` to show their row (`enabled === true` → `failed`, anything else →
// `unknown`). A classic 200 body with no `required_pull_request_reviews` key is `failed` for the
// pull-request and approval rows: whether GitHub omits the key when reviews are off is observed
// behaviour, not documented, and `failed` is fail-safe because neither `failed` nor `unknown` is
// ever `held`.
// BYPASS (plan 33.1-19, D-30). The floor must hold against the account the check runs under,
// which is usually the account the agent works under. A source shows an item only when that
// account cannot bypass it. Ruleset arm: each rule that could show an item names its ruleset by
// `ruleset_id`; an id that is not a safe positive integer is never put in a path and the rule
// shows nothing. Each distinct id is read once per run through `rulesets/<id>`, at most
// MAX_RULESET_READS per branch (the rest show nothing). The rule binds only when that read is a
// 200 about the same ruleset reporting `enforcement: "active"`, `target: "branch"` (any other or
// absent value of either is not readable), `source` and `source_type` agreeing with the rule list's
// `ruleset_source` and `ruleset_source_type` for that id (a disagreement, or either side absent or
// garbled, is not readable), and `current_user_can_bypass: "never"`; `always`,
// `pull_requests_only` and `exempt` are read as bypassable; any other answer is not readable. So
// an item is `held` on the ruleset arm when at least one binding rule shows it. Classic arm: the
// body binds only with `enforce_admins.enabled === true` (`false` is read as bypassable, since a
// 200 from the protection endpoint shows the account reads it as an administrator; anything else
// is not readable), and for the pull-request and approval items only with
// `bypass_pull_request_allowances` present and listing no user, team or app (a non-empty list is not
// readable: the check cannot tell whether the account is listed; a missing key is not readable
// either, per D-30, and is never read as "no allowance"). The last row of
// the table, `no_bypass`, is the qualifier: `held` when every item is held (each item already
// counts only binding sources), `failed` when an item fails and a source that would show it was
// read as bypassable, `unknown` otherwise; its evidence names each bypassable or unreadable source.
// THE VERDICT: every row `held` → protected; any row `failed` → unprotected; otherwise
// UNKNOWN - verify. The reason names each row that is not held with the evidence from both arms;
// a protected reason names which arm showed each row. `--json` publishes the table
// (`floor.branch`) and, per branch target, one `facts` entry per row.
//
// ENVIRONMENT EVIDENCE: ONE CANONICAL TABLE (plan 33.1-20, CR-01, D-30 `floor-full`).
// `ENVIRONMENT_FLOOR` is the production floor, one row per item of the production checklist in
// install/README.md §5, read from the environment `GET environments?per_page=100` lists under the
// configured name: the environment exists; a `required_reviewers` rule names at least one reviewer;
// that rule has `prevent_self_review === true`; `can_admins_bypass === false`; and
// `deployment_branch_policy` is exactly `{ protected_branches: true, custom_branch_policies: false }`
// AND the same run shows CLASSIC branch protection on some branch (re-review CR-02, plan 33.1-23).
// GitHub defines "Protected branches only" for branch protection rules, lets every branch deploy
// when no branch has them, and does not mention rulesets there (docs.github.com/en/actions/
// reference/workflows-and-actions/deployments-and-environments, fetched 2026-09-29), while
// `GET branches?protected=true` also lists ruleset-protected branches (docs.github.com/en/rest/
// branches/branches). So the evidence is a protection record from `branches/<b>/protection` (the
// same ACCEPT.classicProtectionRecord the branch floor reads, so the two never disagree): first
// from a classic arm this run already read (each branch's classic arm is read at most once per run),
// else from `GET branches?protected=true&per_page=1`, read at most once per run and only for the
// documented pair: an empty list is `failed` (every branch can deploy) unless the same run shows
// protection on some branch (a ruleset rule, a classic record, or `protected: true`), which makes
// it `unknown` (red-team finding 5 of plan 33.1-23); one element naming a usable
// branch with `protected: true` → that branch's classic arm is read, and anything but a body (a
// ruleset-only branch, a non-admin 404, any other answer) is `unknown`; any other answer is
// `unknown`. A branch the same run contradicts (a name answered as another branch or not shown to
// exist, or a body for a branch the probe read as `protected` false or unreadable) is never
// evidence.
// A field that is missing or of an unexpected type is `unknown`, never its safe default;
// `protection_rules` that is not an array is `unknown`; a `null` branch policy is `failed`; a custom
// branch policy is `unknown` (the check does not read which branches it allows). A reviewer counts
// only in the documented shape (`type` "User" or "Team" and a `reviewer` whose `id` is a positive
// integer); a reviewers list holding anything else is `unknown` (re-review WR-01). An entry of
// `protection_rules` that is not an object with a string `type` can only turn a row that would be
// `failed` into `unknown`; what a readable rule shows stays shown. No environment of that name is `unknown` for every row, and
// the verdict says grugops cannot tell how production deploys run. Two environments of that name,
// or two `required_reviewers` rules in it, are `unknown` too: the check never takes the first
// match of a host list (nor the first of two HTTP status lines). Same verdict rule as branches.
// Reviewer identities are never printed; the evidence counts them. The name is `--env <name>`,
// else the last entry of `environments` in `.grugops/factory.config.json`, else the last entry in
// `agent-factory/config/factory.config.json` (both relative to the working directory; an
// unparseable file or a non-array value falls through), else `production`. The line names the
// source.
//
// READ-ONLY BY CONSTRUCTION. Every call goes through runGh(), and there are exactly two argv
// shapes: `gh auth status` and `gh api --method GET -i <path>`. No field flag is ever passed
// (`gh api` switches to POST when a field is given), and the method is pinned to GET. The
// protected-branch list is a GET too: its query (`?protected=true&per_page=1`) is part of the path,
// never a field flag.
//
// The D-12 contract (uniform across all kit-shipped runnables):
//   node tools/grugops/host-protection.js [--json] [--branch <name>]... [--env <name>]
//     exit 0 → every inspected target is `protected`
//     exit 1 → at least one target is `unprotected`
//     exit 2 → none `unprotected`, but at least one `UNKNOWN - verify`, or the check could not run.
//              Exit 2 is never a pass.
//     stdout → human-readable lines in CLEAR PROFESSIONAL VOICE (the audit trail)
//     stdout → with --json, a { ok, floor: { branch, environment }, targets: [{ kind, name,
//              verdict, reason, facts }], calls } block after the human lines; `floor.branch` and
//              `floor.environment` are the BRANCH_FLOOR and ENVIRONMENT_FLOOR requirement strings
//              in table order, every target carries `facts` (one { id, requirement, state,
//              evidence } per row of its table), and `calls` is the argv of every gh call, so a
//              recorded note shows how each verdict was reached
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
  console.log(`HOST-PROTECTION: the check could not run (${err instanceof Error ? printable(err.message) : hostText(err)}) — UNKNOWN - verify`);
  process.exit(2);
});

type Verdict = "protected" | "unprotected" | "UNKNOWN - verify";

// One row's state on one arm, or combined across both: positively shown, read and not shown, or
// not readable.
type FactState = "held" | "failed" | "unknown";

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
  facts?: Fact[]; // present on every branch and environment target
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
  let statusLines = 0;
  let next = false;
  for (const line of head.split(/\r?\n/)) {
    const m = /^HTTP\/[0-9.]+ ([0-9]{3})(?:\s|$)/.exec(line);
    if (m !== null) {
      statusLines++;
      if (status === undefined) status = Number(m[1]);
    }
    if (/^link:/i.test(line) && /rel="next"/.test(line)) next = true;
  }
  if (status === undefined) {
    return { status: undefined, body: undefined, next: false, problem: "gh returned no readable HTTP status" };
  }
  // Never first-match-wins (red-team finding 4, D-30): a header block with more than one status
  // line does not say which status answers.
  if (statusLines > 1) {
    return { status: undefined, body: undefined, next: false, problem: "gh printed more than one HTTP status line in one header block" };
  }
  // gh's exit status must agree with the status it printed (D-30: an answer the same run
  // contradicts is never evidence). Measured 2026-09-29 on gh 2.96.0: `gh api --method GET -i`
  // exits 0 on HTTP 200 and 1 on HTTP 404 (fixtures/gh-stub.mjs models the same). So exit 0 goes
  // with a status below 400 and a non-zero exit with 400 or above; any other pairing, or no exit
  // status at all (the process was killed), is a problem. A 404 with exit 1 is still read, which
  // every "not protected" and "not found" path depends on.
  const exitOk = r.status === 0;
  if (r.status === null || exitOk !== status < 400) {
    const exit = r.status === null ? "without an exit status" : `with status ${r.status}`;
    return { status: undefined, body: undefined, next: false, problem: `gh exited ${exit} but printed HTTP ${status}` };
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

// --- the one reader (plan 33.1-22, D-30) --------------------------------------------------------
// Every host value that can make a floor row `held`, or a source `binds`, is read through
// readFact(value, ACCEPT.<name>). An ACCEPT entry says which values show the fact (`held`), which
// values are read and do not show it (`failed`, optional), and everything else is `unknown`. So a
// value is `held` only when an entry names it as held, and the table is checked when the module
// loads (assertAcceptTable): no entry may read an absent (`undefined`) or `null` value as held, and
// an entry may read absence as `failed` only when it carries the written reason why.
interface AcceptEntry {
  readonly held: (v: unknown) => boolean;
  readonly failed?: (v: unknown) => boolean;
  readonly absentFailedWhy?: string;
}

function isEmptyList(v: unknown): boolean {
  return Array.isArray(v) && v.length === 0;
}

function isPositiveSafeInteger(v: unknown): v is number {
  return typeof v === "number" && Number.isSafeInteger(v) && v > 0;
}

// One element of a `required_reviewers` rule's `reviewers` list in the documented shape (re-review
// WR-01): `type` "User" or "Team", and a plain-object `reviewer` whose `id` is a positive safe
// integer. It reads through hostField, so a non-object element or reviewer is never of this shape.
function isReviewerElement(e: unknown): boolean {
  const type = hostField(e, "type");
  return (type === "User" || type === "Team") && isPositiveSafeInteger(hostField(hostField(e, "reviewer"), "id"));
}

const ACCEPT = {
  // bypass_pull_request_allowances inside classic required_pull_request_reviews: held only when it is
  // present and lists no user, team or app. There is no `failed`: a list with members is not
  // readable, because the check cannot tell whether the account it runs under is on it.
  bypassAllowances: {
    held: (v: unknown) => isObject(v) && isEmptyList(v.users) && isEmptyList(v.teams) && isEmptyList(v.apps),
  },
  // Classic enforce_admins: the protection applies to administrators only as `{ enabled: true }`.
  enforceAdmins: {
    held: (v: unknown) => isObject(v) && v.enabled === true,
    failed: (v: unknown) => isObject(v) && v.enabled === false,
  },
  // Classic required_pull_request_reviews: a plain object shows that reviews are required.
  classicReviews: {
    held: (v: unknown) => isObject(v),
    failed: (v: unknown) => v === undefined,
    absentFailedWhy:
      "whether GitHub omits required_pull_request_reviews when reviews are off is observed, not documented; failed is fail-safe because it is never held",
  },
  // required_approving_review_count on a ruleset rule or classic protection: a safe integer >= 1
  // shows the approval row; only the integer 0 is read and not met; anything else is unknown.
  approvalCount: {
    held: (v: unknown) => isPositiveSafeInteger(v),
    failed: (v: unknown) => v === 0,
  },
  // Classic allow_force_pushes / allow_deletions: the row is shown only as `{ enabled: false }`.
  disabledFlag: {
    held: (v: unknown) => isObject(v) && v.enabled === false,
    failed: (v: unknown) => isObject(v) && v.enabled === true,
  },
  // One entry of a rule list (the ruleset rules of a branch, or an environment's protection_rules):
  // readable only as an object with a string `type`.
  ruleEntry: {
    held: (v: unknown) => isObject(v) && typeof v.type === "string",
  },
  // current_user_can_bypass on `GET rulesets/<id>`: only "never" binds; the three documented other
  // values are read as bypassable; anything else is not readable.
  rulesetBypass: {
    held: (v: unknown) => v === "never",
    failed: (v: unknown) => v === "always" || v === "pull_requests_only" || v === "exempt",
  },
  // `enforcement` on `GET rulesets/<id>`: only "active" is enforced. GitHub documents "disabled"
  // and "evaluate" as not enforced, but the rule list named this ruleset as applying, so a body
  // saying either contradicts the same run and is not readable (no `failed`); so is any other value.
  // An absent value is not readable (D-30); a real answer carries it (fixtures model that).
  rulesetEnforcement: {
    held: (v: unknown) => v === "active",
  },
  // `target` on `GET rulesets/<id>`: a ruleset binds a branch only when it targets branches. A
  // "tag", "push" or "repository" ruleset, an absent target or any other value is not readable.
  rulesetTarget: {
    held: (v: unknown) => v === "branch",
  },
  // `source` on `GET rulesets/<id>` and `ruleset_source` on each rule of the rule list: the owner
  // of the ruleset, readable only as a non-empty string. Both sides must name the same one (red-team
  // case P of plan 33.1-22); readFact reads each side, and the agreement is compared after.
  rulesetSource: {
    held: (v: unknown) => typeof v === "string" && v.length > 0,
  },
  // `source_type` on the ruleset body and `ruleset_source_type` on its rules, compared the same way
  // whenever either side carries it.
  rulesetSourceType: {
    held: (v: unknown) => typeof v === "string" && v.length > 0,
  },
  // The environment object `GET environments` listed under the configured name.
  environmentPresent: {
    held: (v: unknown) => isObject(v),
  },
  // A required_reviewers rule's `reviewers`: held for a non-empty list whose every element has the
  // documented shape; failed for an empty list; any other value, including a list holding one
  // element of another shape, is unknown (WR-01).
  reviewerList: {
    held: (v: unknown) => Array.isArray(v) && v.length > 0 && v.every(isReviewerElement),
    failed: (v: unknown) => isEmptyList(v),
  },
  preventSelfReview: {
    held: (v: unknown) => v === true,
    failed: (v: unknown) => v === false,
  },
  canAdminsBypass: {
    held: (v: unknown) => v === false,
    failed: (v: unknown) => v === true,
  },
  // deployment_branch_policy: held only as the documented protected-branches pair; null is the
  // documented "any branch may deploy".
  deploymentBranchPolicy: {
    held: (v: unknown) => isObject(v) && v.protected_branches === true && v.custom_branch_policies === false,
    failed: (v: unknown) => v === null,
    absentFailedWhy: "GitHub documents a null deployment_branch_policy as: any branch may deploy to the environment",
  },
  // The answer of `GET branches?protected=true&per_page=1` (re-review CR-02, plan 33.1-23): held for
  // a list of exactly the one element asked for, a plain object with `protected === true` and a
  // `name` this check will put in a REST path; failed for an empty list (the host lists no protected
  // branch); anything else, including two elements when one was asked for, is unknown. A held list
  // is not evidence by itself: it also names ruleset-protected branches, so the named branch's
  // classic protection is read next.
  protectedBranchList: {
    held: (v: unknown) => {
      if (!Array.isArray(v) || v.length !== 1) return false;
      const first: unknown = v[0];
      return isObject(first) && first.protected === true && typeof first.name === "string" && usableBranch(first.name);
    },
    failed: (v: unknown) => isEmptyList(v),
  },
  // A 200 answer of `branches/<b>/protection` is a branch protection record (red-team finding 1 of
  // plan 33.1-23) only as a plain object that carries `enforce_admins` as an object with a boolean
  // `enabled`, and carries neither `message` (GitHub's error envelope) nor `protected` (a field of
  // the branch object, not of a protection record). GitHub's documented example answer carries
  // enforce_admins, and its schema marks no property required; the branch floor cannot show any
  // classic row without a readable enforce_admins anyway (classicBinding), so requiring it here
  // costs no row the floor could have held. Anything else (`{}`, an error envelope, a branch
  // object) is not a record: the classic arm is not readable, and it is no branch-policy evidence.
  // The main/master probe's `protected` on `branches/<b>` about the branch asked for (red-team
  // finding 3 of plan 33.1-23): true is held, false is failed, and anything else present (a string,
  // null, a number, an object) is unknown. It is only ever a contradiction check against a
  // protection body, never evidence that a branch is protected.
  branchProtectedFlag: {
    held: (v: unknown) => v === true,
    failed: (v: unknown) => v === false,
  },
  classicProtectionRecord: {
    held: (v: unknown) =>
      isObject(v) && v.message === undefined && v.protected === undefined && isObject(v.enforce_admins) && typeof v.enforce_admins.enabled === "boolean",
  },
  // What the classic arm read for a branch (the check's own ClassicArm kind): only a protection
  // record (ACCEPT.classicProtectionRecord, decided once in readClassicArmOnce) shows classic
  // branch protection. The branch floor and the branch-policy row both read this one kind, so they
  // can never disagree about a body. There is no `failed`.
  classicArmShown: {
    held: (v: unknown) => v === "body",
  },
} satisfies Record<string, AcceptEntry>;

// The load-time self-check. A violation throws, and the uncaughtException handler above turns that
// into exit 2 ("the check could not run") before any gh call is made.
function assertAcceptTable(): void {
  for (const [name, entry] of Object.entries(ACCEPT) as Array<[string, AcceptEntry]>) {
    if (entry.held(undefined) || entry.held(null)) {
      throw new Error(`ACCEPT.${name} reads an absent or null value as held`);
    }
    const failsAbsent = entry.failed !== undefined && (entry.failed(undefined) || entry.failed(null));
    const why = entry.absentFailedWhy;
    if (failsAbsent && (typeof why !== "string" || why.trim().length === 0)) {
      throw new Error(`ACCEPT.${name} reads an absent or null value as failed without a written reason`);
    }
  }
}
assertAcceptTable();

// The one reader: `held` when the entry accepts the value as held, `failed` when it reads it as not
// shown, `unknown` otherwise. It returns nothing else and reads nothing else.
function readFact(value: unknown, accept: AcceptEntry): FactState {
  if (accept.held(value)) return "held";
  if (accept.failed !== undefined && accept.failed(value)) return "failed";
  return "unknown";
}

// The one accessor for every other field of a host answer: the value under `key` when `value` is a
// plain object, `undefined` otherwise. Outside readFact and the ACCEPT predicates, nothing else
// indexes a host answer (brief 33.1-GAP-PLANNING-BRIEF.md §2.2, DC-1).
function hostField(value: unknown, key: string): unknown {
  return isObject(value) ? value[key] : undefined;
}

// A source's binding from one readFact state: held → `binds`, failed → `bypassable`, unknown →
// `unknown`, each with the evidence written for that state.
function toBinding(state: FactState, evidence: { held: string; failed: string; unknown: string }): Binding {
  if (state === "held") return { state: "binds", evidence: evidence.held };
  if (state === "failed") return { state: "bypassable", evidence: evidence.failed };
  return { state: "unknown", evidence: evidence.unknown };
}

// A row reading from one readFact state, with the evidence written for that state.
function says(state: FactState, evidence: { held: string; failed: string; unknown: string }): Shown {
  return { state, evidence: evidence[state] };
}

// A list that could not be read whole (a garbage entry) cannot show that a row is missing: a row
// that would be `failed` is `unknown`. A row a readable entry shows is unchanged.
function downgrade(state: FactState, partial: boolean): FactState {
  return partial && state === "failed" ? "unknown" : state;
}

// How a call answered, for an UNKNOWN - verify reason: the problem, or the status and message.
function answered(res: ApiResult): string {
  if (res.problem !== undefined) return res.problem;
  const text = hostField(res.body, "message");
  const message = typeof text === "string" ? ` (${printable(text)})` : "";
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

// THE ONE WAY A HOST VALUE ENTERS EVIDENCE TEXT (red-team finding 5 of plan 33.1-22). Never
// `String(v)` or `${v}` on a host value: a parsed object such as `{ "toString": 1 }` throws there,
// and a throw is the whole-run "could not run" (exit 2), which would hide another target's
// `unprotected` (exit 1). The value is written as JSON (a string keeps its quotes), bounded and
// cleaned by printable(); anything JSON cannot write falls back to a fixed phrase.
function hostText(v: unknown, max = 200): string {
  if (v === undefined) return "(absent)";
  try {
    const s: unknown = JSON.stringify(v);
    return typeof s === "string" ? printable(s, max) : "(a value this check cannot print)";
  } catch {
    return "(a value this check cannot print)";
  }
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
// `elsewhere`: the same run shows the answer is about ANOTHER branch (a renamed branch's old name
// answers with the new branch's record), so nothing asked under this name is evidence about it.
type ClassicArm =
  | { kind: "body"; body: Record<string, unknown> }
  | { kind: "none"; evidence: string }
  | { kind: "unreadable"; evidence: string }
  | { kind: "elsewhere"; evidence: string };

// What one source (one ruleset rule, or the classic protection body) says about one item, before
// asking whether it binds the account the check runs under.
interface Shown {
  state: FactState;
  evidence: string;
}

// Whether a source binds the account the check runs under (D-30): `binds` (that account cannot
// bypass it), `bypassable` (read, and that account can bypass it) or `unknown` (not readable).
interface Binding {
  state: "binds" | "bypassable" | "unknown";
  evidence: string;
}

// An item of the branch floor: shown by a ruleset rule of `ruleType`, or by the classic body.
interface FloorItem {
  kind: "item";
  id: string;
  requirement: string;
  ruleType: string;
  // Over one rule of `ruleType`: `held` when it shows the item, `failed` when it does not,
  // `unknown` when its field cannot be read.
  fromRule: (rule: Record<string, unknown>) => Shown;
  // Over a classic protection 200 body.
  fromClassic: (body: Record<string, unknown>) => Shown;
  // The classic arm also needs an empty pull request bypass allowance for this item.
  reviewItem: boolean;
}

// The qualifier row: read from the items' sources, never from a source of its own.
interface FloorQualifier {
  kind: "qualifier";
  id: string;
  requirement: string;
}

type FloorRow = FloorItem | FloorQualifier;

function rulesOfType(rules: Record<string, unknown>[], type: string): Record<string, unknown>[] {
  return rules.filter((r) => hostField(r, "type") === type);
}

// A `ruleset_id` this check will put in a REST path: a safe positive integer, nothing else
// (T-33.1-191). A string, a fraction, 0, a negative or an unsafe integer never reaches a path.
function usableRulesetId(v: unknown): v is number {
  return isPositiveSafeInteger(v);
}

// Which ruleset a rule came from, for the evidence line.
function rulesetOf(rule: Record<string, unknown>): string {
  const id = hostField(rule, "ruleset_id");
  return usableRulesetId(id) ? `ruleset ${id}` : "an active ruleset";
}

// A rule of the item's type shows it by being a readable rule entry.
function ruleShows(rule: Record<string, unknown>): Shown {
  return says(readFact(rule, ACCEPT.ruleEntry), {
    held: `${rulesetOf(rule)} has a ${hostText(hostField(rule, "type"))} rule`,
    failed: "an entry of the rule list does not show the item",
    unknown: "an entry of the rule list is not a readable rule",
  });
}

// A classic `{ enabled }` object shows the item only when `enabled === false`.
function classicDisabled(key: string): (body: Record<string, unknown>) => Shown {
  return (body) =>
    says(readFact(hostField(body, key), ACCEPT.disabledFlag), {
      held: `classic ${key}.enabled is false`,
      failed: `classic ${key}.enabled is true`,
      unknown: `classic protection carries no readable ${key}.enabled`,
    });
}

// Classic required_pull_request_reviews, as both review rows read it first.
const CLASSIC_REVIEWS_SAYS = {
  held: "classic protection requires pull request reviews",
  failed: "classic protection does not require pull request reviews",
  unknown: "classic required_pull_request_reviews has an unexpected shape",
};

// The approval count's evidence: the count when it is read, and what is expected when it is not.
function approvalSays(where: string, count: unknown): { held: string; failed: string; unknown: string } {
  return {
    held: `${where} requires ${hostText(count)} approving review(s)`,
    failed: `${where} requires ${hostText(count)} approving review(s)`,
    unknown: `${where} carries no required_approving_review_count this check can read (a whole number of 0 or more)`,
  };
}

// THE CANONICAL BRANCH FLOOR. Each `requirement` is byte-equal to a line of the branch checklist
// in install/README.md §5; host-protection.test.ts binds the two both ways and holds a weakening
// fixture per row. Nothing outside this table decides whether a branch is `protected`.
const BRANCH_FLOOR: readonly FloorRow[] = [
  {
    kind: "item",
    id: "pull_request",
    requirement: "requires a pull request before merging",
    ruleType: "pull_request",
    fromRule: ruleShows,
    fromClassic: (body) => says(readFact(hostField(body, "required_pull_request_reviews"), ACCEPT.classicReviews), CLASSIC_REVIEWS_SAYS),
    reviewItem: true,
  },
  {
    kind: "item",
    id: "approving_review",
    requirement: "requires at least one approving review",
    ruleType: "pull_request",
    fromRule: (rule) => {
      const count = hostField(hostField(rule, "parameters"), "required_approving_review_count");
      return says(readFact(count, ACCEPT.approvalCount), approvalSays(`a pull_request rule in ${rulesetOf(rule)}`, count));
    },
    fromClassic: (body) => {
      const rpr = hostField(body, "required_pull_request_reviews");
      const reviews = readFact(rpr, ACCEPT.classicReviews);
      if (reviews !== "held") return says(reviews, CLASSIC_REVIEWS_SAYS);
      const count = hostField(rpr, "required_approving_review_count");
      return says(readFact(count, ACCEPT.approvalCount), approvalSays("classic protection", count));
    },
    reviewItem: true,
  },
  {
    kind: "item",
    id: "no_force_push",
    requirement: "blocks force pushes",
    ruleType: "non_fast_forward",
    fromRule: ruleShows,
    fromClassic: classicDisabled("allow_force_pushes"),
    reviewItem: false,
  },
  {
    kind: "item",
    id: "no_deletion",
    requirement: "restricts deletions",
    ruleType: "deletion",
    fromRule: ruleShows,
    fromClassic: classicDisabled("allow_deletions"),
    reviewItem: false,
  },
  {
    kind: "qualifier",
    id: "no_bypass",
    requirement: "does not let administrators or the account the agent works under bypass it",
  },
];

const FLOOR_ITEMS: readonly FloorItem[] = BRANCH_FLOOR.filter((row): row is FloorItem => row.kind === "item");

// --- binding: can the account the check runs under bypass a source? (D-30) --------------------
// At most this many distinct rulesets are read per branch (T-33.1-192: each read is a gh spawn
// with a 20 s timeout). A rule from a ruleset beyond the bound shows nothing: its binding is
// `unknown`.
const MAX_RULESET_READS = 20;
// One read per ruleset per run, whichever branch asks first.
// Each entry keeps the body's own `source` and `source_type`, so every branch that asks can hold
// them against its own rule list.
interface RulesetRead {
  binding: Binding;
  source: unknown;
  sourceType: unknown;
}
const rulesetBindingCache = new Map<number, RulesetRead>();

// `GET rulesets/<id>`: GitHub documents `current_user_can_bypass` as one of `always`,
// `pull_requests_only`, `never` and `exempt`. Only `never` binds. The answer counts only when it
// is about the ruleset that was asked for, and only when the same body says the ruleset is
// enforced (`enforcement` "active") and targets branches (`target` "branch"): a ruleset that is
// disabled, only evaluated, or aimed at tags, pushes or the repository binds no branch row, and
// its bypass value is then not read either (red-team finding 2 of plan 33.1-22, D-30).
// `bypass_actors` is never read (T-33.1-193).
function readRulesetBinding(id: number): RulesetRead {
  const cached = rulesetBindingCache.get(id);
  if (cached !== undefined) return cached;
  const res = apiGet(`repos/{owner}/{repo}/rulesets/${id}`);
  let b: Binding;
  const enforcement = hostField(res.body, "enforcement");
  const target = hostField(res.body, "target");
  if (res.status === 200 && hostField(res.body, "id") === id && readFact(enforcement, ACCEPT.rulesetEnforcement) !== "held") {
    b = { state: "unknown", evidence: `ruleset ${id} does not report enforcement "active" (it reports ${hostText(enforcement)}), so it is not shown to bind` };
  } else if (res.status === 200 && hostField(res.body, "id") === id && readFact(target, ACCEPT.rulesetTarget) !== "held") {
    b = { state: "unknown", evidence: `ruleset ${id} does not report target "branch" (it reports ${hostText(target)}), so it cannot bind a branch` };
  } else if (res.status === 200 && hostField(res.body, "id") === id) {
    const v = hostField(res.body, "current_user_can_bypass");
    b = toBinding(readFact(v, ACCEPT.rulesetBypass), {
      held: `ruleset ${id} reports current_user_can_bypass "never"`,
      failed: `ruleset ${id} reports current_user_can_bypass ${hostText(v)}`,
      unknown:
        v === undefined
          ? `ruleset ${id} carries no current_user_can_bypass`
          : `ruleset ${id} reports a current_user_can_bypass this check does not recognize (${hostText(v)})`,
    });
  } else if (res.status === 200 && isObject(res.body)) {
    b = { state: "unknown", evidence: `the read of ruleset ${id} answered about a different ruleset` };
  } else {
    b = { state: "unknown", evidence: `the read of ruleset ${id} answered ${answered(res)}` };
  }
  const read: RulesetRead = { binding: b, source: hostField(res.body, "source"), sourceType: hostField(res.body, "source_type") };
  rulesetBindingCache.set(id, read);
  return read;
}

// SOURCE AGREEMENT (red-team case P of plan 33.1-22, D-30). The rule list names each rule's
// ruleset by `ruleset_id` AND by owner (`ruleset_source`, `ruleset_source_type`); the ruleset's own
// answer names its owner as `source` and `source_type`. They are two endpoints naming one fact, so
// they must agree: every rule of that id and the body name the same readable `source` (exact
// string comparison), and the same readable source type whenever either side carries one (absent
// on both sides is not a disagreement). Anything else — a disagreement, or one side absent or
// garbled — is why the ruleset binds nothing: its rows are `unknown`, never `failed`.
function sourceDisagreement(id: number, rules: Record<string, unknown>[], read: RulesetRead): string | undefined {
  const mine = rules.filter((r) => hostField(r, "ruleset_id") === id);
  const sources = [read.source, ...mine.map((r) => hostField(r, "ruleset_source"))];
  if (!sources.every((v) => readFact(v, ACCEPT.rulesetSource) === "held") || new Set(sources).size !== 1) {
    return `ruleset ${id} names its source as ${hostText(read.source)}, and its rules name ${hostText(mine.map((r) => hostField(r, "ruleset_source")))}: these do not agree, so it is not shown to bind`;
  }
  const types = [read.sourceType, ...mine.map((r) => hostField(r, "ruleset_source_type"))];
  if (types.every((v) => v === undefined)) return undefined;
  if (!types.every((v) => readFact(v, ACCEPT.rulesetSourceType) === "held") || new Set(types).size !== 1) {
    return `ruleset ${id} names its source type as ${hostText(read.sourceType)}, and its rules name ${hostText(mine.map((r) => hostField(r, "ruleset_source_type")))}: these do not agree, so it is not shown to bind`;
  }
  return undefined;
}

// A ruleset's binding for this branch: its own read, unless its source disagrees with the rules
// that name it here.
function rulesetBindingFor(id: number, rules: Record<string, unknown>[]): Binding {
  const read = readRulesetBinding(id);
  if (read.binding.state === "unknown") return read.binding;
  const why = sourceDisagreement(id, rules, read);
  return why === undefined ? read.binding : { state: "unknown", evidence: why };
}

// The binding of every distinct ruleset whose rules could show an item on this branch, in the
// order the rules name them; the first MAX_RULESET_READS are read, the rest are `unknown`.
function rulesetBindings(arm: RulesetArm): Map<number, Binding> {
  const types = new Set(FLOOR_ITEMS.map((row) => row.ruleType));
  const ids: number[] = [];
  for (const rule of arm.rules) {
    const id = hostField(rule, "ruleset_id");
    const type = hostField(rule, "type");
    if (typeof type === "string" && types.has(type) && usableRulesetId(id) && !ids.includes(id)) ids.push(id);
  }
  const out = new Map<number, Binding>();
  ids.forEach((id, i) => {
    out.set(
      id,
      i < MAX_RULESET_READS
        ? rulesetBindingFor(id, arm.rules)
        : { state: "unknown", evidence: `ruleset ${id} was not read (the check reads at most ${MAX_RULESET_READS} rulesets per branch)` },
    );
  });
  return out;
}

function ruleBinding(rule: Record<string, unknown>, bindings: Map<number, Binding>): Binding {
  const id = hostField(rule, "ruleset_id");
  if (!usableRulesetId(id)) {
    return {
      state: "unknown",
      evidence: `a ${hostText(hostField(rule, "type"))} rule carries no usable ruleset_id, so its ruleset cannot be asked about bypass`,
    };
  }
  return bindings.get(id) ?? { state: "unknown", evidence: `ruleset ${id} was not read` };
}

// The classic arm's binding for one item. Classic protection binds only when it applies to
// administrators (`enforce_admins.enabled === true`): a 200 from the protection endpoint is itself
// evidence that the account reads it as an administrator (a non-administrator reads 404
// `Not Found`, 33.1-RESEARCH.md Q4), so `false` means this account can bypass it. For the pull
// request and approval items it also needs `bypass_pull_request_allowances` absent, or listing no
// user, team or app; a non-empty list is `unknown`, because the check cannot tell whether this
// account is on it. An absent key is not readable either (D-30, plan 33.1-22): it is never read as
// evidence that the protection grants no allowance. Evidence counts listed actors and never names
// them (T-33.1-193).
function classicBinding(body: Record<string, unknown>, row: FloorItem): Binding {
  const applies = "classic protection applies to administrators";
  const admins = readFact(hostField(body, "enforce_admins"), ACCEPT.enforceAdmins);
  if (admins !== "held" || !row.reviewItem) {
    return toBinding(admins, {
      held: applies,
      failed:
        "classic protection does not apply to administrators (enforce_admins.enabled is false), and a 200 from the protection endpoint shows this account reads it as an administrator",
      unknown: "classic protection carries no readable enforce_admins.enabled",
    });
  }
  const allowances = hostField(hostField(body, "required_pull_request_reviews"), "bypass_pull_request_allowances");
  return toBinding(readFact(allowances, ACCEPT.bypassAllowances), {
    held: `${applies} and grants no pull request bypass allowance`,
    // ACCEPT.bypassAllowances has no `failed`; the text is here so every state has its evidence.
    failed: "classic protection lets an actor bypass required pull requests",
    unknown: allowanceUnreadable(allowances),
  });
}

// Why the allowance is not readable. When the three lists are arrays with members, count them
// ("lets N actor(s) ..."), never naming an actor. In every other case, including an absent key, say
// that no readable allowance was found.
function allowanceUnreadable(allowances: unknown): string {
  const lists = [hostField(allowances, "users"), hostField(allowances, "teams"), hostField(allowances, "apps")];
  if (isObject(allowances) && lists.every(Array.isArray)) {
    const listed = lists.reduce((n: number, l) => n + (l as unknown[]).length, 0);
    if (listed > 0) {
      return `classic protection lets ${listed} actor(s) bypass required pull requests, and the check cannot tell whether this account is one of them`;
    }
  }
  return "classic protection carries no readable bypass_pull_request_allowances (absent or of an unexpected shape)";
}

// --- one item on one arm ------------------------------------------------------------------------
// One arm's reading of one item: its state, the evidence, and the sources that would show the
// item but were read as bypassable (`bypassed`) or whose binding could not be read (`unbound`).
interface ArmReading {
  state: FactState;
  evidence: string;
  bypassed: string[];
  unbound: string[];
}

function plain(state: FactState, evidence: string): ArmReading {
  return { state, evidence, bypassed: [], unbound: [] };
}

function unique(list: string[]): string[] {
  return [...new Set(list)];
}

// A source shows an item only when it shows it AND binds the account. `held` when at least one
// source does; `unknown` when none does and some source cannot be read; `failed` otherwise (every
// source was read and either does not show the item or can be bypassed).
function bindSources(sources: Array<{ shown: Shown; binding: Binding }>): ArmReading {
  const held: string[] = [];
  const unknown: string[] = [];
  const failed: string[] = [];
  const bypassed: string[] = [];
  const unbound: string[] = [];
  for (const { shown, binding } of sources) {
    const both = `${shown.evidence}, and ${binding.evidence}`;
    const but = `${shown.evidence}, but ${binding.evidence}`;
    if (shown.state !== "failed" && binding.state === "bypassable") bypassed.push(binding.evidence);
    if (shown.state !== "failed" && binding.state === "unknown") unbound.push(binding.evidence);
    if (shown.state === "failed") failed.push(shown.evidence);
    else if (binding.state === "bypassable") failed.push(but);
    else if (shown.state === "held" && binding.state === "binds") held.push(both);
    else unknown.push(binding.state === "unknown" ? but : shown.evidence);
  }
  const extra = { bypassed: unique(bypassed), unbound: unique(unbound) };
  if (held.length > 0) return { state: "held", evidence: held[0], ...extra };
  if (unknown.length > 0) return { state: "unknown", evidence: unique(unknown).join("; "), ...extra };
  return { state: "failed", evidence: unique(failed).join("; "), ...extra };
}

function rulesetReading(row: FloorItem, arm: RulesetArm, bindings: Map<number, Binding>): ArmReading {
  if (arm.read === "none") return plain("unknown", arm.why);
  const found = rulesOfType(arm.rules, row.ruleType);
  const r =
    found.length === 0
      ? plain("failed", `no active ruleset has a ${row.ruleType} rule`)
      : bindSources(found.map((rule) => ({ shown: row.fromRule(rule), binding: ruleBinding(rule, bindings) })));
  if (r.state === "failed" && arm.read === "partial") {
    return { ...r, state: "unknown", evidence: `${r.evidence} in the entries read, but ${arm.why}` };
  }
  return r;
}

function classicReading(row: FloorItem, arm: ClassicArm): ArmReading {
  if (arm.kind === "body") return bindSources([{ shown: row.fromClassic(arm.body), binding: classicBinding(arm.body, row) }]);
  return plain(arm.kind === "none" ? "failed" : "unknown", arm.evidence);
}

// THE UNION RULE: held when either arm shows the item, failed only when both arms read it and
// neither shows it, unknown otherwise.
function combineArms(a: FactState, b: FactState): FactState {
  if (a === "held" || b === "held") return "held";
  if (a === "failed" && b === "failed") return "failed";
  return "unknown";
}

// THE QUALIFIER (D-30). Every item is already counted only from sources that bind the account,
// so the qualifier is `held` exactly when every item is; `failed` when some item fails and a
// source that would show it was read as bypassable (on arms that were both read); `unknown`
// otherwise. Its evidence names each bypassable or unreadable source.
function qualifierFact(
  row: FloorQualifier,
  items: Array<{ fact: Fact; fromRules: ArmReading; fromClassic: ArmReading }>,
): Fact {
  const bypassed = unique(items.flatMap((i) => [...i.fromRules.bypassed, ...i.fromClassic.bypassed]));
  const unbound = unique(items.flatMap((i) => [...i.fromRules.unbound, ...i.fromClassic.unbound]));
  const base = { id: row.id, requirement: row.requirement };
  if (items.every((i) => i.fact.state === "held")) {
    const also = bypassed.length > 0 ? `; read as bypassable and not counted: ${bypassed.join("; ")}` : "";
    return { ...base, state: "held", evidence: `every item above is shown by a source this account cannot bypass${also}` };
  }
  const bypassFailed = items.filter(
    (i) => i.fact.state === "failed" && i.fromRules.bypassed.length + i.fromClassic.bypassed.length > 0,
  );
  if (bypassFailed.length > 0) {
    return {
      ...base,
      state: "failed",
      evidence: `this account can bypass what would show ${bypassFailed.map((i) => i.fact.requirement).join(", ")}: ${bypassed.join("; ")}`,
    };
  }
  const parts: string[] = [];
  if (bypassed.length > 0) parts.push(`read as bypassable: ${bypassed.join("; ")}`);
  if (unbound.length > 0) parts.push(`not readable: ${unbound.join("; ")}`);
  if (parts.length === 0) parts.push("not every item above is shown, so there is no protection to judge for bypass");
  return { ...base, state: "unknown", evidence: parts.join("; ") };
}

// Every row `unknown`, for a branch target the check could not read at all.
function unreadFacts(why: string): Fact[] {
  return BRANCH_FLOOR.map((row) => ({ id: row.id, requirement: row.requirement, state: "unknown", evidence: why }));
}

function branchUnknown(name: string, reason: string): Target {
  return { kind: "branch", name, verdict: "UNKNOWN - verify", reason, facts: unreadFacts(reason) };
}

function readRulesetArm(name: string, bp: string): RulesetArm {
  const res = apiGet(`repos/{owner}/{repo}/rules/branches/${bp}?per_page=100`);
  if (res.status === 200 && Array.isArray(res.body)) {
    const entries: unknown[] = res.body;
    // Only readable entries count. A garbage entry shows nothing, and the list is then read only
    // partially, so a row no readable rule shows is `unknown`, never `failed` (D-30).
    const rules = entries.filter((r): r is Record<string, unknown> => readFact(r, ACCEPT.ruleEntry) === "held");
    if (rules.length > 0) noteProtectionShown(`the rule list of branch ${hostText(name)} names ${rules.length} active ruleset rule(s)`);
    const whys: string[] = [];
    if (rules.length < entries.length) whys.push("an entry of the rule list is not a readable rule");
    if (res.next) whys.push("the rule list runs past one page");
    return whys.length > 0 ? { read: "partial", rules, why: whys.join(", and ") } : { read: "full", rules, why: "" };
  }
  return { read: "none", rules: [], why: `the rules endpoint answered ${answered(res)}` };
}

// The repository API url this run asked about (red-team finding 4 of plan 33.1-23), from the
// `url` of the `repos/{owner}/{repo}` answer the main flow reads first. The check's own paths carry
// gh's `{owner}/{repo}` placeholders, so the check does not know the owner and name it asked
// about; this same-run answer is what names them. Readable only as an http(s) URL with no
// credentials, query or fragment, whose path ends in `/repos/<owner>/<name>` (any prefix before it,
// such as GitHub Enterprise Server's `/api/v3`, is kept and must match). `full_name` is not read
// here (plan 33.1-25 owns it).
let repositoryApi: URL | undefined;
function readRepositoryApi(v: unknown): URL | undefined {
  if (typeof v !== "string") return undefined;
  let u: URL;
  try {
    u = new URL(v);
  } catch {
    return undefined;
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") return undefined;
  if (u.username !== "" || u.password !== "" || u.search !== "" || u.hash !== "") return undefined;
  return /\/repos\/[^/]+\/[^/]+$/.test(u.pathname) ? u : undefined;
}

// Why a classic protection body's `url` shows it is NOT about branch `name` of this run's
// repository, or undefined when it is (red-team finding 3 of plan 33.1-22 and finding 4 of plan
// 33.1-23, D-30). The url must be on the same origin (scheme, host and port) as the repository
// answer's url, carry no credentials, query or fragment, and its path must be exactly
// `<repository path>/branches/<branch>/protection`; the branch segment is compared after
// percent-decoding, so a branch whose name holds `/` or an escaped character is not falsely refused.
// An ABSENT url is not required: its absence says nothing about which branch the body describes,
// and the check's rename evidence comes from the branches/<b> answer (the main/master probe and the
// 404 `Not Found` path). A url that is present and names another endpoint, another repository or
// another host, or cannot be read, or cannot be compared because the repository answer named no
// readable url, is evidence the same run does not agree with, so the branch is `UNKNOWN - verify`.
function protectionUrlMismatch(url: unknown, name: string): string | undefined {
  if (url === undefined) return undefined;
  const says = `the protection endpoint's answer carries url ${hostText(url)}`;
  if (typeof url !== "string") return `${says}, which is not a string`;
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return `${says}, which is not a URL this check can read`;
  }
  const repo = repositoryApi;
  if (repo === undefined) {
    return `${says}, but the repository answer names no readable url to compare it with, so which repository it describes is not shown`;
  }
  const where = `this run's repository ${hostText(repo.href)}`;
  if (u.origin !== repo.origin || u.username !== "" || u.password !== "" || u.search !== "" || u.hash !== "") {
    return `${says}, which is not on the host of ${where}`;
  }
  const prefix = `${repo.pathname}/branches/`;
  const suffix = "/protection";
  const path = u.pathname;
  if (!path.startsWith(prefix) || !path.endsWith(suffix) || path.length <= prefix.length + suffix.length) {
    return `${says}, which is not a branch protection endpoint of ${where}`;
  }
  let about: string;
  try {
    about = decodeURIComponent(path.slice(prefix.length, path.length - suffix.length));
  } catch {
    return `${says}, whose branch name cannot be decoded`;
  }
  return about === name ? undefined : `${says}, which is about branch ${hostText(about)}, not this one`;
}

// One classic read per branch per run, whoever asks first (a branch target, or the environment's
// branch-policy evidence). Keyed by the branch name; the path is always branchPath(name).
const classicArmCache = new Map<string, ClassicArm>();

// The evidence phrase for a 200 answer that is not a protection record (the tests key on it).
const NOT_A_RECORD = "is not a branch protection record";

// What the main/master probe read this run (the main flow fills these before any verdict is made):
// the `protected` value each probed branch's own answer carried, each probed name the host
// answered as ANOTHER branch (mapped to the name it answered), and each probed name whose answer
// did not show a branch of that name (mapped to how it answered: a 404, another status, or a 200
// naming no readable branch).
interface ProbedFlag {
  state: FactState; // readFact(value, ACCEPT.branchProtectedFlag)
  value: unknown;
}
const probedProtected = new Map<string, ProbedFlag>();
const renamedBranches = new Map<string, string>();
const unshownBranches = new Map<string, string>();

// Protection this run showed on some branch (red-team finding 5 of plan 33.1-23, D-30): a rule list
// naming at least one readable ruleset rule, a classic protection record, or a branch answer that
// reports `protected: true`. `GET branches?protected=true` documents that it lists branches
// protected by branch protections or rulesets, so any of these contradicts an EMPTY list, which is
// then `unknown`, never `failed`. `rules/branches/<b>` answers for a name whether or not a branch
// of that name exists, so a rule list may over-count; that only turns `failed` into `unknown`.
const protectionShown: string[] = [];
function noteProtectionShown(what: string): void {
  if (!protectionShown.includes(what)) protectionShown.push(what);
}

// THE ONE AUTHORITY for "the same run shows that nothing asked under this name is evidence about a
// branch of that name" (red-team finding 2 of plan 33.1-23, D-30): a name the probe saw answered
// as another branch, or a name the probe did not show to exist. Every later read under such a
// name is refused: a `--branch` target of that name is UNKNOWN - verify and is never asked about,
// a protected-branch list naming it is not evidence and its protection is never asked, and a
// classic arm cached under it is never branch-policy evidence.
// Whether the probe's own `protected` value contradicts a protection body under `name` (red-team
// finding 3 of plan 33.1-23, D-30): `false` does, and so does any present value that is not a
// boolean (it cannot be read, so it cannot be shown to agree). `true` and absence do not.
function probeContradictsBody(name: string): string | undefined {
  const flag = probedProtected.get(name);
  if (flag === undefined || flag.state === "held") return undefined;
  const says = flag.state === "failed" ? "reports protected false" : `reports a protected value this check cannot read (${hostText(flag.value)})`;
  return `branch ${hostText(name)} ${says}, but its classic protection endpoint answered with a protection body`;
}

// The other side of the same check (sibling of red-team finding 5 of plan 33.1-23): the probe read
// `protected` true, yet the rule list was read in full with no rule and the classic endpoint
// reports no classic protection. Both arms say "nothing" while the branch's own answer says
// "protected", so a `failed` from those arms would be a same-run contradiction.
function probeContradictsNone(name: string, rules: RulesetArm, classic: ClassicArm | undefined): string | undefined {
  if (probedProtected.get(name)?.state !== "held") return undefined;
  if (rules.read !== "full" || rules.rules.length > 0 || classic?.kind !== "none") return undefined;
  return `branch ${hostText(name)} reports protected true, but its rule list names no rule and ${classic.evidence}, so the same run disagrees with itself`;
}

function contradictedName(name: string): string | undefined {
  const renamedTo = renamedBranches.get(name);
  if (renamedTo !== undefined) {
    return `the same run saw branch ${hostText(name)} answered as branch ${hostText(renamedTo)} (a renamed branch's old name answers this way)`;
  }
  const unshown = unshownBranches.get(name);
  if (unshown !== undefined) {
    return `the same run's branch endpoint answered ${unshown} for branch ${hostText(name)}, so the branch is not shown to exist`;
  }
  return undefined;
}

function readClassicArm(name: string, bp: string): ClassicArm {
  const cached = classicArmCache.get(name);
  if (cached !== undefined) return cached;
  const arm = readClassicArmOnce(name, bp);
  classicArmCache.set(name, arm);
  if (arm.kind === "body") noteProtectionShown(`branch ${hostText(name)} answers a classic protection record`);
  return arm;
}

function readClassicArmOnce(name: string, bp: string): ClassicArm {
  const prot = apiGet(`repos/{owner}/{repo}/branches/${bp}/protection`);
  if (prot.status === 200) {
    const elsewhere = protectionUrlMismatch(hostField(prot.body, "url"), name);
    if (elsewhere !== undefined) return { kind: "elsewhere", evidence: elsewhere };
    // THE ONE PLACE a classic arm becomes `body` (red-team finding 1 of plan 33.1-23): only a
    // protection record. Every reader of the arm (the branch floor and the branch-policy row) asks
    // its kind, so no reader can take a non-record as protection.
    if (isObject(prot.body) && readFact(prot.body, ACCEPT.classicProtectionRecord) === "held") return { kind: "body", body: prot.body };
    return {
      kind: "unreadable",
      // The body is not quoted: a non-record may still list actors, and evidence never names them.
      evidence: `the protection endpoint answered HTTP 200 with a body that ${NOT_A_RECORD} (a plain object with an enforce_admins object whose enabled is a boolean, and no message or protected key, was expected)`,
    };
  }
  const message = hostField(prot.body, "message");
  if (prot.status === 404 && message === "Branch not protected") {
    return { kind: "none", evidence: "the host reports no classic branch protection" };
  }
  if (prot.status === 404 && message === "Not Found") {
    const br = apiGet(`repos/{owner}/{repo}/branches/${bp}`);
    // Only an answer about the branch that was asked for counts (a renamed branch's old name
    // answers with the new branch's record).
    const brName = hostField(br.body, "name");
    if (br.status === 200 && brName === name) {
      // Read through the same ACCEPT entry as the probe's value (sibling of red-team finding 3 of
      // plan 33.1-23): true and false are read, anything else is not readable.
      const flag = readFact(hostField(br.body, "protected"), ACCEPT.branchProtectedFlag);
      if (flag === "held") {
        noteProtectionShown(`branch ${hostText(name)} reports protected true`);
        return { kind: "unreadable", evidence: "classic protection present; its rules are not readable with this token" };
      }
      if (flag === "failed") return { kind: "none", evidence: "the branch reports no classic protection" };
      // The answer is about this branch, so it is not `elsewhere`; its protected value is not read.
      return {
        kind: "unreadable",
        evidence: `the protection endpoint answered HTTP 404 (Not Found) and the branch endpoint reports a protected value this check cannot read (${hostText(hostField(br.body, "protected"))})`,
      };
    }
    if (br.status === 200 && typeof brName === "string") {
      return { kind: "elsewhere", evidence: `the branch endpoint answered about branch ${hostText(brName)}, not this one (a renamed branch's old name answers this way)` };
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
  const contradicted = contradictedName(name);
  if (contradicted !== undefined) return branchUnknown(name, `${contradicted}, so nothing asked under this name is evidence about it`);
  const bp = branchPath(name);

  const rulesetArm = readRulesetArm(name, bp);
  const bindings = rulesetBindings(rulesetArm);
  const fromRules = FLOOR_ITEMS.map((row) => rulesetReading(row, rulesetArm, bindings));
  // The classic arm is read only when the ruleset arm leaves some item not shown.
  const classicArm: ClassicArm | undefined = fromRules.every((r) => r.state === "held") ? undefined : readClassicArm(name, bp);
  // An answer about another branch taints every read made under this name, the ruleset arm too.
  if (classicArm?.kind === "elsewhere") return branchUnknown(name, classicArm.evidence);
  // Two endpoints naming one fact (D-30): the probe read `protected` false or unreadable, but the
  // classic protection endpoint answered with a protection body. The same run contradicts itself.
  const probeSays = classicArm?.kind === "body" ? probeContradictsBody(name) : probeContradictsNone(name, rulesetArm, classicArm);
  if (probeSays !== undefined) return branchUnknown(name, probeSays);
  const fromClassic = FLOOR_ITEMS.map((row): ArmReading =>
    classicArm === undefined ? plain("unknown", "not read (the ruleset arm shows every item)") : classicReading(row, classicArm),
  );

  const items = FLOOR_ITEMS.map((row, i) => ({
    fact: {
      id: row.id,
      requirement: row.requirement,
      state: combineArms(fromRules[i].state, fromClassic[i].state),
      evidence: `ruleset: ${fromRules[i].evidence}; classic: ${fromClassic[i].evidence}`,
    } satisfies Fact,
    fromRules: fromRules[i],
    fromClassic: fromClassic[i],
  }));
  const facts: Fact[] = BRANCH_FLOOR.map((row) =>
    row.kind === "item" ? items.find((i) => i.fact.id === row.id)!.fact : qualifierFact(row, items),
  );

  if (facts.every((f) => f.state === "held")) {
    const shownBy = items.map(({ fact, fromRules: r, fromClassic: c }) => {
      const arm =
        r.state === "held" && c.state === "held" ? "ruleset and classic protection" : r.state === "held" ? "ruleset" : "classic protection";
      return `${fact.requirement} (${arm})`;
    });
    const qualifier = facts.filter((f) => !items.some((i) => i.fact.id === f.id)).map((f) => `${f.requirement} (${f.evidence})`);
    return {
      kind: "branch",
      name,
      verdict: "protected",
      reason: `every branch floor item is shown: ${[...shownBy, ...qualifier].join(", ")}`,
      facts,
    };
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

// THE CANONICAL PRODUCTION FLOOR (plan 33.1-20, D-30 `floor-full`). Each `requirement` is
// byte-equal to a line of the production checklist in install/README.md §5; host-protection.test.ts
// binds the two both ways and holds a weakening fixture per row. Every row reads the environment
// object that `GET environments` returned under the configured name (`undefined` when there is
// none). Nothing outside this table decides whether the environment is `protected`.
// Evidence a row reads from the rest of the same run, not from the environment object. Only the
// branch-policy row uses it.
interface RunEvidence {
  classicProtection: () => Shown;
}

interface EnvironmentRow {
  id: string;
  requirement: string;
  read: (env: Record<string, unknown> | undefined, run: RunEvidence) => Shown;
}

// --- the branch-policy row's run evidence (re-review CR-02, plan 33.1-23, D-30) ----------------
// "Protected branches only" is defined for branch protection rules, and every branch can deploy
// when no branch has them (docs.github.com/en/actions/reference/workflows-and-actions/
// deployments-and-environments, fetched 2026-09-29); the page does not mention rulesets. The
// protected-branch list `GET branches?protected=true` names branches protected by branch
// protection OR by rulesets (docs.github.com/en/rest/branches/branches). So only CLASSIC branch
// protection shown in this run is evidence: a 200 object body from `branches/<b>/protection`.
const PROTECTED_BRANCH_LIST = "repos/{owner}/{repo}/branches?protected=true&per_page=1";
const RULESETS_UNSAID =
  'GitHub documents "Protected branches only" for branch protection rules and does not say whether rulesets count';

// Whether one branch's classic arm, as this run read it, shows classic branch protection, or why
// not. A name the run contradicts (contradictedName), or a body for a branch the probe read as
// `protected` false or unreadable (probeContradictsBody), is not evidence.
function classicShownOn(name: string, arm: ClassicArm): Shown {
  const contradicted = contradictedName(name);
  if (contradicted !== undefined) return { state: "unknown", evidence: contradicted };
  const probeSays = arm.kind === "body" ? probeContradictsBody(name) : undefined;
  if (probeSays !== undefined) return { state: "unknown", evidence: probeSays };
  const why = arm.kind === "body" ? "" : arm.evidence;
  return says(readFact(arm.kind, ACCEPT.classicArmShown), {
    held: `classic branch protection exists on branch ${hostText(name)}: its protection endpoint answered 200`,
    failed: `branch ${hostText(name)} shows no classic branch protection (${why})`,
    unknown: `branch ${hostText(name)} shows no readable classic branch protection (${why})`,
  });
}

// At most once per run, and only when the branch-policy row asks (the policy is the documented
// protected-branches pair). (a) A classic arm this run already read shows a body → that branch.
// (b) Otherwise the host's protected-branch list, one element: empty → failed (every branch can
// deploy); unreadable → unknown; one branch → its classic arm (read, or reused from the cache).
let classicEvidence: Shown | undefined;
function classicProtectionEvidence(): Shown {
  if (classicEvidence === undefined) classicEvidence = readClassicProtectionEvidence();
  return classicEvidence;
}

function readClassicProtectionEvidence(): Shown {
  for (const [name, arm] of classicArmCache) {
    const shown = classicShownOn(name, arm);
    if (shown.state === "held") return shown;
  }
  const res = apiGet(PROTECTED_BRANCH_LIST);
  if (res.status !== 200) return { state: "unknown", evidence: `the protected-branch list answered ${answered(res)}` };
  // An empty list that names a further page contradicts itself: it cannot show "no protected
  // branch", so downgrade() reads it as unknown.
  const list = downgrade(readFact(res.body, ACCEPT.protectedBranchList), res.next);
  // An empty list the same run contradicts cannot show "no protected branch" (finding 5).
  if (list === "failed" && protectionShown.length > 0) {
    return { state: "unknown", evidence: `the host lists no protected branch, yet the same run shows protection: ${protectionShown.join("; ")}` };
  }
  if (list !== "held") {
    return says(list, {
      held: "the protected-branch list names a branch",
      failed: "the host lists no protected branch, and GitHub documents that every branch can deploy when no branch has branch protection rules",
      unknown: "the protected-branch list is not readable (one plain-object element with protected true and a usable name, or an empty list, was expected)",
    });
  }
  const listed: unknown[] = Array.isArray(res.body) ? res.body : [];
  const name = hostField(listed[0], "name");
  if (typeof name !== "string") return { state: "unknown", evidence: "the protected-branch list names no readable branch" };
  // A name the same run contradicts (answered as another branch, or not shown to exist) is never
  // asked about: its protection read would describe another branch, or none.
  const arm: ClassicArm = contradictedName(name) !== undefined ? { kind: "unreadable", evidence: "not asked" } : readClassicArm(name, branchPath(name));
  const shown = classicShownOn(name, arm);
  if (shown.state === "held") return { state: shown.state, evidence: `the first protected branch the host lists has classic protection: ${shown.evidence}` };
  return {
    state: "unknown",
    evidence: `the first protected branch the host lists, ${hostText(name)}, is not shown to have classic branch protection (${shown.evidence}); ${RULESETS_UNSAID}`,
  };
}

const NO_ENVIRONMENT: Shown = { state: "unknown", evidence: "there is no environment of that name to read" };

// The environment's readable `required_reviewers` rules, plus `partial` when some entry of
// `protection_rules` is not a readable rule (not an object with a string `type`); undefined when
// `protection_rules` is not an array (an unexpected shape, never read as "no rules").
function reviewerRules(env: Record<string, unknown>): { rules: Record<string, unknown>[]; partial: boolean } | undefined {
  const list = hostField(env, "protection_rules");
  if (!Array.isArray(list)) return undefined;
  const entries: unknown[] = list;
  const readable = entries.filter((r): r is Record<string, unknown> => readFact(r, ACCEPT.ruleEntry) === "held");
  return {
    rules: readable.filter((r) => hostField(r, "type") === "required_reviewers"),
    partial: readable.length < entries.length,
  };
}

// A rule's reviewers read through ACCEPT.reviewerList.
function reviewersOf(rule: Record<string, unknown>): FactState {
  return readFact(hostField(rule, "reviewers"), ACCEPT.reviewerList);
}

// More than one `required_reviewers` rule in one answer does not say which one the host enforces,
// so neither reviewer row picks one (never first-match-wins, red-team finding 4 of plan 33.1-22,
// D-30): both rows are `unknown`. Otherwise the one rule, or undefined when there is none.
const MANY_REVIEWER_RULES = (n: number): Shown => ({
  state: "unknown",
  evidence: `the environment lists ${n} required_reviewers rules, so which one applies is not readable`,
});
function reviewerRule(rules: Record<string, unknown>[]): Record<string, unknown> | undefined {
  return rules.length === 1 ? rules[0] : undefined;
}

// How many reviewers of the documented shape a rule names (the evidence counts; it never names).
function reviewerCount(rule: Record<string, unknown>): number {
  const list = hostField(rule, "reviewers");
  return Array.isArray(list) ? list.filter(isReviewerElement).length : 0;
}

const ENVIRONMENT_FLOOR: readonly EnvironmentRow[] = [
  {
    id: "environment_exists",
    requirement: "has the name your deploy jobs use",
    // Not found is `unknown`, never `failed`: grugops cannot tell how production deploys run.
    read: (env) =>
      says(readFact(env, ACCEPT.environmentPresent), {
        held: "the host lists an environment of that name",
        failed: "the host lists no environment of that name",
        unknown: "the host lists no environment of that name",
      }),
  },
  {
    id: "required_reviewer",
    requirement: "requires at least one reviewer",
    read: (env) => {
      if (env === undefined) return NO_ENVIRONMENT;
      const found = reviewerRules(env);
      if (found === undefined) return { state: "unknown", evidence: "the environment carries no readable protection_rules list" };
      if (found.rules.length > 1) return MANY_REVIEWER_RULES(found.rules.length);
      const states = found.rules.map(reviewersOf);
      const at = states.findIndex((state) => state === "held");
      if (at >= 0) {
        const n = reviewerCount(found.rules[at]);
        return { state: states[at], evidence: `a required_reviewers rule names ${n} reviewer${n === 1 ? "" : "s"}` };
      }
      if (states.includes("unknown")) {
        return { state: "unknown", evidence: "a required_reviewers rule carries no readable reviewers list (each reviewer needs a type and a numeric id)" };
      }
      // Every readable rule was read and names no reviewer. `failed`, unless a garbage entry of the
      // list might have been the rule that does.
      return {
        state: downgrade("failed", found.partial),
        evidence: found.partial
          ? "no readable required_reviewers rule names a reviewer, and an entry of protection_rules is not a readable rule"
          : "the environment has no required_reviewers rule that names a reviewer",
      };
    },
  },
  {
    id: "no_self_review",
    requirement: "prevents self-review",
    read: (env) => {
      if (env === undefined) return NO_ENVIRONMENT;
      const found = reviewerRules(env);
      if (found === undefined) return { state: "unknown", evidence: "the environment carries no readable protection_rules list" };
      if (found.rules.length > 1) return MANY_REVIEWER_RULES(found.rules.length);
      const rule = reviewerRule(found.rules);
      if (rule === undefined) {
        return {
          state: downgrade("failed", found.partial),
          evidence: found.partial
            ? "no readable required_reviewers rule was found, and an entry of protection_rules is not a readable rule"
            : "the environment has no required_reviewers rule, so nothing prevents self-review",
        };
      }
      // A rule whose reviewers cannot be read cannot be told apart from a garbage entry, so which
      // rule prevents self-review is not readable either (WR-01).
      if (reviewersOf(rule) === "unknown") {
        return { state: "unknown", evidence: "the required_reviewers rule carries no readable reviewers list" };
      }
      return says(downgrade(readFact(hostField(rule, "prevent_self_review"), ACCEPT.preventSelfReview), found.partial), {
        held: "the required_reviewers rule has prevent_self_review true",
        failed: "the required_reviewers rule has prevent_self_review false",
        unknown: found.partial
          ? "the required_reviewers rule does not show prevent_self_review true, and an entry of protection_rules is not a readable rule"
          : "the required_reviewers rule carries no boolean prevent_self_review",
      });
    },
  },
  {
    id: "no_admin_bypass",
    requirement: "does not let administrators bypass its protection rules",
    read: (env) => {
      if (env === undefined) return NO_ENVIRONMENT;
      return says(readFact(hostField(env, "can_admins_bypass"), ACCEPT.canAdminsBypass), {
        held: "can_admins_bypass is false",
        failed: "can_admins_bypass is true",
        unknown: "the environment carries no boolean can_admins_bypass",
      });
    },
  },
  {
    id: "branch_policy",
    requirement: "allows deployments only from protected branches",
    // Held only when the policy is the documented protected-branches pair AND the same run shows
    // classic branch protection on some branch (re-review CR-02): with no branch protection rules
    // anywhere, "Protected branches only" lets every branch deploy.
    read: (env, run) => {
      if (env === undefined) return NO_ENVIRONMENT;
      const policy = hostField(env, "deployment_branch_policy");
      const custom = hostField(policy, "protected_branches") === false && hostField(policy, "custom_branch_policies") === true;
      const pair = readFact(policy, ACCEPT.deploymentBranchPolicy);
      const PAIR = "deployment_branch_policy allows protected branches only";
      if (pair !== "held") {
        return says(pair, {
          held: PAIR,
          failed: "deployment_branch_policy is null, so any branch can deploy",
          unknown: custom
            ? "the environment uses a custom deployment branch policy, and the check does not read which branches it allows"
            : "the environment carries no readable deployment_branch_policy (only protected_branches true with custom_branch_policies false shows this item)",
        });
      }
      const shown = run.classicProtection();
      return { state: shown.state, evidence: `${PAIR}, ${shown.state === "held" ? "and" : "but"} ${shown.evidence}` };
    },
  },
];

// Every production floor row `unknown`, for an environment the check could not read at all.
function unreadEnvironmentFacts(why: string): Fact[] {
  return ENVIRONMENT_FLOOR.map((row) => ({ id: row.id, requirement: row.requirement, state: "unknown", evidence: why }));
}

function environmentVerdict(name: string, source: string): Target {
  const at = `; environment name from ${source}`;
  const res = apiGet("repos/{owner}/{repo}/environments?per_page=100");
  const list = hostField(res.body, "environments");
  if (!(res.status === 200 && Array.isArray(list))) {
    const reason = `the environments endpoint answered ${answered(res)}`;
    return { kind: "environment", name, verdict: "UNKNOWN - verify", reason: `${reason}${at}`, facts: unreadEnvironmentFacts(reason) };
  }
  const entries: unknown[] = list;
  const matches = entries.filter((e) => hostField(e, "name") === name);
  // Two environments of one name do not say which one deploys use: never first-match-wins
  // (red-team finding 4 of plan 33.1-22, D-30); every row is unknown.
  if (matches.length > 1) {
    const reason = `the host lists ${matches.length} environments named ${name}, so which one deploys use is not readable`;
    return { kind: "environment", name, verdict: "UNKNOWN - verify", reason: `${reason}${at}`, facts: unreadEnvironmentFacts(reason) };
  }
  const found: unknown = matches[0];
  const env = isObject(found) ? found : undefined;
  // Every branch verdict ran before this one, so the classic arm cache already holds this run's
  // branch reads; the branch-policy row reuses them before asking the host anything new.
  const run: RunEvidence = { classicProtection: classicProtectionEvidence };
  const facts: Fact[] = ENVIRONMENT_FLOOR.map((row) => ({ id: row.id, requirement: row.requirement, ...row.read(env, run) }));
  if (env === undefined) {
    const why = res.next ? `no environment named ${name} on the first page of a longer list` : `no environment named ${name}`;
    const reason = `${why}; grugops cannot tell how production deploys run`;
    return {
      kind: "environment",
      name,
      verdict: "UNKNOWN - verify",
      reason: `${reason}${at}`,
      // The environment_exists row keeps its own evidence; the rest name the reason.
      facts: facts.map((f) => (f.id === "environment_exists" ? { ...f, evidence: reason } : f)),
    };
  }
  if (facts.every((f) => f.state === "held")) {
    return {
      kind: "environment",
      name,
      verdict: "protected",
      reason: `every production floor item is shown: ${facts.map((f) => `${f.requirement} (${f.evidence})`).join(", ")}${at}`,
      facts,
    };
  }
  const verdict: Verdict = facts.some((f) => f.state === "failed") ? "unprotected" : "UNKNOWN - verify";
  const reason = facts
    .filter((f) => f.state !== "held")
    .map((f) => `${f.requirement}: ${f.state === "failed" ? "not shown" : "not readable"} (${f.evidence})`)
    .join("; ");
  return { kind: "environment", name, verdict, reason: `${reason}${at}`, facts };
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
    facts: unreadEnvironmentFacts(cannotAsk),
  });
} else {
  const names: string[] = [];
  // The probe fills renamedBranches (main/master names the host answered as another branch) and
  // probedProtected (the `protected` value each probed answer carried about itself), module-level,
  // because branchVerdict and the environment's branch-policy evidence both read them.
  const renamed = renamedBranches;
  const probed = probedProtected;
  const repo = apiGet("repos/{owner}/{repo}");
  const defaultBranch = hostField(repo.body, "default_branch");
  // The repository a protection body's url must name (red-team finding 4 of plan 33.1-23).
  repositoryApi = repo.status === 200 ? readRepositoryApi(hostField(repo.body, "url")) : undefined;
  if (repo.status === 200 && typeof defaultBranch === "string") {
    names.push(defaultBranch);
  } else {
    targets.push(branchUnknown("(default branch)", `the repository endpoint answered ${answered(repo)}; the default branch is unknown`));
  }
  for (const b of ["main", "master"]) {
    if (names.includes(b)) continue;
    const res = apiGet(`repos/{owner}/{repo}/branches/${b}`);
    // GitHub answers a RENAMED branch's old name with the branch it was renamed to (measured
    // 2026-09-27: `branches/master` → 200 with `"name": "main"` on a repository whose master was
    // renamed). Only an answer about the branch that was asked for shows the branch exists.
    const answeredName = hostField(res.body, "name");
    if (res.status === 200 && answeredName === b) {
      names.push(b);
      // Read through ACCEPT.branchProtectedFlag. An ABSENT key is not recorded, and stays neutral:
      // every branch the probe never asks (the default branch, each --branch, a listed branch) has
      // no probe value either, so absence cannot count as a contradiction without making every such
      // branch unknown, and the probe value is never evidence of protection, only a check against
      // a protection body.
      const flag = hostField(res.body, "protected");
      if (flag !== undefined) {
        const state = readFact(flag, ACCEPT.branchProtectedFlag);
        probed.set(b, { state, value: flag });
        if (state === "held") noteProtectionShown(`branch ${hostText(b)} reports protected true`);
      }
    } else if (res.status === 200 && typeof answeredName === "string") renamed.set(b, answeredName);
    else {
      // Not shown to exist (red-team finding 2 of plan 33.1-23): a 404 omits the target, but the
      // name is recorded, so no later read under it (a --branch, the protected-branch list, the
      // classic arm cache) is taken as evidence about a branch of that name.
      unshownBranches.set(b, res.status === 200 ? "HTTP 200 naming no readable branch" : answered(res));
      if (res.status !== 404) {
        targets.push(branchUnknown(b, `could not tell whether the branch exists: the branch endpoint answered ${answered(res)}`));
      }
    }
  }
  // A `--branch` name the same run contradicts (answered as another branch, or not shown to exist)
  // is never judged: contradictedName() is the one authority (red-team findings 3 of plan 33.1-22
  // and 2 of plan 33.1-23, D-30).
  for (const b of extraBranches) {
    if (names.includes(b) || targets.some((t) => t.kind === "branch" && t.name === b)) continue;
    const contradicted = contradictedName(b);
    if (contradicted === undefined) names.push(b);
    else targets.push(branchUnknown(b, `${contradicted}, so nothing asked under this name is evidence about it`));
  }
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
        floor: {
          branch: BRANCH_FLOOR.map((row) => row.requirement),
          environment: ENVIRONMENT_FLOOR.map((row) => row.requirement),
        },
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

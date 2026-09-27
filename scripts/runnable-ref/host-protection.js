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
// BRANCH EVIDENCE, in order (measured endpoint behaviour: 33.1-RESEARCH.md § Q4):
//   1. `rules/branches/<b>` 200 naming both `pull_request` and `non_fast_forward` → protected.
//   2. `branches/<b>/protection` 200: each requirement (a pull request before merge, force pushes
//      blocked) must be shown by the ruleset or by classic protection. Both shown → protected.
//      One missing → unprotected, naming it, but only when the rule list was read in full;
//      otherwise a ruleset might still cover it → UNKNOWN - verify.
//   3. `/protection` 404 with body message `Branch not protected` (visible to admins) →
//      unprotected when the rule list was read in full, else UNKNOWN - verify.
//   4. `/protection` 404 with body message `Not Found` (what a non-admin sees, protected or not)
//      → ask `branches/<b>`: `.protected === true` → UNKNOWN - verify (classic protection exists
//      but its rules are not readable with this token); `.protected === false` with the rule list
//      read in full → unprotected.
//   5. Any other status, spawn error or unparseable output → UNKNOWN - verify, quoting the status.
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
//     stdout → with --json, a { ok, targets: [{ kind, name, verdict, reason }], calls } block
//              after the human lines; `calls` is the argv of every gh call, so a recorded note
//              shows how each verdict was reached
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
process.on("uncaughtException", (err) => {
    console.log(`HOST-PROTECTION: the check could not run (${err instanceof Error ? err.message : String(err)}) — UNKNOWN - verify`);
    process.exit(2);
});
// --- args -------------------------------------------------------------------------------------
const argv = process.argv.slice(2);
const wantJson = argv.includes("--json");
// Every value of a "--flag value" or "--flag=value" pair; a value that is itself a flag is not
// taken as a value.
function flagValues(name) {
    const out = [];
    for (let i = 0; i < argv.length; i++) {
        const a = argv[i];
        if (a === name) {
            const v = argv[i + 1];
            if (v !== undefined && !v.startsWith("-"))
                out.push(v);
        }
        else if (a.startsWith(`${name}=`)) {
            out.push(a.slice(name.length + 1));
        }
    }
    return out;
}
function flagValue(name) {
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
const calls = [];
function runGh(args) {
    calls.push([...args]);
    const options = {
        shell: false,
        encoding: "utf8",
        timeout: 20000,
        env: { ...process.env, GH_PROMPT_DISABLED: "1", GH_NO_UPDATE_NOTIFIER: "1" },
    };
    const r = ghScript === undefined
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
function apiGet(path) {
    const r = runGh(["api", "--method", "GET", "-i", path]);
    if (r.spawnError !== undefined) {
        return { status: undefined, body: undefined, next: false, problem: `gh could not be run (${r.spawnError})` };
    }
    const split = /\r?\n\r?\n/.exec(r.stdout);
    const head = split === null ? r.stdout : r.stdout.slice(0, split.index);
    const rest = split === null ? "" : r.stdout.slice(split.index + split[0].length);
    let status;
    let next = false;
    for (const line of head.split(/\r?\n/)) {
        const m = /^HTTP\/[0-9.]+ ([0-9]{3})(?:\s|$)/.exec(line);
        if (m !== null && status === undefined)
            status = Number(m[1]);
        if (/^link:/i.test(line) && /rel="next"/.test(line))
            next = true;
    }
    if (status === undefined) {
        return { status: undefined, body: undefined, next: false, problem: "gh returned no readable HTTP status" };
    }
    let body;
    try {
        body = JSON.parse(rest);
    }
    catch {
        body = undefined;
    }
    return { status, body, next, problem: undefined };
}
function isObject(v) {
    return typeof v === "object" && v !== null && !Array.isArray(v);
}
// How a call answered, for an UNKNOWN - verify reason: the problem, or the status and message.
function answered(res) {
    if (res.problem !== undefined)
        return res.problem;
    const message = isObject(res.body) && typeof res.body.message === "string" ? ` (${res.body.message})` : "";
    return `HTTP ${res.status}${message}`;
}
// Untrusted text (branch names, host messages) is printed with control characters replaced and
// its length bounded, so a hostile value cannot rewrite the audit line it appears in.
function printable(s) {
    const clean = s.replace(/[\u0000-\u001f\u007f-\u009f]/g, "?");
    return clean.length > 200 ? `${clean.slice(0, 200)}…` : clean;
}
// A branch name this check will put in a REST path: git's own rules refuse the rest, and refusing
// `.`/`..` segments keeps a crafted name from resolving to a different endpoint.
function usableBranch(name) {
    if (name.length === 0 || name.startsWith("-"))
        return false;
    if (/[\u0000- \u007f-\u009f]/.test(name))
        return false;
    return name.split("/").every((seg) => seg !== "" && seg !== "." && seg !== "..");
}
// Encode a branch name for a REST path, keeping `/` literal (branch names may contain it).
function branchPath(name) {
    return name.split("/").map(encodeURIComponent).join("/");
}
// --- branch verdict ---------------------------------------------------------------------------
function branchVerdict(name) {
    const unknown = (reason) => ({ kind: "branch", name, verdict: "UNKNOWN - verify", reason });
    if (!usableBranch(name))
        return unknown("this is not a branch name the check can ask the host about");
    const bp = branchPath(name);
    const rules = apiGet(`repos/{owner}/{repo}/rules/branches/${bp}?per_page=100`);
    const types = new Set();
    let rulesRead = false; // the full list of active rules was read
    if (rules.status === 200 && Array.isArray(rules.body)) {
        for (const r of rules.body)
            if (isObject(r) && typeof r.type === "string")
                types.add(r.type);
        rulesRead = !rules.next;
    }
    const rulePr = types.has("pull_request");
    const ruleNoForce = types.has("non_fast_forward");
    if (rulePr && ruleNoForce) {
        return { kind: "branch", name, verdict: "protected", reason: "an active ruleset requires a pull request and blocks force pushes" };
    }
    const rulesUnread = rules.status === 200 ? "the rule list runs past one page" : `the rules endpoint answered ${answered(rules)}`;
    const prot = apiGet(`repos/{owner}/{repo}/branches/${bp}/protection`);
    if (prot.status === 200 && isObject(prot.body)) {
        const classicPr = isObject(prot.body.required_pull_request_reviews);
        const force = prot.body.allow_force_pushes;
        const classicNoForce = isObject(force) && force.enabled === false;
        const pr = rulePr || classicPr;
        const noForce = ruleNoForce || classicNoForce;
        if (pr && noForce) {
            return {
                kind: "branch",
                name,
                verdict: "protected",
                reason: classicPr && classicNoForce
                    ? "classic branch protection requires pull request reviews and disables force pushes"
                    : "classic branch protection and an active ruleset together require a pull request and block force pushes",
            };
        }
        const missing = [];
        if (!pr)
            missing.push("a pull request review before merge is not required");
        if (!noForce)
            missing.push("force pushes are not blocked");
        if (rulesRead)
            return { kind: "branch", name, verdict: "unprotected", reason: missing.join(" and ") };
        return unknown(`${missing.join(" and ")} by classic protection, but ${rulesUnread}, so a ruleset may still cover it`);
    }
    if (prot.status === 404 && isObject(prot.body)) {
        const missingFromRules = [
            ...(rulePr ? [] : ["requires a pull request"]),
            ...(ruleNoForce ? [] : ["blocks force pushes"]),
        ].join(" or ");
        if (prot.body.message === "Branch not protected") {
            if (rulesRead) {
                return {
                    kind: "branch",
                    name,
                    verdict: "unprotected",
                    reason: `the host reports no classic branch protection, and no active ruleset ${missingFromRules}`,
                };
            }
            return unknown(`the host reports no classic branch protection, but ${rulesUnread}`);
        }
        if (prot.body.message === "Not Found") {
            const br = apiGet(`repos/{owner}/{repo}/branches/${bp}`);
            if (br.status === 200 && isObject(br.body) && br.body.name === name) {
                if (br.body.protected === true) {
                    return unknown("classic protection present; its rules are not readable with this token");
                }
                if (br.body.protected === false) {
                    if (rulesRead) {
                        return {
                            kind: "branch",
                            name,
                            verdict: "unprotected",
                            reason: `the branch reports no classic protection, and no active ruleset ${missingFromRules}`,
                        };
                    }
                    return unknown(`the branch reports no classic protection, but ${rulesUnread}`);
                }
            }
            return unknown(`the protection endpoint answered HTTP 404 (Not Found) and the branch endpoint answered ${answered(br)}`);
        }
    }
    return unknown(`the protection endpoint answered ${answered(prot)}`);
}
// --- environment verdict ----------------------------------------------------------------------
function environmentName() {
    const flag = flagValue("--env");
    if (flag !== undefined && flag.length > 0)
        return { name: flag, source: "the --env flag" };
    for (const rel of [".grugops/factory.config.json", "agent-factory/config/factory.config.json"]) {
        const p = join(process.cwd(), rel);
        if (!existsSync(p))
            continue;
        try {
            const parsed = JSON.parse(readFileSync(p, "utf8"));
            if (isObject(parsed) && Array.isArray(parsed.environments) && parsed.environments.length > 0) {
                const last = parsed.environments[parsed.environments.length - 1];
                if (typeof last === "string" && last.length > 0) {
                    return { name: last, source: `the last "environments" entry of ${rel}` };
                }
            }
        }
        catch {
            // unreadable or unparseable: fall through to the next source
        }
    }
    return { name: "production", source: 'the documented default (no --env flag and no usable "environments" list)' };
}
function environmentVerdict(name, source) {
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
        const reviewers = rules.find((r) => isObject(r) && r.type === "required_reviewers" && Array.isArray(r.reviewers) && r.reviewers.length > 0);
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
const targets = [];
const extraBranches = flagValues("--branch");
const env = environmentName();
let cannotAsk;
if (ghScript !== undefined && !existsSync(ghScript)) {
    cannotAsk = "gh is not available on this machine, so the host could not be asked";
}
else {
    const auth = runGh(["auth", "status"]);
    if (auth.spawnError !== undefined)
        cannotAsk = "gh is not available on this machine, so the host could not be asked";
    else if (auth.status !== 0)
        cannotAsk = "`gh auth status` failed, so the host could not be asked";
}
if (cannotAsk !== undefined) {
    for (const name of ["(default branch)", ...extraBranches]) {
        targets.push({ kind: "branch", name, verdict: "UNKNOWN - verify", reason: cannotAsk });
    }
    targets.push({
        kind: "environment",
        name: env.name,
        verdict: "UNKNOWN - verify",
        reason: `${cannotAsk}; environment name from ${env.source}`,
    });
}
else {
    const names = [];
    const repo = apiGet("repos/{owner}/{repo}");
    if (repo.status === 200 && isObject(repo.body) && typeof repo.body.default_branch === "string") {
        names.push(repo.body.default_branch);
    }
    else {
        targets.push({
            kind: "branch",
            name: "(default branch)",
            verdict: "UNKNOWN - verify",
            reason: `the repository endpoint answered ${answered(repo)}; the default branch is unknown`,
        });
    }
    for (const b of ["main", "master"]) {
        if (names.includes(b))
            continue;
        const res = apiGet(`repos/{owner}/{repo}/branches/${b}`);
        // GitHub answers a RENAMED branch's old name with the branch it was renamed to (measured
        // 2026-09-27: `branches/master` → 200 with `"name": "main"` on a repository whose master was
        // renamed). Only an answer about the branch that was asked for shows the branch exists.
        if (res.status === 200 && isObject(res.body) && res.body.name === b)
            names.push(b);
        else if (res.status === 200 && isObject(res.body) && typeof res.body.name === "string")
            continue;
        else if (res.status !== 404) {
            targets.push({
                kind: "branch",
                name: b,
                verdict: "UNKNOWN - verify",
                reason: `could not tell whether the branch exists: the branch endpoint answered ${answered(res)}`,
            });
        }
    }
    for (const b of extraBranches)
        if (!names.includes(b))
            names.push(b);
    for (const b of names)
        targets.push(branchVerdict(b));
    targets.push(environmentVerdict(env.name, env.source));
}
// --- report -----------------------------------------------------------------------------------
let p = 0;
let u = 0;
let k = 0;
for (const t of targets) {
    if (t.verdict === "protected")
        p++;
    else if (t.verdict === "unprotected")
        u++;
    else
        k++;
    console.log(`${t.kind} ${printable(t.name)}: ${t.verdict} — ${printable(t.reason)}`);
}
console.log(`HOST-PROTECTION: ${p} protected, ${u} unprotected, ${k} UNKNOWN - verify`);
const exitCode = u > 0 ? 1 : k > 0 ? 2 : 0;
if (wantJson) {
    console.log(JSON.stringify({
        ok: exitCode === 0,
        targets: targets.map((t) => ({ kind: t.kind, name: printable(t.name), verdict: t.verdict, reason: printable(t.reason) })),
        calls,
    }, null, 2));
}
process.exit(exitCode);

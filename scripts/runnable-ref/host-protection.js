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
// BYPASS (plan 33.1-19, D-30). The floor must hold against the account the check runs under,
// which is usually the account the agent works under. A source shows an item only when that
// account cannot bypass it. Ruleset arm: each rule that could show an item names its ruleset by
// `ruleset_id`; an id that is not a safe positive integer is never put in a path and the rule
// shows nothing. Each distinct id is read once per run through `rulesets/<id>`, at most
// MAX_RULESET_READS per branch (the rest show nothing). The rule binds only when that read is a
// 200 about the same ruleset reporting `current_user_can_bypass: "never"`; `always`,
// `pull_requests_only` and `exempt` are read as bypassable; any other answer is not readable. So
// an item is `held` on the ruleset arm when at least one binding rule shows it. The last row of
// the table, `no_bypass`, is the qualifier: `held` when every item is held (each item already
// counts only binding sources), `failed` when an item fails and a source that would show it was
// read as bypassable, `unknown` otherwise; its evidence names each bypassable or unreadable source.
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
    const message = isObject(res.body) && typeof res.body.message === "string" ? ` (${printable(res.body.message)})` : "";
    return `HTTP ${res.status}${message}`;
}
// Untrusted text (branch names, host messages) is printed with control characters replaced and
// its length bounded, so a hostile value cannot rewrite the audit line it appears in. A single host
// value is bounded at 200 characters; a composed reason or fact evidence (our own text around host
// values that were each bounded already) at REASON_MAX, since a branch reason names up to four
// floor rows with the evidence from both arms.
const REASON_MAX = 2000;
function printable(s, max = 200) {
    const clean = s.replace(/[\u0000-\u001f\u007f-\u009f]/g, "?");
    return clean.length > max ? `${clean.slice(0, max)}…` : clean;
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
function rulesOfType(rules, type) {
    return rules.filter((r) => r.type === type);
}
// A `ruleset_id` this check will put in a REST path: a safe positive integer, nothing else
// (T-33.1-191). A string, a fraction, 0, a negative or an unsafe integer never reaches a path.
function usableRulesetId(v) {
    return typeof v === "number" && Number.isSafeInteger(v) && v > 0;
}
// Which ruleset a rule came from, for the evidence line.
function rulesetOf(rule) {
    return usableRulesetId(rule.ruleset_id) ? `ruleset ${rule.ruleset_id}` : "an active ruleset";
}
// A rule of the item's type shows it by being present.
function ruleShows(rule) {
    return { state: "held", evidence: `${rulesetOf(rule)} has a ${String(rule.type)} rule` };
}
// A classic `{ enabled }` object shows the item only when `enabled === false`.
function classicDisabled(key) {
    return (body) => {
        const v = body[key];
        if (isObject(v) && v.enabled === false)
            return { state: "held", evidence: `classic ${key}.enabled is false` };
        if (isObject(v) && v.enabled === true)
            return { state: "failed", evidence: `classic ${key}.enabled is true` };
        return { state: "unknown", evidence: `classic protection carries no readable ${key}.enabled` };
    };
}
// An approval count shows the approval item only as an integer >= 1.
function approvalCount(count) {
    if (!Number.isInteger(count))
        return "unknown";
    return count >= 1 ? "held" : "failed";
}
// THE CANONICAL BRANCH FLOOR. Each `requirement` is byte-equal to a line of the branch checklist
// in install/README.md §5; host-protection.test.ts binds the two both ways and holds a weakening
// fixture per row. Nothing outside this table decides whether a branch is `protected`.
const BRANCH_FLOOR = [
    {
        kind: "item",
        id: "pull_request",
        requirement: "requires a pull request before merging",
        ruleType: "pull_request",
        fromRule: ruleShows,
        fromClassic: (body) => {
            const rpr = body.required_pull_request_reviews;
            if (isObject(rpr))
                return { state: "held", evidence: "classic protection requires pull request reviews" };
            if (rpr === undefined)
                return { state: "failed", evidence: "classic protection does not require pull request reviews" };
            return { state: "unknown", evidence: "classic required_pull_request_reviews has an unexpected shape" };
        },
        reviewItem: true,
    },
    {
        kind: "item",
        id: "approving_review",
        requirement: "requires at least one approving review",
        ruleType: "pull_request",
        fromRule: (rule) => {
            const count = isObject(rule.parameters) ? rule.parameters.required_approving_review_count : undefined;
            const state = approvalCount(count);
            if (state === "unknown") {
                return { state, evidence: `a pull_request rule in ${rulesetOf(rule)} carries no integer required_approving_review_count` };
            }
            return { state, evidence: `a pull_request rule in ${rulesetOf(rule)} requires ${String(count)} approving review(s)` };
        },
        fromClassic: (body) => {
            const rpr = body.required_pull_request_reviews;
            if (rpr === undefined)
                return { state: "failed", evidence: "classic protection does not require pull request reviews" };
            if (!isObject(rpr))
                return { state: "unknown", evidence: "classic required_pull_request_reviews has an unexpected shape" };
            const count = rpr.required_approving_review_count;
            const state = approvalCount(count);
            if (state === "unknown") {
                return { state, evidence: "classic protection carries no integer required_approving_review_count" };
            }
            return { state, evidence: `classic protection requires ${String(count)} approving review(s)` };
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
const FLOOR_ITEMS = BRANCH_FLOOR.filter((row) => row.kind === "item");
// --- binding: can the account the check runs under bypass a source? (D-30) --------------------
// At most this many distinct rulesets are read per branch (T-33.1-192: each read is a gh spawn
// with a 20 s timeout). A rule from a ruleset beyond the bound shows nothing: its binding is
// `unknown`.
const MAX_RULESET_READS = 20;
// One read per ruleset per run, whichever branch asks first.
const rulesetBindingCache = new Map();
// `GET rulesets/<id>`: GitHub documents `current_user_can_bypass` as one of `always`,
// `pull_requests_only`, `never` and `exempt`. Only `never` binds. The answer counts only when it
// is about the ruleset that was asked for. `bypass_actors` is never read (T-33.1-193).
function readRulesetBinding(id) {
    const cached = rulesetBindingCache.get(id);
    if (cached !== undefined)
        return cached;
    const res = apiGet(`repos/{owner}/{repo}/rulesets/${id}`);
    let b;
    if (res.status === 200 && isObject(res.body) && res.body.id === id) {
        const v = res.body.current_user_can_bypass;
        if (v === "never")
            b = { state: "binds", evidence: `ruleset ${id} reports current_user_can_bypass "never"` };
        else if (v === "always" || v === "pull_requests_only" || v === "exempt") {
            b = { state: "bypassable", evidence: `ruleset ${id} reports current_user_can_bypass "${v}"` };
        }
        else if (v === undefined) {
            b = { state: "unknown", evidence: `ruleset ${id} carries no current_user_can_bypass` };
        }
        else {
            b = {
                state: "unknown",
                evidence: `ruleset ${id} reports a current_user_can_bypass this check does not recognize (${printable(String(JSON.stringify(v)))})`,
            };
        }
    }
    else if (res.status === 200 && isObject(res.body)) {
        b = { state: "unknown", evidence: `the read of ruleset ${id} answered about a different ruleset` };
    }
    else {
        b = { state: "unknown", evidence: `the read of ruleset ${id} answered ${answered(res)}` };
    }
    rulesetBindingCache.set(id, b);
    return b;
}
// The binding of every distinct ruleset whose rules could show an item on this branch, in the
// order the rules name them; the first MAX_RULESET_READS are read, the rest are `unknown`.
function rulesetBindings(arm) {
    const types = new Set(FLOOR_ITEMS.map((row) => row.ruleType));
    const ids = [];
    for (const rule of arm.rules) {
        const id = rule.ruleset_id;
        if (types.has(String(rule.type)) && usableRulesetId(id) && !ids.includes(id))
            ids.push(id);
    }
    const out = new Map();
    ids.forEach((id, i) => {
        out.set(id, i < MAX_RULESET_READS
            ? readRulesetBinding(id)
            : { state: "unknown", evidence: `ruleset ${id} was not read (the check reads at most ${MAX_RULESET_READS} rulesets per branch)` });
    });
    return out;
}
function ruleBinding(rule, bindings) {
    const id = rule.ruleset_id;
    if (!usableRulesetId(id)) {
        return { state: "unknown", evidence: `a ${String(rule.type)} rule carries no usable ruleset_id, so its ruleset cannot be asked about bypass` };
    }
    return bindings.get(id) ?? { state: "unknown", evidence: `ruleset ${id} was not read` };
}
// The classic arm's binding for one item. Filled in by the enforce_admins and pull request
// bypass allowance readings.
function classicBinding(_body, _row) {
    return { state: "binds", evidence: "" };
}
function plain(state, evidence) {
    return { state, evidence, bypassed: [], unbound: [] };
}
function unique(list) {
    return [...new Set(list)];
}
// A source shows an item only when it shows it AND binds the account. `held` when at least one
// source does; `unknown` when none does and some source cannot be read; `failed` otherwise (every
// source was read and either does not show the item or can be bypassed).
function bindSources(sources) {
    const held = [];
    const unknown = [];
    const failed = [];
    const bypassed = [];
    const unbound = [];
    for (const { shown, binding } of sources) {
        const both = binding.evidence === "" ? shown.evidence : `${shown.evidence}, and ${binding.evidence}`;
        const but = binding.evidence === "" ? shown.evidence : `${shown.evidence}, but ${binding.evidence}`;
        if (shown.state !== "failed" && binding.state === "bypassable")
            bypassed.push(binding.evidence);
        if (shown.state !== "failed" && binding.state === "unknown")
            unbound.push(binding.evidence);
        if (shown.state === "failed")
            failed.push(shown.evidence);
        else if (binding.state === "bypassable")
            failed.push(but);
        else if (shown.state === "held" && binding.state === "binds")
            held.push(both);
        else
            unknown.push(binding.state === "unknown" ? but : shown.evidence);
    }
    const extra = { bypassed: unique(bypassed), unbound: unique(unbound) };
    if (held.length > 0)
        return { state: "held", evidence: held[0], ...extra };
    if (unknown.length > 0)
        return { state: "unknown", evidence: unique(unknown).join("; "), ...extra };
    return { state: "failed", evidence: unique(failed).join("; "), ...extra };
}
function rulesetReading(row, arm, bindings) {
    if (arm.read === "none")
        return plain("unknown", arm.why);
    const found = rulesOfType(arm.rules, row.ruleType);
    const r = found.length === 0
        ? plain("failed", `no active ruleset has a ${row.ruleType} rule`)
        : bindSources(found.map((rule) => ({ shown: row.fromRule(rule), binding: ruleBinding(rule, bindings) })));
    if (r.state === "failed" && arm.read === "partial") {
        return { ...r, state: "unknown", evidence: `${r.evidence} on the first page, but ${arm.why}` };
    }
    return r;
}
function classicReading(row, arm) {
    if (arm.kind === "body")
        return bindSources([{ shown: row.fromClassic(arm.body), binding: classicBinding(arm.body, row) }]);
    return plain(arm.kind === "none" ? "failed" : "unknown", arm.evidence);
}
// THE UNION RULE: held when either arm shows the item, failed only when both arms read it and
// neither shows it, unknown otherwise.
function combineArms(a, b) {
    if (a === "held" || b === "held")
        return "held";
    if (a === "failed" && b === "failed")
        return "failed";
    return "unknown";
}
// THE QUALIFIER (D-30). Every item is already counted only from sources that bind the account,
// so the qualifier is `held` exactly when every item is; `failed` when some item fails and a
// source that would show it was read as bypassable (on arms that were both read); `unknown`
// otherwise. Its evidence names each bypassable or unreadable source.
function qualifierFact(row, items) {
    const bypassed = unique(items.flatMap((i) => [...i.fromRules.bypassed, ...i.fromClassic.bypassed]));
    const unbound = unique(items.flatMap((i) => [...i.fromRules.unbound, ...i.fromClassic.unbound]));
    const base = { id: row.id, requirement: row.requirement };
    if (items.every((i) => i.fact.state === "held")) {
        const also = bypassed.length > 0 ? `; read as bypassable and not counted: ${bypassed.join("; ")}` : "";
        return { ...base, state: "held", evidence: `every item above is shown by a source this account cannot bypass${also}` };
    }
    const bypassFailed = items.filter((i) => i.fact.state === "failed" && i.fromRules.bypassed.length + i.fromClassic.bypassed.length > 0);
    if (bypassFailed.length > 0) {
        return {
            ...base,
            state: "failed",
            evidence: `this account can bypass what would show ${bypassFailed.map((i) => i.fact.requirement).join(", ")}: ${bypassed.join("; ")}`,
        };
    }
    const parts = [];
    if (bypassed.length > 0)
        parts.push(`read as bypassable: ${bypassed.join("; ")}`);
    if (unbound.length > 0)
        parts.push(`not readable: ${unbound.join("; ")}`);
    if (parts.length === 0)
        parts.push("not every item above is shown, so there is no protection to judge for bypass");
    return { ...base, state: "unknown", evidence: parts.join("; ") };
}
// Every row `unknown`, for a branch target the check could not read at all.
function unreadFacts(why) {
    return BRANCH_FLOOR.map((row) => ({ id: row.id, requirement: row.requirement, state: "unknown", evidence: why }));
}
function branchUnknown(name, reason) {
    return { kind: "branch", name, verdict: "UNKNOWN - verify", reason, facts: unreadFacts(reason) };
}
function readRulesetArm(bp) {
    const res = apiGet(`repos/{owner}/{repo}/rules/branches/${bp}?per_page=100`);
    if (res.status === 200 && Array.isArray(res.body)) {
        const rules = res.body.filter((r) => isObject(r) && typeof r.type === "string");
        return res.next
            ? { read: "partial", rules, why: "the rule list runs past one page" }
            : { read: "full", rules, why: "" };
    }
    return { read: "none", rules: [], why: `the rules endpoint answered ${answered(res)}` };
}
function readClassicArm(name, bp) {
    const prot = apiGet(`repos/{owner}/{repo}/branches/${bp}/protection`);
    if (prot.status === 200 && isObject(prot.body))
        return { kind: "body", body: prot.body };
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
            if (br.body.protected === false)
                return { kind: "none", evidence: "the branch reports no classic protection" };
        }
        return {
            kind: "unreadable",
            evidence: `the protection endpoint answered HTTP 404 (Not Found) and the branch endpoint answered ${answered(br)}`,
        };
    }
    return { kind: "unreadable", evidence: `the protection endpoint answered ${answered(prot)}` };
}
// --- branch verdict ---------------------------------------------------------------------------
function branchVerdict(name) {
    if (!usableBranch(name))
        return branchUnknown(name, "this is not a branch name the check can ask the host about");
    const bp = branchPath(name);
    const rulesetArm = readRulesetArm(bp);
    const bindings = rulesetBindings(rulesetArm);
    const fromRules = FLOOR_ITEMS.map((row) => rulesetReading(row, rulesetArm, bindings));
    // The classic arm is read only when the ruleset arm leaves some item not shown.
    const classicArm = fromRules.every((r) => r.state === "held") ? undefined : readClassicArm(name, bp);
    const fromClassic = FLOOR_ITEMS.map((row) => classicArm === undefined ? plain("unknown", "not read (the ruleset arm shows every item)") : classicReading(row, classicArm));
    const items = FLOOR_ITEMS.map((row, i) => ({
        fact: {
            id: row.id,
            requirement: row.requirement,
            state: combineArms(fromRules[i].state, fromClassic[i].state),
            evidence: `ruleset: ${fromRules[i].evidence}; classic: ${fromClassic[i].evidence}`,
        },
        fromRules: fromRules[i],
        fromClassic: fromClassic[i],
    }));
    const facts = BRANCH_FLOOR.map((row) => row.kind === "item" ? items.find((i) => i.fact.id === row.id).fact : qualifierFact(row, items));
    if (facts.every((f) => f.state === "held")) {
        const shownBy = items.map(({ fact, fromRules: r, fromClassic: c }) => {
            const arm = r.state === "held" && c.state === "held" ? "ruleset and classic protection" : r.state === "held" ? "ruleset" : "classic protection";
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
    const verdict = facts.some((f) => f.state === "failed") ? "unprotected" : "UNKNOWN - verify";
    const reason = facts
        .filter((f) => f.state !== "held")
        .map((f) => `${f.requirement}: ${f.state === "failed" ? "not shown" : "not readable"} (${f.evidence})`)
        .join("; ");
    return { kind: "branch", name, verdict, reason, facts };
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
        targets.push(branchUnknown(name, cannotAsk));
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
        targets.push(branchUnknown("(default branch)", `the repository endpoint answered ${answered(repo)}; the default branch is unknown`));
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
            targets.push(branchUnknown(b, `could not tell whether the branch exists: the branch endpoint answered ${answered(res)}`));
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
    console.log(`${t.kind} ${printable(t.name)}: ${t.verdict} — ${printable(t.reason, REASON_MAX)}`);
}
console.log(`HOST-PROTECTION: ${p} protected, ${u} unprotected, ${k} UNKNOWN - verify`);
const exitCode = u > 0 ? 1 : k > 0 ? 2 : 0;
if (wantJson) {
    console.log(JSON.stringify({
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
    }, null, 2));
}
process.exit(exitCode);

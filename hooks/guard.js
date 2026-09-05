// guard.ts — grugops SAFE-02 mechanical prod-deploy guard.
//
// Pure-Node Claude Code PreToolUse hook (D-34): no `jq`, no npm dependency, Node stdlib only
// (plus the shared checkpoint roster and config reader from scripts/). Wired by hooks/hooks.json
// as a plugin-level PreToolUse Bash matcher
// (`node "${CLAUDE_PLUGIN_ROOT}/hooks/guard.js"`). This guard makes "humans decide, agents
// execute" mechanical: a prompt cannot override a PreToolUse hook deny.
//
// This is a byte-for-behavior TypeScript port of the original hooks/guard.mjs (Phase 5,
// SAFE-02), extended in Phase 30 (AUTO-01..03, AUTO-07) to consult the per-checkpoint autonomy
// matrix. The Phase-5 semantics are UNCHANGED at every default: the same approval env-var NAME,
// the same DEPLOY pattern set (now split into two named groups, not one regex altered), the same
// fail-closed stdin parse, and the same exit-0-+-JSON-deny block mechanism. See D-10 and RESEARCH
// Pitfall 2 — a careless "cleanup" silently disables the deny path; translate, never redesign. The
// committed compiled output is hooks/guard.js, which the host hook runs.
//
// WHAT PHASE 30 ADDED, AND WHAT IT DELIBERATELY DID NOT CHANGE (AUTO-07).
// With NO `checkpoints` object in config, every checkpoint sits at its roster default `block` and
// this guard's DECISION for every input is the Phase-5 decision, with the Phase-5 denial wording,
// byte for byte. The only difference in a zero-config run is ONE added line on stderr: the run
// banner. That equivalence is asserted as a whole-run differential against the pre-phase artifact
// in scripts/autonomy-zero-config.test.ts — a line-level diff, never a substring probe.
//
// THE ONE DISCLOSED TIGHTENING. The self-set refusal now covers the whole `GRUGOPS_FLOOR_*` family
// as well as the approval variable, so a command that inline-sets a floor variable is refused where
// the Phase-5 guard would have allowed it. That is a strictly stricter decision on an input class
// that did not exist before this phase, and it is named here rather than left for a reader to find.
//
// Contract (all clear-voice, no caveman voice in safety output):
//   - Reads the Bash command from PreToolUse stdin JSON (`tool_input.command`).
//   - DENIES any matched production-deploy command unless a HUMAN-SET session env var
//     (GRUGOPS_PROD_DEPLOY_APPROVED, D-33) is present in the hook's own process env.
//   - Consults the per-checkpoint matrix (`checkpoints.<id>` in factory.config.json) for the two
//     checkpoints it enforces. Lowering a FLOOR checkpoint takes TWO keys: the config declaration
//     AND a human-set `GRUGOPS_FLOOR_<ID>` in this process's own env, read fresh per invocation.
//     A declaration with no matching variable is enforced exactly as `block` and denied BY NAME,
//     naming the checkpoint and the missing variable (D-09, D-10).
//   - REFUSES any command that tries to inline-set/export the approval variable OR any floor
//     variable, so the agent can never self-approve and can never self-authorize a lowering (D-33,
//     D-09) — even when the variable is already present in the environment.
//   - PRINTS the run banner on stderr on EVERY invocation: one line naming each checkpoint whose
//     declared disposition is not its default, or the fixed literal `all checkpoints at default`
//     (D-19, D-20). It goes to stderr, never stdout, because stdout is the hook's JSON channel and
//     a non-JSON line there would break the deny mechanism this file exists to provide.
//   - FAILS CLOSED: malformed/empty stdin never crash-allows a matched deploy; a config that cannot
//     be read is treated as `block`; a throw while reading the matrix denies a MATCHED command.
//   - Uses no hardcoded absolute path; the deploy-pattern set is config-driven with sane
//     defaults (D-32) and pairs with factory.config.json
//     `production_requires_human_confirmation: true`.
//
// Block mechanism: exit 0 + JSON `hookSpecificOutput.permissionDecision: "deny"` with a
// `permissionDecisionReason` (gives the agent a clear message). Allow = exit 0, no stdout.
import { readFileSync } from "node:fs";
import { CHECKPOINT_DEFAULTS, FLOOR_CHECKPOINTS, FLOOR_ENV_VAR_PREFIX, floorEnvVarName, renderCheckpointBanner, resolveCheckpoint, } from "../scripts/checkpoints.js";
import { readGovernanceConfig } from "../scripts/context-io.js";
// D-33: the human-confirm signal. A human exports this in the shell that launches Claude
// (or via settings env). The name is a placeholder per research Assumption A2 — projects may
// rename it; the guard reads whatever name is set here from its own process env.
//
// THIS IS THE ACTION APPROVAL AND ITS MEANING IS UNCHANGED. It permits a matched command whose
// checkpoint is at `block` — which is what makes a zero-config run behave exactly as it did before
// Phase 30. It is NOT key two: it approves THIS action at the un-lowered posture, whereas a
// `GRUGOPS_FLOOR_<ID>` variable authorizes a standing LOWERING of the posture itself. Two different
// grants, deliberately two different names.
const APPROVAL = "GRUGOPS_PROD_DEPLOY_APPROVED";
// D-32: default production-deploy command patterns. This is a sane built-in set; per-project
// patterns are extended at build/bootstrap and never hardcoded to a single stack. The guard
// pairs with factory.config.json `production_requires_human_confirmation: true` and the
// `environments` list (dev/staging/prod); production is the gated environment.
//
// Two design rules govern this set, both clear-voice (no caveman voice in safety output):
//   1. FAIL CLOSED on ambiguity. A pattern that could be a production mutation is denied; a
//      human can always re-run after exporting the approval var. We would rather over-block a
//      borderline command than miss a real deploy.
//   2. Match the SUBCOMMAND VERB, not a substring anywhere in the line. The tool-name patterns
//      (gcloud/aws) are anchored to the verb position so a benign read-only command that merely
//      mentions "deploy" in a path or a comment (e.g. `cat ./deploy/notes.txt`,
//      `gcloud config list # see deploy docs`) is NOT denied. Over-broad patterns train users to
//      disable the guard, which is the opposite of safe.
//
// PHASE 30 SPLIT THE SET IN TWO WITHOUT TOUCHING A SINGLE REGEX. The members are byte-identical to
// the Phase-5 array and appear in the same relative order; they are merely grouped by the CHECKPOINT
// each one belongs to, so the matrix can be consulted per checkpoint rather than per command.
const PRODUCTION_DEPLOY_PATTERNS = [
    // kubernetes: apply/rollout push state; delete is a destructive prod mutation.
    /\bkubectl\s+(apply|rollout|delete)\b/,
    /\bhelm\s+(upgrade|install)\b/,
    /\bterraform\s+apply\b/,
    // gcloud: deny only `gcloud <group> deploy` (app/run/functions/builds/...), the actual deploy
    // verb — not any command that happens to contain the word "deploy" later on the line.
    /\bgcloud\s+\w+\s+deploy\b/,
    // aws: the CodeDeploy service (`aws deploy ...`) and an S3 sync, which is the common static-site
    // / asset production deploy that carries no literal "deploy" token.
    /\baws\s+deploy\b/,
    /\baws\s+s3\s+sync\b/,
    /\bserverless\s+deploy\b/,
    /\bsls\s+deploy\b/,
    /\bflyctl\s+deploy\b/,
    /\bfly\s+deploy\b/,
    /\bvercel\b[\s\S]*--prod\b/,
    // registry publishes: the JS family (npm/yarn/pnpm). cargo/gem/twine/docker push are
    // intentionally out of the default set (IN-01) and expected to be added per-project.
    /\b(npm|yarn|pnpm)\s+publish\b/,
];
// protected-branch pushes are the OTHER half of the hard rule ("never merge a protected
// branch"). Deny a force push (any branch — a force push is destructive enough to gate) and any
// push that names a protected branch. `\bmain\b`/`\bmaster\b` will also match a branch whose
// name merely contains that word — that is deliberate fail-closed behavior, not a bug.
const PROTECTED_BRANCH_PATTERNS = [
    /\bgit\s+push\b[\s\S]*\s(--force|-f|--force-with-lease)\b/,
    /\bgit\s+push\b[\s\S]*\b(main|master)\b/,
    /\bgit\s+push\b[\s\S]*\brelease\//,
];
/** Which checkpoint each pattern group belongs to. The ids come from the roster, never restated. */
const CHECKPOINT_PATTERNS = [
    { id: "production_requires_human_confirmation", patterns: PRODUCTION_DEPLOY_PATTERNS },
    { id: "protected_branch_merge", patterns: PROTECTED_BRANCH_PATTERNS },
];
// NOTE (residual surface, documented honestly): env-var indirection such as
// `K=kubectl; $K apply -f x` defeats the literal tool-name patterns above and is OUT OF SCOPE for
// this default set — the guard does not normalize variable expansion. The backstop on every tool is
// the per-checkpoint matrix and its two-key rule: the checkpoints that hold merge and deploy default
// to `block`, and lowering either of them takes BOTH an agent-writable config declaration AND a
// human-set `GRUGOPS_FLOOR_<ID>` in the session this hook reads — so a config edit by an agent
// acting alone changes nothing. That backstop is a posture, not a parser: it does not recover a
// command this pattern set failed to recognize.
// See install/README.md §5 and agent-factory/packaging/adapters.md.
// ONE self-set detector, over the WHOLE grant vocabulary (D-09). It detects any attempt to set or
// export a grant variable inline (e.g. `GRUGOPS_PROD_DEPLOY_APPROVED=1 ...`,
// `export GRUGOPS_FLOOR_PROTECTED_BRANCH_MERGE=me`, `env GRUGOPS_PROD_DEPLOY_APPROVED=1 ...`),
// regardless of the surrounding command. The Phase-5 shape
// `(^|[\s;&|(])(export\s+|env\s+)?NAME\s*=` is preserved exactly; only the NAME position widened
// from one literal to an alternation, and the two leading groups became non-capturing so that
// group 1 is the matched NAME and the denial can say which grant was attempted.
//
// THE FLOOR ARM IS THE FAMILY, NOT A LIST OF NAMES — AND THE LIST IS ASSERTED INTO IT. A per-name
// alternation would refuse exactly today's floors and silently allow `GRUGOPS_FLOOR_<something new>`
// the moment the roster grows, which is this repository's founding defect class (set-literal drift)
// pointed at a safety refusal. So the arm matches the whole prefix family, and the DERIVED names
// are asserted to fall inside it below: if a derived name ever escaped the family pattern, the
// guard refuses to run rather than run with a hole.
const FLOOR_ENV_VAR_PATTERN = `${FLOOR_ENV_VAR_PREFIX}[A-Z0-9_]+`;
const SELF_APPROVE = new RegExp(`(?:^|[\\s;&|(])(?:export\\s+|env\\s+)?(${APPROVAL}|${FLOOR_ENV_VAR_PATTERN})\\s*=`);
function deny(reason) {
    process.stdout.write(JSON.stringify({
        hookSpecificOutput: {
            hookEventName: "PreToolUse",
            permissionDecision: "deny",
            permissionDecisionReason: reason,
        },
    }));
    process.exit(0); // exit 0 + JSON deny = blocked, with a message for the agent.
}
// Read and parse stdin. Fail CLOSED: if input cannot be read or parsed, treat the command as
// empty. An empty command matches no deploy pattern and is allowed, so a malformed payload can
// never crash-allow a real deploy — a matched deploy would have to arrive as well-formed JSON
// to be evaluated, and that path is gated below.
//
// PHASE 30 RE-DERIVATION OF THAT ARGUMENT. It is now "matches no CHECKPOINT pattern", and it still
// holds for the same reason: an empty string matches none of the patterns in either group, and the
// matrix is only ever consulted for a command that HAS matched. The argument would stop holding if
// a checkpoint were ever enforced on the ABSENCE of a match; none is, and none may be added here
// without revisiting this comment.
let cmd = "";
try {
    const raw = readFileSync(0, "utf8");
    const input = JSON.parse(raw);
    cmd = (input?.tool_input?.command ?? "");
    if (typeof cmd !== "string")
        cmd = "";
}
catch {
    cmd = ""; // malformed / empty stdin → no command → allow only non-deploys.
}
// ── Read the live matrix (AUTO-02, D-12 posture). ────────────────────────────────────────────────
// ${CLAUDE_PROJECT_DIR} is the documented hook project root; when unset the reader falls back to its
// own repo root, exactly as hooks/admission-guard.ts resolves it. `unreadable` is treated as `block`
// by the reader itself (it returns the roster default), so an absent, corrupt or degenerate config
// all reach the un-lowered posture. A THROW is a different failure — nothing was read at all — and
// is recorded here so that a MATCHED command denies on it rather than proceeding on a matrix nobody
// produced. An unmatched command was never gated by this hook and is not gated by a read failure.
let matrix = { ...CHECKPOINT_DEFAULTS };
let matrixUnread = false;
try {
    matrix = readGovernanceConfig(process.env.CLAUDE_PROJECT_DIR).config.checkpoints;
}
catch {
    matrix = { ...CHECKPOINT_DEFAULTS };
    matrixUnread = true;
}
// ── The run banner, on EVERY invocation (D-19, D-20). ────────────────────────────────────────────
// stderr, never stdout: stdout carries the hook's JSON and a bare line there would break the deny
// mechanism. One line, always present, so a missing banner and a broken banner look different.
process.stderr.write(`${renderCheckpointBanner(matrix, process.env)}\n`);
// The derived floor names must fall inside the family the self-set detector refuses. Asserted here,
// at the point of use, rather than trusted: a derived name outside the pattern would be a grant the
// agent could set for itself, so the guard refuses to run rather than run with the hole.
const FAMILY = new RegExp(`^${FLOOR_ENV_VAR_PATTERN}$`);
for (const c of FLOOR_CHECKPOINTS) {
    if (!FAMILY.test(floorEnvVarName(c))) {
        deny(`Blocked (fail-closed): the floor grant variable for checkpoint "${c}" is ` +
            `"${floorEnvVarName(c)}", which the self-set refusal cannot recognize. The guard will not ` +
            `evaluate a command while a grant variable exists that an agent could set for itself.`);
    }
}
// D-33: the agent must never grant its own approval. Any inline set/export of the approval var
// is denied EVEN IF the var is already present in the environment. D-09 extends the same rule to
// every floor grant variable: the agent must never authorize its own LOWERING either.
const selfSet = SELF_APPROVE.exec(cmd);
if (selfSet) {
    const attempted = selfSet[1];
    if (attempted === APPROVAL) {
        deny(`Refused: an agent may not set or export ${APPROVAL}. ` +
            `Approval for a production deploy must come from a human who exports ${APPROVAL} ` +
            `in the shell that launches Claude — it cannot be set inside the command.`);
    }
    deny(`Refused: an agent may not set or export ${attempted}. ` +
        `A floor grant lowers a safety checkpoint below its default and must come from a human who ` +
        `exports ${attempted}=NAME in the shell that launches Claude — it cannot be set inside the ` +
        `command, and it is refused here even when the variable is already present in the environment. ` +
        `The grant is session-scoped: once a human sets it, it authorizes the lowered posture under ` +
        `that name until it is unset, not for a single action.`);
}
// ── D-32 / D-33 / D-07 / D-10: the per-checkpoint decision. FAIL CLOSED. ─────────────────────────
// For each checkpoint whose pattern group the command matched, resolve the two-key rule and act:
//   effective `block`  → deny unless the human-set ACTION approval is present (the Phase-5 rule,
//                        with the Phase-5 wording — this is the zero-config path);
//   unauthorized lowering → still `block` (the config declaration alone changed nothing), but the
//                        denial names the checkpoint and the missing variable so the agent and the
//                        transcript both say WHY it did not take effect (D-10);
//   effective `notify` / `off` → allow. The lowering was authorized by a human, and the banner
//                        above already named the checkpoint, its value and the authorizing grant.
for (const group of CHECKPOINT_PATTERNS) {
    if (!group.patterns.some((re) => re.test(cmd)))
        continue;
    const r = resolveCheckpoint(group.id, matrix, process.env);
    if (r.effective !== "block")
        continue;
    if (process.env[APPROVAL])
        continue;
    if (matrixUnread) {
        deny(`Blocked (fail-closed): this command matches the "${group.id}" checkpoint and the grugops ` +
            `configuration could not be read, so the guard cannot know whether that checkpoint was ` +
            `lowered. It is enforced at its default, \`block\`. A human must resolve the configuration, ` +
            `or export ${APPROVAL} in the shell that launches Claude, then re-run.`);
    }
    if (r.unauthorizedLowering) {
        deny(`Blocked: the checkpoint "${r.id}" is declared \`${r.declared}\` in factory.config.json, but ` +
            `that declaration alone does not lower it. Lowering a safety floor takes two keys: the ` +
            `config declaration AND the environment variable ${r.envVarName}, set by a human in the ` +
            `session this hook reads. ${r.envVarName} is not set, so "${r.id}" is enforced at \`block\` ` +
            `and this command is refused. A human must export ${r.envVarName}=NAME in the shell that ` +
            `launches Claude — an agent may not set it, and setting it inside this command is refused.`);
    }
    deny(`Production deploy blocked: humans decide, agents execute. ` +
        `This command matches a production-deploy pattern and ${APPROVAL} is not set. ` +
        `A human must export ${APPROVAL} in the shell that launches Claude ` +
        `(pairs with factory.config.json production_requires_human_confirmation), then re-run the deploy.`);
}
// Allow everything else.
process.exit(0);

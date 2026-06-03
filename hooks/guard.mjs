// guard.mjs — grugops SAFE-02 mechanical prod-deploy guard.
//
// Pure-Node Claude Code PreToolUse hook (D-34): no `jq`, no npm dependency, Node stdlib only.
// Wired by hooks/hooks.json as a plugin-level PreToolUse Bash matcher
// (`node "${CLAUDE_PLUGIN_ROOT}/hooks/guard.mjs"`). This guard makes "humans decide, agents
// execute" mechanical: a prompt cannot override a PreToolUse hook deny.
//
// Contract (all clear-voice, no caveman voice in safety output):
//   - Reads the Bash command from PreToolUse stdin JSON (`tool_input.command`).
//   - DENIES any matched production-deploy command unless a HUMAN-SET session env var
//     (GRUGOPS_PROD_DEPLOY_APPROVED, D-33) is present in the hook's own process env.
//   - REFUSES any command that tries to inline-set/export that env var, so the agent can
//     never self-approve (D-33).
//   - FAILS CLOSED: malformed/empty stdin never crash-allows a matched deploy.
//   - Uses no hardcoded absolute path; the deploy-pattern set is config-driven with sane
//     defaults (D-32) and pairs with factory.config.json
//     `production_requires_human_confirmation: true`.
//
// Block mechanism: exit 0 + JSON `hookSpecificOutput.permissionDecision: "deny"` with a
// `permissionDecisionReason` (gives the agent a clear message). Allow = exit 0, no output.

import { readFileSync } from "node:fs";

// D-33: the human-confirm signal. A human exports this in the shell that launches Claude
// (or via settings env). The name is a placeholder per research Assumption A2 — projects may
// rename it; the guard reads whatever name is set here from its own process env.
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
const DEPLOY = [
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
  // protected-branch pushes are the OTHER half of the hard rule ("never merge a protected
  // branch"). Deny a force push (any branch — a force push is destructive enough to gate) and any
  // push that names a protected branch. `\bmain\b`/`\bmaster\b` will also match a branch whose
  // name merely contains that word — that is deliberate fail-closed behavior, not a bug.
  /\bgit\s+push\b[\s\S]*\s(--force|-f|--force-with-lease)\b/,
  /\bgit\s+push\b[\s\S]*\b(main|master)\b/,
  /\bgit\s+push\b[\s\S]*\brelease\//,
];

// NOTE (residual surface, documented honestly): env-var indirection such as
// `K=kubectl; $K apply -f x` defeats the literal tool-name patterns above and is OUT OF SCOPE for
// this default set — the guard does not normalize variable expansion. The real backstop on every
// tool is the `autonomy=pr` posture (stop at a pull request; a named human merges and deploys).
// See install/README.md §5 and agent-factory/packaging/adapters.md.

// Detects any attempt to set or export the approval variable inline (e.g.
// `GRUGOPS_PROD_DEPLOY_APPROVED=1 ...`, `export GRUGOPS_PROD_DEPLOY_APPROVED=1`,
// `env GRUGOPS_PROD_DEPLOY_APPROVED=1 ...`). Matched regardless of surrounding command.
const SELF_APPROVE = new RegExp(`(^|[\\s;&|(])(export\\s+|env\\s+)?${APPROVAL}\\s*=`);

function deny(reason) {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "deny",
        permissionDecisionReason: reason,
      },
    }),
  );
  process.exit(0); // exit 0 + JSON deny = blocked, with a message for the agent.
}

// Read and parse stdin. Fail CLOSED: if input cannot be read or parsed, treat the command as
// empty. An empty command matches no deploy pattern and is allowed, so a malformed payload can
// never crash-allow a real deploy — a matched deploy would have to arrive as well-formed JSON
// to be evaluated, and that path is gated below.
let cmd = "";
try {
  const raw = readFileSync(0, "utf8");
  const input = JSON.parse(raw);
  cmd = input?.tool_input?.command ?? "";
  if (typeof cmd !== "string") cmd = "";
} catch {
  cmd = ""; // malformed / empty stdin → no command → allow only non-deploys.
}

// D-33: the agent must never grant its own approval. Any inline set/export of the approval var
// is denied EVEN IF the var is already present in the environment.
if (SELF_APPROVE.test(cmd)) {
  deny(
    `Refused: an agent may not set or export ${APPROVAL}. ` +
      `Approval for a production deploy must come from a human who exports ${APPROVAL} ` +
      `in the shell that launches Claude — it cannot be set inside the command.`,
  );
}

// D-32 / D-33: fail CLOSED. Deny a matched production-deploy command unless a human has set the
// approval env var in the hook's own process environment.
const isDeploy = DEPLOY.some((re) => re.test(cmd));
if (isDeploy && !process.env[APPROVAL]) {
  deny(
    `Production deploy blocked: humans decide, agents execute. ` +
      `This command matches a production-deploy pattern and ${APPROVAL} is not set. ` +
      `A human must export ${APPROVAL} in the shell that launches Claude ` +
      `(pairs with factory.config.json production_requires_human_confirmation), then re-run the deploy.`,
  );
}

// Allow everything else.
process.exit(0);

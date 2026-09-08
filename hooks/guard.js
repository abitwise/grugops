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
//   - RECORDS a non-blocking decision in the shared verified context (D-11): a checkpoint set to
//     `notify` whose floor key is present allows the action AND writes ONE finding note naming the
//     checkpoint, the authorizing name, the actor and the command — through the sanctioned emitter
//     in scripts/context-io.ts, never a write of its own. The allow is CONDITIONAL on that record:
//     an unrecordable lowering is refused, because a lowering that leaves no trace is exactly the
//     invisibility AUTO-05 exists to prevent. `off` allows and writes nothing, which is what a human
//     chose `off` to mean.
//   - RECORDS an unauthorized lowering too (D-10): a config declaration with no matching floor key
//     is refused as before AND writes its own finding, so an agent that edits config alone is both
//     ineffective and visible rather than only ineffective.
//   - PRINTS the run banner on stderr on EVERY invocation: one line naming each checkpoint whose
//     declared disposition is not its default, or the fixed literal `all checkpoints at default`
//     (D-19, D-20). It goes to stderr, never stdout, because stdout is the hook's JSON channel and
//     a non-JSON line there would break the deny mechanism this file exists to provide.
//   - FAILS CLOSED: malformed/empty stdin never crash-allows a matched deploy; a config that cannot
//     be read is treated as `block`; a throw while reading the matrix denies a MATCHED command; and
//     a failure the guard cannot even name — a dependency that will not load, an unexpected throw
//     anywhere in this file — DENIES rather than exiting non-zero (plan 30-11, finding A-2). At the
//     host, a PreToolUse hook that exits with any code other than 0-plus-deny-JSON or 2 is
//     NON-BLOCKING: the command it was supposed to gate simply runs. So "the guard crashed" and
//     "the guard allowed it" are the same event to the host, and this file must never reach it.
//   - Uses no hardcoded absolute path; the deploy-pattern set is config-driven with sane
//     defaults (D-32) and pairs with factory.config.json
//     `production_requires_human_confirmation: true`.
//
// Block mechanism: exit 0 + JSON `hookSpecificOutput.permissionDecision: "deny"` with a
// `permissionDecisionReason` (gives the agent a clear message). Allow = exit 0, no stdout.
import { readFileSync, writeSync } from "node:fs";
import { join } from "node:path";
// ── The two answers, declared BEFORE anything that can fail. ─────────────────────────────────────
// `deny` and `allow` are written first, use nothing but `process` and `node:fs`, and are therefore
// reachable on every path including the one where this file's own dependencies could not be loaded.
//
// THERE ARE EXACTLY TWO WAYS OUT OF THIS PROCESS, AND A HANDLER THAT REFUSES A THIRD (plan 30-11
// round 2, finding `RA1-2`). Round 1 stated the invariant as "no exit path that is neither an
// explicit allow nor an explicit deny" and established it for THROWS. Three exits that are not
// throws survived: a dependency whose top-level `await` never settles (Node exits 13 with zero
// bytes in 22 ms), a dependency that calls `process.exit(0)` at module scope, and — before the
// reader was hardened — a blocking read that never returned at all. The first two are measured, and
// neither the `try` nor the `uncaughtException` handler can see either.
//
// So the invariant is asserted as a POST-CONDITION rather than as a set of branches: `decided` is
// set by `deny` and by `allow` and by nothing else, and an `exit` handler installed before any
// other code writes the fail-closed deny if the process is leaving without having decided. That
// converts EVERY exit — including code 13 and a dependency's own `process.exit(0)` — into a
// decision. The one exit it cannot convert is a process that never exits, which is why the reader's
// non-regular-file refusal is the other half of this fix and not an optional companion.
/** The private channel an allow is asserted on, and the token it carries (round 3, `RA3-7`). */
const ALLOW_FD = 3;
const ALLOW_TOKEN = "grugops-hook-allow";
let decided = false;
// `writeSync(1, …)` and not `process.stdout.write` (plan 30-11 round 2). Inside an `exit` handler
// only synchronous work runs, and `process.stdout.write` to a pipe is not guaranteed synchronous;
// a decision that is queued rather than written is, at the host, no decision. The same call is used
// on the ordinary path so there is one write, not one reliable one and one hopeful one.
function emitDecision(reason) {
    decided = true;
    writeSync(1, JSON.stringify({
        hookSpecificOutput: {
            hookEventName: "PreToolUse",
            permissionDecision: "deny",
            permissionDecisionReason: reason,
        },
    }));
}
function deny(reason) {
    emitDecision(reason);
    process.exit(0); // exit 0 + JSON deny = blocked, with a message for the agent.
}
/**
 * The other answer — and it is ASSERTED, not inferred from silence (round 3, `RA3-7`).
 *
 * An allow is exit 0 with no stdout, which is also what a process that died without deciding leaves
 * behind. Measured on the round-2 artifact: a dependency calling `process.reallyExit(0)` — which
 * skips the `exit` event entirely — produced exit 0 and zero bytes, a SILENT ALLOW that no wrapper
 * observing exit codes could tell from a real one.
 *
 * So the decider states its allow on a private channel: file descriptor 3, which
 * `hooks/hook-entry.ts` opens as a pipe and the host never sees. Silence on that channel is not an
 * allow; it is a process that stopped. The token is written BEFORE the exit so a later termination
 * cannot retract it, and the write is tolerant of fd 3 being absent — running the decider directly
 * (as every test in this repository does) is still a legal, un-wrapped invocation.
 */
function allow() {
    decided = true;
    try {
        writeSync(ALLOW_FD, ALLOW_TOKEN);
    }
    catch {
        /* fd 3 is not open: the decider was run directly rather than under the wrapper. */
    }
    process.exit(0);
}
// Installed before anything else can exit. Idempotent against `deny`/`allow` through `decided`.
process.on("exit", () => {
    if (decided)
        return;
    // THE EXIT CODE MUST BE CORRECTED TOO, AND THIS NEARLY SHIPPED WITHOUT IT. The block mechanism is
    // exit 0 PLUS the deny JSON; any other non-zero exit is non-blocking at the host regardless of
    // what is on stdout. The `ERR_UNFINISHED_TOP_LEVEL_AWAIT` path exits 13, so a handler that wrote
    // the deny and left the code alone would have emitted a refusal the host ignores — a fix whose
    // own premise was false. Measured directly: with `process.exitCode = 0` in the handler the
    // process exits 0 and carries the JSON; without it, exit 13 and the same JSON.
    process.exitCode = 0;
    emitDecision(`Blocked (fail-closed): the grugops prod-deploy guard is exiting without having decided ` +
        `anything. A PreToolUse hook that does not answer does not block, so an undecided exit is ` +
        `converted into a refusal here rather than left to read as permission. This usually means a ` +
        `dependency of the guard ended the process on its own. A human must repair the grugops ` +
        `installation, then re-run.`);
});
/**
 * The answer for a run that could not reach a decision at all (plan 30-11, finding A-2).
 *
 * ---------------------------------------------------------------------------------------------
 * WHY A CRASH IS NOT A FAIL-CLOSED STATE, WHICH IS THE WHOLE POINT OF THIS FUNCTION.
 *
 * This file's contract said "FAILS CLOSED" and its every documented failure branch does — but the
 * branches it documented were the ones it had thought of. Every OTHER failure left the process to
 * die with an uncaught exception, exit code 1 and no stdout. Measured on the committed
 * `hooks/guard.js`, spawned as a process against a kit whose `scripts/checkpoints.js` had been
 * overwritten with one line of garbage: `git push --force origin main` produced exit 1, zero bytes
 * of stdout, and therefore ALLOW. The same for a deleted `scripts/context-io.js`. Neither needed a
 * grant variable, a config declaration or a human — a single agent-reachable file write turned the
 * two-key rule off entirely, because a hook that does not answer is a hook that does not block.
 *
 * So the invariant this function establishes is stated as a property of the PROCESS rather than of
 * any branch: **this file has no exit path that is neither an explicit allow nor an explicit deny.**
 * The dependency load is guarded, the whole body is guarded, and the two last-resort handlers below
 * catch anything asynchronous. The re-entrancy flag exists because the fail-closed answer must not
 * be able to fail recursively.
 * ---------------------------------------------------------------------------------------------
 */
function denyUndecided(stage, e) {
    if (decided)
        process.exit(0); // never loop inside the fail-closed answer itself
    deny(`Blocked (fail-closed): the grugops prod-deploy guard could not ${stage} ` +
        `(${e instanceof Error ? e.message : String(e)}), so it could not decide whether this ` +
        `command crosses a safety checkpoint. A hook that does not answer does not block, so it ` +
        `answers by refusing. A human must repair the grugops installation, then re-run.`);
}
process.on("uncaughtException", (e) => denyUndecided("complete its evaluation", e));
process.on("unhandledRejection", (e) => denyUndecided("complete its evaluation", e));
// ── The dependency load, GUARDED (finding A-2). ──────────────────────────────────────────────────
// Static `import` statements are hoisted above every line of this module, so a dependency that will
// not load kills the process before `deny` has ever been reachable. The imports are therefore
// dynamic and inside a try — the ONLY structural way to keep the fail-closed answer above them. The
// type-only import at the top of the file is erased at compile time and adds no runtime dependency.
let cpMod;
let ioMod;
try {
    cpMod = await import("../scripts/checkpoints.js");
    ioMod = await import("../scripts/context-io.js");
}
catch (e) {
    denyUndecided("load its checkpoint roster and governance reader", e);
}
const { CHECKPOINT_DEFAULTS, COMMAND_RULE_CHECKPOINTS, CONFIG_REFUSAL_PREFIX, FLOOR_CHECKPOINTS, NAMED_GRANT_ENV_VARS, GRANT_ENV_VAR_PATTERN_SOURCE, PROD_DEPLOY_APPROVAL_ENV_VAR, composeBanner, evaluateMatrix, floorEnvVarName, grantedBy, isGrantEnvVarName, matchCommandCheckpoints, } = cpMod;
const { emitCheckpointNote, readGovernanceConfig, trustedRepoRoot } = ioMod;
// D-33: the human-confirm signal. A human exports this in the shell that launches Claude
// (or via settings env). The name is a placeholder per research Assumption A2 — projects may
// rename it; the guard reads whatever name is set here from its own process env.
//
// THIS IS THE ACTION APPROVAL AND ITS MEANING IS UNCHANGED. It permits a matched command whose
// checkpoint is at `block` — which is what makes a zero-config run behave exactly as it did before
// Phase 30. It is NOT key two: it approves THIS action at the un-lowered posture, whereas a
// `GRUGOPS_FLOOR_<ID>` variable authorizes a standing LOWERING of the posture itself. Two different
// grants, deliberately two different names.
//
// IT IS IMPORTED, NOT SPELLED (plan 30-11, finding A-1). The name lives once, in the grant
// vocabulary in scripts/checkpoints.ts, beside the admission approval and the floor family — so the
// self-set refusal below is built from the same table this constant is read out of, and the two
// cannot name different sets. `hooks/guard.test.ts` asserts that neither hook source contains a
// `GRUGOPS_…` grant name as a string literal, which is what keeps a fourth grant from being
// introduced somewhere the refusal cannot see.
const APPROVAL = PROD_DEPLOY_APPROVAL_ENV_VAR;
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
// `export GRUGOPS_FLOOR_PROTECTED_BRANCH_MERGE=me`, `env GRUGOPS_ADMISSION_APPROVED_BY=me ...`),
// regardless of the surrounding command. The Phase-5 shape
// `(^|[\s;&|(])(export\s+|env\s+)?NAME\s*=` is preserved exactly; only the NAME position widened
// from one literal to an alternation, and the two leading groups became non-capturing so that
// group 1 is the matched NAME and the denial can say which grant was attempted.
//
// THE ALTERNATION IS THE PUBLISHED GRANT VOCABULARY, NOT A LIST WRITTEN HERE (plan 30-11, finding
// A-1). It used to be `APPROVAL | FLOOR-FAMILY`, which enumerated a set that nothing derived: the
// admission approval `GRUGOPS_ADMISSION_APPROVED_BY` — declared as a bare literal in the OTHER hook
// in this same directory — was not in it, so `export GRUGOPS_FLOOR_OPEN_PR=alice && ls` was refused
// while `export GRUGOPS_ADMISSION_APPROVED_BY=alice && ls` was allowed. One detector over the whole
// grant family, or the family is not protected. The floor arm remains the FAMILY rather than a list
// of names, so a roster that grows is covered without anyone remembering to widen a regex — and the
// derived names are still asserted to fall inside the vocabulary below, so a name that escaped it
// would make the guard refuse to run rather than run with a hole.
//
// THE ASSIGNMENT OPERATOR IS A NAMED, CLOSED SET (plan 30-11 round 2, finding `RA1-5`). The pattern
// assumed `=` follows the name. Bash's APPEND-assignment `NAME+=value` is a valid assignment word,
// valid as a command prefix and valid after `export`, and the grant name appears in it literally and
// unexpanded — so it is on this refusal's own declared axis (a literal spelling), not the disclosed
// indirection residual. Measured on the committed artifact:
// `export GRUGOPS_FLOOR_PROTECTED_BRANCH_MERGE+=me && ls` ALLOWED, and so did the `~/.zshrc`
// persistence form, which is the very thing `A-1` was raised for.
//
// `=` and `+=` are the COMPLETE set of assignment operators in POSIX sh and bash — there is no
// third — so this is a one-character widening of a CLOSED grammar, not the open-set widening D-64
// refused. It is written as a named constant so the next reader can check that claim rather than
// re-derive it.
const ASSIGNMENT_OPERATOR = `\\s*\\+?=`;
const SELF_APPROVE = new RegExp(`(?:^|[\\s;&|(])(?:export\\s+|env\\s+)?(${GRANT_ENV_VAR_PATTERN_SOURCE})${ASSIGNMENT_OPERATOR}`);
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
//
// THE ACTOR, READ FROM THE SAME PAYLOAD AND NO FURTHER (plan 30-08). D-11's record names the actor.
// A PreToolUse payload does not carry an agent name; what it carries is the TOOL being invoked and
// the SESSION it belongs to. Those two are what the record states, and it states nothing else — an
// invented "agent" field would be the fabrication the trace exists to make impossible. When either
// is absent the record says so with this repository's honest-unknown marker rather than an empty
// string, because a blank field reads as "nobody" and the truth is "the payload did not say".
const UNKNOWN = "UNKNOWN - verify";
let cmd = "";
let actor = `tool=${UNKNOWN} session=${UNKNOWN}`;
try {
    const raw = readFileSync(0, "utf8");
    const input = JSON.parse(raw);
    cmd = (input?.tool_input?.command ?? "");
    if (typeof cmd !== "string")
        cmd = "";
    const tool = typeof input?.tool_name === "string" && input.tool_name !== "" ? input.tool_name : UNKNOWN;
    const session = typeof input?.session_id === "string" && input.session_id !== "" ? input.session_id : UNKNOWN;
    actor = `tool=${tool} session=${session}`;
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
let configRefusals = [];
try {
    const read = readGovernanceConfig(trustedRepoRoot());
    matrix = read.config.checkpoints;
    configRefusals = read.checkpointRefusals;
}
catch {
    matrix = { ...CHECKPOINT_DEFAULTS };
    matrixUnread = true;
}
// ── ONE evaluation, feeding BOTH the banner and the decision (D-19, plan 30-08). ─────────────────
// The banner and the decision below read this same value. They are not two reads of the same config
// reconciled by a check afterwards; there is one value, so there is nothing to reconcile. A banner
// that claimed `all checkpoints at default` over a run that denied a lowered checkpoint would be a
// line asserting something the run did not establish — and it is not a state this file can reach,
// because the text and the decision are computed from one object.
const evaluation = evaluateMatrix(matrix, process.env);
// ── The run banner, on EVERY invocation (D-19, D-20). ────────────────────────────────────────────
// stderr, never stdout: stdout carries the hook's JSON and a bare line there would break the deny
// mechanism. One line, always present, so a missing banner and a broken banner look different.
// It is written ONCE, here, and no other line in this file writes a banner — hooks/guard.test.ts
// counts the recognized banner lines per run and refuses zero and two alike.
process.stderr.write(`${composeBanner(evaluation)}\n`);
// ── What the config declared and the reader DROPPED (plan 30-11, closing `V-30-10-01`). ──────────
// The reader accumulates a refusal for every `checkpoints` entry it refuses: a key that is not on
// the roster, a value outside `block|notify|off`, a matrix that is not an object. Every drop is
// fail-CLOSED — the checkpoint keeps its default, so nothing is lowered — but until this loop nothing
// printed them, so a human who mistyped a checkpoint id saw a run whose banner truthfully said
// `all checkpoints at default` and had no way to learn that the line they wrote had been ignored.
// The contract on that field says the entry is dropped and recorded "so the run can say what it
// ignored instead of ignoring it silently"; this is the half that says it.
//
// THE BOUND ON WHAT THIS PRINTS. Refusal text is the only stderr this file emits that is composed
// from config CONTENT, and config is agent-writable. Two properties keep that from mattering, both
// asserted in tests rather than argued here: the reader QUOTES the untrusted key (so a refusal is
// one line and cannot spell a second), and `CONFIG_REFUSAL_PREFIX` is disjoint from both banner
// forms (so `isCheckpointBannerLine` rejects every line written here and the exactly-one-banner
// count is unchanged). stderr, never stdout, for the same reason the banner is: stdout is the
// decision channel.
for (const refusal of configRefusals) {
    process.stderr.write(`${CONFIG_REFUSAL_PREFIX}${refusal}\n`);
}
// ── The trace write (AUTO-05, D-10 / D-11). ──────────────────────────────────────────────────────
// THE HOOK WRITES NOTHING ITSELF. There is no `writeFileSync` in this file and there must never be
// one: containment of a note write lives in the shared chokepoint inside scripts/context-io.ts, and
// a second direct writer is the shape this tree already had to close once. This function hands
// structured fields to the ONE sanctioned emitter and holds no path of its own beyond the context
// root, which is resolved from the SAME base the matrix read used.
//
// V-30-10-03 IS DECIDED HERE, AND THE SECOND EXPRESSION IS DELETED (plan 30-11). Surface B recorded
// that this line and the reader's own fallback were two independent spellings of one base, and left
// the semantics question open: should a caller with no project root read the KIT's dial, or refuse?
// The decision is (a) — KEEP the fallback and say so — for a reason that is a fact about this hook
// rather than a preference: `hooks/hooks.json` is a Claude Code plugin manifest, and Claude Code is
// the one target CLI that sets `CLAUDE_PROJECT_DIR`. On the four CLIs that do not set it, this hook
// does not run at all, so the fallback is not a per-repository dial silently resolving to a per-kit
// one for a guard invocation; it is the base for library and manual callers of the reader, for whom
// "the kit I was loaded from" is the only root that exists. A shared kit therefore carries a shared
// dial for those callers, which is documented rather than left to be discovered.
//
// What the surface-B finding got right, and what is fixed here: there were TWO expressions for one
// base. The reader now PUBLISHES its fallback (`GOVERNANCE_FALLBACK_BASE`, added by surface B's F1),
// so this file reads that answer instead of recomputing it. The two were equal only because
// `hooks/` and `scripts/` happen to sit at the same depth — an equality maintained by coincidence is
// the thing this repository keeps closing, not a property.
// ONE trusted root, asked once (round 2, reviewer-1 observation 2). `?? GOVERNANCE_FALLBACK_BASE`
// treated an EMPTY `CLAUDE_PROJECT_DIR` as a supplied value, because `""` is not nullish, and
// resolved the context root against the process cwd — a third base beside the project and the kit.
// `trustedRepoRoot()` is the one place that question is answered, and the matrix read below uses it
// too, so the record and the decision cannot land in different repositories.
const PROJECT_ROOT = trustedRepoRoot();
const CONTEXT_ROOT = join(PROJECT_ROOT, ".grugops", "context");
function record(r, outcome, actionApproval) {
    emitCheckpointNote({
        checkpoint: r.id,
        declared: r.declared,
        effective: r.effective,
        authorizedBy: r.authorizedBy,
        envVarName: r.envVarName,
        outcome,
        actionApproval,
        actor,
        command: cmd,
    }, CONTEXT_ROOT);
}
// Every grant name this guard can be asked about must fall inside the vocabulary the self-set
// refusal is built from. Asserted here, at the point of use, rather than trusted: a name outside the
// vocabulary would be a grant the agent could set for itself, so the guard refuses to run rather
// than run with the hole. Both arms are walked — the DERIVED floor names, and the NAMED grants —
// because a table entry that the pattern source failed to fold in is the same hole as a derived name
// that escaped the family.
for (const c of FLOOR_CHECKPOINTS) {
    if (!isGrantEnvVarName(floorEnvVarName(c))) {
        deny(`Blocked (fail-closed): the floor grant variable for checkpoint "${c}" is ` +
            `"${floorEnvVarName(c)}", which the self-set refusal cannot recognize. The guard will not ` +
            `evaluate a command while a grant variable exists that an agent could set for itself.`);
    }
}
for (const name of Object.keys(NAMED_GRANT_ENV_VARS)) {
    if (!isGrantEnvVarName(name)) {
        deny(`Blocked (fail-closed): the grant variable "${name}" is published in the grant vocabulary ` +
            `but the self-set refusal built from that vocabulary does not recognize it. The guard will ` +
            `not evaluate a command while a grant variable exists that an agent could set for itself.`);
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
    // Every OTHER member of the vocabulary. The sentence naming WHAT the grant authorizes is read out
    // of the published table when the name is one of the named grants, and falls back to the floor
    // sentence for the derived family — so a grant added to the table gets a truthful denial without a
    // fourth arm being written here (finding A-1: three grants, two arms, one of them silently absent).
    const named = NAMED_GRANT_ENV_VARS[attempted];
    deny(`Refused: an agent may not set or export ${attempted}. ` +
        (named === undefined
            ? `A floor grant lowers a safety checkpoint below its default and must come from a human who `
            : `That variable carries ${named}, and must come from a human who `) +
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
// ── The command model, consulted BESIDE the literal patterns (round 2, RA1-1/RA1-3/RA1-4). ───────
// One tokenizer, one tool->verb table, in scripts/checkpoints.ts. It runs ADDITIVELY: a command
// matches a checkpoint if the literal patterns match it OR the model does. Keeping the literals is
// load-bearing — a parser has a grammar an attacker can leave, so the model may only ever ADD
// denials, never remove one. It fails CLOSED on a segment carrying a substitution it will not reason
// about, returning every checkpoint whose tool name appears in that segment.
const modelled = matchCommandCheckpoints(cmd);
// Every checkpoint the TABLE governs must be a checkpoint the evaluation carries. Asserted at the
// point of use, like the grant-vocabulary walk above: a row naming an id the roster does not carry
// would govern nothing while reading as coverage — the set-literal-drift class pointed at a match set.
for (const id of COMMAND_RULE_CHECKPOINTS) {
    if (evaluation.get(id) === undefined) {
        deny(`Blocked (fail-closed): the command model governs the checkpoint "${id}", which the ` +
            `evaluation of the checkpoint matrix does not carry. The guard will not decide a command ` +
            `against a table row whose checkpoint does not exist.`);
    }
}
for (const group of CHECKPOINT_PATTERNS) {
    const byPattern = group.patterns.some((re) => re.test(cmd));
    const byModel = modelled.checkpoints.has(group.id);
    if (!byPattern && !byModel)
        continue;
    // The SAME evaluation the banner was composed from — never a second resolve of the same id.
    const r = evaluation.get(group.id);
    if (r === undefined) {
        deny(`Blocked (fail-closed): this command matches the "${group.id}" checkpoint, which the ` +
            `evaluation of the checkpoint matrix does not carry. The guard will not decide a command ` +
            `against a checkpoint it did not evaluate.`);
    }
    // ── The OUTCOME is decided BEFORE anything is recorded (plan 30-11, finding A-3). ──────────────
    // The record used to be written from its POSITION in this loop: it sat above the action-approval
    // check and therefore hardcoded `"refused"`, because at that point in the file a refusal was the
    // only outcome the author had in view. Measured on the committed artifact: a config declaring
    // `off` with no floor grant, a matched `git push origin main`, and a human-set
    // GRUGOPS_PROD_DEPLOY_APPROVED produced ALLOW — and a note in the shared verified context reading
    // `CHECKPOINT REFUSED`. A record of a refusal that did not happen is worse than no record: the
    // trace is the proof, and this one asserted something the run did not establish.
    //
    // So the run decides first and records second. `actionApproved` is the same question the loop asks
    // below, asked once, above both the record and the decision — the D-19 shape (one evaluation
    // feeding both the announcement and the decision) applied to the record.
    const actionApproved = grantedBy(process.env, APPROVAL);
    const outcome = r.effective === "block" && actionApproved === null ? "refused" : "allowed";
    // ── D-10: an UNAUTHORIZED lowering records its own finding, with the outcome the run reached. ──
    // The declaration alone changed nothing, and without this note it would ALSO have left nothing —
    // an agent editing config alone would be ineffective and invisible, which is only half of what
    // AUTO-05 promises. The record is written BEFORE the denial so a denial can never be the only
    // trace of an attempt. If the record cannot be written the action is refused anyway (it already
    // was), and the denial says the trace is incomplete rather than pretending it is not.
    let unrecorded = "";
    if (r.unauthorizedLowering) {
        try {
            record(r, outcome, actionApproved === null ? null : APPROVAL);
        }
        catch (e) {
            unrecorded =
                ` NOTE: this refusal could NOT be recorded in the shared verified context ` +
                    `(${e instanceof Error ? e.message : String(e)}), so the trace is incomplete for this run.`;
        }
    }
    // ── D-11: the NON-BLOCKING tier allows, records and announces — all three. ─────────────────────
    // `notify` is where a lowering becomes invisible if it is only a line on standard error, so the
    // allow is CONDITIONAL on the record: if the note cannot be written, the lowering does not take
    // effect and the command is refused. An unrecordable lowering is not a lowering. `off` is the
    // disposition a human chose in order to hear nothing, and it writes nothing.
    if (r.effective === "notify") {
        try {
            record(r, "allowed", null); // an authorized lowering allows on its own key, not on the action approval
        }
        catch (e) {
            deny(`Blocked: the checkpoint "${r.id}" is set to \`notify\`, which allows this command only ` +
                `because the decision is recorded in the shared verified context — and the record could ` +
                `not be written (${e instanceof Error ? e.message : String(e)}). A lowering that leaves ` +
                `no trace is not a lowering, so the command is refused at \`block\` until the context ` +
                `directory is writable.`);
        }
        continue;
    }
    if (r.effective !== "block")
        continue;
    // ONE presence predicate for the whole grant vocabulary (finding A-4): a value that names nobody
    // is not an approval. `process.env[APPROVAL]` accepted a single space, so a grant that renders as
    // nothing allowed a matched production deploy.
    if (actionApproved !== null)
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
            `launches Claude — an agent may not set it, and setting it inside this command is refused.` +
            unrecorded);
    }
    // The refusal NAMES THE ESCAPE when the model is what matched, because a denial a user cannot act
    // on is a denial they disable the guard to get past — design rule 1's own caveat (round 2, RA1-3).
    const escape = group.id === "protected_branch_merge" && !byPattern
        ? ` This command was matched by the command model rather than by a literal pattern: a ` +
            `\`git push\` that does not name a branch is treated as a push to the current branch, ` +
            `which may be protected. Naming it — \`git push origin <branch>\` — is not refused when the ` +
            `branch is not protected.`
        : modelled.untokenizable
            ? ` This command carries a shell substitution the guard will not reason about, so it is ` +
                `matched on the tool name alone and refused rather than guessed at.`
            : "";
    deny(`Production deploy blocked: humans decide, agents execute. ` +
        `This command matches a production-deploy pattern and ${APPROVAL} is not set. ` +
        `A human must export ${APPROVAL} in the shell that launches Claude ` +
        `(pairs with factory.config.json production_requires_human_confirmation), then re-run the deploy.` +
        escape);
}
// Allow everything else — through the NAMED allow, so the exit handler above can tell an intended
// allow from a process that simply stopped (finding `RA1-2`).
allow();

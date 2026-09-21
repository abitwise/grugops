// admission-guard.ts — grugops GOV-01 mechanical human-admission gate (PER-CALL, STRUCTURED).
//
// Pure-Node Claude Code PreToolUse hook: no `jq`, no host npm dependency, Node stdlib only
// (plus the ONE shared classifier/config helpers from scripts/context-io). Wired by hooks/hooks.json
// as a SECOND plugin-level PreToolUse matcher beside the byte-frozen prod-deploy guard — but unlike
// the prod-deploy guard (a `Bash` matcher), THIS hook now matches the STRUCTURED admission tool
// FAMILY `mcp__(plugin_grugops_)?grugops__.*` (W3; both spellings since plan 33-28 — see the matcher
// note above the stdin read). The committed compiled output is hooks/admission-guard.js, which
// the host hook runs.
//
// WHY THE GATE MOVED TO THE STRUCTURED CHANNEL (D-01, round 6 — "move the gate to point-of-effect"):
// the prior tier parsed the agent-authored Bash COMMAND STRING to recognize an `admit` invocation.
// Across ten rounds that string was an unbounded obfuscation surface (glob / brace / parameter and
// command substitution / word-split / extglob `(`-fragmentation / launcher rename / xargs stdin-feed),
// because the hook saw the command BEFORE the shell expanded it. Plan 25-09 added a structured
// admission CHANNEL: a role agent admits a note by calling the MCP tool `mcp__grugops__propose_note`,
// whose arguments the harness delivers as FINAL JSON. This hook reads those final structured fields —
// there is NO agent-authored shell string to obfuscate, so the entire shell-expansion bypass family is
// gone BY CONSTRUCTION (not by recognizing more spellings). The whole command-string token parser
// (tokenizer, launcher resolution, allowlist, admit-shape detection) is DELETED.
//
// WHY A SEPARATE HOOK PROCESS, RUNNING FRESH PER CALL (D-01, D-07): the only mechanically un-forgeable
// human-admission signal is a separate process that reads the HUMAN-SET SESSION env var. An agent's own
// inline `export VAR=...` lands in the child env it spawns, which the hook process never inherits; the
// human's session export DOES reach the hook. The hook runs FRESH PER CALL and reads the CURRENT
// session env, so the grant is honestly scoped as SESSION-SCOPED and per-note CAPABLE (GAP-R6-3, human
// decision 2026-06-26): once a named human exports the approval variable, it authorizes high-severity
// admissions under that name for the rest of the session; the human controls granularity by
// setting/unsetting the grant around a specific disposition (the per-call re-read means an unset takes
// effect on the next call), but a standing grant is NOT a mechanically-enforced per-note nonce — one
// export authorizes unlimited admissions under that name until unset. An in-script env check inside
// admit() would be self-settable and therefore forgeable — hence the hook is the un-forgeable tier;
// admit()'s in-script refusal is the documented WEAKER degrade tier for the four non-Claude-Code CLIs
// (D-04/D-05).
//
// Contract (CLEAR PROFESSIONAL VOICE throughout — security/governance/audit surfaces are never caveman
// voice, per CLAUDE.md):
//   - Reads the FINAL structured tool_input from PreToolUse stdin JSON: `by`, `kind`, `verified_by`
//     (and `task` for the message). NEVER a shell command string and NEVER a note file re-read from
//     disk — the note's provenance fields arrive as the tool's arguments.
//   - Decides whether the note is GATED by CALLING the IMPORTED single-source isGatedNote(by, kind,
//     configResult) from context-io (Plan 25-09, W-A). The hook reconstructs NEITHER the gated
//     composition ((high-severity && active) || all, with dial canonicalization) NOR the severity
//     classifier locally — the SAME predicate the combiner (admitAndAppend) imports, so the gate tier
//     and the persist tier can never diverge (the ten-round allow-forge drift surface).
//   - Reads the `human_admission` dial via the shared readGovernanceConfig (Plan 25-01/25-04):
//     `absent`/`off` → not gated (lean / zero-config preserved, SC2); `unreadable` (corrupt config) →
//     fail CLOSED (isGatedNote treats it as gate-or-stricter, SC3); a typo/garbage/non-string value →
//     gate-or-stricter (the only off-equivalent value is EXACTLY "off").
//   - For a GATED note, DENIES unless BOTH (a) the FRESH session env GRUGOPS_ADMISSION_APPROVED_BY=<name>
//     is present in the hook's OWN process env AND (b) tool_input.verified_by === `human:${name}`. This
//     binds the agent-supplied stamp to the env-verified approver on EVERY call against the fresh
//     session grant (a session-scoped, per-note-CAPABLE grant, D-07 — not a per-note nonce): the agent
//     supplies the stamp, the hook validates it against the fresh env. A missing env, a missing/empty
//     stamp, or a mismatched/forged stamp (`human:bob` while env=alice) all DENY. No tool argument alone
//     grants — the stamp alone never approves (this is the structured-channel form of refuse-self-set:
//     the agent can never set the hook's session env).
//   - FAILS CLOSED: a matched admission with missing/malformed structured args, or an unclassifiable
//     note under an active dial, DENIES — never crash-allow. An unparsable / absent stdin payload also
//     denies (the matcher only routes real admission calls here). A dependency that will not load, or
//     any unexpected throw, ALSO denies (plan 30-11, finding A-2): a PreToolUse hook that exits with
//     any code other than 0-plus-deny-JSON or 2 is NON-BLOCKING at the host, so "the hook crashed"
//     and "the hook allowed it" are the same event and this file must never reach that state.
//
// Block mechanism: exit 0 + JSON `hookSpecificOutput.permissionDecision: "deny"` with a
// `permissionDecisionReason` (gives the agent a clear message). Allow = exit 0, no output. This mirrors
// the prod-deploy guard's posture exactly.

import { readFileSync, writeSync } from "node:fs";
import type { GovernanceConfigResult } from "../scripts/context-io.js";

// ── The two answers, declared BEFORE anything that can fail. ─────────────────────────────────────
//
// EXACTLY TWO WAYS OUT, AND A HANDLER THAT REFUSES A THIRD (plan 30-11 round 2, finding `RA1-2`).
// Identical in form to hooks/guard.ts, and for the identical reason: round 1 bounded THROWS, and
// three non-throw exits survived — a dependency whose top-level `await` never settles (Node exits
// 13, zero bytes, 22 ms), a dependency calling `process.exit(0)` at module scope, and a blocking
// read of a non-regular config path that never returned at all (measured: this hook answered a
// control in 43 ms and produced NO answer at 20 seconds against a FIFO). The first two are
// converted here; the third is closed in the reader, because a process that never exits cannot be
// caught by an exit handler.
//
// `writeSync(1, …)` and not `process.stdout.write`: inside an `exit` handler only synchronous work
// runs, and a decision that is merely queued is, at the host, no decision.
/** The private channel an allow is asserted on, and the token it carries (round 3, `RA3-7`). */
const ALLOW_FD = 3;
const ALLOW_TOKEN = "grugops-hook-allow";

let decided = false;

function emitDecision(reason: string): void {
  decided = true;
  writeSync(
    1,
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "deny",
        permissionDecisionReason: reason,
      },
    }),
  );
}

function deny(reason: string): never {
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
function allow(): never {
  decided = true;
  try {
    writeSync(ALLOW_FD, ALLOW_TOKEN);
  } catch {
    /* fd 3 is not open: the decider was run directly rather than under the wrapper. */
  }
  process.exit(0);
}

process.on("exit", () => {
  if (decided) return;
  // THE EXIT CODE MUST BE CORRECTED TOO, AND THIS NEARLY SHIPPED WITHOUT IT. The block mechanism is
  // exit 0 PLUS the deny JSON; any other non-zero exit is non-blocking at the host regardless of
  // what is on stdout. The `ERR_UNFINISHED_TOP_LEVEL_AWAIT` path exits 13, so a handler that wrote
  // the deny and left the code alone would have emitted a refusal the host ignores — a fix whose
  // own premise was false. Measured directly: with `process.exitCode = 0` in the handler the
  // process exits 0 and carries the JSON; without it, exit 13 and the same JSON.
  process.exitCode = 0;
  emitDecision(
    `Admission blocked (fail-closed): the grugops admission guard is exiting without having ` +
      `decided anything. A PreToolUse hook that does not answer does not block, so an undecided ` +
      `exit is converted into a refusal here rather than left to read as permission. A human must ` +
      `repair the grugops installation, then re-run.`,
  );
});

/**
 * The answer for a run that could not reach a decision at all (plan 30-11, finding A-2).
 *
 * Measured on the committed `hooks/admission-guard.js`, spawned as a process against a kit whose
 * `scripts/context-io.js` had been overwritten with one line of garbage: a gated high-severity
 * admission with no human env and no stamp produced exit 1, zero bytes of stdout, and therefore
 * ALLOW. The whole un-forgeable tier turned off by one agent-reachable file write. The invariant is
 * stated as a property of the process — this file has no exit path that is neither an explicit allow
 * nor an explicit deny — and the two handlers plus the guarded dynamic import are what establish it.
 * The re-entrancy flag exists because the fail-closed answer must not be able to fail recursively.
 */
function denyUndecided(stage: string, e: unknown): never {
  if (decided) process.exit(0);
  deny(
    `Admission blocked (fail-closed): the grugops admission guard could not ${stage} ` +
      `(${e instanceof Error ? e.message : String(e)}), so it could not decide whether this ` +
      `admission needs a named human. A hook that does not answer does not block, so it answers by ` +
      `refusing. A human must repair the grugops installation, then re-run.`,
  );
}
process.on("uncaughtException", (e) => denyUndecided("complete its evaluation", e));
process.on("unhandledRejection", (e) => denyUndecided("complete its evaluation", e));

// ── The dependency load, GUARDED (finding A-2). ──────────────────────────────────────────────────
// Static `import` statements are hoisted above every line of this module, so a dependency that will
// not load kills the process before `deny` has ever been reachable. The imports are therefore
// dynamic and inside a try. The type-only import above is erased at compile time.
let ioMod: typeof import("../scripts/context-io.js");
let cpMod: typeof import("../scripts/checkpoints.js");
try {
  ioMod = await import("../scripts/context-io.js");
  cpMod = await import("../scripts/checkpoints.js");
} catch (e) {
  denyUndecided("load its note classifier and governance reader", e);
}
const { isGatedNote, normalizeKind, readGovernanceConfig } = ioMod;

// The human-confirm signal for admission. A human exports this in the shell that launches Claude (or
// via settings env); the agent must never set it. The hook reads it from its OWN process env, which the
// agent's spawned-child env cannot reach.
//
// IT IS IMPORTED, NOT SPELLED (plan 30-11, finding A-1). This name used to be a bare string literal
// here and appeared in no other file — so the prod-deploy guard's self-set refusal, which enumerates
// the grant vocabulary, did not contain it, and an agent's `export GRUGOPS_ADMISSION_APPROVED_BY=…`
// was allowed where the same command for a floor grant was refused. The vocabulary now lives once,
// in scripts/checkpoints.ts, and both hooks read their own constant out of it.
const APPROVAL = cpMod.ADMISSION_APPROVAL_ENV_VAR;

// ── Read and parse the PreToolUse stdin payload. ──────────────────────────────────────────────────
// The hooks.json matcher (`mcp__(plugin_grugops_)?grugops__.*`) guarantees this hook is invoked ONLY for
// a grugops structured admission tool call, so EVERY invocation is an admission attempt. BOTH spellings
// are in the family (plan 33-28): the platform exposes a plugin's bundled MCP server under the SCOPED
// name `mcp__plugin_<plugin>_<server>__<tool>` — here `mcp__plugin_grugops_grugops__propose_note`, the
// name the round-1 init frame listed — and its plugin reference states that a matcher written against
// the bare server key never fires for those tools. The bare `mcp__grugops__.*` is the server's own name
// and would be the live spelling only for a standalone `.mcp.json` server, which the kit does not ship;
// it is kept in the alternation so that path is gated too if it ever exists. A payload we cannot
// parse into a structured tool_input object is therefore a malformed admission — fail CLOSED (deny),
// never crash-allow. This never throws past here.
let raw = "";
try {
  raw = readFileSync(0, "utf8");
} catch {
  raw = "";
}

let toolInput: Record<string, unknown> | null = null;
try {
  const input = JSON.parse(raw) as unknown;
  if (input !== null && typeof input === "object" && !Array.isArray(input)) {
    const ti = (input as { tool_input?: unknown }).tool_input;
    if (ti !== null && typeof ti === "object" && !Array.isArray(ti)) {
      toolInput = ti as Record<string, unknown>;
    }
  }
} catch {
  toolInput = null;
}

if (toolInput === null) {
  deny(
    `Admission blocked (fail-closed): the structured admission tool call had no readable ` +
      `tool_input. A grugops admission must arrive as a well-formed structured tool call; a ` +
      `malformed payload is never crash-allowed. A human must review this admission, or export ` +
      `${APPROVAL}=NAME to authorize it after the call is corrected.`,
  );
}

// ── Read the governance dial via the shared discriminated reader (SC3 fail-closed source). ─────────
// The reader distinguishes a genuinely ABSENT config (stay lean → allow routine) from a present-but-
// UNREADABLE one (corrupt / non-JSON → fail CLOSED via isGatedNote). ${CLAUDE_PROJECT_DIR} is the
// documented hook project root; when unset the reader falls back to its own repo root. The reader does
// not throw, but a throw on a matched admit must also fail closed.
let configResult: GovernanceConfigResult;
try {
  configResult = readGovernanceConfig(ioMod.trustedRepoRoot());
} catch {
  deny(
    `Admission blocked (fail-closed): the governance configuration could not be read while ` +
      `evaluating an admission. A human must resolve the configuration, or export ${APPROVAL}=NAME ` +
      `to authorize this admission explicitly.`,
  );
}

// Is the dial ACTIVE at all? Probe the SINGLE-SOURCE predicate with a known high-severity finding:
// isGatedNote returns true under high-severity / all / a garbage value / an unreadable config, and
// false ONLY under the exact "off" (or a genuinely absent config). The hook reconstructs no dial
// composition of its own — it asks the imported predicate. Used to decide whether an UNCLASSIFIABLE
// note (missing/malformed kind or by) must fail closed: an unreadable note is gate-or-stricter while
// the dial is active, and lean while it is off.
const dialIsActive = isGatedNote("security-nfr", "finding", configResult);

// ── Classify the note from the FINAL structured fields. ───────────────────────────────────────────
// kind is required to know whether the note is even gateable (only a finding is ever gated, D-08).
const kindRaw = toolInput.kind;
if (typeof kindRaw !== "string" || kindRaw.length === 0) {
  // Unclassifiable kind: fail closed while the dial is active, lean while it is off.
  if (dialIsActive) {
    deny(
      `Admission blocked (fail-closed): the admission had no readable note "kind" while governance ` +
        `is active. The hook cannot classify it, so it treats this admission as gate-or-stricter. A ` +
        `human must review this admission, or export ${APPROVAL}=NAME to authorize it.`,
    );
  }
  allow(); // off / absent → nothing to gate
}
// Canonicalize the kind via the SINGLE-SOURCE authority ONCE at the source (round-8 GAP-R7-1 Lever-1)
// so BOTH the finding-equality check below AND the isGatedNote call further down see the SAME normalized
// value parseNote persists. Pre-fix the hook raw-compared `kindRaw !== "finding"`, so a padded
// `kind:"finding "` read as a soft kind here and the hook ALLOWed a real, store-persisted finding. The
// missing/empty-kind fail-closed branch above intentionally inspects kindRaw (an all-whitespace kind is
// still "present" to the agent); the classification below consults the canonical form.
const kind = normalizeKind(kindRaw);

// Only a finding is ever gated (soft kinds carry no disposition stamp, D-08 — via isGatedNote).
if (kind !== "finding") {
  allow();
}

// A finding's authoring role `by` drives severity classification. A missing/empty `by` on a finding is
// unclassifiable: fail closed while the dial is active (a `by` the hook cannot read is gate-or-stricter,
// never a silent routine ALLOW), lean while it is off.
const byRaw = toolInput.by;
const by = typeof byRaw === "string" ? byRaw.trim() : "";
if (by === "") {
  if (dialIsActive) {
    deny(
      `Admission blocked (fail-closed): the finding had no readable authoring role ("by") while ` +
        `governance is active. The hook cannot classify its severity, so it treats this admission as ` +
        `gate-or-stricter. A human must review this admission, or export ${APPROVAL}=NAME to ` +
        `authorize it.`,
    );
  }
  allow();
}

// ── The single-source gated decision (W-A). ───────────────────────────────────────────────────────
// isGatedNote owns the FULL composition ((isHighSeverityRole(by) && dial active) || dial=all, with the
// dial canonicalization and the unreadable-config fail-closed). The hook adds ONLY the per-call
// env+stamp check on top. The imported classifier already Unicode-folds (compatibility-normalizes) and
// strips all whitespace/zero-width before the role-set test, so a near-miss high-severity `by` (nbsp /
// zero-width / compatibility-form / case variant) still classifies high-severity here (W1) — the hook
// defines no classifier of its own.
const gated = isGatedNote(by, kind, configResult);
if (!gated) {
  allow(); // routine under high-severity, or off / absent → not gated
}

// ── The un-forgeable per-call gate (D-07). ────────────────────────────────────────────────────────
// A GATED note is authorized ONLY if BOTH the FRESH human-set session env is present AND the
// agent-supplied stamp matches it exactly. The agent cannot set the hook's session env, so the stamp
// alone never grants — this is the structured-channel form of refuse-self-set.
// ONE presence predicate for the whole grant vocabulary (plan 30-11, finding A-4). The value of this
// variable IS the human's name — it is interpolated straight into the stamp the admission must
// match — so a value that names nobody is not a grant. `length === 0` accepted a single space, which
// would have made the expected stamp `human: ` and attributed a gated governance disposition to a
// name that renders as nothing.
const approver = cpMod.grantedBy(process.env, APPROVAL);
if (approver === null) {
  deny(
    `Admission blocked: humans decide, agents execute. This is a gated governance finding ` +
      `(by: ${by}); it requires a named human disposition. The finding cannot be admitted until a ` +
      `human exports ${APPROVAL}=NAME in the shell that launches Claude and the admission carries a ` +
      `matching verified_by: human:NAME stamp. The agent must not set ${APPROVAL} itself.`,
  );
}

const verifiedBy = typeof toolInput.verified_by === "string" ? toolInput.verified_by : "";
const expectedStamp = `human:${approver}`;
if (verifiedBy !== expectedStamp) {
  deny(
    `Admission blocked: the admission's verified_by stamp does not match the human-set approver. ` +
      `The fresh session env authorizes "${expectedStamp}", but the admission carries ` +
      `${verifiedBy === "" ? "no human disposition stamp" : `"${verifiedBy}"`}. A gated finding is ` +
      `admitted only when the agent-supplied stamp matches the human-exported ${APPROVAL} for THIS ` +
      `call — the stamp alone never grants, and a stamp for a different name is refused.`,
  );
}

// env present AND verified_by === `human:${env}` → this gated admission is authorized for this call.
allow();

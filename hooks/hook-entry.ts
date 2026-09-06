// hook-entry.ts — the fail-closed WRAPPER that is the hook entry point (plan 30-11 round 3, RA3-7).
//
// ─────────────────────────────────────────────────────────────────────────────────────────────
// WHY A SECOND PROCESS EXISTS, AND WHY THE INVARIANT COULD NOT BE ESTABLISHED WITHOUT ONE.
//
// `hooks/guard.ts` publishes this invariant: *"this file has no exit path that is neither an
// explicit allow nor an explicit deny."* Round 1 established it for THROWS (`A-2`). Round 2
// established it for a never-settling top-level await and for a dependency's own `process.exit(0)`,
// by naming two exits and adding an `exit` handler that converts any third into a refusal
// (`RA1-2`).
//
// Round 3 measured two more, on the fixed artifact, reached by exactly the same one-key file write
// the earlier ones used — an ordinary agent write to `scripts/checkpoints.js`, which matches no
// deploy pattern and carries no grant name:
//
//     dependency calls process.reallyExit(0)   ->  exit 0, ZERO bytes stdout   = a silent ALLOW
//     dependency calls process.abort()          ->  SIGABRT, no decision        = ALLOW at the host
//     dependency SIGKILLs its own process       ->  SIGKILL, no decision        = ALLOW at the host
//
// `process.reallyExit` skips the `exit` event entirely; `abort()` and a self-signal terminate before
// any handler can run. **No amount of care inside a process establishes a property about a process a
// dependency can terminate.** Enumerating a third and fourth termination mechanism would be the
// Phase-25/27 move on a different axis, so the invariant moves to its point of effect instead: a
// PARENT that observes the child's exit and answers for it.
//
// WHAT THIS FILE MAY IMPORT, AND WHY THE LIST IS THIS SHORT. `node:child_process`, `node:fs` and
// `node:path` — Node builtins that cannot fail to load and that no agent can overwrite. It imports
// nothing from `scripts/`, so the corruption class that reaches the decider cannot reach the
// wrapper. That is the whole reason it is a separate file rather than a function.
//
// THE DECISION RULE, STATED ONCE. The child's answer is passed through UNCHANGED when the child
// exited 0 and wrote either nothing (an allow) or one well-formed PreToolUse decision object.
// EVERY other outcome — a signal, a non-zero exit, unparseable stdout, a JSON object that is not a
// decision — produces this wrapper's own fail-closed deny. One branch, no enumeration of failure
// mechanisms, because the wrapper does not need to know how the child died.
// ─────────────────────────────────────────────────────────────────────────────────────────────

import { spawnSync } from "node:child_process";
import { readFileSync, writeSync } from "node:fs";
import { dirname, join } from "node:path";

/** The wrapper's own answer. Written with `writeSync` so it cannot be a queued, undelivered write. */
function denyFailClosed(reason: string): never {
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
  process.exit(0); // exit 0 + JSON deny = blocked. Any other code is NON-BLOCKING at the host.
}

/** The token a decider writes on fd 3 to ASSERT an allow. Silence there is not an allow. */
const ALLOW_TOKEN = "grugops-hook-allow";

/**
 * Is this stdout a decision the host will act on?
 *
 * An empty stdout is only reached here once the fd-3 allow assertion has already been checked above,
 * so at this point empty means "an allow the decider asserted". Anything non-empty must parse and
 * must carry a decision; a child that printed something else did not decide, whatever it printed.
 */
function isWellFormedDecision(stdout: string): boolean {
  if (stdout === "") return true;
  let parsed: unknown;
  try {
    parsed = JSON.parse(stdout);
  } catch {
    return false;
  }
  if (parsed === null || typeof parsed !== "object") return false;
  const hso = (parsed as { hookSpecificOutput?: unknown }).hookSpecificOutput;
  if (hso === null || typeof hso !== "object") return false;
  const d = (hso as { permissionDecision?: unknown }).permissionDecision;
  return d === "deny" || d === "allow" || d === "ask";
}

// The decider is named on argv so ONE wrapper serves both hooks — one rule, not two copies of it.
const deciderArg = process.argv[2];
if (deciderArg === undefined || deciderArg === "") {
  denyFailClosed(
    `Blocked (fail-closed): the grugops hook wrapper was invoked without naming a decider. It ` +
      `cannot know which check to run, so it refuses rather than allowing an unchecked command. A ` +
      `human must repair hooks/hooks.json, then re-run.`,
  );
}
const decider = join(dirname(new URL(import.meta.url).pathname), deciderArg);

let payload = "";
try {
  payload = readFileSync(0, "utf8");
} catch {
  payload = ""; // the decider fails closed on an unreadable payload; the wrapper does not second-guess
}

const child = spawnSync(process.execPath, [decider], {
  input: payload,
  encoding: "utf8",
  // stderr is inherited so the run banner (D-20) reaches the transcript from the decider itself,
  // unchanged and un-buffered by this wrapper. The wrapper adds no line of its own on a clean run.
  // fd 3 is the decider's private ALLOW channel. The host never sees it; the wrapper reads it to
  // tell "the decider allowed" from "the decider stopped", which exit 0 + empty stdout cannot.
  stdio: ["pipe", "pipe", "inherit", "pipe"],
});

const stdout = child.stdout ?? "";

if (child.signal !== null && child.signal !== undefined) {
  denyFailClosed(
    `Blocked (fail-closed): the grugops hook was terminated by ${child.signal} before it reached a ` +
      `decision. A PreToolUse hook that does not answer does not block, so a terminated check is ` +
      `answered here by refusing. A human must repair the grugops installation, then re-run.`,
  );
}

if (child.status !== 0) {
  denyFailClosed(
    `Blocked (fail-closed): the grugops hook exited ${child.status} rather than 0. Only exit 0 ` +
      `carries a decision the host acts on, so any other exit is a check that did not happen and is ` +
      `refused here. A human must repair the grugops installation, then re-run.`,
  );
}

const allowChannel = String(child.output?.[3] ?? "");

// SILENCE IS NOT AN ALLOW (round 3, `RA3-7`). `process.reallyExit(0)` in a dependency produces exit
// 0 and zero bytes of stdout — indistinguishable from a real allow to anything reading exit codes.
// Measured on the round-2 artifact, that was a silent ALLOW and the sharpest of the three
// termination classes, because the transcript shows a hook that ran and said nothing. An allow must
// therefore be ASSERTED on fd 3; a decider that exits 0 in silence did not decide.
if (stdout === "" && !allowChannel.includes(ALLOW_TOKEN)) {
  denyFailClosed(
    `Blocked (fail-closed): the grugops hook exited 0 without stating a decision — no denial on ` +
      `stdout and no allow on its own channel. An allow is asserted, never inferred from silence, ` +
      `because a process that stops before deciding is silent in exactly the same way. A human must ` +
      `repair the grugops installation, then re-run.`,
  );
}

if (!isWellFormedDecision(stdout)) {
  denyFailClosed(
    `Blocked (fail-closed): the grugops hook exited 0 but wrote something that is not a PreToolUse ` +
      `decision, so nothing decided this command. It is refused rather than allowed. A human must ` +
      `repair the grugops installation, then re-run.`,
  );
}

// The child decided. Pass its answer through byte-for-byte — the wrapper is not a second decider.
if (stdout !== "") writeSync(1, stdout);
process.exit(0);

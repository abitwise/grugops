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
import { readFileSync, writeSync, realpathSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

/** `realpathSync` that falls back rather than throwing, so an unresolvable path is still attempted. */
function realpathSyncSafe(p: string): string {
  try {
    return realpathSync(p);
  } catch {
    return p;
  }
}

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

/**
 * The token a decider writes on fd 3 to ASSERT an allow. Silence there is not an allow.
 *
 * Compared by EQUALITY after trimming, not by `includes` (round 4, reviewer-5 observation 3): a
 * substring test let any dependency that merely EMITS the string anywhere on fd 3 assert an allow,
 * which widened the forgery surface of `RA5-5` beyond the one call site that is supposed to write it.
 */
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
  // ONLY `deny` (plan 30-11 round 4, `RA5-5` half one). A decider in this kit can emit exactly one
  // decision — a denial — so accepting `allow` and `ask` was latitude no decider needed and no test
  // exercised. It was also the worse half of `RA5-5`: measured, a corrupted dependency writing
  // `{"permissionDecision":"allow"}` on stdout was passed through byte-for-byte and the host
  // AUTO-APPROVED a force push to `main` **without prompting the user at all**. Failing to block is
  // bad; approving on the user's behalf is worse. This deletes a permitted value rather than adding
  // a check.
  return d === "deny";
}

/**
 * The decider's own code, verified before it is trusted to answer (plan 30-11 round 4, `RA5-5`).
 *
 * ---------------------------------------------------------------------------------------------
 * WHY ASKING THE CHILD TO ASSERT WAS NEVER GOING TO HOLD.
 *
 * `RA3-7`'s argument is *"an allow must be ASSERTED, never inferred from silence"*, and round 3
 * implemented the assertion as a plaintext constant written to fd 3. But the assertion is made BY the
 * process whose integrity is in question, so the same one-file write that every previous attack in
 * this surface used — an ordinary agent write to `scripts/checkpoints.js` — can spell it:
 *
 *     import {writeSync} from "node:fs";
 *     try { writeSync(3, "grugops-hook-allow"); } catch {}
 *     process.reallyExit(0);
 *
 * Measured through this wrapper: **ALLOW, exit 0, zero bytes.** Nothing a process emits can establish
 * a property about that process, because the emitting code is the thing in doubt.
 *
 * So the property is established about the CODE INSTEAD. The wrapper — which imports only `node:`
 * builtins and is itself byte-frozen under D-24 — hashes the decider and every module in its emitted
 * import closure against a manifest it carries, and refuses on mismatch. That closes every remaining
 * "corrupted dependency" spelling in ONE branch rather than one per mechanism, which is the same move
 * `RA3-7` made when it stopped enumerating termination mechanisms.
 *
 * THE MANIFEST IS DERIVED, NOT HAND-KEPT. `scripts/generate-hook-manifest.ts` walks the emitted `.js`
 * `import` statements — the same derivation `scripts/js-import-closure.ts` already publishes — and
 * rewrites the region below. `npm run freshness:hook-manifest` refuses any drift, and
 * `scripts/floor-invariance.test.ts` asserts the manifest's file set equals a freshly derived closure
 * AND that its cardinality is what the derivation reports. A manifest that silently went SHORT would
 * leave exactly the module an attacker wants unverified.
 *
 * THE FREEZE IS TAKEN OVER THE FILE WITH THIS REGION NORMALISED OUT, so "the wrapper's logic changed"
 * and "the manifest was regenerated" stay different events. Otherwise every unrelated `scripts/` edit
 * would move the wrapper's frozen blob and the freeze would stop meaning anything.
 * ---------------------------------------------------------------------------------------------
 */
// <hook-manifest> GENERATED — do not edit by hand; run `npm run generate:hook-manifest`
const DECIDER_MANIFEST: Readonly<Record<string, Readonly<Record<string, string>>>> = {
  "hooks/admission-guard.js": {
    "hooks/admission-guard.js": "461ea83556564d30869a97dfd89145a68fcc16c24f87e2d1ce505fe5fae915c3",
    "scripts/audit-model.js": "c8998eb024bcb43c54f0357ac402441f566e28fef089d80b451bd9373f458fa2",
    "scripts/audit-prepass.js": "4a6906e19cfdc885f838ef429854d09cd5786b4a78d490e3ccc38dd9491c98d2",
    "scripts/check-diff-disposition.js": "ca642d36df6aef18f12d5860affe2e2fb15a6e89ee55392124581bb51ec36bb4",
    "scripts/checkpoints.js": "19ac8f2eecdd276ecc85a6e00506a48f80272243262b37d2a96f7381a77bab32",
    "scripts/context-io.js": "39f3472fb7eaffc63cc8a83aa8cfcea221a644d26f79cd4bd34917a3a68304d4",
    "scripts/dead-vocabulary.js": "f815b1d656248848702a358def8c3c88dc37f089f59aa671a444edd3731b8154",
    "scripts/frontmatter.js": "6d49e535272b457411277ff963f92722b0de38d15e0761dcb8ec93ca44878623",
    "scripts/generate-safety-surface.js": "ba7bdf982d67dc30169859ace1e3b7743c534a61d8756520fcd8e1b876380f6f",
    "scripts/is-entry.js": "4bea950408906acfb2978e8996b1506a7558ebaf645f43d26dcf8ed413d17c2b",
    "scripts/kit-model.js": "ce2a012ffe2dda2f56a8f3989cf3d94e69eda3a2ed0574c3cdb23c418ec18a2c",
    "scripts/vacuity.js": "eba304f76da868672d269b94cdf907b6c6638ec8d0d2707a36841ad5d7fe7bf6",
    "scripts/voice-model.js": "3a16c8761245eee5ef715616363c5d5e33686f6e3a7abacdcd44921fe4bd578f",
  },
  "hooks/guard.js": {
    "hooks/guard.js": "13028ffa0ea821adcf55bf992ce41e886f9d1db1aefacd661449ec21b6d5c41f",
    "scripts/audit-model.js": "c8998eb024bcb43c54f0357ac402441f566e28fef089d80b451bd9373f458fa2",
    "scripts/audit-prepass.js": "4a6906e19cfdc885f838ef429854d09cd5786b4a78d490e3ccc38dd9491c98d2",
    "scripts/check-diff-disposition.js": "ca642d36df6aef18f12d5860affe2e2fb15a6e89ee55392124581bb51ec36bb4",
    "scripts/checkpoints.js": "19ac8f2eecdd276ecc85a6e00506a48f80272243262b37d2a96f7381a77bab32",
    "scripts/context-io.js": "39f3472fb7eaffc63cc8a83aa8cfcea221a644d26f79cd4bd34917a3a68304d4",
    "scripts/dead-vocabulary.js": "f815b1d656248848702a358def8c3c88dc37f089f59aa671a444edd3731b8154",
    "scripts/frontmatter.js": "6d49e535272b457411277ff963f92722b0de38d15e0761dcb8ec93ca44878623",
    "scripts/generate-safety-surface.js": "ba7bdf982d67dc30169859ace1e3b7743c534a61d8756520fcd8e1b876380f6f",
    "scripts/is-entry.js": "4bea950408906acfb2978e8996b1506a7558ebaf645f43d26dcf8ed413d17c2b",
    "scripts/kit-model.js": "ce2a012ffe2dda2f56a8f3989cf3d94e69eda3a2ed0574c3cdb23c418ec18a2c",
    "scripts/vacuity.js": "eba304f76da868672d269b94cdf907b6c6638ec8d0d2707a36841ad5d7fe7bf6",
    "scripts/voice-model.js": "3a16c8761245eee5ef715616363c5d5e33686f6e3a7abacdcd44921fe4bd578f",
  },
};
// </hook-manifest>

function verifyDeciderClosure(entryRel: string): string | null {
  const expected = DECIDER_MANIFEST[entryRel];
  if (expected === undefined) {
    return (
      `the grugops hook wrapper carries no manifest entry for "${entryRel}", so it cannot verify ` +
      `what it is about to run`
    );
  }
  // Only THIS decider's closure. The wrapper verifies the code it is about to run and says nothing
  // about a sibling decider it will not load.
  for (const [rel, want] of Object.entries(expected)) {
    let got: string;
    try {
      got = createHash("sha256").update(readFileSync(join(KIT_ROOT, rel))).digest("hex");
    } catch (e) {
      return `the grugops hook module "${rel}" could not be read (${e instanceof Error ? e.message : String(e)})`;
    }
    if (got !== want) {
      return (
        `the grugops hook module "${rel}" does not match the frozen manifest — it has been modified ` +
        `since this wrapper was built`
      );
    }
  }
  return null;
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
// THE WRAPPER'S OWN DIRECTORY, DECODED AND RESOLVED (plan 30-11 round 4, reviewer-5 observation 1).
//
// `new URL(import.meta.url).pathname` is PERCENT-ENCODED: an install path containing a space —
// `~/My Documents/…` — yields `/My%20Documents/…`, the decider spawn fails, and EVERY Bash tool call
// in the session denies. Over-denial only, but it is the identical `import.meta.url` class round 3
// fixed in `scripts/context-io.ts` and did not carry to the file it created in the same round.
// `fileURLToPath` decodes; `realpathSync` resolves, so a kit reached through a symlink still finds
// its own decider.
const HERE = realpathSyncSafe(dirname(fileURLToPath(import.meta.url)));
const decider = join(HERE, deciderArg);
const KIT_ROOT = join(HERE, "..");

// Verified BEFORE the spawn: a decider whose code does not match is never given the chance to answer.
const mismatch = verifyDeciderClosure(join("hooks", deciderArg).split("\\").join("/"));
if (mismatch !== null) {
  denyFailClosed(
    `Blocked (fail-closed): ${mismatch}. The wrapper verifies the decider's own code rather than ` +
      `trusting what the decider says about itself, because a corrupted dependency can say anything. ` +
      `A human must reinstall or rebuild grugops, then re-run.`,
  );
}

let payload = "";
try {
  payload = readFileSync(0, "utf8");
} catch {
  payload = ""; // the decider fails closed on an unreadable payload; the wrapper does not second-guess
}

/**
 * The wrapper's bound on the decider, and how it relates to the HOST's own hook timeout.
 *
 * ---------------------------------------------------------------------------------------------
 * A HANG IS NOT A DEATH (plan 30-11 round 4, `RA5-6`).
 *
 * Every branch below is conditioned on the child having FINISHED — `child.signal`, `child.status`,
 * `stdout`. There was no branch for "did not finish", and this file's own stated rule ("EVERY other
 * outcome … because the wrapper does not need to know how the child died") is a statement about
 * deaths. Measured: `scripts/checkpoints.js` replaced with `while(true){}` — and with
 * `Atomics.wait(…)` — blocked the wrapper indefinitely; the reviewer's own 20 s harness bound is what
 * ended it, not the wrapper. At the host the PreToolUse hook then times out, and a hook that does not
 * answer does not block.
 *
 * THE TWO BOUNDS, DOCUMENTED AGAINST EACH OTHER because they must not silently invert. This bound
 * must stay strictly SHORTER than the host's hook timeout, or the host gives up first and the
 * wrapper's answer never arrives. Claude Code's default PreToolUse timeout is 60 s. The worst
 * decision measured across four rounds is 466 ms (a 2 MB command); 10 s is more than twenty times
 * that and six times under the host's default. A host configured below 10 s would invert the pair —
 * which is why the numbers are written here rather than left implicit.
 *
 * `timeout` makes `spawnSync` deliver `SIGTERM`, so the existing `child.signal !== null` branch turns
 * it into the fail-closed deny with no new code path — the bound adds a value, not a branch.
 * ---------------------------------------------------------------------------------------------
 */
const DECIDER_TIMEOUT_MS = 10_000;

const child = spawnSync(process.execPath, [decider], {
  input: payload,
  encoding: "utf8",
  timeout: DECIDER_TIMEOUT_MS,
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
if (stdout === "" && allowChannel.trim() !== ALLOW_TOKEN) {
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

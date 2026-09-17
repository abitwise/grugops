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
import { closeSync, constants as fsConstants, existsSync, fstatSync, openSync, readSync, realpathSync, statSync, writeSync, } from "node:fs";
import { dirname, isAbsolute, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
/**
 * THE WRAPPER PERFORMS NO UNBOUNDED OPERATION BEFORE IT CAN ANSWER (plan 31-27, `CR-17`).
 *
 * ---------------------------------------------------------------------------------------------
 * WHAT WENT WRONG, AND WHY IT IS A PROPERTY RATHER THAN A HABIT.
 *
 * `verifyDeciderClosure` below hashes every module in the decider's import closure — thirteen paths,
 * eleven of them under `scripts/`, every one of them agent-writable by design; that is the whole
 * reason the manifest exists. It read each one with a bare `readFileSync`. `readFileSync` opens
 * WITHOUT `O_NONBLOCK`, and `open(2)` on a FIFO with no writer BLOCKS with no timeout. The
 * verification runs BEFORE the `spawnSync` that `DECIDER_TIMEOUT_MS` bounds, so the wrapper's only
 * bound covered none of it.
 *
 * Measured on the committed artifact, at all THIRTEEN positions, through the command derived from
 * `hooks/hooks.json`: `timeout 12` -> EXIT=124, ZERO bytes on stdout and ZERO on stderr, against a
 * control that returned EXIT=0 in 0.07 s. A PreToolUse hook that never answers does not block, and
 * this is the tier that decides whether a force push or a deploy pattern runs at all.
 *
 * The rule is therefore stated as a PROPERTY OF THIS FILE and not as an enumeration of dangerous
 * file types: **no unbounded operation before the wrapper can answer.** Two things establish it —
 * every manifest read goes through the one reader below, and the wrapper's own fd-0 payload read is
 * DELETED rather than guarded (see the `stdio` comment at the spawn).
 *
 * WHY THE READER IS RESTATED HERE INSTEAD OF IMPORTED. `scripts/context-io.ts` owns the same rule as
 * `readRegularFileOrNull` (plan 31-21, D-24). This file may import only `node:` builtins — that
 * import list is the entire reason the wrapper is a separate process, and importing from `scripts/`
 * would hand the corruption class that reaches the decider a route into the wrapper. So this is a
 * SECOND implementation of ONE rule, which is this repository's own recorded drift shape. The two
 * are bound in both directions by `scripts/nonblocking-reader-parity.test.ts`: the set of files
 * implementing the discipline is DERIVED from source and asserted to have exactly two members, and
 * one shared file-shape corpus is required to produce the same decision from each. They are bound by
 * a measurement, not by trust.
 * ---------------------------------------------------------------------------------------------
 */
/**
 * The ceiling on ONE manifest-module read. STATED here rather than inherited from
 * `scripts/context-io.ts`'s note ceiling: a note and a hook module are different objects, and a
 * shared constant would make one of the two numbers a coincidence of refactoring. The two are
 * deliberately independent, and the parity test asserts each is stated ONCE rather than asserting
 * they are equal.
 */
const HOOK_MODULE_MAX_BYTES = 8 * 1024 * 1024;
/**
 * The ONE spelling of the wrapper's non-regular-file refusal, so a corpus binds to a literal rather
 * than to a sentence someone can rephrase.
 */
const MANIFEST_POSITION_NOT_REGULAR_FILE = "manifest-path-not-a-regular-file";
/**
 * Read one manifest position, in BOUNDED time, or refuse it by name.
 *
 * `O_NONBLOCK` so a FIFO at a manifest path returns a descriptor (or fails ENXIO) instead of waiting
 * for a writer; `fstat` on THAT descriptor so anything which is not a regular file is refused rather
 * than read, because reading a FIFO, a device, a socket or a directory can block forever; a stated
 * ceiling so an enormous regular file is refused rather than buffered; a read loop bounded by the
 * size `fstat` just reported on this same descriptor; and a `close` in a `finally` so a refusal
 * cannot leak the descriptor it refused.
 *
 * An ENOENT or otherwise unopenable position is NOT caught here — it propagates to the caller's
 * existing "could not be read" branch, because a module that is absent and a module the wrapper will
 * not read whole are different events and both are denials.
 */
function readRegularFileOrRefuse(path) {
    const fd = openSync(path, fsConstants.O_RDONLY | fsConstants.O_NONBLOCK);
    try {
        const st = fstatSync(fd);
        if (!st.isFile()) {
            const e = new Error(`"${path}" is not a regular file (${MANIFEST_POSITION_NOT_REGULAR_FILE})`);
            e.grugopsKind = "not-regular";
            throw e;
        }
        if (st.size > HOOK_MODULE_MAX_BYTES) {
            const e = new Error(`"${path}" is ${String(st.size)} bytes, above the ${String(HOOK_MODULE_MAX_BYTES)}-byte ceiling`);
            e.grugopsKind = "over-ceiling";
            throw e;
        }
        const buf = Buffer.allocUnsafe(Number(st.size));
        let off = 0;
        while (off < buf.length) {
            const n = readSync(fd, buf, off, buf.length - off, off);
            if (n === 0)
                break;
            off += n;
        }
        return buf.subarray(0, off);
    }
    finally {
        closeSync(fd);
    }
}
/** `realpathSync` that falls back rather than throwing, so an unresolvable path is still attempted. */
function realpathSyncSafe(p) {
    try {
        return realpathSync(p);
    }
    catch {
        return p;
    }
}
/** The wrapper's own answer. Written with `writeSync` so it cannot be a queued, undelivered write. */
function denyFailClosed(reason) {
    writeSync(1, JSON.stringify({
        hookSpecificOutput: {
            hookEventName: "PreToolUse",
            permissionDecision: "deny",
            permissionDecisionReason: reason,
        },
    }));
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
function isWellFormedDecision(stdout) {
    if (stdout === "")
        return true;
    let parsed;
    try {
        parsed = JSON.parse(stdout);
    }
    catch {
        return false;
    }
    if (parsed === null || typeof parsed !== "object")
        return false;
    const hso = parsed.hookSpecificOutput;
    if (hso === null || typeof hso !== "object")
        return false;
    const d = hso.permissionDecision;
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
const DECIDER_MANIFEST = {
    "hooks/admission-guard.js": {
        "hooks/admission-guard.js": "461ea83556564d30869a97dfd89145a68fcc16c24f87e2d1ce505fe5fae915c3",
        "scripts/audit-model.js": "c8998eb024bcb43c54f0357ac402441f566e28fef089d80b451bd9373f458fa2",
        "scripts/audit-prepass.js": "4a6906e19cfdc885f838ef429854d09cd5786b4a78d490e3ccc38dd9491c98d2",
        "scripts/check-diff-disposition.js": "ac33078d59949033e57a365bc7174b440202bd456f6b75e22f6c47339a3998a3",
        "scripts/checkpoints.js": "956762281858343e85537c2aee7bfd0c7469af83168397ce3e43a76d89ad7374",
        "scripts/context-io.js": "166492585917a61667e90cf2f2bddbeded290d3451f05dac26f8f09ec8cec5c3",
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
        "scripts/check-diff-disposition.js": "ac33078d59949033e57a365bc7174b440202bd456f6b75e22f6c47339a3998a3",
        "scripts/checkpoints.js": "956762281858343e85537c2aee7bfd0c7469af83168397ce3e43a76d89ad7374",
        "scripts/context-io.js": "166492585917a61667e90cf2f2bddbeded290d3451f05dac26f8f09ec8cec5c3",
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
function verifyDeciderClosure(entryRel) {
    const expected = DECIDER_MANIFEST[entryRel];
    if (expected === undefined) {
        return (`the grugops hook wrapper carries no manifest entry for "${entryRel}", so it cannot verify ` +
            `what it is about to run`);
    }
    // Only THIS decider's closure. The wrapper verifies the code it is about to run and says nothing
    // about a sibling decider it will not load.
    for (const [rel, want] of Object.entries(expected)) {
        const position = join(KIT_ROOT, rel);
        let got;
        try {
            // BOUNDED (plan 31-27, CR-17). The three ways this read can fail are three DIFFERENT events
            // with three different messages, and all three are denials: a module that is absent cannot be
            // hashed, a module that is not a regular file must not be waited on, and a module the wrapper
            // will not read whole cannot be verified. Collapsing them into one message would tell a human
            // repairing an installation nothing about what to repair.
            got = createHash("sha256").update(readRegularFileOrRefuse(position)).digest("hex");
        }
        catch (e) {
            const kind = e.grugopsKind;
            if (kind === "not-regular") {
                return (`the grugops hook module "${rel}" at "${position}" is not a regular file ` +
                    `(${MANIFEST_POSITION_NOT_REGULAR_FILE}) — it is refused rather than waited on, because ` +
                    `opening a FIFO, a device, a socket or a directory for reading can block forever and a ` +
                    `PreToolUse hook that never answers does not block`);
            }
            if (kind === "over-ceiling") {
                return (`the grugops hook module "${rel}" at "${position}" is above the ` +
                    `${String(HOOK_MODULE_MAX_BYTES)}-byte ceiling this wrapper reads — it is refused rather ` +
                    `than read, because a module the wrapper will not read whole is a module it cannot verify`);
            }
            return `the grugops hook module "${rel}" could not be read (${e instanceof Error ? e.message : String(e)})`;
        }
        if (got !== want) {
            return (`the grugops hook module "${rel}" does not match the frozen manifest — it has been modified ` +
                `since this wrapper was built`);
        }
    }
    return null;
}
// The decider is named on argv so ONE wrapper serves both hooks — one rule, not two copies of it.
const deciderArg = process.argv[2];
if (deciderArg === undefined || deciderArg === "") {
    denyFailClosed(`Blocked (fail-closed): the grugops hook wrapper was invoked without naming a decider. It ` +
        `cannot know which check to run, so it refuses rather than allowing an unchecked command. A ` +
        `human must repair hooks/hooks.json, then re-run.`);
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
    denyFailClosed(`Blocked (fail-closed): ${mismatch}. The wrapper verifies the decider's own code rather than ` +
        `trusting what the decider says about itself, because a corrupted dependency can say anything. ` +
        `A human must reinstall or rebuild grugops, then re-run.`);
}
/**
 * THE HOST-DELIVERED GOVERNANCE ROOT (plan 31-27, structural fix S1).
 *
 * ---------------------------------------------------------------------------------------------
 * WHY THIS FILE IS THE PLACE, AND THE ONLY PLACE.
 *
 * Every member of `scripts/context-io.ts`'s `TRUSTED_ROOT_RESIDUALS` ends with the same criterion:
 * *a root the calling process cannot influence, resolved by the host from outside the agent's
 * process tree and delivered through a channel the agent cannot write.* The wrapper is the one point
 * in this process tree where that criterion is satisfiable. The HOST builds the environment of the
 * hook subprocess it spawns, so `CLAUDE_PROJECT_DIR` read HERE is host-built and not something the
 * agent's own tool calls composed. This file is byte-frozen under D-24, and it hash-verifies the
 * decider's entire import closure above before the decider is allowed to run. Those two facts ARE
 * the trust in this channel — nothing more, and the register says so rather than implying it.
 *
 * AN UNUSABLE VALUE DELIVERS NOTHING, NOT A BAD VALUE. When the host's value fails any condition
 * below the name is simply not set, and the decider answers from the tier below — which is the walk,
 * the program that has always answered. Delivering a value that failed a check would be strictly
 * worse than delivering none: the decider would then TRUST a tier the fallback would have answered
 * correctly.
 *
 * THE CONDITIONS ARE THE READER'S OWN, AND THAT IS A MEASUREMENT RATHER THAN A CLAIM (plan 31-37,
 * `WR-36`). Until this plan there were three of them — non-empty after a trim, absolute, an existing
 * directory — under a sentence saying they were the ones a file limited to `node:` builtins can make.
 * That reason was FALSE of this file: `existsSync` is imported at the top of it and used below, and
 * both remaining conditions are `node:fs` plus `node:path` operations. Measured end-to-end through
 * BOTH `hooks/hooks.json` commands, four candidates in a thirteen-shape corpus were DELIVERED here
 * and DISCARDED by `hostDeliveredRoot`: a directory with no version-control marker, a symlink to one,
 * a directory nested inside a repository, and the kit's own root. The gap was benign only because the
 * reader re-checks, and nothing held the two together — so a later narrowing of the reader would have
 * gone unnoticed.
 *
 * The two further conditions are therefore applied HERE, and the pair is BOUND rather than aligned:
 * `scripts/context-io.test.ts` drives ONE shared candidate corpus through this wrapper end-to-end and
 * through the reader of the SAME kit, and asserts that no candidate this wrapper accepts is one that
 * reader would discard. No difference remains on the accept set.
 *
 * D-29'S BOUND IS UNMOVED, AND THAT IS RE-DRIVEN RATHER THAN ARGUED. The work added here is at most
 * nine `existsSync` probes on the candidate's own children plus one `realpathSync` — `access(2)`- and
 * `stat(2)`-shaped calls that open nothing, so none of them can wait for a writer the way `open(2)`
 * on a FIFO does. The `CR-17` reproduction is re-driven against this change, with its exit code, its
 * elapsed time and both stream byte counts recorded beside `31-31`'s.
 *
 * THE NAME IS THE DECIDER'S, NOT THE HOST'S. `GRUGOPS_HOST_DELIVERED_ROOT` is spelled here as a
 * literal — this file may import only `node:` builtins, so it cannot import the constant — and
 * `scripts/context-io.test.ts` asserts the two spellings agree in both directions. It is deliberately
 * distinct from `CLAUDE_PROJECT_DIR` and `GRUGOPS_PROJECT_DIR`, so the delivered channel and the
 * ambient channel cannot be mistaken for one another at the point of reading.
 * ---------------------------------------------------------------------------------------------
 */
const HOST_DELIVERED_ROOT_ENV = "GRUGOPS_HOST_DELIVERED_ROOT";
/**
 * WHERE A REPOSITORY STARTS, SPELLED HERE AS A LITERAL for the same reason the env name above is.
 *
 * `scripts/context-io.ts` owns the authority as `REPO_BOUNDARY_MARKERS`; this file may import only
 * `node:` builtins, so it cannot import that constant. A second hand-kept spelling of one set is this
 * repository's recorded drift shape, so it is BOUND rather than trusted: `scripts/context-io.test.ts`
 * derives THIS list from this file's own syntax tree and asserts it equal to the module's export in
 * both directions, cardinality included.
 */
const REPO_BOUNDARY_MARKERS = Object.freeze([
    ".git", // Git
    ".hg", // Mercurial
    ".svn", // Subversion
    ".bzr", // Bazaar
    "_darcs", // Darcs
    ".jj", // Jujutsu
    ".pijul", // Pijul
    ".fslckout", // Fossil, POSIX checkout marker
    "_FOSSIL_", // Fossil, Windows checkout marker
]);
function hostBuiltProjectRoot() {
    const raw = process.env["CLAUDE_PROJECT_DIR"];
    if (typeof raw !== "string")
        return null;
    const trimmed = raw.trim();
    if (trimmed === "" || !isAbsolute(trimmed))
        return null;
    const canonical = realpathSyncSafe(trimmed);
    try {
        if (!statSync(canonical).isDirectory())
            return null;
    }
    catch {
        return null;
    }
    if (!existsSync(canonical))
        return null;
    // A REPOSITORY, by the marker set the reader applies. Bounded: at most one `access(2)`-shaped probe
    // per marker, on the candidate's own children, opening nothing.
    if (!REPO_BOUNDARY_MARKERS.some((marker) => existsSync(join(canonical, marker))))
        return null;
    // NOT the kit this wrapper ships in. The kit is not a governed project; delivering it would hand
    // the decider the kit's own lean default wearing the name of a host-resolved project root, which
    // is the shape `D-23 (4)` and `CR-13` both already refuse one tier down.
    if (canonical === realpathSyncSafe(KIT_ROOT))
        return null;
    return canonical;
}
const deliveredRoot = hostBuiltProjectRoot();
const deciderEnv = { ...process.env };
if (deliveredRoot !== null) {
    deciderEnv[HOST_DELIVERED_ROOT_ENV] = deliveredRoot;
}
else {
    // Never inherit a delivered name the wrapper did not itself establish: an ambient value under this
    // spelling would otherwise be indistinguishable from a host-built one at the decider.
    delete deciderEnv[HOST_DELIVERED_ROOT_ENV];
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
    encoding: "utf8",
    timeout: DECIDER_TIMEOUT_MS,
    // The ONE call the delivered root is set on (plan 31-27, S1). Everything else is inherited.
    env: deciderEnv,
    // fd 0 IS INHERITED, AND THE WRAPPER'S OWN READ OF IT IS GONE (plan 31-27, `CR-17`'s second half).
    //
    // This used to be a pipe fed from `input: payload`, where `payload` came from
    // `readFileSync(0, "utf8")` a few lines above. That read waits for EOF on the host's stdin, and it
    // happened BEFORE this spawn — so, exactly like the manifest reads, it sat outside the one bound
    // this wrapper carries. Measured on the committed artifact: a parent that writes a complete,
    // valid payload and never closes the pipe left the wrapper running past a 25 s harness bound with
    // zero bytes on both streams; only the harness's SIGKILL ended it.
    //
    // THE DELETION IS THE FIX, AND IT IS NOT A SECOND GUARD. A read the wrapper does not perform
    // cannot be a read the wrapper waits on. Both deciders already read fd 0 themselves, so inheriting
    // it moves that read INTO the child — the one process `DECIDER_TIMEOUT_MS` already bounds. A stall
    // on the host's stdin now arrives as SIGTERM on the child, and the existing `child.signal !== null`
    // branch below turns it into the fail-closed deny with no new code path: the bound adds a value,
    // not a branch. `hooks/guard.ts` is NOT touched by any of this.
    //
    // stderr is inherited so the run banner (D-20) reaches the transcript from the decider itself,
    // unchanged and un-buffered by this wrapper. The wrapper adds no line of its own on a clean run.
    // fd 3 is the decider's private ALLOW channel. The host never sees it; the wrapper reads it to
    // tell "the decider allowed" from "the decider stopped", which exit 0 + empty stdout cannot.
    stdio: [0, "pipe", "inherit", "pipe"],
});
const stdout = child.stdout ?? "";
if (child.signal !== null && child.signal !== undefined) {
    denyFailClosed(`Blocked (fail-closed): the grugops hook was terminated by ${child.signal} before it reached a ` +
        `decision. A PreToolUse hook that does not answer does not block, so a terminated check is ` +
        `answered here by refusing. A human must repair the grugops installation, then re-run.`);
}
if (child.status !== 0) {
    denyFailClosed(`Blocked (fail-closed): the grugops hook exited ${child.status} rather than 0. Only exit 0 ` +
        `carries a decision the host acts on, so any other exit is a check that did not happen and is ` +
        `refused here. A human must repair the grugops installation, then re-run.`);
}
const allowChannel = String(child.output?.[3] ?? "");
// SILENCE IS NOT AN ALLOW (round 3, `RA3-7`). `process.reallyExit(0)` in a dependency produces exit
// 0 and zero bytes of stdout — indistinguishable from a real allow to anything reading exit codes.
// Measured on the round-2 artifact, that was a silent ALLOW and the sharpest of the three
// termination classes, because the transcript shows a hook that ran and said nothing. An allow must
// therefore be ASSERTED on fd 3; a decider that exits 0 in silence did not decide.
if (stdout === "" && allowChannel.trim() !== ALLOW_TOKEN) {
    denyFailClosed(`Blocked (fail-closed): the grugops hook exited 0 without stating a decision — no denial on ` +
        `stdout and no allow on its own channel. An allow is asserted, never inferred from silence, ` +
        `because a process that stops before deciding is silent in exactly the same way. A human must ` +
        `repair the grugops installation, then re-run.`);
}
if (!isWellFormedDecision(stdout)) {
    denyFailClosed(`Blocked (fail-closed): the grugops hook exited 0 but wrote something that is not a PreToolUse ` +
        `decision, so nothing decided this command. It is refused rather than allowed. A human must ` +
        `repair the grugops installation, then re-run.`);
}
// The child decided. Pass its answer through byte-for-byte — the wrapper is not a second decider.
if (stdout !== "")
    writeSync(1, stdout);
process.exit(0);

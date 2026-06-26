// admission-guard.ts — grugops GOV-01 mechanical human-admission gate.
//
// Pure-Node Claude Code PreToolUse hook: no `jq`, no host npm dependency, Node stdlib only
// (plus the ONE shared config-read helper from scripts/context-io). Wired by hooks/hooks.json
// as a SECOND plugin-level PreToolUse Bash matcher beside the byte-frozen prod-deploy guard
// (`node "${CLAUDE_PLUGIN_ROOT}/hooks/admission-guard.js"`). Both run independently and
// most-restrictive-deny-wins; this guard never relies on guard.js. The committed compiled
// output is hooks/admission-guard.js, which the host hook runs.
//
// WHY a SEPARATE HOOK PROCESS (D-01, D-10): admission and prod-deploy are distinct concerns,
// so this is a NEW file — hooks/guard.ts stays byte-frozen (D-02). More importantly, the only
// mechanically un-forgeable human-admission tier is a separate process that reads the
// HUMAN-SET SESSION env var. An agent's own inline `export VAR=...` lands in the child env it
// spawns, which the hook process never inherits; the human's session export does reach the
// hook. This mirrors the prod-deploy guard exactly (D-01). An in-script env check inside
// admit() would be self-settable and therefore forgeable — hence the hook.
//
// Contract (clear professional voice throughout — security/governance/audit surfaces are
// never caveman voice, per CLAUDE.md):
//   - Reads the Bash command from PreToolUse stdin JSON (`tool_input.command`). The ONLY input
//     is that command string — NEVER file content. A markdown/fenced/echoed example of an
//     admit invocation is not a real Bash admit call and is therefore inert (inverse of the
//     P23 CR-01 false-positive: this guard fires on the command verb, not on embedded text).
//   - Fires only on a real `node …context-io(.js) admit <task> <noteFile> [root]` invocation
//     (verb-anchored — match the SUBCOMMAND VERB, not a substring). There is no CLI `append`
//     verb; the dispatch exposes only validate/admit/render, so the guard matches ONLY admit.
//   - Re-reads the named note file from disk and classifies HIGH-SEVERITY by the note's
//     authoring role `by` (D-06): {security-nfr, architect-design, release-manager}. No
//     self-declared `severity` field (that would be gameable downward).
//   - Reads the `human_admission` dial via the ONE shared readGovernanceConfig (Plan 25-01),
//     so the hook and admit() cannot diverge (OQ-3): `off` → never gate; `high-severity` →
//     gate only the three high-severity roles; `all` → gate EVERY matched admission.
//   - DENIES a gated admission unless the HUMAN-SET session env var
//     GRUGOPS_ADMISSION_APPROVED_BY is present in the hook's own process env.
//   - REFUSES any command that tries to inline-set/export that var, so the agent can never
//     self-approve — denied EVEN IF the var is already present in env (D-01).
//   - FAILS CLOSED: once the command IS a matched gated admit, any later failure (unreadable
//     note, unparsable `by`, config read throw) → deny(), never crash-allow. An empty/malformed
//     stdin yields cmd="" which matches no admit and is allowed — nothing to gate.
//
// Block mechanism: exit 0 + JSON `hookSpecificOutput.permissionDecision: "deny"` with a
// `permissionDecisionReason` (gives the agent a clear message). Allow = exit 0, no output.
import { readFileSync } from "node:fs";
import { parseNote, readGovernanceConfigResult } from "../scripts/context-io.js";
// The human-confirm signal for admission. A human exports this in the shell that launches
// Claude (or via settings env); the agent must never set it. The hook reads it from its OWN
// process env, which the agent's spawned-child env cannot reach.
const APPROVAL = "GRUGOPS_ADMISSION_APPROVED_BY";
// HIGH-SEVERITY authoring roles (D-06 — the clean 3:3 security / architecture / release map).
// Severity is the note's `by` (the running agent IS that role; relabeling it is an
// impersonation FAIL upstream in validate()), never a self-declared `severity` field.
const HIGH_SEVERITY_ROLES = new Set([
    "security-nfr",
    "architect-design",
    "release-manager",
]);
// Detects any attempt to set or export the approval variable inline (e.g.
// `GRUGOPS_ADMISSION_APPROVED_BY=alice ...`, `export GRUGOPS_ADMISSION_APPROVED_BY=alice`,
// `env GRUGOPS_ADMISSION_APPROVED_BY=alice ...`). Matched regardless of surrounding command.
// Cloned verbatim from hooks/guard.ts:88, swapping only the variable name.
const SELF_APPROVE = new RegExp(`(^|[\\s;&|(])(export\\s+|env\\s+)?${APPROVAL}\\s*=`);
// ── Shell-segment parser: ONE parsing authority over the command grammar ──────────────────────────
//
// CRITICAL INPUT-SURFACE DISCIPLINE (T-25-10/T-25-13, the inverse of the P23 CR-01 false-positive):
// the guard must fire on EVERY real Bash admit invocation, and ONLY on a real one. A real admit can
// be launched by any of `node`, `npx`, `tsx`, or `npx tsx`, and the launcher segment can be wrapped
// in a subshell `( … )` / `$( … )`, prefixed with inline `VAR=val`/`env VAR=val` assignments, and
// joined across a backslash-newline line continuation. Conversely, the same text appearing inside a
// single/double-quoted string, after a `#` comment, or in a heredoc body is INERT DATA, not a live
// command. The prior `ADMIT_SEGMENT` regex anchored only on a bare `node` at an unquoted segment
// start; three real launchers (subshell, `\`-continuation, `npx tsx`) escaped it and an inert
// heredoc body line false-positived. Widening the regex one more notch is the whack-a-mole trap
// (P22 was bypassed 7× that way). Instead, the boundary IS the parser: one tokenizer walks the
// command grammar once, classifying quoted / commented / heredoc text as data, then we ask whether
// any LIVE command segment is an admit launch. A launcher shape outside a narrow anchor cannot
// escape, and an inert mention cannot false-positive — both follow from the single grammar walk.
//
// This is the SOLE gate input surface: the Bash `tool_input.command` string, never file content.
const ADMIT_VERB = "admit";
const ADMIT_SCRIPT = "context-io"; // matches context-io and context-io.js as a token substring
// The launcher commands that actually RUN a script: a bare interpreter or an npx/tsx runner.
// `nodejs` is the alternate Debian/Ubuntu binary name for `node` (round-2 GAP-A).
const LAUNCHERS = new Set(["node", "npx", "tsx", "nodejs"]);
// ── Round-5 (GOV-01 un-forgeable tier): structural admit-SHAPE detection ───────────────────────────
//
// The prior admit-SHAPE detector (segmentHasAdmitShape) is a LITERAL substring/token test on the
// UN-EXPANDED command string, so any shell REWRITE that defers the script-ref or the admit verb to
// runtime walked through (glob `node scripts/context-i*.js admit`, command/parameter substitution,
// word-split, extglob `context-i@(o).js`, a non-node JS runner, a shebang). The fix requires PROOF a
// script/verb token is its final literal form — an ALLOWLIST of provably-inert characters, NOT a
// denylist of dangerous ones (a denylist is the same enumeration trap inverted; it would miss extglob
// `@(` and any future metachar). A token outside the allowlist is UNRESOLVABLE → fail CLOSED, with no
// enumeration of what expands. The disposition is SCRIPT-anchored and applies to ANY command word —
// never the literal substring. `scripts/context-io.ts` is NOT edited (the un-forgeable hook re-closes
// the dial-`all` rewrite case; the self-settable in-script tier adds no un-forgeable defense).
// JS-EXECUTION-CAPABILITY set: runtimes that can RUN a context-io admit. This is a NEW SEPARATE set —
// NOT a widening of COMMAND_MODIFIERS (which resolves a wrapped command word) and NOT a widening of
// LAUNCHERS. A JS_RUNNER is treated as a recognized (FORWARDING) launcher: it forwards to a runner +
// script at a deep / variable position the hook cannot pin, so any unresolvable token in its argv fails
// closed (RULE 2 forwarding). This closes `bun $S $V` while keeping `cp $A $B` allowed (cp is not a JS
// runner, so the unrecognized-command scan needs a concrete literal anchor it does not have).
const JS_RUNNERS = new Set(["bun", "bunx", "deno", "ts-node"]);
// DIRECT runners execute their FIRST positional as the script, so RULE 2 can pin it precisely (after a
// value-flag-arity skip) and gate only that script — a trailing dynamic ARG is ignored (`node build
// $HOME/out` allows). FORWARDING runners ({npx} ∪ JS_RUNNERS) hand off to a runner + script the hook
// cannot pin, so RULE 2 gates on ANY unresolvable token in the post-launcher argv.
const DIRECT_RUNNERS = new Set(["node", "nodejs", "tsx"]);
// node's value-consuming flags: each takes the NEXT token as its value, so the DIRECT-runner script pin
// skips BOTH (by arity). A `--flag=value` is a single token, skipped as one. Skipping by arity (not
// guessing) keeps the pin precise; RULE 1 (position-free) independently catches the literal-context-io
// case regardless of any flag, so the rev-1 npx-value-flag regression cannot reopen.
const VALUE_FLAGS = new Set([
    "-r",
    "--require",
    "-e",
    "--eval",
    "--import",
    "--loader",
    "-p",
    "--print",
    "-C",
    "--conditions",
]);
// A launcher reached BEHIND one of these feeders has a STDIN-sourced argv (the script/verb arrive on
// stdin, not the command line). `xargs` is also a COMMAND_MODIFIER (the leading-run skip reaches the
// launcher behind it); this set marks that the reached launcher's argv is stdin-fed → unresolvable.
const STDIN_ARGV_FEEDERS = new Set(["xargs"]);
// ── Effective-command-word resolution (round-2 GAP-A): command-RESOLUTION, not an anchor list ──────
//
// The 25-04 tokenizer (liveTokens) correctly solved SEGMENTATION — it classifies quoted / commented /
// heredoc / subshell / `\`-continuation / `VAR=` / `env`-prefixed text as data vs live command. The
// round-2 red-team then showed a real gated admit can still slip past because the matcher tested the
// launcher as a LITERAL command word (`LAUNCHERS.has(token)`). An attacker can wrap the launcher in a
// command-modifier builtin (`command`/`exec`/`nice node …`), give it as a path (`/usr/local/bin/node`),
// alias it (`nodejs`), split it across quotes (`no"de"`), or put it in a brace group (`{ node …; }`).
// Widening the launcher anchor list one more notch is the whack-a-mole trap (P22 was bypassed 7× that
// way, and round-1 reopened this exact class on command-resolution). Instead, there is ONE command-
// resolution authority: resolve the segment's EFFECTIVE command word (skip command-modifier builtins,
// basename a path, fully de-quote, recognize a brace group) and test THAT against the launchers. A
// launcher spelling outside any narrow anchor cannot escape, because resolution — not enumeration — is
// the boundary (the P22 round-8 "make the boundary BE the parser" lesson, applied to command-resolution).
// Command-modifier builtins that the shell strips before resolving the real command word: each one
// runs the command that FOLLOWS it (`command node …` runs node, `nice node …` runs node, etc.). The
// resolver skips these to reach the effective command word. This is a fixed, closed set of POSIX/bash
// command-prefix modifiers — NOT a launcher list (it never matches as a launcher itself).
const COMMAND_MODIFIERS = new Set([
    "command",
    "exec",
    "builtin",
    "nice",
    "time",
    "nohup",
    "stdbuf",
    "timeout",
    "xargs",
]);
// Dynamic-evaluation / indirection command words whose body the parser CANNOT statically resolve to a
// definitely-non-launcher (round-2 GAP-A fail-closed tail). When the admit SHAPE (a context-io script
// reference AND the admit verb) appears in a LIVE segment whose effective command word is one of these,
// the resolver gives up and the gate treats it as a live admit and GATES (deny pending a human). The
// trigger is NARROW: it fires ONLY when the admit shape is present — a plain `eval "echo hi"` /
// `bash -c "ls"` with no admit reference is not an admit and is not gated (no over-block of unrelated
// dynamic commands). `sh`/`bash`/`dash`/`zsh` are here because a `-c "<string body>"` hides the real
// command word inside a quoted run the tokenizer treats as data; `eval` evaluates its argument as a
// command; an env-var-indirected command word (`$X …`) is unknowable statically.
const DYNAMIC_EVAL_WORDS = new Set([
    "eval",
    "sh",
    "bash",
    "dash",
    "zsh",
    "source",
    ".",
]);
// Resolve the EFFECTIVE command word of a launcher token: take the path basename (`/usr/local/bin/node`
// → `node`, `./node` → `node`) so a path-form launcher resolves. The token has already been fully
// de-quoted by the tokenizer (every quoted run stripped), so split/partial-quote launchers (`no"de"`,
// `n''ode`) arrive here as the bare word.
function effectiveCommandWord(token) {
    // Basename: drop everything up to and including the last "/". A trailing slash yields "".
    const slash = token.lastIndexOf("/");
    return slash >= 0 ? token.slice(slash + 1) : token;
}
// Remove EVERY balanced single/double-quoted run within a token, keeping the inner literal content, so
// the result is the word the shell would resolve. Walks the token once: inside a quoted run the quote
// chars are dropped and the inner chars kept; outside a run the char is kept verbatim. An unbalanced
// trailing quote keeps the remaining chars literally (best-effort; a failure here fails CLOSED on a
// matched gated admit downstream). This replaces the 25-04 whole-token-only de-quote.
function stripQuotedRuns(token) {
    let out = "";
    let i = 0;
    const n = token.length;
    while (i < n) {
        const c = token[i];
        if (c === "'" || c === '"') {
            const close = token.indexOf(c, i + 1);
            if (close < 0) {
                // No closing quote — keep the rest as literal (the opening quote is dropped).
                out += token.slice(i + 1);
                break;
            }
            out += token.slice(i + 1, close);
            i = close + 1;
            continue;
        }
        out += c;
        i += 1;
    }
    return out;
}
// Sentinel value for a synthetic token the walk emits when a command-substitution `$( … )` or a
// backtick run stands in COMMAND-WORD position (it IS the command word the shell would form). The
// produced command word is dynamic and statically unresolvable, so the resolver treats this segment's
// command word as unresolvable and FAILS CLOSED when the segment carries the admit shape (Class B).
// A real token can never equal this value (it contains characters no shell word survives with).
const DYNAMIC_COMMAND_WORD = "\0$(dynamic)\0";
// Find the index just past the matching `)` that closes a `$( … )` command substitution that opens
// at `open` (where cmd[open]==='$' && cmd[open+1]==='('). Counts NESTED `$( … )` and `(` so a nested
// substitution `$(echo $(echo node))` is consumed as one balanced span. Quoted runs inside are skipped
// so a `)` inside a string does not close the span early. Returns `cmd.length` on an unbalanced span
// (best-effort; the whole tail is then treated as the substitution body — the segment's command word
// stays the synthetic dynamic token, which fails CLOSED on a matched admit shape).
function matchCommandSubstitution(cmd, open) {
    let depth = 0;
    let i = open;
    const n = cmd.length;
    while (i < n) {
        const c = cmd[i];
        if (c === "'" || c === '"') {
            const close = cmd.indexOf(c, i + 1);
            i = close < 0 ? n : close + 1;
            continue;
        }
        if (c === "$" && cmd[i + 1] === "(") {
            depth += 1;
            i += 2;
            continue;
        }
        if (c === "(") {
            depth += 1;
            i += 1;
            continue;
        }
        if (c === ")") {
            depth -= 1;
            i += 1;
            if (depth === 0)
                return i;
            continue;
        }
        i += 1;
    }
    return n;
}
// Walk the command string ONCE, honoring the shell quoting / comment / continuation / heredoc /
// segment-separator grammar, and return the LIVE tokens (the words the shell would actually run),
// each flagged with whether it begins a command segment. Anything inside quotes, after `#`, or
// within a heredoc body is data and is never emitted as a live token. This is intentionally a
// recognizer for the constructs that matter to the gate (it does not evaluate the command); a
// failure to recognize a launcher fails CLOSED downstream on a matched gated admit.
function liveTokens(cmd) {
    const tokens = [];
    const heredocDelims = []; // pending heredoc terminators, in declaration order
    let i = 0;
    const n = cmd.length;
    // A segment starts at the very beginning and after every command separator / opening grouping.
    // The first non-space token after such a boundary is the segment's command.
    let atSegmentStart = true;
    let cur = ""; // the token being accumulated
    let curStartsSegment = false;
    let curStart = 0; // byte offset where the current token began
    let building = false; // true once cur has begun accumulating a token
    const flush = () => {
        if (building) {
            // FULLY de-quote the token: strip EVERY balanced single/double-quoted run within it, not only a
            // whole-token-surrounding pair (round-2 GAP-A). The shell concatenates a token's quoted and
            // unquoted runs into one word, so `no"de"` and `n''ode` are both the literal word `node`. The
            // 25-04 behavior only un-quoted a token that was ENTIRELY one quoted run, leaving split-quote
            // launchers unresolved. Removing each `'...'`/`"..."` run (keeping the inner literal) yields the
            // effective word for command-resolution while preserving inner literal content for non-launchers.
            const stripped = stripQuotedRuns(cur);
            tokens.push({ value: stripped, startsSegment: curStartsSegment, start: curStart });
            cur = "";
            building = false;
        }
    };
    const begin = () => {
        if (!building) {
            building = true;
            curStartsSegment = atSegmentStart;
            curStart = i;
            atSegmentStart = false;
        }
    };
    while (i < n) {
        const c = cmd[i];
        // After a newline, consume any pending heredoc body up to (and including) its terminator line.
        // The body lines are DATA — never tokenized — so an admit mention inside a heredoc is inert.
        if (heredocDelims.length > 0 && (c === "\n" || (c === "\r" && cmd[i + 1] === "\n"))) {
            flush();
            // advance past the CR?LF that ended the redirection line
            i += c === "\r" ? 2 : 1;
            const delim = heredocDelims.shift();
            while (i < n) {
                let lineEnd = cmd.indexOf("\n", i);
                if (lineEnd < 0)
                    lineEnd = n;
                const rawLine = cmd.slice(i, lineEnd).replace(/\r$/, "");
                // The terminator may be indented when the heredoc used `<<-`; compare the trimmed line.
                if (rawLine.trim() === delim) {
                    i = lineEnd < n ? lineEnd + 1 : n;
                    break;
                }
                i = lineEnd < n ? lineEnd + 1 : n;
            }
            atSegmentStart = true; // the line after a heredoc body begins a fresh segment
            continue;
        }
        // `#` introduces a comment only at a token boundary (not mid-word); the rest of the line is data.
        if (c === "#" && !building) {
            let lineEnd = cmd.indexOf("\n", i);
            if (lineEnd < 0)
                lineEnd = n;
            i = lineEnd;
            continue;
        }
        // Single / double quoted runs: capture the whole run (including quotes) as part of the current
        // token so it strips to literal data. A quote can never start a live launcher token.
        if (c === "'" || c === '"') {
            const close = cmd.indexOf(c, i + 1);
            const end = close < 0 ? n : close + 1;
            begin();
            cur += cmd.slice(i, end);
            i = end;
            continue;
        }
        // Backslash-newline is a LINE CONTINUATION: the shell joins the two physical lines into one
        // logical line, so it neither ends the token nor starts a new segment. `node \<newline> …admit`
        // is ONE live `node` segment. A backslash before any other char escapes that char into the token.
        if (c === "\\") {
            if (cmd[i + 1] === "\n") {
                i += 2;
                continue;
            }
            if (cmd[i + 1] === "\r" && cmd[i + 2] === "\n") {
                i += 3;
                continue;
            }
            if (i + 1 < n) {
                begin();
                cur += cmd[i + 1];
                i += 2;
                continue;
            }
            i += 1;
            continue;
        }
        // Heredoc redirection operator: `<<WORD`, `<<-WORD`, `<<'WORD'`/`<<"WORD"`. Record the
        // terminator; the BODY (consumed after the next newline) is data. The operator itself is not a
        // token we care about, but we keep walking the rest of the redirection line normally.
        if (c === "<" && cmd[i + 1] === "<") {
            flush();
            let j = i + 2;
            if (cmd[j] === "-")
                j += 1;
            while (j < n && /\s/.test(cmd[j]) && cmd[j] !== "\n")
                j += 1;
            let delim = "";
            if (cmd[j] === "'" || cmd[j] === '"') {
                const q = cmd[j];
                const close = cmd.indexOf(q, j + 1);
                const end = close < 0 ? n : close;
                delim = cmd.slice(j + 1, end);
                j = close < 0 ? n : close + 1;
            }
            else {
                const m = /^[A-Za-z0-9_]+/.exec(cmd.slice(j));
                delim = m ? m[0] : "";
                j += delim.length;
            }
            if (delim !== "")
                heredocDelims.push(delim);
            i = j;
            continue;
        }
        // Command substitution `$( … )`. Two cases, distinguished by POSITION (round-3 Class B):
        //   1. TOKEN-START position (`!building` — nothing accumulated into the current token yet): the
        //      substitution PRODUCES a whole word the shell will run as the command word OR a leading-run
        //      modifier argument (`$(echo node) …admit`, `nice $(echo node) …admit`). That word is dynamic
        //      and statically unresolvable, so we emit a synthetic DYNAMIC_COMMAND_WORD token (carrying this
        //      position's startsSegment flag), consume the WHOLE balanced `$( … )` span as data, and keep
        //      the line open so the rest of the segment is its arguments — letting the admit-shape scan see
        //      the trailing `…admit NOTE`. The leading-run resolver (liveAdmitSegments) then encounters the
        //      synthetic token as the effective command word and fails CLOSED on the admit shape. (The 25-04
        //      behavior opened a fresh segment at the INNER word, which both exposed the inner command AND
        //      lost the outer admit shape — the Class B root.)
        //   2. MID-WORD position (`building` — appended to an in-progress token, e.g. `foo$(…)bar`): the
        //      substitution is part of an argument word, not a command word; we skip its balanced span as
        //      data and keep accumulating the current token.
        if (c === "$" && cmd[i + 1] === "(") {
            const end = matchCommandSubstitution(cmd, i); // index just past the matching ")"
            if (!building) {
                tokens.push({ value: DYNAMIC_COMMAND_WORD, startsSegment: atSegmentStart, start: i });
                atSegmentStart = false; // the produced word occupies this token position
            }
            i = end;
            continue;
        }
        // A backtick command substitution `` ` … ` `` behaves like `$( … )`. At a token-start position it
        // produces a dynamic command word / leading-run argument (Class B); mid-word it is part of a word.
        // Backticks were previously unhandled (the run extended the current token), so a
        // `` `echo node` …admit `` failed OPEN — the Class B backtick root.
        if (c === "`") {
            const close = cmd.indexOf("`", i + 1);
            const end = close < 0 ? n : close + 1;
            if (!building) {
                tokens.push({ value: DYNAMIC_COMMAND_WORD, startsSegment: atSegmentStart, start: i });
                atSegmentStart = false;
            }
            i = end;
            continue;
        }
        // Command separators and grouping that OPEN a new command context. After any of these, the next
        // word is the first command of a segment. `(` opens a subshell whose first command is still
        // evaluated — so `( node …admit )` is recognized. `;` `&` `|` `\n` separate segments; `)` closes.
        if (c === "(" || c === ")" || c === ";" || c === "&" || c === "|") {
            flush();
            atSegmentStart = true;
            i += 1;
            continue;
        }
        // A `{` / `}` brace group opens / closes a command-list context whose first command is still
        // evaluated, so `{ node …admit; }` is recognized exactly like the `( … )` subshell (round-2
        // GAP-A). A `{` is a command-context opener ONLY when it stands as its own token (followed by
        // whitespace / newline / EOF or `(`), not when it is part of a word such as `${VAR}` or a brace
        // expansion `a{b,c}`; in those cases it extends the current token. The shell itself requires the
        // `{` of a group command to be a separate word followed by a space, which this check mirrors.
        if (c === "{" && !building) {
            const next = cmd[i + 1];
            if (next === undefined || /\s/.test(next) || next === "(") {
                flush();
                atSegmentStart = true;
                i += 1;
                continue;
            }
        }
        if (c === "}" && !building) {
            const prev = cmd[i - 1];
            // A closing `}` standing as its own token (preceded by whitespace / `;` / start) closes the
            // group; otherwise it is part of a word and extends the current token.
            if (prev === undefined || /\s/.test(prev) || prev === ";") {
                flush();
                atSegmentStart = true;
                i += 1;
                continue;
            }
        }
        if (c === "\n" || c === "\r") {
            flush();
            atSegmentStart = true;
            i += 1;
            continue;
        }
        // Plain whitespace ends the current token but does NOT open a new segment (still inside the
        // same command's argument list).
        if (/\s/.test(c)) {
            flush();
            i += 1;
            continue;
        }
        // Any other character extends the current token. An inline `VAR=val` / `env VAR=val` assignment
        // PREFIX is handled in liveAdmitSegments() (the leading-run prefix-skip treats assignment tokens
        // and `env` as transparent), so the tokenizer needs no special case here.
        begin();
        cur += c;
        i += 1;
    }
    flush();
    return tokens;
}
// A command-prefix token that the shell strips before resolving the real command word: an inline
// `VAR=val` assignment, the `env` wrapper, or a command-modifier builtin (`command`/`exec`/`nice`/… —
// each runs the command that FOLLOWS it). The launcher may sit behind any number of these.
//
// Round-3 Class A: the EFFECTIVE command word is resolved over EVERY leading-run token, not only the
// final command word. An assignment is detected on the RAW token (an assignment must keep its `=` and
// is never path-formed), but `env` / a command-modifier builtin is detected on the token's EFFECTIVE
// word (basename of a path, fully de-quoted) so a PATH-FORM modifier (`/usr/bin/env`, `/usr/bin/nice`,
// `./xargs`) resolves to `env`/`nice`/`xargs` and is skipped exactly like the bare form. Previously the
// raw token was tested, so a path-form modifier escaped the prefix-skip and the trailing launcher read
// as an argument (the Class A root). The token is already de-quoted by the tokenizer; we basename it
// here so resolution — not a raw-spelling anchor — is the boundary (one authority over every token).
function isCommandPrefix(value) {
    // An inline `VAR=val` assignment prefix — tested on the RAW token (it keeps its `=`).
    if (/^[A-Za-z_][A-Za-z0-9_]*=/.test(value))
        return true;
    // `env` / a command-modifier builtin — tested on the EFFECTIVE word (basename + already de-quoted).
    const word = effectiveCommandWord(value);
    return word === "env" || COMMAND_MODIFIERS.has(word);
}
// Does the rest of THIS segment (from index `from`, until the next segment-leading token) carry the
// admit SHAPE — a context-io script reference followed by the `admit` verb? A quoted/commented/heredoc
// mention never produces these live tokens, so an inert mention can never match.
function segmentHasAdmitShape(tokens, from) {
    let sawScript = false;
    for (let j = from; j < tokens.length && (j === from || !tokens[j].startsSegment); j++) {
        const v = tokens[j].value;
        if (v.includes(ADMIT_SCRIPT))
            sawScript = true;
        else if (v === ADMIT_VERB && sawScript)
            return true;
    }
    return false;
}
// An env-var-indirected command word (`$X …`, `${X} …`): the real command is unknowable statically.
function isEnvIndirectedWord(value) {
    return /^\$\{?[A-Za-z_]/.test(value);
}
// Does this segment's leading run — from the unresolved command word at `from` up to the next
// segment-leading token — contain a dynamic-evaluation / indirection word (eval / sh / bash / dash /
// zsh / source / `.` / `$X`)? Used by the round-4 invert's fail-closed tail: when the resolved command
// word is an UNRESOLVED operand / wrapper / redirection that carries no LIVE admit shape, an admit
// shape hidden inside such a word's quoted body (`timeout 5 sh -c "node …admit NOTE"`) is still
// EXECUTED and must fail CLOSED — but ONLY when a dynamic-evaluation word is actually present, so an
// inert quoted / heredoc / comment mention behind a plain wrapper (`timeout 5 echo "…admit…"`,
// `timeout 5 cat <<EOF…EOF`) — where the body is never executed — is NOT over-blocked. The scan reuses
// the SAME DYNAMIC_EVAL_WORDS / isEnvIndirectedWord recognizers as the direct dynamic-eval branch; it
// does not enumerate a new grammar.
function segmentHasDynamicEvalWord(tokens, from) {
    for (let j = from; j < tokens.length && (j === from || !tokens[j].startsSegment); j++) {
        const raw = tokens[j].value;
        if (raw === DYNAMIC_COMMAND_WORD)
            continue;
        const w = effectiveCommandWord(raw);
        if (DYNAMIC_EVAL_WORDS.has(w) || isEnvIndirectedWord(raw))
            return true;
    }
    return false;
}
// For a dynamic-evaluation / indirection command word (eval / sh -c / bash -c / `$X`), the admit shape
// is typically hidden inside a quoted body the tokenizer (correctly) treats as DATA, so the live-token
// scan cannot see it. The resolver cannot evaluate the body, so it fails CLOSED: if the RAW remaining
// text of the segment carries the admit shape (a context-io reference AND the `admit` verb as a word),
// treat it as a live admit and GATE. This is a deliberately conservative RAW-text check used ONLY on
// the dynamic-eval tail — never on a normal segment — so an inert quoted mention in a non-dynamic
// command (handled by the live-token path) is unaffected. `admit` is matched as a whole word to avoid
// a substring false-positive (e.g. a path component literally named `admit`).
const RAW_ADMIT_VERB = /(^|[^A-Za-z0-9_-])admit([^A-Za-z0-9_-]|$)/;
function rawTextHasAdmitShape(text) {
    return text.includes(ADMIT_SCRIPT) && RAW_ADMIT_VERB.test(text);
}
// Return the RAW source text of the live command segment that begins at live-token index `from`,
// i.e. from the start offset of tokens[from] up to (but excluding) the next segment-leading token
// (or end of string). Used only for the dynamic-eval tail raw-text check above.
function rawSegmentText(cmd, tokens, from) {
    const start = tokens[from]?.start ?? 0;
    let end = cmd.length;
    for (let j = from + 1; j < tokens.length; j++) {
        if (tokens[j].startsSegment) {
            end = tokens[j].start;
            break;
        }
    }
    return cmd.slice(start, end);
}
// The note file a LIVE admit segment names: the admit CLI signature is
// `<launcher> <script> admit <task> <noteFile> [root]` (context-io.ts), so within the segment's live
// tokens the note file is the SECOND live token AFTER the `admit` verb token. Scans only THIS segment
// (from `from` until the next segment-leading token). Returns null when the segment does not carry the
// admit shape or the note positional is absent — the caller fails closed on a matched gated admit.
function noteFileInSegment(tokens, from) {
    let sawScript = false;
    for (let j = from; j < tokens.length && (j === from || !tokens[j].startsSegment); j++) {
        const v = tokens[j].value;
        if (v.includes(ADMIT_SCRIPT))
            sawScript = true;
        else if (v === ADMIT_VERB && sawScript) {
            // tokens[j+1] = task, tokens[j+2] = noteFile — but only if they stay within this segment.
            const taskIdx = j + 1;
            const noteIdx = j + 2;
            if (noteIdx < tokens.length &&
                !tokens[taskIdx].startsSegment &&
                !tokens[noteIdx].startsSegment) {
                const noteFile = tokens[noteIdx].value;
                return noteFile === "" ? null : noteFile;
            }
            return null; // admit shape present but no locatable note positional → fail closed upstream
        }
    }
    return null;
}
// ── ALLOWLIST prove-final-literal (round-5) ────────────────────────────────────────────────────────
//
// The inert ALLOWLIST: letters, digits, and `/ . _ - : = ,` — exactly the characters a real
// `scripts/context-io.js` / an absolute or `./` path / the `admit`/`validate`/`render` verb / a task-id
// / a note path need, NONE of which triggers a bash rewrite as a bare character. ANY other character
// (extglob `@( +( !(`, history `!`, process-sub `<(`, brace `{}`, glob `*?[`, tilde `~`, `$`, backtick,
// a future metachar) is OUTSIDE the allowlist → the token is not provably its final literal form. This
// is a POSITIVE character-class match, not a denylist — a new/exotic expansion form gates with NO code
// change because it is outside the inert set, not because it was added to a list of dangerous chars.
const FINAL_LITERAL_VALUE = /^[A-Za-z0-9/._:=,-]*$/;
// The RAW source slice of token `j`: from its start offset to the next token's start (or end of string).
// Used to catch a substitution the tokenizer consumed MID-WORD (e.g. `sc$(echo ript).js` de-quotes to a
// clean `sc.js` value, but its raw carries `$(`). The interstitial gap between two emitted tokens is only
// whitespace / separators (a `$`/backtick would itself BEGIN a token, so it lands at the next token's
// start, which this slice excludes), so the slice never imports a neighbour's metacharacter.
function tokenRawSlice(cmd, tokens, j) {
    const start = tokens[j].start;
    const end = j + 1 < tokens.length ? tokens[j + 1].start : cmd.length;
    return cmd.slice(start, end);
}
// PROVE token `j` is its final literal form (the rev-2 ALLOWLIST, not the rev-1 denylist): (1) its
// DE-QUOTED value (liveTokens already stripped balanced quotes) consists EXCLUSIVELY of the inert
// allowlist; (2) its RAW slice carries no `$` and no backtick (catching a parameter/command/arithmetic/
// process/ANSI-C substitution the tokenizer consumed mid-word, while NOT over-flagging a balanced quoted
// literal like `"admit"` whose raw has only quotes); (3) it is not the dynamic-command-word sentinel.
// Anything else is UNRESOLVABLE → the caller fails CLOSED. De-quoting happens FIRST, so a quoted-but-
// static token (`"admit"`, `scripts/'context-io'.js`) proves literal and classifies correctly.
function tokenIsFinalLiteral(tokens, j, cmd) {
    const tok = tokens[j];
    if (tok.value === DYNAMIC_COMMAND_WORD)
        return false;
    if (!FINAL_LITERAL_VALUE.test(tok.value))
        return false;
    const raw = tokenRawSlice(cmd, tokens, j);
    return !raw.includes("$") && !raw.includes("`");
}
// Resolve THIS segment's admit disposition STRUCTURALLY, applied to ANY command word — a recognized
// launcher (LAUNCHERS ∪ JS_RUNNERS) or an unrecognized command word (cp/tar/git, or a shebang script) —
// never the literal substring. `behindFeeder` marks that the command word was reached behind a
// STDIN_ARGV_FEEDER. A script/verb token the hook cannot PROVE is an inert final literal is gate-or-
// stricter; we prove inertness via the allowlist, never enumerate what expands.
// The disposition of a recognized launcher (LAUNCHERS ∪ JS_RUNNERS) at `launcherIdx`: RULE 1 (position-
// free literal-context-io → verb check) then RULE 2 (hidden script: direct-runner script pin vs
// forwarding-runner any-unresolvable), then the stdin-feeder fallback.
function launcherDisposition(tokens, launcherIdx, cmd, behindFeeder) {
    const word = effectiveCommandWord(tokens[launcherIdx].value);
    // RULE 1 (POSITION-FREE — matches the committed whole-segment behavior, closing the rev-1 npx-flag
    // regression): scan the post-launcher argv for the FIRST final-literal token whose de-quoted value
    // contains the context-io script name, regardless of any value-consuming flag in front of it. Classify
    // the immediately-following verb token.
    for (let j = launcherIdx + 1; j < tokens.length && !tokens[j].startsSegment; j++) {
        if (tokenIsFinalLiteral(tokens, j, cmd) && tokens[j].value.includes(ADMIT_SCRIPT)) {
            const verbIdx = j + 1;
            if (verbIdx >= tokens.length || tokens[verbIdx].startsSegment)
                return { kind: "none" };
            if (!tokenIsFinalLiteral(tokens, verbIdx, cmd))
                return { kind: "unresolvable" };
            if (tokens[verbIdx].value === ADMIT_VERB) {
                return { kind: "admit", noteFile: noteFileInSegment(tokens, launcherIdx + 1) };
            }
            return { kind: "none" }; // a final-literal non-admit verb (validate / render) → ALLOW
        }
    }
    // RULE 2 (no final-literal context-io found → a HIDDEN script).
    if (word === "npx" || JS_RUNNERS.has(word)) {
        // FORWARDING runner: it forwards to a runner + script at a deep / variable position, so ANY
        // unresolvable token in the post-launcher argv fails closed (the disclosed bounded over-block:
        // `npx vitest run $FILE` / `bun app.js $ARG` gate while governance is active).
        for (let j = launcherIdx + 1; j < tokens.length && !tokens[j].startsSegment; j++) {
            if (!tokenIsFinalLiteral(tokens, j, cmd))
                return { kind: "unresolvable" };
        }
    }
    else if (DIRECT_RUNNERS.has(word)) {
        // DIRECT runner: pin the script = the first positional after a value-flag-arity skip, and gate only
        // if THAT script is unresolvable. A trailing dynamic ARG after a literal script is ignored (`node
        // build $HOME/out` allows).
        let j = launcherIdx + 1;
        while (j < tokens.length && !tokens[j].startsSegment && tokens[j].value.startsWith("-")) {
            j += VALUE_FLAGS.has(tokens[j].value) ? 2 : 1; // skip a value-flag AND its separate-word value
        }
        if (j < tokens.length && !tokens[j].startsSegment && !tokenIsFinalLiteral(tokens, j, cmd)) {
            return { kind: "unresolvable" };
        }
        // a literal non-context-io script (or no positional) → not an admit.
    }
    // A launcher behind a stdin feeder with no resolvable script: the admit args arrive on stdin (the hook
    // cannot see them). Gate only when the raw command text carries the admit shape, so a benign
    // `echo build | xargs node` stays ALLOW while `echo "<ctx> admit …" | xargs node` fails closed.
    if (behindFeeder && rawTextHasAdmitShape(cmd))
        return { kind: "unresolvable" };
    return { kind: "none" };
}
// Does the segment from `from` carry a STRUCTURAL admit shape — adjacent positional tokens (Ti, Ti+1)
// where [Ti final-literal-context-io OR Ti not final-literal] AND [Ti+1 final-literal-admit OR Ti+1 not
// final-literal] AND at least one CONCRETE literal anchor (Ti literally context-io OR Ti+1 literally
// admit)? Used by the Class B branch (a `$( … )`/backtick command word) so a glob/rewrite-obfuscated
// script behind a dynamic launcher (`$(echo node) scripts/context-i*.js admit`) is caught structurally,
// not only the literal `segmentHasAdmitShape` substring (BLOCKER-2 — structural detection on ANY command
// word). The anchor bound keeps `$(echo hi) ls` (no concrete admit/context-io literal) from over-blocking.
function segmentHasStructuralAdmitShape(tokens, from, cmd) {
    for (let j = from; j + 1 < tokens.length && (j === from || !tokens[j].startsSegment); j++) {
        if (tokens[j + 1].startsSegment)
            break;
        const tiLiteral = tokenIsFinalLiteral(tokens, j, cmd);
        const ti1Literal = tokenIsFinalLiteral(tokens, j + 1, cmd);
        const tiCtx = tiLiteral && tokens[j].value.includes(ADMIT_SCRIPT);
        const ti1Admit = ti1Literal && tokens[j + 1].value === ADMIT_VERB;
        const tiOk = tiCtx || !tiLiteral;
        const ti1Ok = ti1Admit || !ti1Literal;
        if (tiOk && ti1Ok && (tiCtx || ti1Admit))
            return true;
    }
    return false;
}
// An admit hidden inside an EXECUTED quoted eval body (`sh -c "node scripts/context-i*.js admit NOTE"`)
// is DATA to the live-token walk, so the literal rawTextHasAdmitShape (which needs the literal
// `context-io` substring) misses a glob/rewrite-obfuscated script inside it. Re-run the ONE tokenizer on
// the de-quoted body text and apply the structural shape scan, so a glob/param/cmd-sub context-io inside
// an sh -c / eval / $X body gates too. (extglob `@(` inside a body still fragments the token at `(` in
// the byte-frozen tokenizer — a disclosed residual, see 25-08-SUMMARY.) Reuses liveTokens — no new walk.
function rawBodyHasStructuralAdmitShape(text) {
    const unquoted = text.replace(/['"]/g, " "); // de-quote so the executed body becomes live tokens
    const toks = liveTokens(unquoted);
    for (let k = 0; k < toks.length; k++) {
        if (k === 0 || toks[k].startsSegment) {
            if (segmentHasStructuralAdmitShape(toks, k, unquoted))
                return true;
        }
    }
    return false;
}
function segmentAdmitDisposition(tokens, cmdIdx, cmd, behindFeeder) {
    const word = effectiveCommandWord(tokens[cmdIdx].value);
    if (LAUNCHERS.has(word) || JS_RUNNERS.has(word)) {
        return launcherDisposition(tokens, cmdIdx, cmd, behindFeeder);
    }
    // UNRECOGNIZED command word. A launcher can still be BURIED in this segment's leading run behind a
    // wrapper / modifier-operand / redirection the resolver stopped at (`timeout 5 node …`, `sudo node …`,
    // `>/dev/null node …`), and its script may itself be rewritten (extglob `context-i@(o).js` splits the
    // token at `(`, glob, a command substitution). Evaluate a buried launcher's disposition and use it
    // only when it resolves to admit / unresolvable, so a wrapped NON-admit launcher (`timeout 5 node
    // build`) is not over-blocked. This generalizes the round-4 unresolved-tail invert to a launcher whose
    // SCRIPT is unresolvable, not only to a literal admit shape.
    for (let j = cmdIdx + 1; j < tokens.length && !tokens[j].startsSegment; j++) {
        const w = effectiveCommandWord(tokens[j].value);
        if (LAUNCHERS.has(w) || JS_RUNNERS.has(w)) {
            const d = launcherDisposition(tokens, j, cmd, behindFeeder);
            if (d.kind !== "none")
                return d;
        }
    }
    // The concrete-anchor structural scan. The command word ITSELF is a Ti candidate (the shebang case
    // `scripts/context-io.js admit …`). Gate when adjacent positional tokens (Ti, Ti+1) satisfy [Ti final-
    // literal-context-io OR Ti not final-literal] AND [Ti+1 final-literal-admit OR Ti+1 not final-literal]
    // AND at least one CONCRETE literal anchor (so `cp $A $B` — both unresolvable, no anchor — stays
    // ALLOW; the disclosed `qjs $S $V` unknown-runtime residual too).
    for (let j = cmdIdx; j + 1 < tokens.length && (j === cmdIdx || !tokens[j].startsSegment); j++) {
        if (tokens[j + 1].startsSegment)
            break;
        const tiLiteral = tokenIsFinalLiteral(tokens, j, cmd);
        const ti1Literal = tokenIsFinalLiteral(tokens, j + 1, cmd);
        const tiCtx = tiLiteral && tokens[j].value.includes(ADMIT_SCRIPT);
        const ti1Admit = ti1Literal && tokens[j + 1].value === ADMIT_VERB;
        const tiOk = tiCtx || !tiLiteral;
        const ti1Ok = ti1Admit || !ti1Literal;
        const anchor = tiCtx || ti1Admit;
        if (tiOk && ti1Ok && anchor) {
            if (tiCtx && ti1Admit) {
                return { kind: "admit", noteFile: noteFileInSegment(tokens, j) };
            }
            return { kind: "unresolvable" };
        }
    }
    return { kind: "none" };
}
// THE ONE command-resolution + classification authority (round-3 UNIFY). A single walk over the live
// tokens yields EVERY live admit segment — replacing both the launcher-membership matcher and the
// separate naive note-file walk that diverged (the disease behind Classes A/B/E). For each command
// segment we resolve the EFFECTIVE command word over EVERY leading-run token (skip assignment / `env` /
// command-modifier-builtin prefixes, each resolved by basename + de-quote so a PATH-FORM modifier is
// skipped too — Class A), then classify the segment's command word:
//   - a launcher (node | npx | tsx | nodejs) carrying the admit shape → a live, resolvable admit
//     segment; its note file is the second live token after the admit verb;
//   - a dynamic-evaluation / indirection word (eval / sh -c / bash -c / `$X`) OR a command-substitution
//     `$( … )` / backtick command word (the synthetic DYNAMIC_COMMAND_WORD token — Class B) carrying the
//     admit shape → an UNRESOLVABLE live admit segment (the command word is statically unknowable), so
//     it fails CLOSED (gate). For the eval/`$X` tail the admit shape may sit inside a quoted body the
//     tokenizer treats as DATA, so we also check the segment's RAW text.
// EVERY live admit segment is returned (not just the first), so a multi-admit command is classified
// per segment and the caller gates if ANY segment is gated (Class E). The narrow trigger is preserved:
// a dynamic / substitution command word with NO admit shape in its live segment is NOT an admit segment.
function liveAdmitSegments(cmd) {
    const tokens = liveTokens(cmd);
    const segments = [];
    for (let i = 0; i < tokens.length; i++) {
        if (!tokens[i].startsSegment)
            continue;
        // Skip an assignment / `env` / command-modifier-builtin prefix to reach the real command word.
        // isCommandPrefix resolves each leading-run token's effective word (basename + de-quote), so a
        // path-form modifier (`/usr/bin/env`/`/usr/bin/nice`/`./xargs`) is skipped like the bare form. Once
        // at least one modifier has been skipped, an option flag belonging to that modifier (`env -S …`,
        // `env -i …`, `nohup -n …`) is also skipped — a launcher / the admit script / the admit verb never
        // begins with `-`, so skipping a leading-run flag cannot swallow a real command word (Class A: the
        // `env -S node …admit` form).
        let cmdIdx = i;
        let behindFeeder = false; // reached the command word behind a STDIN_ARGV_FEEDER (xargs) → stdin argv
        while (cmdIdx < tokens.length) {
            if (cmdIdx > i && tokens[cmdIdx].startsSegment)
                break; // stay within this segment's leading run
            const v = tokens[cmdIdx].value;
            const isPrefix = isCommandPrefix(v);
            const isModifierFlag = cmdIdx > i && v.startsWith("-"); // an option to a modifier already skipped
            if (!isPrefix && !isModifierFlag)
                break;
            if (isPrefix && STDIN_ARGV_FEEDERS.has(effectiveCommandWord(v)))
                behindFeeder = true;
            cmdIdx += 1;
        }
        if (cmdIdx >= tokens.length)
            continue;
        if (cmdIdx > i && tokens[cmdIdx].startsSegment)
            continue; // crossed into a new segment
        const rawWord = tokens[cmdIdx].value;
        // Class B: a command-substitution `$( … )` / backtick command word (the synthetic dynamic token) is
        // statically unresolvable. If THIS segment carries the admit shape, it is an unresolvable live admit
        // → fail CLOSED. With no admit shape it is not an admit (narrow trigger — no over-block).
        if (rawWord === DYNAMIC_COMMAND_WORD) {
            // Round-5: detect the admit shape STRUCTURALLY too, so a glob/rewrite-obfuscated script behind a
            // dynamic launcher (`$(echo node) scripts/context-i*.js admit`) gates, not only the literal form.
            if (segmentHasAdmitShape(tokens, cmdIdx + 1) ||
                segmentHasStructuralAdmitShape(tokens, cmdIdx + 1, cmd)) {
                segments.push({ noteFile: null, unresolvable: true });
            }
            continue;
        }
        const word = effectiveCommandWord(rawWord); // basename a path; the token is already de-quoted
        // Fail-closed tail: an admit shape behind a dynamic-evaluation / indirection command word the
        // resolver cannot see through (eval / sh -c / bash -c / `$X`). The admit shape is usually inside a
        // quoted body the tokenizer treats as DATA, so we also check the RAW segment text. GATE only when
        // the admit shape is present — a plain `eval "echo hi"` / `bash -c "ls"` is NOT an admit segment.
        if (DYNAMIC_EVAL_WORDS.has(word) || isEnvIndirectedWord(rawWord)) {
            if (segmentHasAdmitShape(tokens, cmdIdx + 1) ||
                // Round-5: a glob/rewrite-obfuscated script in the LIVE argv behind a dynamic-eval/indirection
                // word (`$X scripts/context-i*.js admit`) is caught structurally; the body retokenize catches a
                // glob/param/cmd-sub admit hidden inside an EXECUTED quoted eval body; rawTextHasAdmitShape remains
                // the literal fallback for the round-4 literal-context-io eval-body form.
                segmentHasStructuralAdmitShape(tokens, cmdIdx + 1, cmd) ||
                rawBodyHasStructuralAdmitShape(rawSegmentText(cmd, tokens, cmdIdx)) ||
                rawTextHasAdmitShape(rawSegmentText(cmd, tokens, cmdIdx))) {
                segments.push({ noteFile: null, unresolvable: true });
            }
            continue;
        }
        // ── Round-4 INVERT THE DEFAULT on the unresolvable leading-run tail (SC1, sub-roots a/b/c) ──────
        //
        // The command word resolved to NONE of {launcher, the synthetic command-substitution token, a
        // dynamic-evaluation / `$X` word}. So it is a leading-run construct the resolver cannot prove
        // launches a recognized interpreter: a command-MODIFIER OPERAND the prefix-skip stopped at
        // (`timeout 5 node …` — the duration `5`; `nice -n 5 node …` — the `-n` value; `xargs -I {} node …`),
        // an UNLISTED WRAPPER not in COMMAND_MODIFIERS (`sudo`/`doas`/`setsid`/`ionice`/`chrt`/`taskset node …`),
        // or a LEADING REDIRECTION operator/target the tokenizer read as the command word (`>/dev/null node …`,
        // `2>/dev/null node …`). The pre-round-4 code silently DROPPED such a segment (the default-ALLOW hole).
        //
        // INVERT that default and fail CLOSED — exactly the posture Class B (a `$( … )`/backtick command word)
        // and the dynamic-eval tail already take — so a NEW wrapper / option-operand / redirection spelling
        // cannot escape WITHOUT a code change (no COMMAND_MODIFIERS widening, no operand/redirection grammar
        // enumeration; the gate fires structurally on the admit shape behind the unresolvable command word).
        // Two narrow, admit-shape-triggered cases (the over-block fail-safe — a non-admit wrapper has neither
        // and stays ALLOW):
        //   1. A LIVE admit shape (the `node`/`context-io`/`admit`/NOTE run survives as live tokens because
        //      the wrapper/operand/redirection sits in FRONT of it). The note positional is therefore also a
        //      live token, so classify by the note's actual severity exactly like a launcher (re-read from
        //      disk in classifySegmentOrDeny): a routine admit behind a wrapper stays ALLOW under
        //      `high-severity` (no over-block — the dial gates only high-severity roles) while a high-severity
        //      admit behind the same wrapper DENIES; under `all` every matched admission gates. When the note
        //      positional is absent, noteFileInSegment returns null and the segment fails closed downstream.
        //      (This refines the blanket fail-closed gate to a severity-classified gate so the `high-severity`
        //      dial's routine-allow contract holds — the threat is an UNAPPROVED high-severity/all admit, and
        //      the note's `by` cannot be forged downward, so reading it behind the wrapper is safe.)
        //   2. No live admit shape, BUT a dynamic-evaluation word sits in this segment's leading run after the
        //      unresolved operand AND the RAW segment text carries the admit shape (`timeout 5 sh -c
        //      "node …admit NOTE"` — the admit hidden inside an EXECUTED quoted body the tokenizer treats as
        //      data). The note is unreadable, so fail CLOSED (unresolvable). An inert quoted/heredoc/comment
        //      mention behind a non-eval wrapper has no dynamic-eval word and stays ALLOW.
        //
        // Round-5: the admit-SHAPE detection is now STRUCTURAL via the ONE segmentAdmitDisposition — applied
        // to ANY command word (a recognized launcher RULE 1/RULE 2, or this unrecognized command word's
        // concrete-anchor scan / the shebang case), never the literal `segmentHasAdmitShape` substring. A
        // script/verb token the hook cannot prove is an inert final literal is unresolvable → fail CLOSED, so
        // glob / param / cmd-sub / extglob / a JS runner / a hidden script gate WITHOUT enumerating spellings.
        const disp = segmentAdmitDisposition(tokens, cmdIdx, cmd, behindFeeder);
        if (disp.kind === "admit") {
            segments.push({ noteFile: disp.noteFile, unresolvable: false });
        }
        else if (disp.kind === "unresolvable") {
            segments.push({ noteFile: null, unresolvable: true });
        }
        else if (
        // PRESERVE the round-4 dynamic-eval tail: no live admit shape, but a dynamic-evaluation word in the
        // leading run AND the RAW segment text carries the admit shape (`timeout 5 sh -c "node …admit NOTE"`
        // — the admit hidden inside an EXECUTED quoted body the tokenizer treats as data). Fail CLOSED. An
        // inert quoted/heredoc/comment mention behind a non-eval wrapper has no dynamic-eval word → ALLOW.
        segmentHasDynamicEvalWord(tokens, cmdIdx) &&
            rawTextHasAdmitShape(rawSegmentText(cmd, tokens, cmdIdx))) {
            segments.push({ noteFile: null, unresolvable: true });
        }
    }
    return segments;
}
// Does ANY live segment of the command carry the admit SHAPE (a context-io script reference followed
// by the `admit` verb), regardless of whether a launcher word was recognized? This is the GAP-B
// backstop input: the refuse-self-set (D-01) floor must hold even on a matcher false-negative, so the
// self-set check is evaluated whenever a self-set co-occurs with a live admit shape — independent of
// launcher recognition. It is still SHAPE-scoped (a live script+verb run, never an inert quoted/heredoc/
// comment mention), so a benign self-set with no admit attempt (`export VAR=x && ls`) is not affected.
function commandHasLiveAdmitShape(cmd) {
    // Round-5: derive from the ONE structural authority, so the D-01 floor holds even behind a rewrite the
    // literal segmentHasAdmitShape would miss (a glob `node scripts/context-i*.js admit` self-set resolves
    // to an unresolvable admit segment here → the floor fires). A benign self-set with no admit attempt
    // (`export VAR=x && ls`) yields no admit segment → the floor does not over-block.
    return liveAdmitSegments(cmd).length > 0;
}
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
// Read and parse stdin. Fail CLOSED on the parse: if input cannot be read or parsed, treat the
// command as empty. An empty command matches no admit invocation and is allowed, so a malformed
// payload can never crash-allow a real admission — a matched admit must arrive as well-formed
// JSON to be evaluated, and that path is gated below.
let cmd = "";
try {
    const raw = readFileSync(0, "utf8");
    const input = JSON.parse(raw);
    cmd = (input?.tool_input?.command ?? "");
    if (typeof cmd !== "string")
        cmd = "";
}
catch {
    cmd = ""; // malformed / empty stdin → no command → nothing to gate.
}
// D-01 refuse-self-set FLOOR — evaluated INDEPENDENT of / IN FRONT of the matcher early-exit (round-2
// GAP-B). The agent must never grant its own admission, and that floor must hold even when the matcher
// would NOT recognize the launcher (a matcher false-negative must not reopen the floor). So the
// self-set check fires whenever an inline set/export of the approval var co-occurs with a LIVE admit
// shape — regardless of whether the launcher word resolved to a recognized interpreter. It is still
// admit-shape-scoped (a live script+verb run, never an inert quoted/heredoc/comment mention and never a
// benign self-set with no admit attempt), so it does not over-block. The set is denied EVEN IF the var
// is already present in the environment — this is the entire reason the gate is a separate hook process
// reading the human-set SESSION env, not an in-script check.
if (SELF_APPROVE.test(cmd) && commandHasLiveAdmitShape(cmd)) {
    deny(`Refused: an agent may not set or export ${APPROVAL}. ` +
        `Admission of a governance entry must be authorized by a human who exports ${APPROVAL}=NAME ` +
        `in the shell that launches Claude — it cannot be set inside the command.`);
}
// Resolve EVERY live admit segment through the ONE command-resolution authority (round-3 UNIFY). An
// empty result means the command is not an admit invocation — nothing to gate. This includes
// empty/malformed stdin (cmd=""), a non-admit command (ls, render), and any command that merely
// MENTIONS admit text without being a real `node …context-io admit …` call (e.g.
// `echo 'node context-io.js admit …'`, `cat doc.md`). The guard's only input is the command verb,
// never file content. The refuse-self-set floor above already fired for any self-set co-occurring
// with a live admit shape.
const admitSegments = liveAdmitSegments(cmd);
if (admitSegments.length === 0) {
    process.exit(0);
}
// The command IS a matched admit (one or more live admit segments). From here, any later failure on a
// gated admission denies. Class E: a multi-admit command is classified PER SEGMENT below, and the
// command gates if ANY live admit segment resolves to a gated severity — not just the first.
// Read the dial via the richer discriminated read (Plan 25-01 reader; 25-04 result wrapper). The
// hook — the un-forgeable tier — must FAIL CLOSED on a corrupt config, so it distinguishes a
// genuinely ABSENT config (stay lean → allow routine) from a present-but-UNREADABLE one (deny). The
// value reader (readGovernanceConfig) keeps its default-on-absent contract; this hook consumes the
// richer result instead. The try/catch is belt-and-suspenders — the reader does not throw — but a
// throw on a matched admit must also fail closed.
let dial;
let configSource;
try {
    // ${CLAUDE_PROJECT_DIR} is the documented hook project root (CLAUDE.md). When unset, the reader
    // falls back to its own repo root.
    const projectDir = process.env.CLAUDE_PROJECT_DIR;
    const result = readGovernanceConfigResult(projectDir);
    dial = result.config.human_admission;
    configSource = result.source;
}
catch {
    deny(`Admission blocked (fail-closed): the governance configuration could not be read while ` +
        `evaluating an admission. A human must resolve the configuration, or export ${APPROVAL}=NAME ` +
        `to authorize this admission explicitly.`);
}
// Fail CLOSED on a present-but-unreadable (corrupt / non-JSON) config: a matched admit is denied
// pending a human, never crash-allowed. A genuinely ABSENT config is NOT a read failure — it is the
// zero-config lean default, so it falls through to the dial logic below (which allows routine).
if (configSource === "unreadable") {
    deny(`Admission blocked (fail-closed): the governance configuration exists but could not be parsed ` +
        `(corrupt or non-JSON) while evaluating an admission. The hook treats an unreadable governance ` +
        `config as gate-or-stricter. A human must repair the configuration, or export ${APPROVAL}=NAME ` +
        `to authorize this admission explicitly.`);
}
// Canonicalize the dial fail-CLOSED. The ONLY value that does NOT gate is EXACTLY "off". Every other
// human_admission value — a typo, garbage, a case variant, trailing whitespace, an empty string — is
// treated as gate-or-stricter, never off-equivalent, so a typo can never open a hole (SC3). This is
// the un-dialable-floor guarantee at the un-forgeable tier: the dials only TIGHTEN.
//   - "off"           → no human stop (lean / explicit off). Nothing to gate.
//   - "high-severity" → gate only the three high-severity authoring roles.
//   - "all"           → gate EVERY matched admission.
//   - anything else   → gate EVERY matched admission (conservative: a non-canonical value never
//                       under-gates, so an unrecognized dial is at least as strict as `all`).
if (dial === "off") {
    process.exit(0);
}
const gateEveryMatch = dial !== "high-severity"; // "all" OR any non-canonical value → gate all
// Whether the human stamp is present in the hook's OWN process env (the un-forgeable session export).
// When present, a gated admission is authorized; when absent, a gated admission denies.
const approved = Boolean(process.env[APPROVAL]);
// Classify ONE live admit segment under the active dial and deny if it is gated and unapproved. Each
// segment is classified independently so a multi-admit command gates if ANY segment is gated (Class E):
// the first gated, unapproved segment denies the whole command; a routine segment under `high-severity`
// is not gated and is skipped (no over-block of a routine-only multi-admit). An unresolvable segment
// (Class B `$()`/backtick command word, or the eval/`$X` tail) has no readable note, so it fails CLOSED
// under any active dial. A resolvable segment re-reads its note from disk and classifies severity by the
// authoring role `by` (round-2 GAP-D case-insensitive); any read/parse failure on a gated admit denies.
function classifySegmentOrDeny(seg) {
    // Unresolvable command word (Class B substitution / the eval/`$X` tail): the note is unknowable, so
    // fail CLOSED under any active dial regardless of whether this specific note would be high-severity.
    if (seg.unresolvable) {
        if (!approved) {
            deny(`Admission blocked (fail-closed): an admission was launched behind a command word the hook ` +
                `cannot statically resolve (a command substitution "$( … )"/backtick or a dynamic-evaluation ` +
                `wrapper) while governance is active (human_admission="${dial}"). The hook cannot read the ` +
                `note to classify it, so it treats this admission as gate-or-stricter. A human must review ` +
                `this admission, or export ${APPROVAL}=NAME to authorize it.`);
        }
        return; // approved → this segment is authorized; continue to the next
    }
    const noteFile = seg.noteFile;
    if (noteFile === null) {
        deny(`Admission blocked (fail-closed): could not determine the note file from the admit command ` +
            `while governance is active (human_admission="${dial}"). A human must review this admission, ` +
            `or export ${APPROVAL}=NAME to authorize it.`);
    }
    let by = "";
    try {
        const text = readFileSync(noteFile, "utf8");
        const parsed = parseNote(text);
        if (parsed === null) {
            deny(`Admission blocked (fail-closed): the note "${noteFile}" has no parsable frontmatter while ` +
                `governance is active (human_admission="${dial}"). A human must review this admission, ` +
                `or export ${APPROVAL}=NAME to authorize it.`);
        }
        // Class F — the hook's note read must be CONSISTENT with admit()'s validate() (D-06): a note whose
        // provenance `by` is structurally invalid must NOT be read last-wins-to-routine and slipped through.
        // parseNote keeps the LAST `by` (overwrite) in scalars.by for backward-compatible reads, but it
        // RECORDS a duplicate `by` in duplicateKeys and an indented / `key : value` ` by:` line in
        // malformedLines (projecting it to empty) — exactly the two shapes validate() (context-io.ts:542-557)
        // rejects as a structural FAIL. The hook consults those SAME signals so the un-forgeable hook tier
        // and the in-script admit() tier classify the identical note identically; a `by` the hook cannot read
        // consistently with validate() is gate-or-stricter, never a silent routine ALLOW. We scope to the
        // provenance `by` specifically (not validate()'s full required-field set) so the hook's note re-read —
        // which only needs `by` to classify severity — does not over-reach. The trigger is still admit-shape-
        // scoped (this is a LIVE matched admit's re-read note), so an inert duplicate-`by` mention is
        // unaffected. context-io.ts is UNCHANGED — this reuses the exported parseNote's recorded signals.
        const hasDuplicateBy = parsed.duplicateKeys.includes("by");
        const hasMalformedBy = parsed.malformedLines.some((line) => {
            const m = line.match(/^\s*([A-Za-z_]+)\s*:/);
            return m !== null && m[1] === "by";
        });
        if (hasDuplicateBy || hasMalformedBy) {
            deny(`Admission blocked (fail-closed): the note "${noteFile}" has a structurally invalid authoring ` +
                `role — a ${hasDuplicateBy ? "duplicate" : "malformed (indented or \"key : value\")"} "by" ` +
                `line that validate() rejects — while governance is active (human_admission="${dial}"). The ` +
                `hook classifies a note consistently with admit()'s validate(): a "by" it cannot read ` +
                `unambiguously is gate-or-stricter, never read last-wins. A human must review this admission, ` +
                `or export ${APPROVAL}=NAME to authorize it.`);
        }
        by = (parsed.scalars.by ?? "").trim();
        if (by === "") {
            deny(`Admission blocked (fail-closed): the note "${noteFile}" has no authoring role ("by") while ` +
                `governance is active (human_admission="${dial}"). A human must review this admission, ` +
                `or export ${APPROVAL}=NAME to authorize it.`);
        }
    }
    catch {
        deny(`Admission blocked (fail-closed): the note "${noteFile}" could not be read while governance is ` +
            `active (human_admission="${dial}"). A human must review this admission, ` +
            `or export ${APPROVAL}=NAME to authorize it.`);
    }
    // Is THIS admission gated by the dial?
    //   - gateEveryMatch (set for "all" AND for any non-canonical value): every matched admission
    //     requires the human stamp.
    //   - "high-severity" (the only other non-off value): only the three high-severity authoring roles.
    // Case-INSENSITIVE high-severity classification (round-2 GAP-D): the role constants are lowercase and
    // validate() accepts any non-empty `by`, so a case-variant `by` (`Security-NFR`, `SECURITY-NFR`) must
    // still classify high-severity — otherwise the `high-severity` dial is escapable by casing. We
    // lowercase the trimmed `by` for the membership test only; the original `by` is preserved for the
    // deny message.
    const isHighSeverity = HIGH_SEVERITY_ROLES.has(by.toLowerCase());
    const isGated = gateEveryMatch || isHighSeverity;
    if (isGated && !approved) {
        const disposition = gateEveryMatch
            ? `Governance requires a named human disposition for every admission under the active setting ` +
                `(human_admission="${dial}").`
            : `This is a high-severity admission (by: ${by}); a high-severity governance entry requires a named human disposition.`;
        deny(`Admission blocked: humans decide, agents execute. ${disposition} ` +
            `The note "${noteFile}" cannot be admitted until a human exports ${APPROVAL}=NAME in the shell ` +
            `that launches Claude, then re-runs the admission. The agent must not set ${APPROVAL} itself.`);
    }
    // This segment is not gated (routine under high-severity) or the human stamp is present → authorized.
}
// Class E: classify EVERY live admit segment; the command gates if ANY segment is gated and unapproved.
// classifySegmentOrDeny denies (and exits) on the first gated, unapproved segment, so a high-severity
// segment shielded behind a routine admit is still caught regardless of position.
for (const seg of admitSegments) {
    classifySegmentOrDeny(seg);
}
// Allow: no live admit segment was gated-and-unapproved (every segment routine under high-severity, or
// off, or the human stamp is present).
process.exit(0);

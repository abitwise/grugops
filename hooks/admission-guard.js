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
        // Command separators and grouping that OPEN a new command context. After any of these, the next
        // word is the first command of a segment. `(` and `$(` open a subshell / command substitution
        // whose first command is still evaluated — so `( node …admit )` is recognized.
        // `;` `&` `|` `\n` separate segments; `)` closes a group.
        if (c === "$" && cmd[i + 1] === "(") {
            flush();
            atSegmentStart = true;
            i += 2;
            continue;
        }
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
        // PREFIX is handled in isAdmitInvocation() (the launcher scan treats assignment tokens and `env`
        // as transparent), so the tokenizer needs no special case here.
        begin();
        cur += c;
        i += 1;
    }
    flush();
    return tokens;
}
// A command-prefix token that the shell strips before resolving the real command word: an inline
// `VAR=val` assignment, the `env` wrapper, or a command-modifier builtin (`command`/`exec`/`nice`/… —
// each runs the command that FOLLOWS it). The launcher may sit behind any number of these (round-2
// GAP-A: the prior version skipped only `env`/`VAR=`, so `command node …` / `nice node …` escaped).
function isCommandPrefix(value) {
    return (value === "env" ||
        COMMAND_MODIFIERS.has(value) ||
        /^[A-Za-z_][A-Za-z0-9_]*=/.test(value));
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
// Returns true only when a LIVE command segment is a real admit launch — OR an admit-shape behind a
// command word the resolver cannot statically resolve to a definitely-non-launcher (the round-2 GAP-A
// fail-closed tail). For each command segment we skip the assignment / `env` / command-modifier-builtin
// prefix to find the EFFECTIVE command word (basename of a path; fully de-quoted by the tokenizer). If
// the effective word is a launcher (node | npx | tsx | nodejs) AND the same segment carries the admit
// shape → live admit. If instead the effective word is a dynamic-evaluation / indirection construct
// (eval / sh -c / bash -c / `$X`-indirected) AND the segment STILL carries the admit shape → the gate
// fails CLOSED (treat as a live admit to be gated). The dynamic-tail trigger is NARROW: it requires the
// admit shape in the live segment, so a plain `eval "echo hi"` / `bash -c "ls"` with no admit reference
// is not gated. ONE command-resolution authority, not a growing launcher-spelling list.
function isAdmitInvocation(cmd) {
    const tokens = liveTokens(cmd);
    for (let i = 0; i < tokens.length; i++) {
        if (!tokens[i].startsSegment)
            continue;
        // Skip an assignment / `env` / command-modifier-builtin prefix to reach the real command word.
        let cmdIdx = i;
        while (cmdIdx < tokens.length && isCommandPrefix(tokens[cmdIdx].value)) {
            // Only continue skipping while we stay within this segment's leading run.
            if (cmdIdx > i && tokens[cmdIdx].startsSegment)
                break;
            cmdIdx += 1;
        }
        if (cmdIdx >= tokens.length)
            continue;
        if (cmdIdx > i && tokens[cmdIdx].startsSegment)
            continue; // crossed into a new segment
        const rawWord = tokens[cmdIdx].value;
        const word = effectiveCommandWord(rawWord); // basename a path; the token is already de-quoted
        if (LAUNCHERS.has(word)) {
            if (segmentHasAdmitShape(tokens, cmdIdx + 1))
                return true;
            continue;
        }
        // Fail-closed tail: an admit shape behind a dynamic-evaluation / indirection command word the
        // resolver cannot see through (eval / sh -c / bash -c / `$X`). The admit shape is usually inside a
        // quoted body the tokenizer treats as DATA, so we check the RAW segment text (live-token scan would
        // miss it). GATE only when the admit shape (a context-io reference AND the `admit` verb) is present
        // in this segment — a plain `eval "echo hi"` / `bash -c "ls"` with no admit reference is NOT gated.
        if (DYNAMIC_EVAL_WORDS.has(word) || isEnvIndirectedWord(rawWord)) {
            if (segmentHasAdmitShape(tokens, cmdIdx + 1) ||
                rawTextHasAdmitShape(rawSegmentText(cmd, tokens, cmdIdx))) {
                return true;
            }
        }
    }
    return false;
}
// Does ANY live segment of the command carry the admit SHAPE (a context-io script reference followed
// by the `admit` verb), regardless of whether a launcher word was recognized? This is the GAP-B
// backstop input: the refuse-self-set (D-01) floor must hold even on a matcher false-negative, so the
// self-set check is evaluated whenever a self-set co-occurs with a live admit shape — independent of
// launcher recognition. It is still SHAPE-scoped (a live script+verb run, never an inert quoted/heredoc/
// comment mention), so a benign self-set with no admit attempt (`export VAR=x && ls`) is not affected.
function commandHasLiveAdmitShape(cmd) {
    const tokens = liveTokens(cmd);
    for (let i = 0; i < tokens.length; i++) {
        if (!tokens[i].startsSegment)
            continue;
        if (segmentHasAdmitShape(tokens, i))
            return true;
    }
    return false;
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
// Tokenize a shell command into whitespace-separated argv-like tokens, stripping a single layer
// of surrounding quotes from each token. This is intentionally simple: it is only used to find
// the positional note-file argument AFTER the verb has already matched ADMIT_VERB. It does not
// attempt full shell parsing — it does not need to, because a failure to locate the note file on
// a matched gated admit fails CLOSED below (deny), never crash-allows.
function tokenize(cmd) {
    const tokens = cmd.match(/"[^"]*"|'[^']*'|[^\s]+/g) ?? [];
    return tokens.map((t) => t.replace(/^['"]|['"]$/g, ""));
}
// Extract the note-file path from a matched admit invocation. The admit CLI signature is
// `context-io.js admit <task> <noteFile> [contextRoot]` (context-io.ts:1051-1060), so the note
// file is the SECOND positional after the `admit` verb (rest[1]). Returns null when it cannot be
// located — the caller fails closed on a matched gated admit.
function noteFileFromCommand(cmd) {
    const tokens = tokenize(cmd);
    const admitIdx = tokens.findIndex((t) => t === "admit");
    if (admitIdx < 0)
        return null;
    // tokens[admitIdx+1] = task, tokens[admitIdx+2] = noteFile.
    const noteFile = tokens[admitIdx + 2];
    if (noteFile === undefined || noteFile === "")
        return null;
    return noteFile;
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
// Not an admit invocation → nothing to gate. This includes empty/malformed stdin (cmd=""), a
// non-admit command (ls, render), and any command that merely MENTIONS admit text without being
// a real `node …context-io admit …` call (e.g. `echo 'node context-io.js admit …'`,
// `cat doc.md`). The guard's only input is the command verb, never file content. The refuse-self-set
// floor above already fired for any self-set co-occurring with a live admit shape.
if (!isAdmitInvocation(cmd)) {
    process.exit(0);
}
// The command IS a matched admit. From here, any later failure on a gated admission denies.
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
// Locate and re-read the named note file to classify severity by its authoring role `by`. Fail
// CLOSED: an unreadable note or an unparsable `by` on a matched admit denies (never crash-allow).
const noteFile = noteFileFromCommand(cmd);
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
// still classify high-severity — otherwise the `high-severity` dial is escapable by casing. We lowercase
// the trimmed `by` for the membership test only; the original `by` is preserved for the deny message.
const isHighSeverity = HIGH_SEVERITY_ROLES.has(by.toLowerCase());
const isGated = gateEveryMatch || isHighSeverity;
if (isGated && !process.env[APPROVAL]) {
    const disposition = gateEveryMatch
        ? `Governance requires a named human disposition for every admission under the active setting ` +
            `(human_admission="${dial}").`
        : `This is a high-severity admission (by: ${by}); a high-severity governance entry requires a named human disposition.`;
    deny(`Admission blocked: humans decide, agents execute. ${disposition} ` +
        `The note "${noteFile}" cannot be admitted until a human exports ${APPROVAL}=NAME in the shell ` +
        `that launches Claude, then re-runs the admission. The agent must not set ${APPROVAL} itself.`);
}
// Allow: not gated (routine role under high-severity, or off), or the human stamp is present.
process.exit(0);

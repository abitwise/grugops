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
const LAUNCHERS = new Set(["node", "npx", "tsx"]);

// A LIVE token produced by the walk, with the structural role the parser assigned it. Quoted,
// commented, and heredoc-body text never becomes a live token — it is dropped as data.
interface LiveToken {
  value: string; // the token text with one layer of surrounding quotes already stripped
  startsSegment: boolean; // true when this token is the FIRST command of a (sub)command segment
}

// Walk the command string ONCE, honoring the shell quoting / comment / continuation / heredoc /
// segment-separator grammar, and return the LIVE tokens (the words the shell would actually run),
// each flagged with whether it begins a command segment. Anything inside quotes, after `#`, or
// within a heredoc body is data and is never emitted as a live token. This is intentionally a
// recognizer for the constructs that matter to the gate (it does not evaluate the command); a
// failure to recognize a launcher fails CLOSED downstream on a matched gated admit.
function liveTokens(cmd: string): LiveToken[] {
  const tokens: LiveToken[] = [];
  const heredocDelims: string[] = []; // pending heredoc terminators, in declaration order
  let i = 0;
  const n = cmd.length;
  // A segment starts at the very beginning and after every command separator / opening grouping.
  // The first non-space token after such a boundary is the segment's command.
  let atSegmentStart = true;
  let cur = ""; // the token being accumulated
  let curStartsSegment = false;
  let building = false; // true once cur has begun accumulating a token

  const flush = (): void => {
    if (building) {
      // Strip one layer of matching surrounding quotes (already-literal inner content is kept).
      const stripped = cur.replace(/^(['"])([\s\S]*)\1$/, "$2");
      tokens.push({ value: stripped, startsSegment: curStartsSegment });
      cur = "";
      building = false;
    }
  };
  const begin = (): void => {
    if (!building) {
      building = true;
      curStartsSegment = atSegmentStart;
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
      const delim = heredocDelims.shift() as string;
      while (i < n) {
        let lineEnd = cmd.indexOf("\n", i);
        if (lineEnd < 0) lineEnd = n;
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
      if (lineEnd < 0) lineEnd = n;
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
      if (cmd[i + 1] === "\n") { i += 2; continue; }
      if (cmd[i + 1] === "\r" && cmd[i + 2] === "\n") { i += 3; continue; }
      if (i + 1 < n) { begin(); cur += cmd[i + 1]; i += 2; continue; }
      i += 1;
      continue;
    }

    // Heredoc redirection operator: `<<WORD`, `<<-WORD`, `<<'WORD'`/`<<"WORD"`. Record the
    // terminator; the BODY (consumed after the next newline) is data. The operator itself is not a
    // token we care about, but we keep walking the rest of the redirection line normally.
    if (c === "<" && cmd[i + 1] === "<") {
      flush();
      let j = i + 2;
      if (cmd[j] === "-") j += 1;
      while (j < n && /\s/.test(cmd[j] as string) && cmd[j] !== "\n") j += 1;
      let delim = "";
      if (cmd[j] === "'" || cmd[j] === '"') {
        const q = cmd[j] as string;
        const close = cmd.indexOf(q, j + 1);
        const end = close < 0 ? n : close;
        delim = cmd.slice(j + 1, end);
        j = close < 0 ? n : close + 1;
      } else {
        const m = /^[A-Za-z0-9_]+/.exec(cmd.slice(j));
        delim = m ? m[0] : "";
        j += delim.length;
      }
      if (delim !== "") heredocDelims.push(delim);
      i = j;
      continue;
    }

    // Command separators and grouping that OPEN a new command context. After any of these, the next
    // word is the first command of a segment. `(` and `$(` open a subshell / command substitution
    // whose first command is still evaluated — so `( node …admit )` is recognized.
    // `;` `&` `|` `\n` separate segments; `)` closes a group.
    if (c === "$" && cmd[i + 1] === "(") { flush(); atSegmentStart = true; i += 2; continue; }
    if (c === "(" || c === ")" || c === ";" || c === "&" || c === "|") {
      flush();
      atSegmentStart = true;
      i += 1;
      continue;
    }
    if (c === "\n" || c === "\r") { flush(); atSegmentStart = true; i += 1; continue; }

    // Plain whitespace ends the current token but does NOT open a new segment (still inside the
    // same command's argument list).
    if (/\s/.test(c as string)) { flush(); i += 1; continue; }

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
// `VAR=val` assignment or the `env` wrapper. The launcher may sit behind any number of these.
function isCommandPrefix(value: string): boolean {
  return value === "env" || /^[A-Za-z_][A-Za-z0-9_]*=/.test(value);
}

// Returns true only when a LIVE command segment is a real admit launch. For each command segment we
// skip the assignment/`env` prefix to find the real command word; if it is a launcher (node | npx |
// tsx) we then confirm the SAME segment's remaining live tokens include a context-io script token
// followed by the `admit` verb. The `npx tsx <script>` two-token form is covered because the
// launcher is `npx` and `tsx` is simply an earlier argument before the script token. A
// quoted/commented/heredoc mention never produces these live tokens, so it can never match.
function isAdmitInvocation(cmd: string): boolean {
  const tokens = liveTokens(cmd);
  for (let i = 0; i < tokens.length; i++) {
    if (!tokens[i].startsSegment) continue;
    // Skip an assignment / `env` command prefix to reach the real command word for this segment.
    let cmdIdx = i;
    while (cmdIdx < tokens.length && isCommandPrefix(tokens[cmdIdx].value)) {
      // Only continue skipping while we stay within this segment's leading run.
      if (cmdIdx > i && tokens[cmdIdx].startsSegment) break;
      cmdIdx += 1;
    }
    if (cmdIdx >= tokens.length) continue;
    if (cmdIdx > i && tokens[cmdIdx].startsSegment) continue; // crossed into a new segment
    if (!LAUNCHERS.has(tokens[cmdIdx].value)) continue;
    // Scan the rest of THIS segment (until the next segment-leading token) for the script + verb.
    let sawScript = false;
    for (let j = cmdIdx + 1; j < tokens.length && !tokens[j].startsSegment; j++) {
      const v = tokens[j].value;
      if (v.includes(ADMIT_SCRIPT)) sawScript = true;
      else if (v === ADMIT_VERB && sawScript) return true;
    }
  }
  return false;
}

function deny(reason: string): never {
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

// Tokenize a shell command into whitespace-separated argv-like tokens, stripping a single layer
// of surrounding quotes from each token. This is intentionally simple: it is only used to find
// the positional note-file argument AFTER the verb has already matched ADMIT_VERB. It does not
// attempt full shell parsing — it does not need to, because a failure to locate the note file on
// a matched gated admit fails CLOSED below (deny), never crash-allows.
function tokenize(cmd: string): string[] {
  const tokens = cmd.match(/"[^"]*"|'[^']*'|[^\s]+/g) ?? [];
  return tokens.map((t) => t.replace(/^['"]|['"]$/g, ""));
}

// Extract the note-file path from a matched admit invocation. The admit CLI signature is
// `context-io.js admit <task> <noteFile> [contextRoot]` (context-io.ts:1051-1060), so the note
// file is the SECOND positional after the `admit` verb (rest[1]). Returns null when it cannot be
// located — the caller fails closed on a matched gated admit.
function noteFileFromCommand(cmd: string): string | null {
  const tokens = tokenize(cmd);
  const admitIdx = tokens.findIndex((t) => t === "admit");
  if (admitIdx < 0) return null;
  // tokens[admitIdx+1] = task, tokens[admitIdx+2] = noteFile.
  const noteFile = tokens[admitIdx + 2];
  if (noteFile === undefined || noteFile === "") return null;
  return noteFile;
}

// Read and parse stdin. Fail CLOSED on the parse: if input cannot be read or parsed, treat the
// command as empty. An empty command matches no admit invocation and is allowed, so a malformed
// payload can never crash-allow a real admission — a matched admit must arrive as well-formed
// JSON to be evaluated, and that path is gated below.
let cmd = "";
try {
  const raw = readFileSync(0, "utf8");
  const input = JSON.parse(raw) as { tool_input?: { command?: unknown } } | null;
  cmd = (input?.tool_input?.command ?? "") as string;
  if (typeof cmd !== "string") cmd = "";
} catch {
  cmd = ""; // malformed / empty stdin → no command → nothing to gate.
}

// Not an admit invocation → nothing to gate. This includes empty/malformed stdin (cmd=""), a
// non-admit command (ls, render), and any command that merely MENTIONS admit text without being
// a real `node …context-io admit …` call (e.g. `echo 'node context-io.js admit …'`,
// `cat doc.md`). The guard's only input is the command verb, never file content.
if (!isAdmitInvocation(cmd)) {
  process.exit(0);
}

// The command IS a matched admit. From here, any later failure on a gated admission denies.

// D-01: the agent must never grant its own admission. Any inline set/export of the approval var
// is denied EVEN IF the var is already present in the environment. This is the entire reason the
// gate is a separate hook process reading the human-set SESSION env, not an in-script check.
if (SELF_APPROVE.test(cmd)) {
  deny(
    `Refused: an agent may not set or export ${APPROVAL}. ` +
      `Admission of a governance entry must be authorized by a human who exports ${APPROVAL}=NAME ` +
      `in the shell that launches Claude — it cannot be set inside the command.`,
  );
}

// Read the dial via the richer discriminated read (Plan 25-01 reader; 25-04 result wrapper). The
// hook — the un-forgeable tier — must FAIL CLOSED on a corrupt config, so it distinguishes a
// genuinely ABSENT config (stay lean → allow routine) from a present-but-UNREADABLE one (deny). The
// value reader (readGovernanceConfig) keeps its default-on-absent contract; this hook consumes the
// richer result instead. The try/catch is belt-and-suspenders — the reader does not throw — but a
// throw on a matched admit must also fail closed.
let dial: string;
let configSource: "absent" | "ok" | "unreadable";
try {
  // ${CLAUDE_PROJECT_DIR} is the documented hook project root (CLAUDE.md). When unset, the reader
  // falls back to its own repo root.
  const projectDir = process.env.CLAUDE_PROJECT_DIR;
  const result = readGovernanceConfigResult(projectDir);
  dial = result.config.human_admission;
  configSource = result.source;
} catch {
  deny(
    `Admission blocked (fail-closed): the governance configuration could not be read while ` +
      `evaluating an admission. A human must resolve the configuration, or export ${APPROVAL}=NAME ` +
      `to authorize this admission explicitly.`,
  );
}

// Fail CLOSED on a present-but-unreadable (corrupt / non-JSON) config: a matched admit is denied
// pending a human, never crash-allowed. A genuinely ABSENT config is NOT a read failure — it is the
// zero-config lean default, so it falls through to the dial logic below (which allows routine).
if (configSource === "unreadable") {
  deny(
    `Admission blocked (fail-closed): the governance configuration exists but could not be parsed ` +
      `(corrupt or non-JSON) while evaluating an admission. The hook treats an unreadable governance ` +
      `config as gate-or-stricter. A human must repair the configuration, or export ${APPROVAL}=NAME ` +
      `to authorize this admission explicitly.`,
  );
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
  deny(
    `Admission blocked (fail-closed): could not determine the note file from the admit command ` +
      `while governance is active (human_admission="${dial}"). A human must review this admission, ` +
      `or export ${APPROVAL}=NAME to authorize it.`,
  );
}

let by = "";
try {
  const text = readFileSync(noteFile, "utf8");
  const parsed = parseNote(text);
  if (parsed === null) {
    deny(
      `Admission blocked (fail-closed): the note "${noteFile}" has no parsable frontmatter while ` +
        `governance is active (human_admission="${dial}"). A human must review this admission, ` +
        `or export ${APPROVAL}=NAME to authorize it.`,
    );
  }
  by = (parsed.scalars.by ?? "").trim();
  if (by === "") {
    deny(
      `Admission blocked (fail-closed): the note "${noteFile}" has no authoring role ("by") while ` +
        `governance is active (human_admission="${dial}"). A human must review this admission, ` +
        `or export ${APPROVAL}=NAME to authorize it.`,
    );
  }
} catch {
  deny(
    `Admission blocked (fail-closed): the note "${noteFile}" could not be read while governance is ` +
      `active (human_admission="${dial}"). A human must review this admission, ` +
      `or export ${APPROVAL}=NAME to authorize it.`,
  );
}

// Is THIS admission gated by the dial?
//   - gateEveryMatch (set for "all" AND for any non-canonical value): every matched admission
//     requires the human stamp.
//   - "high-severity" (the only other non-off value): only the three high-severity authoring roles.
const isHighSeverity = HIGH_SEVERITY_ROLES.has(by);
const isGated = gateEveryMatch || isHighSeverity;

if (isGated && !process.env[APPROVAL]) {
  const disposition =
    gateEveryMatch
      ? `Governance requires a named human disposition for every admission under the active setting ` +
        `(human_admission="${dial}").`
      : `This is a high-severity admission (by: ${by}); a high-severity governance entry requires a named human disposition.`;
  deny(
    `Admission blocked: humans decide, agents execute. ${disposition} ` +
      `The note "${noteFile}" cannot be admitted until a human exports ${APPROVAL}=NAME in the shell ` +
      `that launches Claude, then re-runs the admission. The agent must not set ${APPROVAL} itself.`,
  );
}

// Allow: not gated (routine role under high-severity, or off), or the human stamp is present.
process.exit(0);

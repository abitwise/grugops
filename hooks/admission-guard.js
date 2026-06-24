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
import { parseNote, readGovernanceConfig } from "../scripts/context-io.js";
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
// Verb-anchored admit match (mirror guard.ts:50 — match the SUBCOMMAND VERB, not a substring).
// CRITICAL INPUT-SURFACE DISCIPLINE (inverse of the P23 CR-01 false-positive, T-25-04): the
// guard must fire ONLY on a real Bash admit invocation, NEVER on the same text appearing inside
// a quoted string (`echo 'node context-io.js admit …'`), after a `#` comment, or as a path
// component. A naive `node[\s\S]*admit` spans across quotes and comments and false-positives.
//
// The match shape, anchored within ONE unquoted command segment: an optional shell prefix of
// inline VAR=val assignments and/or `env VAR=val` (the shell's command-prefix grammar — this is
// also exactly how an agent would TRY to self-set the approval var), then `node` as the segment's
// command, then a context-io(.js) script token, then the `admit` verb — with NO quote character
// (' or ") and NO `#` comment introducer anywhere in the matched span. A real admit never wraps
// its own verb in quotes; a quote or a comment before the verb means the text is an argument to
// some OTHER command (echo/cat), not a live admit. See isAdmitInvocation() below.
//
// The prefix span allows `=` and `+` (env values), but the FIRST token after the separator must
// still resolve to `node` — so a quoted/commented mention can never reach the `node` anchor.
const ADMIT_SEGMENT = /(^|[;&|\n])(\s|&|\|)*(?:(?:env\s+)?[A-Za-z_][A-Za-z0-9_]*=[^\s'"#;&|\n]*\s+)*(?:env\s+)?node\b[^'"#;&|\n]*?\bcontext-io(?:\.js)?\b[^'"#;&|\n]*?\badmit\b/;
// Returns true only when `cmd` contains a real `node …context-io(.js) admit …` invocation as an
// actual command segment — not embedded in a quoted echo/cat argument, not after a `#` comment,
// not as a path. This is the SOLE gate input surface: the command verb, never file content.
function isAdmitInvocation(cmd) {
    return ADMIT_SEGMENT.test(cmd);
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
    deny(`Refused: an agent may not set or export ${APPROVAL}. ` +
        `Admission of a governance entry must be authorized by a human who exports ${APPROVAL}=NAME ` +
        `in the shell that launches Claude — it cannot be set inside the command.`);
}
// Read the dial via the ONE shared config-read path (Plan 25-01). Fail CLOSED: if this throws on
// a matched admit, deny. (readGovernanceConfig is built to never throw and to return the lean
// default on any read failure; the catch is belt-and-suspenders for any future read path.)
let dial;
try {
    // ${CLAUDE_PROJECT_DIR} is the documented hook project root (CLAUDE.md). When unset, the helper
    // falls back to its own repo root.
    const projectDir = process.env.CLAUDE_PROJECT_DIR;
    dial = readGovernanceConfig(projectDir).human_admission;
}
catch {
    deny(`Admission blocked (fail-closed): the governance configuration could not be read while ` +
        `evaluating an admission. A human must resolve the configuration, or export ${APPROVAL}=NAME ` +
        `to authorize this admission explicitly.`);
}
// Lean default / explicit `off` → no human stop. Nothing to gate.
if (dial === "off") {
    process.exit(0);
}
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
//   - "all": every matched admission requires the human stamp.
//   - "high-severity": only the three high-severity authoring roles require it.
const isHighSeverity = HIGH_SEVERITY_ROLES.has(by);
const isGated = dial === "all" || (dial === "high-severity" && isHighSeverity);
if (isGated && !process.env[APPROVAL]) {
    const disposition = dial === "all"
        ? `Governance is set to "all": every admission requires a named human disposition.`
        : `This is a high-severity admission (by: ${by}); a high-severity governance entry requires a named human disposition.`;
    deny(`Admission blocked: humans decide, agents execute. ${disposition} ` +
        `The note "${noteFile}" cannot be admitted until a human exports ${APPROVAL}=NAME in the shell ` +
        `that launches Claude, then re-runs the admission. The agent must not set ${APPROVAL} itself.`);
}
// Allow: not gated (routine role under high-severity, or off), or the human stamp is present.
process.exit(0);

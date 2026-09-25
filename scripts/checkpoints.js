// checkpoints.ts — the per-checkpoint autonomy matrix's ONE roster (AUTO-01, AUTO-02, AUTO-07).
//
// WHAT THIS MODULE IS. Phase 30 replaces the documentary `autonomy` scalar with an ENFORCED
// per-checkpoint ternary matrix (`block` / `notify` / `off`). This file owns the roster, the
// ternary vocabulary, the fail-closed canonicalizer, the floor-tier subset, the per-floor env var
// NAME derivation, the disposition resolution rule and the run banner. Every other surface —
// the config reader, the PreToolUse guard, the validator, the render — CONSULTS this module and
// declares none of it a second time.
//
// WHY IT IS ONE MODULE AND NOT A SET OF LITERALS SCATTERED ACROSS THE CONSUMERS. This repository's
// founding defect class is set-literal drift: a hand-maintained scan set / role list / allowlist
// that rots while every gate over it stays green. The remedy this tree has settled on is "derive
// the set, assert the count". So: `CHECKPOINT_DEFAULTS` is the ONLY declaration of the roster,
// `CHECKPOINTS` is `Object.keys()` over it, and `FLOOR_CHECKPOINTS` is an intersection with
// `SAFETY_FLOORS` — imported from ./audit-model.js, never restated (D-04). No second array literal
// of checkpoint ids exists in this file, and none may be added to a consumer.
//
// THE COMPILE-TIME HALF OF THE SAME RULE. `CHECKPOINT_DEFAULTS` carries
// `as const satisfies Record<Checkpoint, Disposition>`: adding a member to the `Checkpoint` union
// without giving it a default is a `tsc` diagnostic, not a runtime surprise. This is the
// `FROZEN_SOURCES` idiom from scripts/check-diff-disposition.ts, applied to the roster — Object.keys()
// over this table is the roster count, and nothing else declares it.
//
// THE TWO-KEY RULE (AUTO-03, D-07 / D-09 / D-10). Every checkpoint is ternary. A FLOOR-tier
// checkpoint differs only in this: lowering it below `block` takes TWO keys, not one.
//   key one — the agent-writable config declaration `checkpoints.<id>: notify | off`;
//   key two — the human-set session env var `GRUGOPS_FLOOR_<ID>=<name>`, read FRESH by the hook
//             process on every invocation.
// A config declaration with no matching env var is an UNAUTHORIZED LOWERING: the effective
// disposition stays `block`, so an agent that edits config alone changes nothing — and the banner
// and the denial both say so by name, so it changes nothing LOUDLY (D-10).
//
// HOW FAR KEY TWO ACTUALLY GOES, STATED HONESTLY. `process.env[NAME]` carries no provenance. The
// env var is un-forgeable from inside a tool call — an agent's own `export VAR=…` lands in the
// child env it spawns, which the hook process never inherits. It is NOT un-forgeable against an
// agent that can write the host's settings files: Claude Code's `env` settings block is reapplied
// to a live session and reaches the next hook subprocess identically (RESEARCH F-2). That residual
// is accepted and disclosed, not closed here. A grant is also SESSION-SCOPED, not per-action: once
// the variable is set, it authorizes lowered behaviour under that name until it is unset.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { SAFETY_FLOORS } from "./audit-model.js";
// The section locator and the workflow lister are IMPORTED, never restated. `locateSection` is the
// tree's one section-extent adapter over the `unfencedHeadingIndex` / `sectionEndIndex` authority
// (which scripts/section-locator-oracle.test.ts holds with a parser oracle), and `listWorkflows` is
// the one rule that decides which files are workflows. A private heading scanner or a private
// directory walk here would be a SECOND authority for a predicate this tree already unified — the
// Phase 29 lesson this module exists downstream of.
import { locateSection } from "./check-diff-disposition.js";
import { listWorkflowDirEntries, listWorkflows, WORKFLOWS_SUBPATH } from "./kit-model.js";
import { fencedLineFlags, unfencedHeadingIndices, unfencedHeadingNearMisses, unfencedMatchIndices, } from "./frontmatter.js";
/**
 * The roster AND its defaults, in ONE table. Object.keys() over this is the roster count; nothing
 * else declares it.
 *
 * `as const satisfies Record<Checkpoint, Disposition>` is load-bearing in both directions:
 *   - `satisfies` makes a `Checkpoint` member with no entry here a COMPILE error (the missing-member
 *     proof this tree previously only had via `assertNeverVerdict`);
 *   - `as const` keeps the literal value types, so `CHECKPOINT_DEFAULTS[id]` is a `Disposition` and
 *     not a widened `string`.
 *
 * EVERY FLOOR-TIER MEMBER DEFAULTS TO `block`. That is AUTO-07 in one line: a repo that configures
 * nothing gets the un-lowered posture, and no floor is lowered by omission.
 *
 * THE ONE NON-`block` DEFAULT, AND WHY IT IS NOT AN EXCEPTION TO THAT RULE. `commit_to_branch` is
 * NOT a floor (it is absent from `SAFETY_FLOORS`), and D-06 fixes its grade default at `off`:
 * committing to a working branch is what the factory does on every ticket, so a `block` default
 * would stop the kit's own documented flow at its first step rather than protect anything. AUTO-07
 * says no FLOOR is lowered by omission, and no floor is: the four `SAFETY_FLOORS` members below all
 * read `block`, and scripts/checkpoints.test.ts asserts that mapping from `SAFETY_FLOORS` rather
 * than from this comment, so a floor added later with a permissive default is red.
 */
export const CHECKPOINT_DEFAULTS = {
    protected_branch_merge: "block",
    production_requires_human_confirmation: "block",
    test_integrity: "block",
    open_pr: "block",
    commit_to_branch: "off",
    proceed_past_blocked_risk: "block",
    sign_off_acceptance: "block",
    escalate_stale_blocker: "block",
    exceed_wip_limit: "block",
    decide_accessibility_exception: "block",
    exhaust_self_fix_budget: "block",
    override_finding_severity: "block",
    escalate_unadjudicable_result: "block",
    accept_human_only_failure: "block",
};
/**
 * The roster, DERIVED. Never a second array literal of checkpoint ids (D-01).
 *
 * Iteration order is the declaration order of `CHECKPOINT_DEFAULTS` and nothing else declares it.
 * Consumers that COMPARE sets must sort both sides first, so that ordering can never change a
 * verdict — see `sortedIds()`.
 */
export const CHECKPOINTS = Object.keys(CHECKPOINT_DEFAULTS);
/**
 * EVERY roster member at `block` — the answer a reader gives when it does not KNOW what the config
 * says. Derived from `CHECKPOINTS`, never listed.
 *
 * WHY THIS EXISTS, AND WHY IT IS NOT THE SAME THING AS `CHECKPOINT_DEFAULTS` (plan 30-02). Until
 * this plan the two were interchangeable, because every roster default was `block` — so
 * scripts/context-io.ts could hand back the DEFAULTS on a corrupt config and truthfully say "no
 * degenerate shape can lower a checkpoint". D-06 breaks that premise: `commit_to_branch` is a
 * non-floor member whose default is `off`, and the moment one default is permissive, "fall back to
 * the defaults" stops meaning "fail closed". A repository that had declared
 * `commit_to_branch: block` and then corrupted its config file would have had the corruption
 * silently GRANT the permission it had refused.
 *
 * THE TWO CASES ARE NOW DISTINGUISHED BY NAME.
 *   - The config was READ and simply says nothing about a checkpoint → `CHECKPOINT_DEFAULTS`. A
 *     repository that configures nothing is not misconfigured (AUTO-07).
 *   - The config could NOT be read, or was read into a shape a matrix cannot come out of → this
 *     constant. An unknown declaration is treated as the strictest one, never as the absent one,
 *     because "we could not tell" and "they chose the permissive value" are different facts.
 */
export const STRICTEST_MATRIX = Object.freeze(Object.fromEntries(CHECKPOINTS.map((id) => [id, "block"])));
/** The canonical spellings of `Disposition`, derived from nothing else and used by the validator. */
export const DISPOSITIONS = ["block", "notify", "off"];
/** The env-var family that carries key two. One prefix, declared once. */
export const FLOOR_ENV_VAR_PREFIX = "GRUGOPS_FLOOR_";
// ─────────────────────────────────────────────────────────────────────────────────────────────
// THE GRANT VOCABULARY — one authority over every variable a human sets to authorize something.
// ─────────────────────────────────────────────────────────────────────────────────────────────
/**
 * The NAMED grant variables: every environment variable whose presence authorizes an action or a
 * posture that a human — and only a human — may authorize. The floor family
 * (`GRUGOPS_FLOOR_<ID>`) is the third member and is a PATTERN rather than a list, because it grows
 * with the roster; it is folded in by `GRANT_ENV_VAR_PATTERN_SOURCE` below.
 *
 * ---------------------------------------------------------------------------------------------
 * WHY THIS TABLE EXISTS (plan 30-11, red-team surface A, finding A-1).
 *
 * Until this table, the grant vocabulary was written down in three unrelated places: `hooks/guard.ts`
 * held the prod-deploy approval as a bare string literal, `hooks/admission-guard.ts` held the
 * admission approval as its own bare string literal, and the self-set refusal in `hooks/guard.ts`
 * was an alternation of ONE of those two names plus the floor family. Measured on the committed
 * artifact: `export GRUGOPS_FLOOR_OPEN_PR=alice && ls` was REFUSED and
 * `export GRUGOPS_ADMISSION_APPROVED_BY=alice && ls` was ALLOWED — two grant variables, the same
 * command shape, opposite decisions, because the refusal enumerated a set that nothing derived.
 *
 * That is this repository's founding defect class (a hand-maintained set literal drifting away from
 * the thing it is supposed to cover) pointed at a safety refusal. So the set is declared ONCE here,
 * both hooks import their own constant OUT of it rather than restating it, and the refusal pattern
 * is BUILT from it. A grant added to this table is refused without anyone remembering to widen a
 * regex; a grant added anywhere else is caught by the no-second-literal assertion in
 * `hooks/guard.test.ts`.
 *
 * WHAT THE REFUSAL IS, AND WHAT IT IS NOT. Refusing an inline `NAME=value` in an agent-authored
 * command is a VISIBILITY control, not the access control. The access control is that the hook runs
 * as a separate process whose environment the agent's own child shell can never reach. Shell
 * indirection (`V=GRUGOPS_FLOOR_OPEN_PR; export "$V=me"`) defeats the literal spelling and is
 * measured to do so — and it authorizes nothing either way, for the same reason. See
 * `docs/audit/30-redteam-surface-a.md` § A-1.
 * ---------------------------------------------------------------------------------------------
 */
export const NAMED_GRANT_ENV_VARS = {
    GRUGOPS_PROD_DEPLOY_APPROVED: "approval for a production deploy at the un-lowered posture (this action, this session)",
    GRUGOPS_ADMISSION_APPROVED_BY: "the named human who may dispose of a gated governance finding (this session)",
};
/** The prod-deploy ACTION approval. `hooks/guard.ts` imports this rather than spelling it. */
export const PROD_DEPLOY_APPROVAL_ENV_VAR = "GRUGOPS_PROD_DEPLOY_APPROVED";
/** The human-admission approval. `hooks/admission-guard.ts` imports this rather than spelling it. */
export const ADMISSION_APPROVAL_ENV_VAR = "GRUGOPS_ADMISSION_APPROVED_BY";
/**
 * The whole grant vocabulary as ONE regular-expression source: every named grant, plus the floor
 * FAMILY. Built from the table above and the prefix above; nothing restates a name.
 */
export const GRANT_ENV_VAR_PATTERN_SOURCE = `${Object.keys(NAMED_GRANT_ENV_VARS).join("|")}|${FLOOR_ENV_VAR_PREFIX}[A-Z0-9_]+`;
/** Anchored form of the vocabulary — "is this exact string a grant variable name?" */
const GRANT_ENV_VAR_EXACT = new RegExp(`^(?:${GRANT_ENV_VAR_PATTERN_SOURCE})$`);
/** Is `name` a member of the grant vocabulary (a named grant, or a floor-family name)? */
export function isGrantEnvVarName(name) {
    return GRANT_ENV_VAR_EXACT.test(name);
}
/**
 * Read a grant out of an environment: the human's NAME, or `null` when nobody is named.
 *
 * ---------------------------------------------------------------------------------------------
 * ONE PREDICATE FOR THE WHOLE VOCABULARY, AND WHY IT TRIMS (plan 30-11, finding A-4; reviewer 8
 * observation 2 carried over from surface B as `V-30-10-04` item 2).
 *
 * The presence test used to be `raw.length > 0`, applied to the floor grant only, while the action
 * approval used a bare truthiness test. Measured on the committed artifact: a grant of a single
 * space AUTHORIZED the lowering, and the run banner then published
 * `authorized by GRUGOPS_FLOOR_PROTECTED_BRANCH_MERGE=` — a lowering in effect, attributed to a name
 * that renders as nothing. The value of a grant is the human's name; that is its entire content and
 * the whole reason the record exists. A value that names nobody is not a grant, and a run that
 * cannot say who authorized a lowering has not recorded the lowering.
 *
 * The direction of the change is strictly stricter: a value that previously authorized and named
 * nobody now authorizes nothing. A value that names somebody is unchanged except that surrounding
 * whitespace is dropped from the published name.
 * ---------------------------------------------------------------------------------------------
 */
export function grantedBy(env, name) {
    const raw = env[name];
    if (typeof raw !== "string")
        return null;
    const named = raw.trim();
    return named.length > 0 ? named : null;
}
// ─────────────────────────────────────────────────────────────────────────────────────────────
// THE COMMAND MODEL — words are CLASSIFIED, not parsed (plan 30-11 round 3).
// ─────────────────────────────────────────────────────────────────────────────────────────────
/**
 * WHY THIS WAS REWRITTEN RATHER THAN REPAIRED, AND WHAT WAS DELETED.
 *
 * Round 2 added a tokenizer to close a real zero-key bypass, and named its own new freedom: *"a
 * tokenizer is a parser, and a parser has a grammar an attacker can leave — this repository's
 * Phase-25/27 lesson."* One round later that grammar had SIX executable holes, every one the same
 * shape:
 *
 *   RA3-1  word-internal quoting/escaping — `kubectl ""apply`, `app\ly`, `$'apply'`, `git ""push
 *          origin main` — invisible to the literal patterns AND to the tokenizer, because quotes were
 *          stripped at word EDGES and backslashes were not handled at all.
 *   RA3-2  `( … )`, `{ …; }`, `if/then`, `for/do`, `case`, `!` — the grouping token became the "tool".
 *   RA3-3  `WRAPPERS` was a hand-maintained set literal (`nice`, `timeout`, `doas`, `stdbuf`,
 *          `setsid`, `ionice`, `parallel`, `find -exec` all missing), and the unwrap loop needed
 *          exactly the per-tool flag grammar the docstring refused to maintain: `sudo -u root
 *          kubectl …` took **`root`** as the tool.
 *   RA3-4  the fail-closed backstop required BOTH the tool and one of its verbs as whole words in the
 *          raw text, so splitting the VERB defeated the parser and the backstop with one edit.
 *   RA3-5  `-c` had to be the last letter of a flag cluster; herestrings were never operands.
 *   RA3-6  `git.exe`, `\kubectl`, and a verb hidden in a `-c alias.x=push` value.
 *
 * THE THREE THINGS THIS REWRITE DELETES, rather than fixes:
 *
 *   1. **The wrapper set is gone.** Nothing identifies "the tool of a segment" any more. EVERY
 *      canonical non-flag word is a candidate tool, and a governed verb is looked for AFTER it. That
 *      one change removes `WRAPPERS`, the flag-with-argument question, and the grouping/reserved-word
 *      question together — `sudo -u root kubectl … apply`, `nice -n 5 kubectl … apply`,
 *      `( kubectl … apply )` and `find . -exec kubectl … apply` all match without a single new rule.
 *   2. **Edge quote-stripping is gone.** A word is now CLASSIFIED, and a word this model cannot read
 *      is refused rather than read. That is the D-64 posture — name the canonical form and refuse the
 *      near-miss — applied to shell words instead of to markdown headings.
 *   3. **The verb conjunct in the fail-closed backstop is gone.** An unreadable segment denies on the
 *      TOOL NAME alone, so splitting the verb no longer defeats both authorities at once.
 *
 * IT REMAINS ADDITIVE to the literal patterns in `hooks/guard.ts`, which is what makes a bug in this
 * file able to MISS a denial and never able to CREATE a bypass.
 */
/**
 * The characters a canonical unquoted word may contain.
 *
 * Anything outside this set — a quote in the middle of a word, a backslash, `$`, a brace, a
 * parenthesis — means the word's VALUE is not the text, and this model does not guess at it. It
 * refuses instead. That refusal is `WordKind.opaque` below. A redirection glyph is the ONE exception,
 * and only in the shapes `REDIRECTION_RE` below admits: a redirection is not a value at all.
 *
 * The class is spelled ONCE, as a string, so the word rule and the redirection rule are built from
 * the same alphabet and cannot drift (the two-grammars-for-one-punctuation-set defect of plan 33-27).
 */
const CANONICAL_CHARS = "A-Za-z0-9._/@:+=,~%^-";
const CANONICAL_WORD_RE = new RegExp(`^[${CANONICAL_CHARS}]+$`);
/**
 * THE REDIRECTION GRAMMAR — one anchored allow-list, asked at the split AND at the word (plan 33-27,
 * 33-DIAGNOSIS.md § 2, WINDOWS.md row 257).
 *
 * Round 1's live capture refused fifteen commands that deploy nothing because `2>&1` was two things
 * to this file: the segment splitter cut it at `&` (an `&` is a splitter) and the word `2>` that
 * remained was opaque, so `git log --oneline -5 2>&1` denied on the tool name alone. A redirection is
 * not a substitution: its VALUE is never a command word, and the shell grammar for it is small and
 * closed. So it is admitted — by ONE regex, consulted by `commandSegments` before the `&` splitter
 * and by `classifyWords` before the canonical rule, so the split and the word cannot disagree.
 *
 * ADMITTED (every form, nothing else):
 *   - fd duplication, one operator and an attached `&`-digit target: `2>&1`, `1>&2`, `3>&2`, `>&2`,
 *     `<&0`;
 *   - an output, append or input operator with an optional fd digit run and an attached target of
 *     canonical characters: `>f`, `>>f`, `<f`, `2>f`, `2>>f`, `>/dev/null`, `2>/dev/null`;
 *   - the both-streams operators with an attached canonical target: `&>f`, `&>>f`;
 *   - any of the above operators BARE (`>`, `>>`, `<`, `2>`, `&>`, `&>>`), in which case the NEXT
 *     word is its target — that word is consumed into the redirection and is never read as a tool or
 *     a verb (`git > push origin main` is not a push; `push` is a file name there). A bare operator
 *     whose next word is quoted, escaped or otherwise not a single canonical run, or which has no
 *     next word, stays OPAQUE.
 *
 * DELIBERATELY NOT ADMITTED (each stays opaque, the segment fails closed on the tool name alone):
 *   - a heredoc `<<EOF` / `<<'EOF'` — its body lines are commands to this tokenizer, and a note
 *     written through a heredoc is exactly the route the shared-context reader now refuses;
 *   - a here-string `<<<x` and a process substitution `<(cmd)` / `>(cmd)` — `UNRESOLVABLE_SHELL_RE`
 *     refuses them at the raw level as well;
 *   - an operator glued to letters on either side — `push>x`, `pu2>&1sh`, `main>&1` — because an
 *     anchored grammar reads the whole word or none of it (the RA3-1 rule);
 *   - a bare `>&` / `<&` with no digit target, `>&-`, and `&>&1`;
 *   - a quoted target (`>'a b'`, `> "$f"`) — a quoted run is not a canonical run.
 *
 * A bare `$var` expansion is NOT a redirection and stays opaque by decision: its value is unknowable
 * at hook time. Readable by this grammar, or opaque — there is no third state.
 */
export const REDIRECTION_RE = new RegExp(`^(?:\\d*[<>]&\\d+|(?:\\d*(?:>>|>|<)|&>>|&>)(?:[${CANONICAL_CHARS}]+)?)$`);
/** A redirection word is BARE — its target is the next word — exactly when it ends in its operator. */
const BARE_REDIRECTION_RE = /[<>]$/;
/**
 * Split one segment into words, quote-aware, and classify each.
 *
 * ---------------------------------------------------------------------------------------------
 * THE CANONICAL FORM, AND THE TWO SHAPES THAT ARE NOT SPLICING.
 *
 * A word is built from RUNS: unquoted text, `'…'` and `"…"`. A word is CANONICAL when it is
 *   (a) a single unquoted run of `CANONICAL_WORD_RE` characters, or
 *   (b) a single wholly-quoted run — `'apply'` is the word `apply`, which is how a quoted subcommand
 *       legitimately reaches a tool, or
 *   (c) an unquoted prefix that starts with `-` or ends with `=`, followed by ONE quoted run —
 *       the `--grep='x y'` / `-m'msg'` / `--body='…'` shape, which is ordinary and must not be
 *       refused.
 *
 * Everything else is OPAQUE: `app""ly`, `""apply`, `"ap""ply"`, `ma'in'`, `$'apply'`, `app\ly`,
 * `ap$(echo ply)`, an unbalanced quote. Those are exactly the spellings `RA3-1` and `RA3-4` used, and
 * they are refused BY RULE — the model does not learn to read one more of them.
 *
 * A wholly-quoted word's value may contain spaces (`'do not push to main'` is ONE word whose value is
 * that whole string). That is what stops a quoted commit message from contributing its words as verb
 * candidates, which is the mechanism behind five of the false denials reviewer 3 measured.
 *
 * THE THIRD KIND, AND THE LINE THAT DECIDES IT (plan 33-27). A single unquoted, unescaped run that
 * `REDIRECTION_RE` fully describes is a `redirection`. A BARE operator (`>`, `2>`, `&>`, …) holds
 * until the next word: when that word is a single unquoted canonical run it is consumed as the target
 * and the pair becomes ONE redirection word; otherwise the operator is emitted OPAQUE and the next
 * word is classified on its own. Readable by grammar, or opaque — there is no third state. A bare
 * `$var` and a heredoc are opaque BY DECISION, not by omission: a variable's value is unknowable at
 * hook time, and a heredoc's body lines are commands to this tokenizer.
 * ---------------------------------------------------------------------------------------------
 */
export function classifyWords(segment) {
    const words = [];
    let runs = [];
    let cur = "";
    let quote = null;
    let sawBackslash = false;
    /** Where the word being built starts in `segment` — its spelled text is `segment.slice(rawStart, …)`. */
    let rawStart = -1;
    /** A bare redirection operator waiting for its target word. */
    let pending = null;
    const emit = (w, plain) => {
        if (pending !== null) {
            const op = pending;
            pending = null;
            if (plain !== null && CANONICAL_WORD_RE.test(plain)) {
                words.push({ kind: "redirection", value: `${op.value} ${plain}`, raw: `${op.raw} ${w.raw}`, isFlag: false });
                return;
            }
            words.push({ kind: "opaque", value: op.value, raw: op.raw, isFlag: false });
        }
        if (w.kind === "redirection" && BARE_REDIRECTION_RE.test(w.value)) {
            pending = w;
            return;
        }
        words.push(w);
    };
    const flush = (end) => {
        if (runs.length === 0 && cur === "")
            return;
        if (cur !== "")
            runs.push({ quoted: false, text: cur });
        cur = "";
        const raw = segment.slice(rawStart, end);
        rawStart = -1;
        const joined = runs.map((r) => r.text).join("");
        // The word's text when it is ONE unquoted, unescaped run — the only shape a redirection may take.
        const plain = !sawBackslash && runs.length === 1 && !runs[0].quoted ? runs[0].text : null;
        let kind = "opaque";
        if (plain !== null && REDIRECTION_RE.test(plain)) {
            kind = "redirection";
        }
        else if (!sawBackslash) {
            if (runs.length === 1) {
                kind = runs[0].quoted || CANONICAL_WORD_RE.test(runs[0].text) ? "canonical" : "opaque";
            }
            else if (runs.length === 2 &&
                !runs[0].quoted &&
                runs[1].quoted &&
                (runs[0].text.startsWith("-") || runs[0].text.endsWith("=")) &&
                CANONICAL_WORD_RE.test(runs[0].text)) {
                kind = "canonical";
            }
        }
        const value = joined;
        emit({ kind, value, raw, isFlag: kind === "canonical" && value.startsWith("-") }, plain);
        runs = [];
        sawBackslash = false;
    };
    for (let i = 0; i < segment.length; i++) {
        const c = segment[i];
        if (quote !== null) {
            if (c === quote) {
                runs.push({ quoted: true, text: cur });
                cur = "";
                quote = null;
            }
            else
                cur += c;
            continue;
        }
        if (/\s/.test(c)) {
            flush(i);
            continue;
        }
        if (rawStart < 0)
            rawStart = i;
        if (c === "\\") {
            sawBackslash = true;
            cur += c;
            if (i + 1 < segment.length)
                cur += segment[++i];
            continue;
        }
        if (c === '"' || c === "'") {
            if (cur !== "") {
                runs.push({ quoted: false, text: cur });
                cur = "";
            }
            quote = c;
            continue;
        }
        cur += c;
    }
    if (quote !== null) {
        // An unbalanced quote: everything from the opening quote on is unreadable.
        // `pending` is assigned inside `emit`, which the compiler's narrowing does not follow.
        const held = pending;
        if (held !== null)
            words.push({ kind: "opaque", value: held.value, raw: held.raw, isFlag: false });
        words.push({ kind: "opaque", value: cur, raw: segment.slice(rawStart), isFlag: false });
        return words;
    }
    flush(segment.length);
    // A bare operator with no word after it is an incomplete redirection: opaque, never silently dropped.
    const last = pending;
    if (last !== null)
        words.push({ kind: "opaque", value: last.value, raw: last.raw, isFlag: false });
    return words;
}
/** A shell metacharacter set that ENDS a segment. Split only outside quotes. */
const SEGMENT_SPLIT_RE = /^(?:&&|\|\||;;|[;|&\n])/;
/**
 * The run of characters that may follow an `&` inside one word — everything up to whitespace, a
 * splitter, a quote or a backslash. `commandSegments` joins the word so far, the `&` and this run and
 * asks `REDIRECTION_RE` whether the whole is a redirection BEFORE the `&` is read as a splitter.
 */
const AFTER_AMPERSAND_RE = /^[^\s;|&'"\\]*/;
/**
 * Substitution and expansion forms whose presence makes a segment unreadable at the RAW-TEXT level.
 * Kept as a raw-text test in addition to word classification, because a substitution can span words.
 */
const UNRESOLVABLE_SHELL_RE = /\$\(|`|\$\{|<\(|>\(|<<</;
/** Split a command into segments, quote-aware, stripping comments. `null` = unreadable outright. */
export function commandSegments(cmd, depth = 0) {
    if (typeof cmd !== "string")
        return null;
    if (depth > 3)
        return null;
    const raws = [];
    let cur = "";
    let quote = null;
    // The word being built: where it starts in `cur`, and whether it is still one unquoted, unescaped
    // run — the only shape the redirection grammar reads. Reset at every unquoted whitespace and split.
    let wordStart = 0;
    let wordPlain = true;
    for (let i = 0; i < cmd.length; i++) {
        const c = cmd[i];
        if (quote !== null) {
            cur += c;
            if (c === quote)
                quote = null;
            continue;
        }
        if (c === "\\") {
            wordPlain = false;
            cur += c;
            if (i + 1 < cmd.length)
                cur += cmd[++i];
            continue;
        }
        if (c === '"' || c === "'") {
            wordPlain = false;
            quote = c;
            cur += c;
            continue;
        }
        // A COMMENT IS NOT A COMMAND. `#` opens one only at the start of a word.
        if (c === "#" && (i === 0 || /\s/.test(cmd[i - 1]))) {
            const nl = cmd.indexOf("\n", i);
            if (nl === -1)
                break;
            i = nl - 1;
            continue;
        }
        // A REDIRECTION OPERATOR THAT CONTAINS `&` IS NOT A SPLITTER (plan 33-27). `2>&1`, `>&2`, `&>f`,
        // `&>>f` were cut here at the `&`, leaving an opaque `2>` in one segment and a stray `1` in the
        // next. The word so far, the `&` and the run after it are asked of the ONE grammar; a match is
        // consumed into the word, anything else falls through to the splitter exactly as before.
        if (c === "&" && wordPlain) {
            const run = AFTER_AMPERSAND_RE.exec(cmd.slice(i + 1))[0];
            if (REDIRECTION_RE.test(cur.slice(wordStart) + "&" + run)) {
                cur += "&" + run;
                i += run.length;
                continue;
            }
        }
        const m = SEGMENT_SPLIT_RE.exec(cmd.slice(i));
        if (m) {
            raws.push(cur);
            cur = "";
            wordStart = 0;
            wordPlain = true;
            i += m[0].length - 1;
            continue;
        }
        cur += c;
        if (/\s/.test(c)) {
            wordStart = cur.length;
            wordPlain = true;
        }
    }
    if (quote !== null) {
        // Unbalanced quoting: one unreadable segment carrying the whole text, never a silent mis-parse.
        return [{ words: [{ kind: "opaque", value: cmd, raw: cmd, isFlag: false }], raw: cmd, opaque: true }];
    }
    raws.push(cur);
    return raws.map((raw) => {
        const words = classifyWords(raw);
        return {
            words,
            raw,
            opaque: UNRESOLVABLE_SHELL_RE.test(raw) || words.some((w) => w.kind === "opaque"),
        };
    });
}
/**
 * The tool -> verb table. `benign` names subcommands of that tool that DECIDE the segment is not a
 * governed invocation when they appear before any governed verb.
 *
 * ---------------------------------------------------------------------------------------------
 * WHY `benign` IS ADMISSIBLE WHERE `WRAPPERS` WAS NOT — the rule this round adopts.
 *
 * `WRAPPERS` was a hand-maintained set whose INCOMPLETENESS let a command through: a launcher missing
 * from it produced an ALLOW. `benign` is a hand-maintained set whose incompleteness makes the model
 * REFUSE more: a subcommand missing from it simply fails to suppress, and the fail-closed word scan
 * decides. **A set whose incompleteness over-refuses is admissible; a set whose incompleteness
 * under-refuses is not.** That distinction is the whole reason one was deleted and the other added,
 * and it is asserted in `scripts/checkpoints.test.ts` by driving an unknown subcommand through and
 * requiring the strict answer.
 *
 * Only two tools need one, and both are measured rather than guessed: `git`, because
 * `git commit -m 'push'` and four sibling spellings were denied (reviewer 3's false-denial table), and
 * `kubectl`, because `kubectl get pods --namespace delete` was the round-2 recorded over-denial.
 * ---------------------------------------------------------------------------------------------
 */
export const COMMAND_CHECKPOINT_RULES = [
    {
        checkpoint: "production_requires_human_confirmation",
        tool: "kubectl",
        verbs: ["apply", "rollout", "delete"],
        benign: ["get", "describe", "logs", "explain", "version", "config", "cluster-info", "top", "api-resources", "auth", "diff"],
    },
    { checkpoint: "production_requires_human_confirmation", tool: "helm", verbs: ["upgrade", "install"] },
    { checkpoint: "production_requires_human_confirmation", tool: "terraform", verbs: ["apply"] },
    { checkpoint: "production_requires_human_confirmation", tool: "gcloud", verbs: ["deploy"] },
    { checkpoint: "production_requires_human_confirmation", tool: "aws", verbs: ["deploy", "sync"] },
    { checkpoint: "production_requires_human_confirmation", tool: "serverless", verbs: ["deploy"] },
    { checkpoint: "production_requires_human_confirmation", tool: "sls", verbs: ["deploy"] },
    { checkpoint: "production_requires_human_confirmation", tool: "flyctl", verbs: ["deploy"] },
    { checkpoint: "production_requires_human_confirmation", tool: "fly", verbs: ["deploy"] },
    // `vercel deploy` without `--prod` is a PREVIEW deploy and is not governed; the literal pattern and
    // this row agree on that (plan 33 round-3 review, CR-01).
    { checkpoint: "production_requires_human_confirmation", tool: "vercel", verbs: [], flags: ["--prod"] },
    {
        checkpoint: "production_requires_human_confirmation",
        tool: "npm",
        verbs: ["publish"],
        resolvesVerbPrefix: true,
        // `npm run publish` is an ordinary package-script invocation, not a registry publish
        // (plan 30-11 round 4, reviewer 5's three NEW false denials).
        benign: ["run", "install", "ci", "test", "exec", "init", "ls", "audit", "pack", "version", "link", "view", "why", "outdated", "start", "update", "dedupe"],
    },
    {
        checkpoint: "production_requires_human_confirmation",
        tool: "yarn",
        verbs: ["publish"],
        resolvesVerbPrefix: true,
        // `yarn run publish` is an ordinary package-script invocation, not a registry publish
        // (plan 30-11 round 4, reviewer 5's three NEW false denials).
        benign: ["run", "install", "ci", "test", "exec", "init", "ls", "audit", "pack", "version", "link", "view", "why", "outdated", "start", "update", "dedupe"],
    },
    {
        checkpoint: "production_requires_human_confirmation",
        tool: "pnpm",
        verbs: ["publish"],
        resolvesVerbPrefix: true,
        // `pnpm run publish` is an ordinary package-script invocation, not a registry publish
        // (plan 30-11 round 4, reviewer 5's three NEW false denials).
        benign: ["run", "install", "ci", "test", "exec", "init", "ls", "audit", "pack", "version", "link", "view", "why", "outdated", "start", "update", "dedupe"],
    },
    { checkpoint: "protected_branch_merge", tool: "gh", verbs: ["merge"], benign: ["list", "view", "create", "checkout", "status", "diff", "comment"] },
    {
        checkpoint: "protected_branch_merge",
        tool: "git",
        verbs: ["update-ref", "push"],
        benign: [
            "commit", "add", "log", "show", "diff", "status", "rebase", "merge", "checkout", "branch",
            "fetch", "pull", "tag", "stash", "config", "remote", "reset", "restore", "switch",
            "cherry-pick", "revert", "describe", "blame", "grep", "ls-files", "rev-parse", "worktree",
            "submodule", "clean", "apply", "am", "bisect", "archive", "init", "clone", "mv", "rm",
            "notes", "reflog", "shortlog", "sparse-checkout", "hash-object", "cat-file", "rev-list",
        ],
    },
];
/**
 * The governed verb `candidate` spells for rule `r`, or `null` (plan 33-36).
 *
 * The verb itself spells itself. On a row that `resolvesVerbPrefix`, a candidate also spells a verb
 * when it is a prefix of exactly one word of the row's `verbs` ∪ `benign` and that word is a governed
 * verb — the discriminator is derived from the row's own arrays, and no short spelling is listed
 * anywhere. An empty candidate (a wholly-quoted `''`) prefixes every word, so it is ambiguous on
 * every row that carries the flag (each has benign words beside its verb).
 */
function spelledVerb(r, candidate) {
    if (r.verbs.includes(candidate))
        return candidate;
    if (r.resolvesVerbPrefix !== true)
        return null;
    const owners = [...r.verbs, ...(r.benign ?? [])].filter((w) => w.startsWith(candidate));
    const only = owners.length === 1 ? owners[0] : null;
    return only !== null && r.verbs.includes(only) ? only : null;
}
/** The protected branch names. One list; the push rule and the update-ref rule both read it. */
const PROTECTED_REF_RE = /^(?:refs\/heads\/)?(?:main|master)$|^(?:refs\/heads\/)?release\//;
/** The governed tool names, derived from the table and nowhere else. */
const GOVERNED_TOOLS = new Set(COMMAND_CHECKPOINT_RULES.map((r) => r.tool));
/** The executable subset of Windows `PATHEXT` — `git.exe` is the ordinary spelling on a Windows host. */
const WINDOWS_EXE_EXT_RE = /\.(?:exe|cmd|bat|com|ps1)$/;
const WINDOWS_EXE_EXT_SRC = "(?:\\.(?:exe|cmd|bat|com|ps1))?";
/** Unquoted characters that end a name: word separators and shell operators. */
const NAME_CUT_RE = /[\s;&|()<>]/;
/** Nesting deeper than this is not projected; the text is answered fail-closed (every governed tool). */
const MAX_PROJECTION_DEPTH = 32;
/** More name variants than this (brace alternations multiply) is answered fail-closed as well. */
const MAX_NAME_VARIANTS = 256;
const ANSI_C_SIMPLE = {
    a: "\x07", b: "\b", e: "\x1b", E: "\x1b", f: "\f", n: "\n", r: "\r", t: "\t", v: "\v",
    "\\": "\\", "'": "'", '"': '"', "?": "?",
};
/** Decode a `$'…'` body starting at `i` (just past the opening quote). Returns the chars and the index past the close. */
function decodeAnsiC(text, i) {
    let out = "";
    while (i < text.length) {
        const c = text[i];
        if (c === "'")
            return { chars: out, end: i + 1 };
        if (c !== "\\" || i + 1 >= text.length) {
            out += c;
            i++;
            continue;
        }
        const d = text[i + 1];
        const simple = ANSI_C_SIMPLE[d];
        if (simple !== undefined) {
            out += simple;
            i += 2;
            continue;
        }
        const num = (re, radix) => {
            const m = re.exec(text.slice(i + 2));
            if (!m || m[0] === "")
                return false;
            const cp = parseInt(m[0], radix);
            if (cp <= 0x10ffff)
                out += String.fromCodePoint(cp);
            i += 2 + m[0].length;
            return true;
        };
        if (/[0-7]/.test(d)) {
            const m = /^[0-7]{1,3}/.exec(text.slice(i + 1));
            out += String.fromCharCode(parseInt(m[0], 8) & 0xff);
            i += 1 + m[0].length;
            continue;
        }
        if (d === "x" && num(/^[0-9A-Fa-f]{1,2}/, 16))
            continue;
        if (d === "u" && num(/^[0-9A-Fa-f]{1,4}/, 16))
            continue;
        if (d === "U" && num(/^[0-9A-Fa-f]{1,8}/, 16))
            continue;
        if (d === "c" && i + 2 < text.length) {
            out += String.fromCharCode((text.charCodeAt(i + 2) & 0x1f) >>> 0);
            i += 3;
            continue;
        }
        out += c + d;
        i += 2;
    }
    return { chars: out, end: text.length };
}
/**
 * The index of the `close` matching an already-consumed `open`, starting at `from`; quote- and
 * escape-aware, nesting-aware. -1 when it never closes — the caller then treats the rest as the body.
 */
function matchingClose(text, from, open, close) {
    let depth = 1;
    for (let i = from; i < text.length; i++) {
        const c = text[i];
        if (c === "\\") {
            i++;
            continue;
        }
        if (c === "'") {
            const j = text.indexOf("'", i + 1);
            if (j === -1)
                return -1;
            i = j;
            continue;
        }
        if (c === '"' || c === "`") {
            let j = i + 1;
            while (j < text.length && text[j] !== c)
                j += text[j] === "\\" ? 2 : 1;
            if (j >= text.length)
                return -1;
            i = j;
            continue;
        }
        if (c === open)
            depth++;
        else if (c === close && --depth === 0)
            return i;
    }
    return -1;
}
/**
 * A `[…]` pathname bracket at `i`, as the regex source of ONE character, or null when the `[` is a
 * literal (no closing `]` inside the word). A POSIX class or a quote inside the bracket is answered
 * by the widest single character, `[^/]`, rather than parsed.
 */
function bracketAt(text, i) {
    let j = i + 1;
    let neg = false;
    if (text[j] === "!" || text[j] === "^") {
        neg = true;
        j++;
    }
    const bodyStart = j;
    if (text[j] === "]")
        j++;
    let wide = false;
    while (j < text.length && text[j] !== "]") {
        const c = text[j];
        if (/\s/.test(c) || c === "/")
            return null;
        if (c === "'" || c === '"') {
            const k = text.indexOf(c, j + 1);
            if (k === -1)
                return null;
            wide = true;
            j = k + 1;
            continue;
        }
        if (c === "[" && text[j + 1] === ":") {
            // A POSIX class (`[:alpha:]`) inside the bracket: skipped to its own `:]`, and answered wide.
            const k = text.indexOf(":]", j + 2);
            if (k === -1)
                return null;
            wide = true;
            j = k + 2;
            continue;
        }
        j += c === "\\" ? 2 : 1;
    }
    if (j >= text.length)
        return null;
    if (wide)
        return { src: "[^/]", end: j + 1 };
    const body = text.slice(bodyStart, j).replace(/\\(.)/g, "$1");
    const src = `[${neg ? "^" : ""}${Array.from(body, (ch) => (/[\\\]\[^]/.test(ch) ? `\\${ch}` : ch)).join("")}]`;
    try {
        new RegExp(src);
        return { src, end: j + 1 };
    }
    catch {
        return { src: "[^/]", end: j + 1 };
    }
}
/** A `{…}` brace expansion at `i`: the alternation or sequence it denotes, or null when it is a literal `{`. */
function braceAt(text, i, depth, out, ctx) {
    let level = 1;
    const commas = [];
    let j = i + 1;
    for (; j < text.length; j++) {
        const c = text[j];
        if (c === "\\") {
            j++;
            continue;
        }
        if (c === "'" || c === '"') {
            const k = text.indexOf(c, j + 1);
            if (k === -1)
                return null;
            j = k;
            continue;
        }
        if (/\s/.test(c))
            return null;
        if (c === "{")
            level++;
        else if (c === "}" && --level === 0)
            break;
        else if (c === "," && level === 1)
            commas.push(j);
    }
    if (j >= text.length)
        return null;
    const body = text.slice(i + 1, j);
    if (commas.length === 0) {
        const seq = /^(-?\d+|[A-Za-z])\.\.(-?\d+|[A-Za-z])(?:\.\.-?\d+)?$/.exec(body);
        if (!seq)
            return null;
        const [a, b] = [seq[1], seq[2]];
        if (/^-?\d+$/.test(a) && /^-?\d+$/.test(b))
            return { tok: { k: "class", src: "-?[0-9]+" }, end: j + 1 };
        if (a.length === 1 && b.length === 1 && /[A-Za-z]/.test(a) && /[A-Za-z]/.test(b)) {
            const [lo, hi] = a <= b ? [a, b] : [b, a];
            // `{A..z}` spans the six ASCII punctuation bytes between the cases, as bash's does.
            const src = `[${lo.replace(/[\\\]^]/, "\\$&")}-${hi.replace(/[\\\]^]/, "\\$&")}]`;
            return { tok: { k: "class", src }, end: j + 1 };
        }
        return null;
    }
    const bounds = [i, ...commas, j];
    const opts = [];
    for (let n = 0; n + 1 < bounds.length; n++) {
        const pieces = [];
        lexNames(text.slice(bounds[n] + 1, bounds[n + 1]), pieces, depth + 1, ctx);
        // An arm that itself contains a boundary (a substitution inside the braces) contributes its LAST
        // piece to the name; its other pieces are names of their own.
        for (let p = 0; p + 1 < pieces.length; p++)
            out.push(pieces[p]);
        opts.push(pieces.length > 0 ? pieces[pieces.length - 1] : []);
    }
    return { tok: { k: "alt", opts }, end: j + 1 };
}
/** Lex `text` as the shell would resolve it for NAME identity, appending one token list per name piece to `out`. */
function lexNames(text, out, depth, ctx) {
    if (depth > MAX_PROJECTION_DEPTH) {
        ctx.failClosed = true;
        return;
    }
    let cur = [];
    let gapPending = false;
    let wordStart = true;
    const cut = () => {
        if (cur.length > 0)
            out.push(cur);
        cur = [];
        gapPending = false;
        wordStart = true;
    };
    const push = (t) => {
        // A re-projected expansion (see `projectNames`) is an expansion at this level too, wherever it sits.
        if (t.k === "lit" && t.c === GAP_SENTINEL) {
            gapPending = true;
            wordStart = false;
            return;
        }
        if (gapPending && cur.length > 0)
            cur.push({ k: "gap" });
        gapPending = false;
        wordStart = false;
        cur.push(t);
    };
    const lits = (s) => {
        for (const ch of s)
            push({ k: "lit", c: ch });
    };
    /** An expansion: its body (if any) is projected on its own; in the word it is a gap or a cut. */
    const expansion = (body) => {
        if (body !== null)
            lexNames(body, out, depth + 1, ctx);
        gapPending = true;
        wordStart = false;
    };
    /** A `$…` form at `i`. Returns the index past it, or -1 when the `$` is a literal. */
    const dollar = (i) => {
        const nx = text[i + 1];
        if (nx === "(") {
            const close = matchingClose(text, i + 2, "(", ")");
            expansion(text.slice(i + 2, close === -1 ? text.length : close));
            return close === -1 ? text.length : close + 1;
        }
        if (nx === "{") {
            const close = matchingClose(text, i + 2, "{", "}");
            const inner = text.slice(i + 2, close === -1 ? text.length : close);
            // A parameter's WORD — the text after its name and operator (`${x:-git}`, `${x/a/git}`) — is
            // what the expansion may produce. The name itself is not.
            const word = inner
                .replace(/^[#!]?(?:[A-Za-z_][A-Za-z0-9_]*|[0-9]+|[@*#?$!-])(?:\[[^\]]*\])?/, "")
                .replace(/^(?::?[-=+?]|##?|%%?|\/{1,2}|\^{1,2}|,{1,2}|:|@)/, "");
            expansion(word);
            return close === -1 ? text.length : close + 1;
        }
        if (nx === "[") {
            const close = matchingClose(text, i + 2, "[", "]");
            expansion(text.slice(i + 2, close === -1 ? text.length : close));
            return close === -1 ? text.length : close + 1;
        }
        const m = /^\$(?:[A-Za-z_][A-Za-z0-9_]*|[0-9@*#?$!-])/.exec(text.slice(i));
        if (m) {
            expansion(null);
            return i + m[0].length;
        }
        return -1;
    };
    const backtick = (i) => {
        let j = i + 1;
        while (j < text.length && text[j] !== "`")
            j += text[j] === "\\" ? 2 : 1;
        expansion(text.slice(i + 1, Math.min(j, text.length)).replace(/\\([\\`$])/g, "$1"));
        return Math.min(j + 1, text.length);
    };
    /** A `"…"` body starting at `i`; returns the index past the closing quote. */
    const doubleQuoted = (i) => {
        while (i < text.length) {
            const c = text[i];
            if (c === '"')
                return i + 1;
            if (c === "\\" && i + 1 < text.length) {
                const d = text[i + 1];
                if (d === "\n") {
                    i += 2;
                    continue;
                }
                if ("$`\"\\".includes(d)) {
                    push({ k: "lit", c: d });
                    i += 2;
                    continue;
                }
            }
            if (c === "$") {
                const end = dollar(i);
                if (end !== -1) {
                    i = end;
                    continue;
                }
            }
            if (c === "`") {
                i = backtick(i);
                continue;
            }
            push({ k: "lit", c });
            i++;
        }
        return text.length;
    };
    for (let i = 0; i < text.length;) {
        const c = text[i];
        if (c === "\\") {
            if (i + 1 < text.length && text[i + 1] !== "\n")
                push({ k: "lit", c: text[i + 1] });
            i += 2;
            continue;
        }
        if (c === "'") {
            const j = text.indexOf("'", i + 1);
            const end = j === -1 ? text.length : j;
            lits(text.slice(i + 1, end));
            if (end === i + 1)
                wordStart = false;
            i = end + 1;
            continue;
        }
        if (c === "$" && text[i + 1] === "'") {
            const { chars, end } = decodeAnsiC(text, i + 2);
            lits(chars);
            wordStart = false;
            i = end;
            continue;
        }
        if (c === "$" && text[i + 1] === '"') {
            wordStart = false;
            i = doubleQuoted(i + 2);
            continue;
        }
        if (c === '"') {
            wordStart = false;
            i = doubleQuoted(i + 1);
            continue;
        }
        if (c === "$") {
            const end = dollar(i);
            if (end !== -1) {
                i = end;
                continue;
            }
        }
        if (c === "`") {
            i = backtick(i);
            continue;
        }
        if ((c === "<" || c === ">") && text[i + 1] === "(") {
            cut();
            const close = matchingClose(text, i + 2, "(", ")");
            lexNames(text.slice(i + 2, close === -1 ? text.length : close), out, depth + 1, ctx);
            i = close === -1 ? text.length : close + 1;
            continue;
        }
        if (NAME_CUT_RE.test(c)) {
            cut();
            i++;
            continue;
        }
        // zsh EQUALS expansion: an unquoted `=` opening a word is the path of the command that follows.
        if (c === "=" && wordStart && cur.length === 0 && i + 1 < text.length && !NAME_CUT_RE.test(text[i + 1])) {
            wordStart = false;
            i++;
            continue;
        }
        if (c === "*") {
            push({ k: "star" });
            i++;
            continue;
        }
        if (c === "?") {
            push({ k: "one" });
            i++;
            continue;
        }
        if (c === "[") {
            const b = bracketAt(text, i);
            if (b) {
                push({ k: "class", src: b.src });
                i = b.end;
                continue;
            }
        }
        if (c === "{") {
            const b = braceAt(text, i, depth, out, ctx);
            if (b) {
                push(b.tok);
                i = b.end;
                continue;
            }
        }
        push({ k: "lit", c });
        i++;
    }
    cut();
}
/**
 * The possible BASENAMES of one name piece: the tokens after its last path separator. A brace arm that
 * carries a separator restarts the basename inside that arm; `restarted` says so, so the text before
 * the brace is dropped for that arm only. `null` = more variants than `MAX_NAME_VARIANTS`.
 */
function basenameVariants(toks) {
    let res = [{ toks: [], restarted: false }];
    for (const t of toks) {
        if (t.k === "lit" && (t.c === "/" || t.c === "\\")) {
            res = [{ toks: [], restarted: true }];
            continue;
        }
        if (t.k === "alt") {
            const next = [];
            for (const o of t.opts) {
                const sub = basenameVariants(o);
                if (sub === null)
                    return null;
                for (const s of sub) {
                    if (s.restarted)
                        next.push({ toks: [...s.toks], restarted: true });
                    else
                        for (const r of res)
                            next.push({ toks: [...r.toks, ...s.toks], restarted: r.restarted });
                }
            }
            if (next.length > MAX_NAME_VARIANTS)
                return null;
            res = next;
            continue;
        }
        for (const r of res)
            r.toks.push(t);
    }
    return res;
}
/** The longest literal basename worth comparing: the longest governed name plus a Windows extension. */
const MAX_LITERAL_NAME = Math.max(...[...GOVERNED_TOOLS].map((t) => t.length)) + 4;
/** Add to `into` every governed tool one basename variant can be. A variant of wildcards alone names nothing. */
function namesOfVariant(toks, into) {
    let literal = true;
    let content = false;
    for (const t of toks) {
        if (t.k !== "lit")
            literal = false;
        if (t.k === "lit" || t.k === "class")
            content = true;
    }
    if (!content)
        return;
    if (literal) {
        if (toks.length > MAX_LITERAL_NAME)
            return;
        const s = toks
            .map((t) => t.c)
            .join("")
            .toLowerCase()
            .replace(WINDOWS_EXE_EXT_RE, "");
        if (GOVERNED_TOOLS.has(s))
            into.add(s);
        return;
    }
    const src = toks
        .map((t) => {
        if (t.k === "lit")
            return t.c.replace(/[.*+?^${}()|[\]\\/-]/g, "\\$&");
        if (t.k === "star" || t.k === "gap")
            return "[^/]*";
        if (t.k === "one")
            return "[^/]";
        if (t.k === "class")
            return t.src;
        return "";
    })
        .join("");
    let re;
    try {
        re = new RegExp(`^(?:${src})${WINDOWS_EXE_EXT_SRC}$`, "i");
    }
    catch {
        for (const tool of GOVERNED_TOOLS)
            into.add(tool); // a pattern this function cannot build is answered fail-closed
        return;
    }
    for (const tool of GOVERNED_TOOLS)
        if (re.test(tool))
            into.add(tool);
}
/** The top-level lits after a piece's last top-level path separator, or -1 when an alternation follows it. */
function tailLiteralCount(toks) {
    let n = 0;
    for (const t of toks) {
        if (t.k === "lit" && (t.c === "/" || t.c === "\\"))
            n = 0;
        else if (t.k === "lit")
            n++;
        else if (t.k === "alt")
            return -1;
    }
    return n;
}
/**
 * Add to `into` every governed tool one name piece can be, reading each of its gaps (an expansion
 * with literal text on both sides) BOTH as empty — `g${x}it` — and as a word boundary —
 * `echo${x}git` with `x=';'` (33 round 4, D-33-R4-03). The whole piece, gaps as `[^/]*`, is the
 * empty reading; every contiguous run of gap-delimited stretches is a boundary reading. A run whose
 * mandatory literals after its last separator already outnumber the longest governed name cannot
 * name one, and nor can any longer run from the same start (a later separator restarts the basename,
 * and that restart is the run starting at the stretch holding it). `false` = more variants than
 * `MAX_NAME_VARIANTS`, answered fail-closed by the caller.
 */
function namesOfPiece(piece, into) {
    const whole = basenameVariants(piece);
    if (whole === null)
        return false;
    for (const v of whole)
        namesOfVariant(v.toks, into);
    const stretches = [[]];
    for (const t of piece) {
        if (t.k === "gap")
            stretches.push([]);
        else
            stretches[stretches.length - 1].push(t);
    }
    if (stretches.length === 1)
        return true;
    for (let i = 0; i < stretches.length; i++) {
        let run = [];
        for (let j = i; j < stretches.length; j++) {
            if (i === 0 && j === stretches.length - 1)
                break; // the whole piece, already read above
            run = j > i ? [...run, { k: "gap" }, ...stretches[j]] : [...stretches[j]];
            const variants = basenameVariants(run);
            if (variants === null)
                return false;
            for (const v of variants)
                namesOfVariant(v.toks, into);
            if (tailLiteralCount(run) > MAX_LITERAL_NAME)
                break;
        }
    }
    return true;
}
/**
 * The private-use character a re-projected text carries where an expansion stood. `lexNames` reads it
 * as an expansion wherever it sits, so the nested reading keeps the gap's two readings (empty and
 * boundary) rather than guessing one. A command that spells it itself only gains a gap: more names.
 */
const GAP_SENTINEL = "\uE000";
/** Characters whose presence means a nested shell would read a text differently from its literal value. */
const NESTED_SIGNIFICANT_RE = /[\s;&|()<>'"\\$`{}*?[\]=]/;
/** Does a piece carry a literal a nested shell would read as syntax? Only such a piece is re-projected. */
function pieceIsSignificant(toks) {
    for (const t of toks) {
        if (t.k === "lit" && NESTED_SIGNIFICANT_RE.test(t.c))
            return true;
        if (t.k === "alt" && t.opts.some((o) => pieceIsSignificant(o)))
            return true;
    }
    return false;
}
/**
 * The texts a piece RESOLVES to — one per brace alternative — as a nested shell would receive them:
 * a literal is itself, a gap is `GAP_SENTINEL`, a pathname pattern is its own glob character. `null`
 * = more alternatives than `MAX_NAME_VARIANTS`.
 */
function resolvedTexts(toks) {
    let res = [""];
    for (const t of toks) {
        if (t.k === "alt") {
            const next = [];
            for (const o of t.opts) {
                const sub = resolvedTexts(o);
                if (sub === null)
                    return null;
                for (const r of res)
                    for (const s of sub)
                        next.push(r + s);
            }
            if (next.length > MAX_NAME_VARIANTS)
                return null;
            res = next;
            continue;
        }
        const ch = t.k === "lit" ? t.c : t.k === "gap" ? GAP_SENTINEL : t.k === "star" ? "*" : "?";
        res = res.map((r) => r + ch);
    }
    return res;
}
/** Work allowed per character of the asked text, across every re-projection. Beyond it: fail-closed. */
const PROJECTION_WORK_PER_CHAR = MAX_PROJECTION_DEPTH;
const PROJECTION_WORK_FLOOR = 65_536;
/**
 * Lex `text` at `depth`, add every governed name its pieces can be, and RE-PROJECT each piece whose
 * shell-resolved text a nested shell would read differently (33 round 4, D-33-R4-03).
 *
 * WHY A PIECE IS PROJECTED AGAIN. A quoted word is data to THIS shell and a command to the next one:
 * `bash -c 'g\it push origin main' $X`, `eval 'g\it' push origin main`, `bash <<< 'n\pm publish'`.
 * One layer of quote removal leaves `g\it push origin main` — a splice the next shell removes. So the
 * resolved text of every piece is lexed again as shell text, recursively, until it stops changing,
 * bounded by `MAX_PROJECTION_DEPTH` and a work budget, and answered with every governed tool beyond
 * either bound. This is the one projection both arms ask; no arm keeps a nested-command queue of its
 * own for it.
 */
function projectNames(text, depth, ctx, into) {
    ctx.work += text.length + 1;
    if (ctx.work > ctx.budget) {
        ctx.failClosed = true;
        return;
    }
    const pieces = [];
    lexNames(text, pieces, depth, ctx);
    if (ctx.failClosed)
        return;
    for (const p of pieces) {
        if (!namesOfPiece(p, into)) {
            ctx.failClosed = true;
            return;
        }
        if (!pieceIsSignificant(p))
            continue;
        const texts = resolvedTexts(p);
        if (texts === null) {
            ctx.failClosed = true;
            return;
        }
        for (const t of texts) {
            if (t === text)
                continue;
            projectNames(t, depth + 1, ctx, into); // D-33-R4-03: the nested re-projection
            if (ctx.failClosed)
                return;
        }
    }
}
/**
 * Every governed tool `text` can run, as far as NAME identity goes — see the block above `NameTok`
 * and `projectNames`. Asked of one spelled word by the readable arm and of a whole unreadable segment
 * by the fail-closed arm: one authority, two callers.
 */
export function governedToolsNamedBy(text) {
    const out = new Set();
    const ctx = {
        failClosed: false,
        work: 0,
        budget: PROJECTION_WORK_PER_CHAR * text.length + PROJECTION_WORK_FLOOR,
    };
    projectNames(text, 0, ctx, out);
    return ctx.failClosed ? GOVERNED_TOOLS : out;
}
function verbCandidates(words, from) {
    const out = [];
    let opaque = false;
    const unreadable = [];
    // AN ALIAS VALUE IS READ WHOLE OR NOT AT ALL (plan 30-11 round 4, `RA5-3`).
    //
    // Round 3 read the value's FIRST TOKEN and then pushed the whole raw value as one more candidate.
    // For `alias.p='push origin main'` that made the list `["push", "alias.p=push origin main", "p"]`,
    // so `gitPushIsGoverned` saw two words after `push` and read the LAST — `"p"` — as the refspec.
    // Not protected, not governed. Measured against real git 2.55.0 with a real bare remote:
    // `git -c alias.p='push --force origin main' p` performed a **force push to main**, the one command
    // `PROTECTED_BRANCH_PATTERNS` governs unconditionally on every branch.
    //
    // The `.split()[0]` read is DELETED rather than corrected. An alias value that is not a single
    // canonical word is a command this model cannot read, and reading half of it produced a candidate
    // list the command does not have. Refusing the near-miss is D-64's posture; half-reading it is what
    // this whole surface has spent four rounds deleting.
    const readAlias = (raw) => {
        const m = /^alias\.[^=]+=(.+)$/.exec(raw);
        if (!m)
            return;
        const value = m[1].trim();
        if (CANONICAL_WORD_RE.test(value))
            out.push(value);
        else {
            opaque = true;
            unreadable.push(raw);
        }
    };
    for (let j = from; j < words.length; j++) {
        const w = words[j];
        // A redirection word is skipped here as a matter of KIND: it is neither a verb nor a flag.
        if (w.kind !== "canonical")
            continue;
        if (w.isFlag) {
            const m = /^-{1,2}c(?:onfig)?=?(.*)$/.exec(w.value);
            if (m && m[1])
                readAlias(m[1]);
            continue;
        }
        readAlias(w.value);
        out.push(w.value);
    }
    return { values: out, opaque, unreadable };
}
/**
 * The first candidate after the tool, or `null` when a FLAG comes first.
 *
 * ---------------------------------------------------------------------------------------------
 * `benign` MAY ONLY SUPPRESS ADJACENT TO THE TOOL (plan 30-11 round 4, `RA5-2`).
 *
 * Round 3 let any `benign` word anywhere after the tool decide the segment. `verbCandidates` cannot
 * tell a SUBCOMMAND from the OPERAND OF A PRECEDING FLAG — that is the per-tool flag grammar this
 * model refuses to maintain — so a flag whose value happened to be a benign word suppressed the whole
 * segment. Measured, and executed against real `git` and real `kubectl`:
 *
 *     git -C log push origin main          ALLOW   (control: git -C . push origin main -> DENY)
 *     git -C notes push origin main        ALLOW
 *     kubectl --cache-dir version apply …  ALLOW   (control: kubectl -n prod apply -f x -> DENY)
 *     kubectl -n get apply -f x.yaml       ALLOW
 *
 * The discriminator between allow and deny was whether a directory happened to be named `log` — a
 * word the agent picks. The round's admissibility rule was stated about a set's MEMBERSHIP (a missing
 * member over-refuses, which is safe) and said nothing about POSITION, which is the axis it was
 * attacked on. So the position is REMOVED rather than the grammar extended: a benign word suppresses
 * only when it is the first thing after the tool with no flag in between, which is the one position
 * this model can justify without knowing any tool's flags.
 * ---------------------------------------------------------------------------------------------
 */
function adjacentWord(words, from) {
    for (let j = from; j < words.length; j++) {
        const w = words[j];
        // A redirection is not part of the tool's argument list — `git 2>&1 commit` is `git commit` —
        // so it neither decides nor intervenes (plan 33-27). An opaque word still ends the search.
        if (w.kind === "redirection")
            continue;
        if (w.kind !== "canonical")
            return null;
        if (w.isFlag)
            return null; // a flag intervenes: nothing after it is a justifiable decider
        return w.value;
    }
    return null;
}
/**
 * The force-push flags, which `PROTECTED_BRANCH_PATTERNS`' first regex governs on ANY branch:
 * *"Deny a force push (any branch — a force push is destructive enough to gate)"*.
 */
const FORCE_PUSH_FLAGS = new Set(["--force", "-f", "--force-with-lease"]);
/** Is this `git push` occurrence governed? See the rule statement below. */
function gitPushIsGoverned(candidates, words) {
    const at = candidates.indexOf("push");
    if (at === -1)
        return false;
    // THE FORCE ARM, WHICH THE MODEL NEVER IMPLEMENTED (plan 30-11 round 4, found by this plan's own
    // corpus while fixing `RA5-2`). The literal pattern governs a force push on ANY branch; the model
    // only ever asked about the refspec. That was invisible while the literal pattern caught every
    // force push it saw — and it needs `git` ADJACENT to `push`, so `git -C log push --force origin
    // feature` matched neither authority and executed. The model now carries the same rule the literal
    // set already declares, rather than a narrower one beside it.
    if (words.some((w) => w.kind === "canonical" && w.isFlag && FORCE_PUSH_FLAGS.has(w.value))) {
        return true;
    }
    const after = candidates.slice(at + 1);
    if (after.length < 2)
        return true; // no refspec named at all
    const ref = after[after.length - 1];
    if (ref === "HEAD" || ref === "@")
        return true;
    return PROTECTED_REF_RE.test(ref);
}
/**
 * XARGS: A COMMAND COMPLETED FROM STDIN (plan 33-36, T-33-167).
 *
 * ---------------------------------------------------------------------------------------------
 * xargs appends the words it reads on stdin to its command and runs the result, so
 * `echo publish | xargs npm` runs `npm publish` with no verb on the line (corpus rows LB-02..LB-04,
 * each measured executable). Every word after an xargs word in a segment is part of that command,
 * so a governed tool named there is decided with the stdin words UNKNOWN:
 *   - it DENIES on the tool name alone (the fail-closed arm), unless
 *   - the word adjacent to the tool is one of its `benign` subcommands (`xargs git log`): appended words
 *     land after that subcommand and cannot change it — the same adjacency rule as everywhere else.
 * A visible governed verb does not rescue it either: `xargs git push origin feature` pushes the refs
 * stdin appends as well.
 *
 * WHY EVERY WORD AFTER XARGS, NOT ONLY XARGS'S OPERAND. The operand of `xargs env npm` is `env`, and
 * `env npm publish` is what runs (measured). Telling a launcher operand from `xargs grep kubectl`
 * needs a list of launchers — a set whose incompleteness under-refuses, which this file does not
 * keep. So a governed NAME anywhere in xargs's command decides, and `xargs grep -l kubectl` denies:
 * the recorded over-denial, the same one `grep -rn kubectl apply docs/` already carries at the top
 * level.
 *
 * TWO READINGS CARRY THE FEED FURTHER.
 *   - A nested body in xargs's command (`xargs sh -c 'npm "$@"' _`) receives the stdin words as its
 *     positional parameters, so its segments are fed too and every word in them is decided this way.
 *   - A REPLACE STRING (`-I`, `-i`, `--replace`, BSD `-J`) is rewritten in every word of the command,
 *     the adjacent benign word included — `echo push | xargs -I status git status origin main` runs a
 *     push (measured) — so under a replace flag an adjacent benign word no longer decides.
 *
 * WHAT NAMES XARGS. A canonical word whose basename, lower-cased and stripped of a leading `=` and a
 * Windows executable extension, ends in `xargs`: `xargs`, `/usr/bin/xargs`, `'xargs'`, and GNU
 * findutils' `gxargs` (installed under that name by Homebrew on the measuring host). Any other
 * spelling of it is not canonical, so its segment is opaque and the fail-closed arm names the tool.
 * ---------------------------------------------------------------------------------------------
 */
const XARGS_NAME_RE = /xargs$/;
/** A flag that sets xargs's replace string: GNU `-I`, `-i`, `--replace`, BSD `-J` (in a short cluster too). */
const XARGS_REPLACE_FLAG_RE = /^(?:-[^-]*[IiJ]|--replace(?:=|$))/;
/** Does this word run xargs? See the block above. */
function isXargsWord(w) {
    if (w.kind !== "canonical" || w.isFlag)
        return false;
    const base = w.value.split(/[\\/]/).pop().toLowerCase().replace(/^=/, "").replace(WINDOWS_EXE_EXT_RE, "");
    return XARGS_NAME_RE.test(base);
}
/**
 * The words that made a segment opaque, for the deny text. Opaque-kind words first; when the raw-level
 * substitution test is what fired (a `$(…)` inside a wholly-quoted word this classifier read as one
 * value), the words carrying that form; the whole segment only if neither names anything.
 */
function unreadableWords(seg) {
    const opaque = seg.words.filter((w) => w.kind === "opaque").map((w) => w.value);
    if (opaque.length > 0)
        return opaque;
    const carrying = seg.words.filter((w) => UNRESOLVABLE_SHELL_RE.test(w.value)).map((w) => w.value);
    return carrying.length > 0 ? carrying : [seg.raw];
}
/**
 * The fail-closed answer for a segment this model will not read: which checkpoints does it touch,
 * judged on the TOOL NAMES it can run alone?
 *
 * ---------------------------------------------------------------------------------------------
 * THE VERB CONJUNCT IS GONE (round 3, `RA3-4`).
 *
 * Round 2 required BOTH `\btool\b` and `\bverb\b`. Measured: `kubectl -n prod ap$(echo ply) -f x`
 * and `git pu$(echo sh) origin main` are untokenizable AND unmatched, because the same edit that
 * made the segment unreadable removed the token the backstop searched for. An unreadable segment
 * denies on the TOOL NAME alone. The over-denial that buys — `git commit -m "push \"x\""` — is the
 * round-2 recorded residual, unchanged in kind.
 *
 * THE TOOL NAME IS ASKED OF THE PROJECTION, AND OF THE RAW TEXT BESIDE IT (33 round-3 review, CR-01).
 *
 * The name is asked of `governedToolsNamedBy`, which reads the text as the shell — and, recursively,
 * the next shell — resolves it. The raw whole-word search for each tool is KEPT beside it, so every
 * segment the raw search refused is still refused: the union can only add denials. A splice of the
 * TOOL word (a backslash, an empty quote pair, a quoted letter, zsh's `=`) therefore names its tool,
 * at the top level and inside a quoted nested command.
 *
 * WHAT THE ROUND-4 TESTS SHOW CLOSED (each ALLOWED with zero keys on the round-3 build, each measured
 * executable, each now denied through the shipped wrapper — corpus `scripts/fixtures/cr01-nested-corpus.json`):
 *   - a governed command quoted for a nested shell (`bash -c`, `sh -c`, `eval`, a here-string), with
 *     the tool spliced one layer down, beside an unreadable word or not (plan 33-35; rows V4-*, R4-*);
 *   - a governed verb spelled as a unique prefix the tool itself resolves (plan 33-36; row LB-01) —
 *     `resolvesVerbPrefix`, derived from the row's own verbs and benign words;
 *   - a governed tool in a command xargs completes from stdin, including a launcher between xargs and
 *     the tool, a nested body fed the stdin words, and a replace string over a benign word (plan 33-36;
 *     rows LB-02..LB-04) — see the block above `XARGS_NAME_RE`.
 *
 * WHAT IT STILL DOES NOT SEE — each measured ALLOW on the round-4 build, stated rather than implied
 * closed:
 *   - a name COMPUTED at run time. The two corpus residual rows (RES-01, RES-02): a tool assembled
 *     from a shell variable and passed to a nested shell, and a nested body produced by a command
 *     substitution. The same class: a variable at a word's edge at the top level, a variable assigned
 *     inside a nested body, text a formatter assembles and pipes to a shell, and a tool name an xargs
 *     replace string assembles. The value of an expansion at a word's edge is unknowable here — the
 *     env-indirection residual `hooks/guard.ts` already discloses;
 *   - a binary reached under ANOTHER name: a symlink, a copy, an alias or a function defined in an
 *     earlier command, a wildcard-only path over a directory holding only a governed binary;
 *   - glob grammars this function does not model: zsh `(a|b)` grouping and bash `extglob`, which are
 *     off by default in the shells a hook's command is run under;
 *   - interpreters that are not the shell (`python -c`, `node -e`, `env -S`) with the name assembled in
 *     the interpreter's own string syntax;
 *   - a stdin-to-argument launcher other than xargs. GNU parallel reads its arguments from stdin the
 *     same way; it was not installed on the measuring host (`UNKNOWN - verify`), and the parallel that
 *     was (moreutils) does not read stdin, so no row pins it;
 *   - git's `help.autocorrect`: with it on — it is on in the measuring host's global config, and
 *     `-c help.autocorrect=immediate` turns it on for one command — git runs a near-miss spelling of
 *     `push` as a push (measured against a scratch bare remote). The verb match compares exact words
 *     and the unique-prefix rule is a different, prefix-only class;
 *   - the classes the phase LEDGER carries rather than this code (plan 33-43): git's `send-pack`, the
 *     `gh api` pull-request merge endpoint, git-core's dashed push binary under its libexec path, the
 *     `-c alias.<x>=push` form of a bare push (WINDOWS.md row 259), and deploy verbs outside
 *     `COMMAND_CHECKPOINT_RULES` (a scope decision of the table, not a spelling).
 *
 * WHAT IT REFUSES THAT IT NEED NOT — the recorded over-denials this posture buys: a quoted message
 * carrying an escaped quote beside a governed tool name; a governed tool NAME used as an operand under
 * xargs (a search for the word `kubectl` over files xargs lists; a commit message naming a governed
 * tool, committed under xargs; `gh pr view` under xargs, whose two-level subcommand has no adjacent
 * benign word); and, on the rows that resolve a prefix, a short operand that happens to begin their
 * governed verb. Each is refused on the name alone, never allowed on a guess.
 * ---------------------------------------------------------------------------------------------
 */
function failClosedCheckpoints(text) {
    const named = governedToolsNamedBy(text);
    const out = [];
    for (const r of COMMAND_CHECKPOINT_RULES) {
        if (named.has(r.tool) || new RegExp(`(?:^|[^A-Za-z0-9_-])${r.tool}(?:[^A-Za-z0-9_-]|$)`).test(text)) {
            out.push(r.checkpoint);
        }
    }
    return out;
}
/**
 * Which checkpoints does this command touch?
 *
 * EVERY canonical non-flag word is a candidate tool. There is no "the tool of this segment" any more,
 * which is what deletes the wrapper set, the flag-argument question and the reserved-word question in
 * one move (`RA3-2`, `RA3-3`).
 *
 * For each tool occurrence, the FIRST candidate after it that is either a governed verb or a `benign`
 * subcommand DECIDES: a benign one suppresses the occurrence, a governed one matches it. When no
 * candidate decides, the fail-closed answer applies — any governed verb anywhere after the tool
 * matches.
 */
export function matchCommandCheckpoints(cmd) {
    const readable = new Set();
    const failClosed = new Set();
    const unreadable = [];
    let untokenizable = false;
    // The ONE fail-closed arm: the tool names of an unreadable text, and the words that made it so.
    const refuse = (text, words) => {
        untokenizable = true;
        for (const id of failClosedCheckpoints(text))
            failClosed.add(id);
        for (const w of words)
            if (!unreadable.includes(w))
                unreadable.push(w);
    };
    // A governed tool in a command xargs completes from stdin: decided on the tool name alone, the same
    // fail-closed arm, naming the command it would not read (plan 33-36).
    const completedFromStdin = (id, text) => {
        untokenizable = true;
        failClosed.add(id);
        const t = text.trim();
        if (!unreadable.includes(t))
            unreadable.push(t);
    };
    const result = () => ({
        checkpoints: new Set([...readable, ...failClosed]),
        untokenizable,
        readable,
        failClosed,
        unreadable,
    });
    const segs = commandSegments(cmd);
    if (segs === null) {
        refuse(cmd, [cmd]);
        return result();
    }
    const queue = segs.map((seg) => ({ seg, fed: null }));
    // NO SEGMENT CAP (plan 30-11 round 4, `RA5-1`).
    //
    // Round 3 wrote `while (queue.length > 0 && depth < 64)`, where `depth` counted SEGMENTS CONSUMED
    // rather than nesting. Segment 65 onward was never classified, never scanned, and never reached
    // `failClosedCheckpoints` — the loop simply ended and nothing was marked untokenizable. Measured:
    // 64 `true ;` then `kubectl -n prod apply -f x`, `gh pr merge 12`, `helm -n prod upgrade rel c`,
    // `git -C sub push origin main` — and even `kubectl ap$(echo ply) -f x`, whose whole point is the
    // fail-closed scan — all ALLOW, executably. A 64-token prefix removed the model AND its backstop.
    //
    // The cap is DELETED rather than made fail-closed, because it was bounding the wrong thing. Work
    // here is already bounded twice: `commandSegments` refuses beyond nesting depth 3, and the number
    // of segments is bounded by the input length. Reviewer 5 measured the worst case at 466 ms for a
    // 2 MB command, and reviewer 3 measured 5 MB at under 500 ms. A bound that silently drops evidence
    // is worse than the cost it was avoiding.
    //
    // OPAQUE IS DECIDED PER SEGMENT, AND A REDIRECTION IS NOT OPAQUE (plan 33-27). A segment is opaque
    // whenever ANY of its words is — a `redirection` word is a third kind, read by `REDIRECTION_RE`, so
    // a segment whose only punctuation was a redirection is now read by the model below; nothing else
    // about this arm changes. Readable by grammar, or opaque: there is no third state. A bare `$var` and
    // a heredoc are opaque BY DECISION — a variable's value is unknowable at hook time, and a heredoc's
    // body lines are commands to this tokenizer. An opaque segment denies on the tool NAMES it can run,
    // asked of `governedToolsNamedBy` (33 round-3 review, CR-01). Round 3 wrote here that the P30 fence
    // was "a backstop the triggering edit cannot defeat"; it was not — a splice of the TOOL word
    // defeated it — and what it still does not see is listed at `failClosedCheckpoints`.
    while (queue.length > 0) {
        const { seg, fed } = queue.shift();
        if (seg.opaque) {
            refuse(seg.raw, unreadableWords(seg));
            continue;
        }
        const words = seg.words;
        // The stdin feed word `i` receives: the segment's own (a nested body under xargs), or an xargs word
        // before it in this segment — with a replace string when a replace flag sits between them.
        const xargsAt = words.findIndex(isXargsWord);
        const feedAt = (i) => {
            const local = xargsAt !== -1 && i > xargsAt;
            if (fed === null && !local)
                return null;
            const replace = (fed?.replace ?? false) ||
                (local &&
                    words.slice(xargsAt + 1, i).some((x) => x.kind === "canonical" && x.isFlag && XARGS_REPLACE_FLAG_RE.test(x.value)));
            return { replace };
        };
        for (let i = 0; i < words.length; i++) {
            const w = words[i];
            if (w.kind !== "canonical" || w.isFlag)
                continue;
            // ANY MULTI-WORD VALUE IS A NESTED COMMAND (plan 30-11 round 4, `RA5-4`).
            //
            // `NESTED_SHELLS = {sh,bash,zsh,dash,ksh}` was a hand-maintained set whose incompleteness
            // UNDER-refuses — the exact property the `benign` table's own admissibility rule declares
            // inadmissible. `eval` is the shell itself with `sh -c` semantics and was not in it:
            // `eval 'kubectl -n prod apply -f x'` and `eval 'gh pr merge 12'` both ALLOW and both execute.
            //
            // It is DELETED the way `WRAPPERS` was: nothing enumerates which tools take a command as an
            // operand. Any canonical word whose value carries whitespace is re-tokenized as a command, so
            // `eval`, `watch`, `xargs -I{} sh -c`, `su -c`, `timeout … sh -c` and every future launcher are
            // covered without naming one of them.
            //
            // THE TENSION REVIEWER 5 NAMED, MEASURED RATHER THAN ASSUMED. The concern was that this
            // resurrects `git commit -m 'push to main'`. It does not: re-tokenizing `push to main` yields a
            // segment whose words name NO governed tool, so nothing matches. Re-tokenization only bites
            // when the quoted content names a tool — which is what `eval 'kubectl …'` does and what a
            // commit message does not. The residual cost is a message that contains a whole governed
            // command (`git commit -m 'git push origin main'`), which is recorded rather than parsed away.
            //
            // …AND ANY QUOTED VALUE WHOSE NEXT-SHELL READING NAMES A GOVERNED TOOL (33.1-01, rule C2 of the
            // D-01 canonical-form cutover; 33 round-4 review CR-01, WINDOWS.md row 301). Whitespace was a
            // proxy for "this value is a command", and a nested shell needs none: a brace list or an `$IFS`
            // join is one whitespace-free word to this tokenizer and a full governed command to the shell
            // that re-reads it. Measured on the committed build: such a body ALLOWED at both entry points
            // with zero keys, and executed. The trigger therefore also fires when `governedToolsNamedBy` —
            // the ONE projection the fail-closed arm asks — names a tool in the VALUE. The re-read goes
            // through the same `commandSegments` and the same queue, so a body the grammar cannot read
            // becomes an opaque nested segment and is refused on the tool name.
            //
            // THE PROGRESS CONDITION IS LOAD-BEARING. It fires only when the value differs from the spelling
            // (a quote or an escape was removed). A canonical word's value is its spelling with quoting
            // stripped, so a re-read value is STRICTLY SHORTER than the word it came from and the queue
            // terminates. Without it a bare `git` re-reads to `git` forever. A word spelled with no quoting
            // is read in this segment already; there is no next-shell reading to ask about.
            if (/\s/.test(w.value) || (w.value !== w.raw && governedToolsNamedBy(w.value).size > 0)) {
                const nested = commandSegments(w.value, 1);
                if (nested === null)
                    refuse(w.value, [w.value]);
                else
                    queue.push(...nested.map((n) => ({ seg: n, fed: feedAt(i) })));
            }
            // The tool this word runs is asked of the ONE projection the fail-closed arm also asks, over the
            // word as SPELLED (33 round-3 review, CR-01) — so `=kubectl` is `kubectl` here too.
            const named = governedToolsNamedBy(w.raw);
            for (const r of COMMAND_CHECKPOINT_RULES) {
                if (!named.has(r.tool))
                    continue;
                // Under xargs the words after the tool are only the start of its argument list (see the block
                // above `XARGS_NAME_RE`): only an adjacent benign subcommand, not rewritten by a replace
                // string, decides; otherwise the tool name alone does.
                const feed = feedAt(i);
                if (feed !== null) {
                    const adjacent = adjacentWord(words, i + 1);
                    const decided = !feed.replace && adjacent !== null && (r.benign ?? []).includes(adjacent) && !r.verbs.includes(adjacent);
                    if (!decided)
                        completedFromStdin(r.checkpoint, seg.raw);
                }
                const cand = verbCandidates(words, i + 1);
                if (cand.opaque) {
                    refuse(seg.raw, cand.unreadable);
                    continue;
                }
                const candidates = cand.values;
                // A benign subcommand suppresses ONLY from the position adjacent to the tool (`RA5-2`).
                const adjacent = adjacentWord(words, i + 1);
                if (adjacent !== null && (r.benign ?? []).includes(adjacent) && !r.verbs.includes(adjacent)) {
                    continue;
                }
                // A FLAG-governed row (`vercel --prod`): the flag anywhere after the tool decides.
                const flags = r.flags ?? [];
                if (flags.length > 0 &&
                    words.slice(i + 1).some((x) => x.kind === "canonical" && x.isFlag && flags.includes(x.value.split("=")[0]))) {
                    readable.add(r.checkpoint);
                    continue;
                }
                if (r.tool === "git") {
                    const at = candidates.indexOf("update-ref");
                    if (at !== -1 && candidates.slice(at + 1).some((c) => PROTECTED_REF_RE.test(c))) {
                        readable.add(r.checkpoint);
                    }
                    if (gitPushIsGoverned(candidates, words))
                        readable.add(r.checkpoint);
                    continue;
                }
                // A candidate is asked what verb it SPELLS, so a unique prefix the tool itself resolves is the
                // verb it resolves to (plan 33-36); on every other row this is exactly `r.verbs.includes(c)`.
                if (candidates.some((c) => spelledVerb(r, c) !== null))
                    readable.add(r.checkpoint);
            }
        }
    }
    return result();
}
/**
 * Every checkpoint the table governs, derived. `hooks/guard.ts` asserts at startup that each is a
 * real roster checkpoint.
 */
export const COMMAND_RULE_CHECKPOINTS = [
    ...new Set(COMMAND_CHECKPOINT_RULES.map((r) => r.checkpoint)),
];
/** The fixed zero-config banner line (D-20). Always printed, so absent and broken look different. */
export const BANNER_ALL_DEFAULT = "all checkpoints at default";
/** The opening of the OTHER banner form. Declared once; the composer and the recognizer share it. */
export const BANNER_NON_DEFAULT_PREFIX = "checkpoints not at default: ";
/**
 * The opening of a CONFIG-REFUSAL line (plan 30-11, closing `V-30-10-01`).
 *
 * The governance reader accumulates a refusal for every `checkpoints` entry it drops — a key that is
 * not on the roster, a value outside `block|notify|off`, a whole matrix that is not an object. Until
 * this constant nothing printed them, so a human who mistyped a checkpoint id got no signal at all
 * and believed they had lowered something they had not.
 *
 * It is a DIFFERENT prefix from the banner's on purpose, and `isCheckpointBannerLine` must never
 * accept a line that starts with it: the exactly-one-banner count in `hooks/guard.test.ts` is what
 * makes a missing banner and a broken banner look different, and a refusal line counted as a banner
 * would break that count. The two literals are asserted disjoint in `scripts/checkpoints.test.ts`.
 */
export const CONFIG_REFUSAL_PREFIX = "checkpoint config refused: ";
/**
 * Is this line a checkpoint banner? The RECOGNIZER half of the exactly-one-banner assertion.
 *
 * A banner-presence check written as "does the output contain this substring" passes for a run that
 * also printed nine wrong lines — the anti-pattern this phase carries forward as blocking. A caller
 * counts the lines this predicate accepts and refuses BY NAME on zero and on two or more, which is
 * the shape install/install.ts already uses for its per-adapter provenance banner. Because both banner
 * forms are produced from the two literals above, a recognizer and a composer that disagree is not a
 * state this module can reach.
 */
export function isCheckpointBannerLine(line) {
    return line === BANNER_ALL_DEFAULT || line.startsWith(BANNER_NON_DEFAULT_PREFIX);
}
// ─────────────────────────────────────────────────────────────────────────────────────────────
// Canonicalization — fail closed BY RULE, never by coercion.
// ─────────────────────────────────────────────────────────────────────────────────────────────
/**
 * Canonicalize a raw disposition value read from config.
 *
 * PITFALL 4, WHICH THIS FUNCTION EXISTS TO REFUSE. The sibling dial in scripts/context-io.ts
 * (`canonicalizeHumanAdmission`) had exactly this bug class in round 2 (GAP-C): `"OFF"`, `true`,
 * `1`, `null`, `[]` each took a different code path and one of them landed on the LENIENT value.
 * So this function does not switch, does not lower-case, does not coerce and has no `default:` arm
 * that could ever return anything else. It recognizes the THREE exact strings and returns `block`
 * for the entire complement — a present non-string, a wrong-case spelling, a number, `null`, an
 * array, an object and `undefined` all reach `block` BY RULE.
 *
 * The direction is deliberate: `block` is the strictest value, so an unrecognized config value
 * gates at least as strictly as the default. There is no input to this function that lowers a
 * checkpoint.
 */
export function canonicalizeDisposition(raw) {
    if (raw === "block")
        return "block";
    if (raw === "notify")
        return "notify";
    if (raw === "off")
        return "off";
    return "block";
}
/** `GRUGOPS_FLOOR_<UPPER_ID>` — the name of a floor's key two. Derived from the id, never listed. */
export function floorEnvVarName(id) {
    return FLOOR_ENV_VAR_PREFIX + id.toUpperCase();
}
/** Sorted copy of an id list, so a set comparison cannot be decided by iteration order. */
export function sortedIds(ids) {
    return [...ids].sort();
}
// ─────────────────────────────────────────────────────────────────────────────────────────────
// The floor-tier subset — derived from SAFETY_FLOORS, count-asserted.
// ─────────────────────────────────────────────────────────────────────────────────────────────
/** Thrown when the floor derivation returns nothing, or returns fewer members than SAFETY_FLOORS. */
export class FloorCheckpointDerivationError extends Error {
    constructor(message) {
        super(message);
        this.name = "FloorCheckpointDerivationError";
    }
}
/**
 * The floor-tier checkpoints: the roster members that are ALSO members of `SAFETY_FLOORS`
 * (scripts/audit-model.ts), which D-04 makes the canonical floor list. The floor ids are IMPORTED,
 * never restated here.
 *
 * PITFALL 6 — THE COUNT IS DERIVED OUTSIDE THE LOOP THAT BUILDS THE RESULT. A vacuity floor that
 * only refuses an EMPTY result happily returns 1 of 2 floors, and the missing one is exactly the
 * one an attacker wants missing. So the expected count is computed by walking `SAFETY_FLOORS` —
 * the OTHER side of the intersection — and compared against the length of the list built by
 * walking `checkpoints`. Two independent traversals, one equality. A silently SHORT derivation is
 * a named throw, not a quiet shrink.
 *
 * Exported (rather than inlined into the const below) for one stated reason: a test must be able
 * to drive it with an empty input and watch it THROW rather than return `[]`.
 */
export function deriveFloorCheckpoints(checkpoints = CHECKPOINTS, floors = SAFETY_FLOORS) {
    const floorIds = new Set(floors.map((f) => f.id));
    const derived = [...new Set(checkpoints)].filter((c) => floorIds.has(c));
    // The independent denominator: counted by walking `floors`, never by measuring `derived`.
    //
    // IT COUNTS DISTINCT IDS, NOT ENTRIES — this is the ADJACENCY rule (D-02/D-03), and it is the
    // reason this is a Set and not a counter. The same human stop can be declared in more than one
    // place (a role's `## Hard limits` AND a workflow's `## Stop conditions`, and later more than one
    // of each); equal ids MERGE into one roster member with a site count of N. They never collide,
    // and they must never inflate the denominator into disagreeing with a correctly-merged result.
    const rosterIds = new Set(checkpoints);
    const distinctInRoster = new Set();
    for (const f of floors)
        if (rosterIds.has(f.id))
            distinctInRoster.add(f.id);
    const expected = distinctInRoster.size;
    if (derived.length !== expected) {
        throw new FloorCheckpointDerivationError(`checkpoints: the floor-tier derivation produced ${derived.length} member(s) while ` +
            `SAFETY_FLOORS independently accounts for ${expected} — a derivation that returns short ` +
            `shrinks what is protected while presenting as a clean run, so it is refused rather than used`);
    }
    if (derived.length === 0) {
        throw new FloorCheckpointDerivationError(`checkpoints: the floor-tier derivation produced NO members. An empty floor set would mean ` +
            `no checkpoint needs key two, i.e. every lowering could be granted by an agent editing ` +
            `config alone. An empty result is refused, never returned as an empty array`);
    }
    return derived;
}
/** The floor-tier roster subset. Every member needs key two before a lowering takes effect. */
export const FLOOR_CHECKPOINTS = deriveFloorCheckpoints();
/** Is this checkpoint floor-tier (i.e. does lowering it need key two)? */
export function isFloorCheckpoint(id) {
    return FLOOR_CHECKPOINTS.includes(id);
}
/**
 * Apply the two-key rule to ONE checkpoint.
 *
 * The rule, in full:
 *   - `declared === "block"` → `effective = "block"`. Nothing to authorize; key two is irrelevant.
 *   - non-floor member declared `notify`/`off` → `effective = declared`. One key is the whole rule.
 *   - FLOOR member declared `notify`/`off`:
 *       key two present and non-empty → `effective = declared` (the lowering takes effect);
 *       key two absent or empty      → `effective = "block"` and `unauthorizedLowering = true`.
 *
 * `env` is read by the CALLER and passed in, so the freshness of the read is the hook's decision
 * (it re-reads `process.env` on every invocation) and a test can drive every arm without mutating
 * the ambient environment.
 */
export function resolveCheckpoint(id, matrix, env) {
    const declared = canonicalizeDisposition(matrix[id]);
    const isFloor = isFloorCheckpoint(id);
    const envVarName = isFloor ? floorEnvVarName(id) : null;
    if (declared === "block") {
        return {
            id,
            declared,
            effective: "block",
            isFloor,
            envVarName,
            authorizedBy: null,
            unauthorizedLowering: false,
        };
    }
    if (!isFloor) {
        return {
            id,
            declared,
            effective: declared,
            isFloor,
            envVarName,
            authorizedBy: null,
            unauthorizedLowering: false,
        };
    }
    // ONE presence predicate for the whole grant vocabulary (finding A-4). A value that names nobody
    // is not a grant, so a whitespace-only grant leaves the floor at `block` and reports itself as an
    // unauthorized lowering exactly as an absent one does.
    const authorizedBy = grantedBy(env, envVarName);
    return {
        id,
        declared,
        effective: authorizedBy === null ? "block" : declared,
        isFloor,
        envVarName,
        authorizedBy,
        unauthorizedLowering: authorizedBy === null,
    };
}
/**
 * Resolve the WHOLE roster once (D-19, plan 30-08).
 *
 * WHY THIS EXISTS RATHER THAN TWO CALLS TO `resolveCheckpoint`. Until this plan the banner walked
 * the roster and resolved every member, and the guard's decision loop separately resolved the member
 * it had matched. Two independent evaluations of the same rule over the same inputs is the surface on
 * which a banner comes to say `all checkpoints at default` over a run that denied a lowered
 * checkpoint — the Phase 28 AP-1 shape, a line asserting something the run did not establish. A
 * consistency CHECK between the two would only report the disagreement after the fact. One evaluation
 * removes the disagreement by construction: there is no second value to disagree with.
 *
 * The map is built by walking `CHECKPOINTS`, so its key set IS the roster and a member cannot be
 * silently skipped; `composeBanner` refuses a map that is missing one anyway.
 */
export function evaluateMatrix(matrix, env) {
    const out = new Map();
    for (const id of CHECKPOINTS)
        out.set(id, resolveCheckpoint(id, matrix, env));
    return out;
}
// ─────────────────────────────────────────────────────────────────────────────────────────────
// The run banner (D-19 / D-20).
// ─────────────────────────────────────────────────────────────────────────────────────────────
/**
 * ONE line describing the live matrix, printed on EVERY guard invocation.
 *
 * WHY IT REPORTS THE DECLARED VALUE AND NOT THE EFFECTIVE ONE. An unauthorized lowering enforces
 * `block`, which IS the default — so a banner keyed on the effective value would print
 * `all checkpoints at default` over a config that plainly declares `off`, and the run's own denial
 * would then name a checkpoint the banner had just called default. That disagreement is precisely
 * the Phase 28 AP-1 shape (a line asserting something the run did not establish). The banner
 * therefore reports what the config DECLARED, and says in the same breath whether the declaration
 * is authorized.
 *
 * D-20: with nothing declared away from its default the line is the FIXED literal
 * `all checkpoints at default` — always present, so a missing banner and a broken banner look
 * different.
 */
/**
 * The ONE way an untrusted value reaches the banner sentence (plan 30-11 round 3, `RA4-4`).
 *
 * ---------------------------------------------------------------------------------------------
 * `A-6` BOUNDED THE KEY AND LEFT THE VALUE IN THE SAME SENTENCE.
 *
 * The banner interpolates two untrusted values: the config KEY (quoted since `A-6`) and the GRANT
 * VALUE, which `grantedBy` trims and hands over raw. Measured on the round-2 artifact with
 * `GRUGOPS_FLOOR_PROTECTED_BRANCH_MERGE=$'alice\nall checkpoints at default'`: the run emitted TWO
 * stderr lines, and the shipped recognizer `isCheckpointBannerLine` accepted BOTH — a verbatim, valid
 * alternative banner asserting the opposite posture, on the one artifact D-20 guarantees per
 * invocation so a human can read the run's posture. The exactly-one-banner count that `A-6` added and
 * asserted reported two.
 *
 * The rule is applied to the SENTENCE rather than to one of its slots: every untrusted value goes
 * through here, and a value carrying a line break is refused by name rather than escaped, so the run
 * still emits exactly one banner and the human is told what to fix — the same shape as the
 * `names nobody` clause `A-4` introduced next door.
 * ---------------------------------------------------------------------------------------------
 */
export function bannerValue(v) {
    return /[\r\n]/.test(v) ? "REFUSED (the value contains a line break)" : v;
}
export function composeBanner(evaluation) {
    const parts = [];
    for (const id of CHECKPOINTS) {
        const r = evaluation.get(id);
        if (r === undefined) {
            // Unreachable through evaluateMatrix, which walks the same roster. Asserted anyway: a banner
            // composed over a SHORT evaluation would omit exactly the checkpoint whose absence an attacker
            // wants, and would present as a clean line while doing it (Pitfall 6, the short denominator).
            throw new Error(`checkpoints: the banner was asked to describe "${id}", which the evaluation it was given ` +
                `does not carry. A banner is a claim a human acts on; it is refused rather than composed ` +
                `over a partial evaluation.`);
        }
        if (r.declared === CHECKPOINT_DEFAULTS[id])
            continue;
        if (r.unauthorizedLowering) {
            // "names nobody", not "absent" (plan 30-11, finding A-4 — the new freedom that fix created).
            // Tightening `grantedBy` so a whitespace-only value stops authorizing introduced a SECOND way
            // to be unauthorized: the variable can now be set and still not be a grant. The banner said
            // `absent`, which for that case is a sentence the run did not establish — a human would go
            // looking for a variable that is in fact right there. One clause covers both, because the
            // predicate is one predicate: what is missing is a NAME, not the variable.
            parts.push(`${id}=${r.declared} NOT AUTHORIZED (${r.envVarName} names nobody; enforced as block)`);
        }
        else if (r.authorizedBy !== null) {
            parts.push(`${id}=${r.declared} authorized by ${r.envVarName}=${bannerValue(r.authorizedBy)}`);
        }
        else {
            parts.push(`${id}=${r.declared}`);
        }
    }
    return parts.length === 0 ? BANNER_ALL_DEFAULT : BANNER_NON_DEFAULT_PREFIX + parts.join(", ");
}
/**
 * The convenience adapter: evaluate, then compose. ONE line, so there is still ONE banner grammar.
 *
 * Callers that also DECIDE something must not use this — they must hold the evaluation themselves
 * and pass it to `composeBanner`, or the banner and the decision are two independent reads of the
 * same config and can drift apart. hooks/guard.ts does exactly that.
 */
export function renderCheckpointBanner(matrix, env) {
    return composeBanner(evaluateMatrix(matrix, env));
}
// ─────────────────────────────────────────────────────────────────────────────────────────────
// THE DERIVATION (plan 30-04 — D-01, D-02, D-03, AUTO-01).
// ─────────────────────────────────────────────────────────────────────────────────────────────
//
// WHY NOTHING BELOW RUNS AT MODULE LOAD. `hooks/guard.js` imports this module on EVERY PreToolUse
// invocation. A derivation at module scope would read nineteen kit files per tool call and, worse,
// would THROW on any kit edit that momentarily left a tag non-canonical — turning a documentation
// typo into a hook that denies every tool call. So the roster is a table (cheap, total), and the
// derivation is a FUNCTION the tests and the validator call. The two are compared explicitly by
// `assertRosterMatchesDerivation`, which is the point at which the corpus is allowed to have an
// opinion about the roster.
/** This repository's root, for the default derivation corpus. */
const DEFAULT_ROOT = join(import.meta.dirname, "..");
/** The heading whose section is the tag corpus. Declared once; `locateSection` is asked for it. */
export const WORKFLOW_STOP_HEADING = "## Stop conditions";
/**
 * The independent cardinality anchor for the tag corpus: how many bullets live inside the nineteen
 * `## Stop conditions` sections, counted on the tree.
 *
 * This is the `ROLE_COUNT` / `WORKFLOW_COUNT` idiom, and it is here for the reason those exist:
 * enforcement is TWO-SIDED, so one under is a failure and one over is a failure. Bumping it is a
 * deliberate act that obliges the author to re-walk the tagging list. A derivation floored only
 * against ZERO happily reports a clean run over 20 of 38 bullets, and the ones it skipped are
 * exactly the ones an attacker would want skipped.
 *
 * MEASURED, WITH THE REASON IT MOVED (31-18): 39 -> 42. Plan 31-18 closed CR-11, WR-17 and WR-18,
 * each of which gives `promoteAdmitted` a refusal an agent can now meet, so
 * `agent-factory/workflows/18-context-compaction.md` gained three stop conditions — a destination
 * that already holds a different note under the promoted id, an origin that is not a context store
 * the route recognises, and a destination dial that gates nothing. THE TAGGING LIST WAS RE-WALKED
 * rather than the constant bumped: all three are stop-and-fix conditions whose remedy is stated in
 * the bullet itself, exactly like that file's carve-out-checker bullet, so none of them carries a
 * `checkpoint:` tag and the roster is unchanged. A stop condition that hands to a HUMAN is what
 * earns a tag, and this round added none.
 *
 * MEASURED AGAIN, WITH THE REASON IT MOVED (31-41): 42 -> 43. Plan `31-41` reconciled
 * `agent-factory/workflows/18-context-compaction.md`'s imperative restatement with its rewritten
 * ledger paragraph. The section was SILENT about the one decline every path of the re-binding route
 * raises — a destination that resolves to no governed store — so an agent following only the stop
 * conditions would not know to stop for it. One bullet, and this axis caught it, which is what the
 * two-sidedness is for: the prose edit moved a number the plan's own `files_modified` did not name.
 * THE TAGGING LIST WAS RE-WALKED rather than the constant bumped. The new bullet is a
 * stop-and-fix whose remedy is stated in the bullet itself — name a destination inside a governed
 * repository, and never build one around the bytes — so it hands to no human, carries no
 * `checkpoint:` tag, and the roster is unchanged. It sits beside the three `31-18` added for the
 * same reason and under the same test.
 */
export const WORKFLOW_STOP_BULLET_COUNT = 43;
/**
 * The tag keyword, declared ONCE. Both patterns below are built from it, so the allow-list and the
 * scope selector can never come to disagree about which word they are talking about.
 */
const TAG_KEYWORD = "checkpoint";
const BACKTICK = "`";
/**
 * THE ONE CANONICAL TAG FORM (D-02): a markdown bullet whose LAST token is a backticked
 * `` `checkpoint: <snake_case_id>` ``.
 *
 * Everything about this pattern is an allow-list, in the D-64 posture that closed Phase 27. It is
 * anchored at both ends, it requires the bullet marker, it requires at least one non-space of
 * sentence before the tag, it requires the single space after the colon, and it requires the id to
 * be lower-case snake_case. There is no alternation and no optional group, because each one would
 * be a second accepted spelling of the same thing.
 *
 * THE PROHIBITION THAT GOES WITH IT, RECORDED HERE RATHER THAN IN A PLAN THAT SCROLLS AWAY: this
 * pattern must never be widened to accommodate a bullet that will not take the canonical form. The
 * BULLET changes, not the pattern. A parser loosened once to fit one stubborn case has stopped
 * being an allow-list and become a list of things that happened to be tried.
 */
export const CHECKPOINT_TAG_RE = new RegExp("^[ \\t]*[-*][ \\t]+\\S.*[ \\t]" +
    BACKTICK +
    TAG_KEYWORD +
    ": ([a-z][a-z0-9]*(?:_[a-z0-9]+)*)" +
    BACKTICK +
    "$");
/**
 * THE SCOPE SELECTOR for the refusal, not a second tag form.
 *
 * The allow-list posture needs two halves: a pattern that says what IS a tag, and a rule that
 * decides which lines the pattern is even ASKED about. This is the second half — it selects every
 * unfenced line inside a located section that MENTIONS the keyword in any case. Such a line either
 * matches `CHECKPOINT_TAG_RE` exactly or is refused by name; it is never skipped.
 *
 * It is deliberately WIDER than the tag pattern, and scripts/checkpoints.test.ts asserts that
 * relation directly. A selector narrower than the pattern would let a canonical tag be collected
 * without ever being offered to the refusal — the P29 defect of asking the right question at the
 * wrong positions.
 */
export const CHECKPOINT_KEYWORD_RE = new RegExp(TAG_KEYWORD, "i");
/** A markdown list bullet. The unit the corpus is counted in, on both passes. */
export const STOP_BULLET_RE = /^[ \t]*[-*][ \t]+\S/;
/** Thrown by every refusal in this derivation, so a caller can tell it from an I/O failure. */
export class CheckpointDerivationError extends Error {
    constructor(message) {
        super(message);
        this.name = "CheckpointDerivationError";
    }
}
/**
 * The count equality, as its own exported function so a test can drive it with a PLANTED
 * disagreement. An assertion that is only ever reached in the passing state is not an assertion.
 */
export function assertBulletCount(examined, counted, where) {
    if (examined !== counted) {
        throw new CheckpointDerivationError(`checkpoints: the tag walk examined ${examined} stop bullet(s) in ${where} while an ` +
            `independent pass counted ${counted}. The two numbers come from different traversals ` +
            `precisely so a silently SHORT walk disagrees with the count instead of reporting a clean ` +
            `run over the bullets it never reached`);
    }
}
/**
 * Walk the workflow `## Stop conditions` corpus and collect the canonically tagged ids.
 *
 * THE SCOPE RULE, WHICH IS THE WHOLE POINT (T-30-14). Every pattern below is evaluated ONLY over
 * the 0-based line range `locateSection` returns for the exact heading. A reader that located a
 * section and then searched to end-of-file would adopt an unrelated later block — the recorded P29
 * scope defect, restated one module along. A tag one line past the closing boundary is therefore
 * not collected AND not refused: it is simply outside the question being asked.
 *
 * Fenced lines are invisible on both arms, through the one fence authority. A workflow that QUOTES
 * a tagged bullet in an example is documenting the form, not declaring a checkpoint.
 */
export function deriveCheckpoints(root = DEFAULT_ROOT) {
    const files = listWorkflows(root);
    // ── THE FILE SET IS TWO-SIDED TOO (plan 30-10 round 2, finding F6) ──────────────────────────
    //
    // `listWorkflows` applies its membership rule as a SILENT filter. A markdown file in the workflows
    // directory that the rule does not admit — an unnumbered `hotfix-emergency.md`, or one with an
    // upper-case extension — is outside the walked set AND outside every denominator derived from it,
    // so a canonically tagged stop bullet in it is neither collected, nor refused, nor counted. That
    // is B-3's fault reached through the corpus's MEMBERSHIP instead of its FORM, and it left the
    // whole tree green when it was measured.
    //
    // The same posture answers it: the corpus admits a canonical form, and a document that sits in the
    // corpus's directory without taking that form is refused BY NAME rather than dropped. The
    // unfiltered read is asked of the lister's own module, so this is two traversals of one directory
    // through one `readdirSync` helper — never a second directory walk written here.
    // (Round 4, R5-3) INVERTED: the read admits EVERY entry and this refuses anything the corpus rule
    // does not, so there is no extension question left to get wrong. R3-4's alias list was defeated on
    // the first probe by seven further Linguist markdown spellings.
    const present = listWorkflowDirEntries(root);
    const admitted = new Set(files);
    const unadmitted = present.filter((f) => !admitted.has(f));
    if (unadmitted.length > 0) {
        throw new CheckpointDerivationError(`checkpoints: ${WORKFLOWS_SUBPATH} carries ${unadmitted.length} entr(ies) the workflow corpus ` +
            `does not admit — ${unadmitted.join(", ")}. A stop declared in a file the corpus rule drops ` +
            `is walked by nothing: it has no roster member, no config cell and no enforcement, and no ` +
            `cardinality anywhere can see that it is missing. Rename it into the numbered corpus, move ` +
            `it out of the workflows directory, or add it to WORKFLOW_DIR_EXEMPT in scripts/kit-model.ts ` +
            `with a reason`);
    }
    const sites = new Map();
    let examinedBullets = 0;
    let countedBullets = 0;
    let sectionsFound = 0;
    for (const file of files) {
        const text = readFileSync(join(root, WORKFLOWS_SUBPATH, file), "utf8");
        // ── THE CANONICAL FORM OF THE CORPUS ITSELF (plan 30-10, red-team surface B finding B-3) ──
        //
        // `locateSection` answers about the FIRST unfenced occurrence of the heading. Until this
        // refusal existed, a workflow carrying a SECOND `## Stop conditions` section put every bullet
        // in it outside the located range on BOTH arms: pass A never walked it, and pass B's
        // `inSection` filter discarded it. A canonically tagged bullet written there was neither
        // collected nor refused nor counted — a declared human stop with no roster member, no config
        // cell and no enforcement, which is the exact fault the two-sided comparison exists to name.
        // Measured pre-fix against the committed artifact: ids, sites, examined and counted bullets all
        // unchanged over a planted second section, with all three live assertions green.
        //
        // THE REPAIR IS THE ALLOW-LIST, NOT A WIDER WALK (D-64). A workflow declares its stops in ONE
        // section; a repeated heading is ambiguity and is refused BY NAME rather than resolved by
        // silently taking the first. Collecting from every occurrence is the other available repair and
        // it is the wrong one: it would make the corpus depend on how many times an editor repeated a
        // heading, and it would leave `sectionsFound === filesWalked` asserting nothing.
        //
        // The occurrence count is asked of the ONE heading authority (`unfencedHeadingIndices`), which
        // is fence-aware, so a workflow QUOTING the heading inside a fenced example still carries one
        // section. A private occurrence scan here would be the second grammar this module refuses.
        const occurrences = unfencedHeadingIndices(text, WORKFLOW_STOP_HEADING);
        if (occurrences.length > 1) {
            throw new CheckpointDerivationError(`checkpoints: ${file} carries ${occurrences.length} \`${WORKFLOW_STOP_HEADING}\` ` +
                `sections (lines ${occurrences.map((i) => i + 1).join(", ")}). The tag corpus is ONE ` +
                `stop section per workflow: only the first is located, so a bullet in any later one is ` +
                `neither collected nor refused nor counted, and a tag written there would declare a stop ` +
                `nothing governs. Merge the sections rather than repeating the heading`);
        }
        // ── AND A HEADING THAT IMITATES IT (plan 30-10 round 2, finding F2) ────────────────────────
        //
        // THE REFUSAL ABOVE COUNTS OCCURRENCES, AND "OCCURRENCE" IS A BYTE-EXACT EQUALITY. The rule that
        // decides where a section ENDS is a prefix. Five spellings sit in the prefix language and
        // outside the equality — two spaces after the hashes, a trailing zero-width or word-joiner or
        // soft-hyphen code point, a ≤3-space indent — and each renders identically to the canonical
        // heading while closing the real section and opening a region neither pass walks. A tagged
        // bullet there is neither collected nor refused nor counted: the fault the refusal above exists
        // to name, reached through a heading the counter does not see.
        //
        // The imitations are asked of the ONE heading authority, which derives them from the two
        // grammars it already owns. Nothing here parses a heading, and acceptance is unchanged — the
        // canonical form is still the only form a section is located from.
        const imitations = unfencedHeadingNearMisses(text, WORKFLOW_STOP_HEADING);
        if (imitations.length > 0) {
            throw new CheckpointDerivationError(`checkpoints: ${file} carries ${imitations.length} heading(s) that RENDER as ` +
                `\`${WORKFLOW_STOP_HEADING}\` but are not spelled as it (lines ` +
                `${imitations.map((i) => i + 1).join(", ")}): ` +
                `${imitations.map((i) => JSON.stringify(text.split("\n")[i])).join(", ")}. A reader sees ` +
                `a stop section there and the corpus does not, so a tag written under one declares a stop ` +
                `nothing governs. The canonical spelling is the only one this corpus admits — write the ` +
                `heading exactly, rather than widening what counts as it`);
        }
        const range = locateSection(text, WORKFLOW_STOP_HEADING);
        if (range === null) {
            throw new CheckpointDerivationError(`checkpoints: ${file} carries no \`${WORKFLOW_STOP_HEADING}\` section. The tag corpus is ` +
                `every workflow's stop section, so a workflow without one is a hole in the corpus and is ` +
                `refused rather than skipped — a skipped file lowers the count silently`);
        }
        sectionsFound += 1;
        const lines = text.split("\n");
        const flags = fencedLineFlags(text);
        // `locateSection` answers in 1-based inclusive line numbers, so `range.from` is the heading's
        // own line number and the section BODY is the 0-based index range [range.from, range.to).
        const inSection = (i) => i >= range.from && i < range.to;
        // ── PASS A — the collecting walk ────────────────────────────────────────────────────────
        for (let i = range.from; i < range.to; i++) {
            if (flags[i])
                continue;
            const line = lines[i];
            const lineNo = i + 1;
            const isBullet = STOP_BULLET_RE.test(line);
            if (isBullet)
                examinedBullets += 1;
            if (!CHECKPOINT_KEYWORD_RE.test(line))
                continue;
            const mentions = line.split(new RegExp(TAG_KEYWORD, "gi")).length - 1;
            if (mentions !== 1) {
                throw new CheckpointDerivationError(`checkpoints: ${file} line ${lineNo} mentions the tag keyword ${mentions} times. One ` +
                    `bullet declares at most one checkpoint; two tags on one bullet is two declarations of ` +
                    `a stop and is refused rather than resolved by taking the last one`);
            }
            const m = line.match(CHECKPOINT_TAG_RE);
            if (m === null) {
                throw new CheckpointDerivationError(`checkpoints: ${file} line ${lineNo} mentions the tag keyword but is not the canonical ` +
                    `form \`- <sentence>. ${BACKTICK}${TAG_KEYWORD}: <snake_case_id>${BACKTICK}\` — ` +
                    `${JSON.stringify(line.trim())}. The pattern is an allow-list: the BULLET takes the ` +
                    `canonical form, the pattern is never widened to accept the bullet`);
            }
            const id = m[1];
            const list = sites.get(id) ?? [];
            list.push({ file, line: lineNo });
            sites.set(id, list);
        }
        // ── PASS B — the independent denominator ────────────────────────────────────────────────
        // A different traversal of the same document: the authority builds its own index set over the
        // WHOLE file and the result is intersected with the section. It shares the fence toggle with
        // pass A and nothing else, so a collecting walk that skipped a line disagrees with it.
        countedBullets += unfencedMatchIndices(text, STOP_BULLET_RE).filter(inSection).length;
    }
    assertBulletCount(examinedBullets, countedBullets, `${files.length} workflow file(s)`);
    if (sites.size === 0) {
        throw new CheckpointDerivationError(`checkpoints: the tag walk found no tagged stop bullets across ${examinedBullets} bullet(s) ` +
            `in ${files.length} workflow file(s). An empty derived set would make the two-sided ` +
            `roster comparison report every roster member as unsupported, or — read the other way — ` +
            `would let a roster of anything at all pass against a corpus that declares nothing. It is ` +
            `refused, never returned as an empty set`);
    }
    let totalSites = 0;
    for (const list of sites.values())
        totalSites += list.length;
    return {
        ids: [...sites.keys()].sort(),
        sites,
        totalSites,
        examinedBullets,
        countedBullets,
        sectionsFound,
        filesWalked: files.length,
    };
}
/** The D-03 id→sites map on its own, for a caller that wants the sites and not the counts. */
export function checkpointSites(root = DEFAULT_ROOT) {
    return deriveCheckpoints(root).sites;
}
/**
 * D-06's mapping from the retired `autonomy` grade to the matrix, stated mechanically rather than
 * interpretively so a user repo carrying `autonomy: branch` has ONE answer to migrate to.
 *
 * `satisfies` is doing real work in both directions: a grade with no row is a compile error, and a
 * row that omits one of the two checkpoints is a compile error, so the table cannot express a
 * partial migration that leaves one half of the old grade undecided.
 */
export const LEGACY_AUTONOMY_GRADES = {
    diff: { commit_to_branch: "block", open_pr: "block" },
    branch: { commit_to_branch: "off", open_pr: "block" },
    pr: { commit_to_branch: "off", open_pr: "off" },
};
/**
 * Arm three's ids, DERIVED from the table's rows rather than listed beside it. Adding a checkpoint
 * to the legacy mapping puts it in the derived set automatically; listing them here as well would
 * be the second declaration this whole module exists to refuse.
 */
export function legacyGradeCheckpoints() {
    const ids = new Set();
    for (const row of Object.values(LEGACY_AUTONOMY_GRADES)) {
        for (const id of Object.keys(row))
            ids.add(id);
    }
    return [...ids].sort();
}
// ─────────────────────────────────────────────────────────────────────────────────────────────
// The three-arm union and the TWO-SIDED comparison.
// ─────────────────────────────────────────────────────────────────────────────────────────────
/** The full derived checkpoint set: the tag arm ∪ the floor arm ∪ the legacy arm, sorted. */
export function derivedCheckpointSet(root = DEFAULT_ROOT) {
    const ids = new Set(deriveCheckpoints(root).ids);
    for (const f of SAFETY_FLOORS)
        ids.add(f.id);
    for (const id of legacyGradeCheckpoints())
        ids.add(id);
    return [...ids].sort();
}
/**
 * Compare the derived set against the roster in BOTH directions.
 *
 * THE TWO DIRECTIONS ARE DIFFERENT FAULTS AND GET DIFFERENT MESSAGES. A roster-only id is a
 * checkpoint the kit no longer declares anywhere — a config cell and an env var name with nothing
 * behind them. A corpus-only id is a stop somebody tagged that the matrix has never heard of, so it
 * has no default, no cell and no enforcement. Collapsing them into one "sets differ" line would
 * hand a reader the symptom and withhold which of the two repairs to make.
 *
 * Both directions are reported when both are non-empty, rather than the first one found: reporting
 * one at a time turns a single wrong edit into two red runs.
 */
export function compareRosterToDerivation(derived, roster) {
    const d = new Set(derived);
    const r = new Set(roster);
    const rosterOnly = [...r].filter((id) => !d.has(id)).sort();
    const corpusOnly = [...d].filter((id) => !r.has(id)).sort();
    const failures = [];
    if (rosterOnly.length > 0) {
        failures.push(`checkpoints: the roster declares ${rosterOnly.length} id(s) that NO arm of the derivation ` +
            `produces — [${rosterOnly.join(", ")}]. A roster member nothing declares is a config cell ` +
            `and an env var name with no stop behind them. Either tag the bullet, add the floor, or ` +
            `remove the member`);
    }
    if (corpusOnly.length > 0) {
        failures.push(`checkpoints: the derivation produces ${corpusOnly.length} id(s) the roster does not admit ` +
            `— [${corpusOnly.join(", ")}]. A declared stop that is not a roster member has no default, ` +
            `no config cell and no enforcement, so it reads as governed while being governed by nothing`);
    }
    return { ok: failures.length === 0, rosterOnly, corpusOnly, failures };
}
/** Compare the live corpus against the live roster, throwing with every direction's message. */
export function assertRosterMatchesDerivation(root = DEFAULT_ROOT) {
    const c = compareRosterToDerivation(derivedCheckpointSet(root), CHECKPOINTS);
    if (!c.ok)
        throw new CheckpointDerivationError(c.failures.join("\n"));
}
// ─────────────────────────────────────────────────────────────────────────────────────────────
// The recorded site counts (D-03).
// ─────────────────────────────────────────────────────────────────────────────────────────────
/**
 * How many workflow sites each roster member is tagged at TODAY.
 *
 * D-03 asks for this: one id tagged at several sites is one roster member with a RECORDED site
 * count, and the derived map is asserted against that record, so a tag added or removed anywhere
 * goes red. The `satisfies` makes the membership half free — a new roster member with no recorded
 * count is a compile error — and the count half is what a silent retag trips over.
 *
 * A ZERO is meaningful, not a placeholder. The floor-arm and legacy-arm members reach the roster
 * without a tag, so their recorded count is 0 and tagging one later is a deliberate bump.
 *
 * `production_requires_human_confirmation` is the one id that arrives through two arms at once: it
 * is a `SAFETY_FLOORS` member AND it is tagged at `12-release.md` and `13-incident.md`, which is
 * the D-03 merge rule doing its job rather than a duplicate.
 *
 * PLAN 30-05 TAGGED `05-pr-quality-gate.md` AND MOVED TWO OF THESE NUMBERS. Its self-fix-budget
 * bullet took `exhaust_self_fix_budget` (4 → 5, a site rather than an id) and its human-only-failure
 * bullet took the NEW id `accept_human_only_failure`, added to the union, to `CHECKPOINT_DEFAULTS`,
 * to this table and to `RECORDED_TOTAL_SITES` in the same commit as the tag — which is what the
 * two-sided comparison forces, since either half alone is red.
 *
 * PLAN 31-14 TAGGED `18-context-compaction.md` AND MOVED THREE NUMBERS THE SAME WAY. Its new stop
 * condition — a faithful re-binding is refused, so stop and hand to a human rather than downgrading
 * — took the EXISTING id `escalate_unadjudicable_result` at a second site (1 -> 2, a site rather
 * than an id), which moved `RECORDED_TOTAL_SITES` (16 -> 17) and `WORKFLOW_STOP_BULLET_COUNT`
 * (38 -> 39) in the same commit as the tag. The id is reused rather than added because the case IS
 * an unadjudicable result: the in-script tier cannot re-verify the human disposition it is being
 * asked to carry forward, and a downgrade there would discard a named human's adjudication.
 */
export const CHECKPOINT_SITE_COUNTS = {
    protected_branch_merge: 0,
    production_requires_human_confirmation: 2,
    test_integrity: 0,
    open_pr: 0,
    commit_to_branch: 0,
    proceed_past_blocked_risk: 1,
    sign_off_acceptance: 2,
    escalate_stale_blocker: 1,
    exceed_wip_limit: 1,
    decide_accessibility_exception: 1,
    exhaust_self_fix_budget: 5,
    override_finding_severity: 1,
    escalate_unadjudicable_result: 2,
    accept_human_only_failure: 1,
};
/**
 * The total number of tagged bullets, as an INDEPENDENT anchor.
 *
 * Summing the table above and comparing the sum to the table is a tautology; comparing it to a
 * number written down separately is not. This is the same reason `WORKFLOW_STOP_BULLET_COUNT` is a
 * literal: a denominator computed by the loop it audits has never caught anything.
 */
export const RECORDED_TOTAL_SITES = 17;
/**
 * Assert a derived id→sites map against the recorded counts, in BOTH directions.
 *
 * Exported with both sides as parameters so a test can plant a disagreement and watch it refuse.
 * A recorded count of zero and an ABSENT record are different facts, and only the first is allowed.
 */
export function assertSiteCounts(sites, recorded) {
    const problems = [];
    for (const [id, want] of Object.entries(recorded)) {
        const got = sites.get(id)?.length ?? 0;
        if (got !== want) {
            problems.push(`${id}: recorded ${want} site(s), derived ${got}` +
                (got === 0 ? " (no bullet in the corpus carries this tag)" : ""));
        }
    }
    for (const id of sites.keys()) {
        // `Object.hasOwn`, NOT `in` (plan 30-10 round 2, reviewer 2's observation 1). `recorded` is a
        // plain object, so `in` consults `Object.prototype` — and `constructor` is the one prototype
        // name that is ALSO legal under `CHECKPOINT_TAG_RE`'s snake_case pattern. Measured against the
        // committed artifact: a bullet tagged `checkpoint: constructor` passed this arm silently while
        // every other prototype spelling was refused. It is masked end-to-end by
        // `compareRosterToDerivation`'s `Set`, so it lowered nothing — but this function is exported
        // precisely so a test can plant a disagreement and watch it refuse, and for that id it silently
        // would not.
        if (!Object.hasOwn(recorded, id)) {
            problems.push(`${id}: tagged in the corpus but carries no recorded site count`);
        }
    }
    if (problems.length > 0) {
        throw new CheckpointDerivationError(`checkpoints: the derived id→sites map disagrees with the recorded site counts — ` +
            problems.join("; ") +
            `. A tag added or removed anywhere is meant to land here rather than pass silently (D-03)`);
    }
}
/**
 * The FULL-CARDINALITY anchors, for the live tree only.
 *
 * Kept out of `deriveCheckpoints` on purpose: that function must run over a two-file fixture, and a
 * derivation that refused anything other than nineteen sections could never be driven by a probe.
 * The cardinality question belongs to the LIVE corpus and is asked of it by name.
 */
export function assertLiveCorpusCardinality(d) {
    if (d.sectionsFound !== d.filesWalked) {
        throw new CheckpointDerivationError(`checkpoints: located ${d.sectionsFound} stop section(s) across ${d.filesWalked} workflow ` +
            `file(s) — every workflow owes one`);
    }
    if (d.countedBullets !== WORKFLOW_STOP_BULLET_COUNT) {
        throw new CheckpointDerivationError(`checkpoints: the live stop corpus holds ${d.countedBullets} bullet(s) against the recorded ` +
            `${WORKFLOW_STOP_BULLET_COUNT}. Enforcement is two-sided: a bullet added or deleted anywhere ` +
            `lands here, and bumping the anchor obliges a re-walk of the tagging list`);
    }
}

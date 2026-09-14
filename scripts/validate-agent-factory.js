// validate-agent-factory.ts — grugops structure-only validator (VAL-01).
//
// TypeScript port of validate-agent-factory.mjs (Phase 15, TOOL-01). This is a TRANSLATION,
// not a redesign (RESEARCH Open Q4 — refactor nothing semantic in the resolution logic): the
// two-root C3 no-false-green guard and the CR-03 fail-closed-on-null rejects are hard-won and
// reproduced verbatim. Only TypeScript types were added; every env-var name, regex, exit code, and
// fail-closed branch was byte-for-behavior identical to the .mjs. (Phase 27 / KIT-02 since changed
// ONE thing: the two frozen role/workflow name arrays are now DERIVED through kit-model.ts — see
// the derivation block below. Nothing else about the resolution logic moved.) The
// committed compiled output is scripts/validate-agent-factory.js, which CI/hosts run with bare
// Node. import.meta.dirname (stable at the Node 22+ floor) replaces dirname(fileURLToPath(...)).
//
// Asserts the frozen grugops kit tree is structurally well-formed: required files exist,
// role/workflow files carry their required sections (by PREFIX match — never exact-string,
// never uniqueness), the config parses with mode/cadence AND enum-checks the 8
// optional v1.2 dial keys WHEN PRESENT (bdd; quality.tdd/ui_e2e/test_integrity/gate_enforcement;
// quality.lint shape; security.asvs_level/block_on) — a MISSING key is its lean default, never
// an error (D-14 active-when-present / lenient-when-absent, preserving SC4 zero-config); the
// trace-integrity key is warn|block only — disabling it is rejected (TINT-03 carve-out).
// Board<->ticket status matches (VACUOUS on zero tickets — D-43), traceability completeness is
// flagged, and packaging is present with a named plugin.json.
//
// Node stdlib ONLY — node:fs + node:path. ZERO npm dependencies. Invocation requires the kit
// root explicitly:
//
//   VALIDATE_KIT_ROOT=/path/to/kit node scripts/validate-agent-factory.js           # exit 0/1
//   VALIDATE_KIT_ROOT=/path/to/kit node scripts/validate-agent-factory.js --strict  # warns→errors
//   VALIDATE_KIT_ROOT=/kit VALIDATE_ROOT=/state node scripts/validate-agent-factory.js
//
// Two roots (VAL-02 / D-08), resolved separately so the validator cannot false-green in the dev
// checkout (the C3 footgun):
//   VALIDATE_KIT_ROOT  REQUIRED — NO DEFAULT. Holds the read-only kit (agent-factory/…, AGENTS.md,
//                      .claude-plugin/). Unset is a HARD ERROR (process.exit(1) with a "(C3)"
//                      message) — it never silently falls back to "." / the dev checkout.
//   VALIDATE_ROOT      The STATE root (plans/…). Optional; defaults to the repo root (back-compat
//                      for the existing single-tree fixtures and self-validation).
// kit-classified checks resolve under KIT_ROOT; state-classified checks under STATE_ROOT
// (Phase-7 classification: agent-factory/… + AGENTS.md + .claude-plugin/ = KIT; plans/… = STATE).
//
// Two-tier findings (D-44): ERRORS (missing file/section; config doesn't parse or lacks
// mode/cadence; config carrying the RETIRED `autonomy` scalar or a malformed `checkpoints`
// declaration; a PRESENT dial key carrying an out-of-enum value — e.g. asvs_level:"L4"
// or a trace-integrity value outside warn|block; a malformed quality.lint shape; plugin.json
// missing name; board/ticket status mismatch) → exit 1.
// WARNINGS (ticket missing a traceability row, or a row missing Tests/UAT) → reported, exit 0
// bare; --strict promotes them to the nonzero exit.
//
// Read-only by construction (T-06-02): every path is join(KIT_ROOT|STATE_ROOT, <fixed literal
// rel>); no write path is ever derived from file content. Every read/JSON.parse is wrapped in
// try/catch so a missing or garbled file becomes a finding, never an unhandled throw
// (T-06-01/T-06-03, mirrors hooks/guard.ts + install.ts fail-closed posture).
import { readFileSync, existsSync, readdirSync, realpathSync } from "node:fs";
import { join, resolve, sep } from "node:path";
// Phase 27 (KIT-02): the role and workflow name sets are DERIVED here, never hand-listed.
// kit-model.ts is the single authority for "which roles and workflows exist" (KIT-01). It reads NO
// environment variable — the kit root is an explicit parameter (D-22) — so this file keeps exactly
// the two root conventions it already had (VALIDATE_KIT_ROOT + VALIDATE_ROOT) and gains no third.
import { listRoles, listWorkflows } from "./kit-model.js";
// THE CHECKPOINT ROSTER AND THE DISPOSITION VOCABULARY ARE IMPORTED, NEVER RESTATED (D-08).
// scripts/checkpoints.ts is the ONE declaration of both; a second array of checkpoint ids here
// would be the set-literal drift this milestone exists to close — it would keep passing while the
// roster grew past it, and the ids it had never heard of would be refused as unknown.
import { CHECKPOINTS, DISPOSITIONS } from "./checkpoints.js";
// (Plan 30-10, finding B-1) WHICH FILES ARE GOVERNANCE CONFIGURATION IS THE READER'S ANSWER, ASKED.
// scripts/context-io.ts owns the candidate list and its precedence order; this file imports it so
// the form check below is applied at exactly the positions the reader would consult and at no
// invented third one. Spelling the two paths here instead would be a second answer to one question,
// free to drift the day a location is added — which is precisely how the form check came to be
// asked only at the file the reader consults second.
import { governanceConfigCandidates } from "./context-io.js";
// THE BOARD GRAMMAR IS READ, NEVER RESTATED (DASH-01 / D-06). scripts/board-model.ts is the only
// sanctioned reader of plans/board.md, and agent-factory/contracts/board.md is the normative schema
// it cites. This file used to carry its own two-line column parser, which made the validator a
// SECOND authority on what a column is — free to disagree with the projector, and a disagreement
// between two parsers is invisible until it has already misreported the board. `kebab` comes from
// the same module for the same reason: `kebab(column) === status` is a rule of that grammar.
import { boardHasColumn, kebab, parseBoard } from "./board-model.js";
// ── Two-root resolution (VAL-02 / D-08 — kit root + state root, resolved separately) ─────────
// STATE_ROOT keeps the install.ts back-compat shape: VALIDATE_ROOT, else the repo root.
// KIT_ROOT comes ONLY from VALIDATE_KIT_ROOT and has NO default — the deliberate C3 override
// ("no fallback" beats "sensible default" here, and ONLY here). Unset → hard error, never a
// silent "." / dev-checkout fallback that would false-green.
const SCRIPT_DIR = import.meta.dirname;
// ONE EXPRESSION FOR "WAS A STATE ROOT SUPPLIED" (plan 30-10, round 4, finding R6-1).
//
// There were two tests over one variable: `STATE_ROOT` branched on TRUTHINESS while the scope
// caveat tested `!== undefined`. `VALIDATE_ROOT=""` — the ordinary shape of a CI wrapper that
// exports an unset variable — therefore took the fallback branch (state root = the kit, the two
// bases collapsed, the repository's governing config form-checked at no base) while the caveat was
// suppressed because the variable existed. Both questions now read one value.
const SUPPLIED_STATE_ROOT = process.env.VALIDATE_ROOT?.trim() || null;
const STATE_ROOT = SUPPLIED_STATE_ROOT
    ? resolve(SUPPLIED_STATE_ROOT)
    : resolve(SCRIPT_DIR, ".."); // back-compat repo root for STATE only
if (!process.env.VALIDATE_KIT_ROOT) {
    console.error("  ERROR    VALIDATE_KIT_ROOT is unset — refusing to default the kit root to '.' (C3)");
    process.exit(1); // the no-false-green guard (NO DEFAULT)
}
const KIT_ROOT = resolve(process.env.VALIDATE_KIT_ROOT);
// ── Safe filesystem helpers, forked per root (try/catch → null/false/[]; never throw) ────────
// kit* resolve under KIT_ROOT; state* resolve under STATE_ROOT. Each keeps the fail-closed
// posture verbatim so a missing/garbled file becomes a finding, never an unhandled throw.
const kitExists = (rel) => existsSync(join(KIT_ROOT, rel));
const kitRead = (rel) => {
    try {
        return readFileSync(join(KIT_ROOT, rel), "utf8");
    }
    catch {
        return null;
    }
};
// (27-53, IN-01) THE KIT-SIDE LIST HELPER IS GONE. Its callers left with the kit sets when those
// moved to scripts/kit-model.ts (KIT-01), and it was this repository's ONLY `--noUnusedLocals`
// error — the single thing standing between the tree and two compiler flags that keep the next
// migration's residue from surviving silently. The `readdirSync` import STAYS: `stateListDir`
// below still uses it, confirmed by reading rather than assumed.
const stateExists = (rel) => existsSync(join(STATE_ROOT, rel));
const stateRead = (rel) => {
    try {
        return readFileSync(join(STATE_ROOT, rel), "utf8");
    }
    catch {
        return null;
    }
};
const stateListDir = (rel) => {
    try {
        return existsSync(join(STATE_ROOT, rel)) ? readdirSync(join(STATE_ROOT, rel)) : [];
    }
    catch {
        return [];
    }
};
// ── Two-tier finding collector (D-44) ───────────────────────────────────────────────────────
const errors = [];
const warnings = [];
const STRICT = process.argv.includes("--strict");
const err = (m) => {
    errors.push(m);
};
const warn = (m) => {
    warnings.push(m);
};
// ── Derived name lists (KIT-02, Phase 27 — the frozen arrays are DELETED) ────────────────────
// Until Phase 27 this file froze a 14-entry workflow array and a 16-entry role array, copied from
// the Phase-4 shell harness. Both had rotted: the kit holds 19 workflows and 17 roles, so five
// workflows and one role were simply never validated and NOTHING reported that. A hand-maintained
// set of names that consumers read as truth, rotting silently while the suite stays green, is the
// exact failure class this milestone exists to delete. Membership now follows the filesystem
// through kit-model.ts — add role #18 and this validator sees it in the same run.
//
// EXTENSION SHAPE — the sharpest hazard here. kit-model's pinned return shape is filenames WITH
// the `.md` extension (`orchestrator.md`), which is what the guards that build repo-relative paths
// from it want. These two lists are BASENAMES WITHOUT the extension, because all five consumer
// sites below append `.md` themselves. The strip therefore happens HERE, once, at this call site —
// never by changing the shared return shape, which would break every other consumer. A direct
// substitution without the strip would append a SECOND extension in every path join, so every
// existence check would fail and read as a wall of bogus findings. (The doubled form is not
// written out even as an example here: an acceptance grep for it over the compiled output is what
// proves the strip is in place, and a comment carrying the literal would defeat that grep.)
//
// VACUITY / MISSING-DIRECTORY FLOOR. Deriving a set silently deletes a fail-red branch: a role
// file that disappears simply stops being a member, so `checkRequiredFiles`'s per-name existence
// loop can no longer fail on it. Two things preserve the signal. kit-model THROWS on an unreadable
// directory and on a zero-length filtered result (a library that quietly returns [] is what lets
// every downstream loop pass vacuously); this file catches that throw and converts it into an
// ordinary `missing required …` finding, keeping its own never-throw fail-closed posture and the
// existing "kit root points at nothing" behaviour intact. Exact CARDINALITY is deliberately NOT
// asserted here — the validator must run against arbitrary kit roots, including the small
// fixtures — so the two-sided count check lives in guard_kit_counts and the deletion signal in the
// KIT-03 referential-integrity oracle, both of which run against the real kit only.
const stripMd = (filename) => filename.replace(/\.md$/, "");
// Derive one kit set through kit-model, degrading an unreadable/empty directory to a finding.
// KIT_ROOT is passed EXPLICITLY (D-22): kit-model reads no environment variable, so the tree keeps
// exactly the root conventions it already has and this file gains no fourth one.
function deriveKitNames(lister, kind, subpath) {
    try {
        return lister(KIT_ROOT).map(stripMd);
    }
    catch {
        err(`missing required ${kind} directory: ${subpath} (kit root holds no readable ${kind} set)`);
        return [];
    }
}
const WORKFLOWS = deriveKitNames(listWorkflows, "workflow", "agent-factory/workflows");
// The 17 static handoff templates were DELETED in Phase 24 (the shared verified-context notes
// replaced the static-handoff relay). The former FROZEN_HANDOFFS existence list is gone with them;
// a workflow's role output is now recorded as typed notes per Workflow 16, and the requirement→
// code→test→release trace SURVIVES as the note-derived plans/traceability.md render (D-01). The
// per-ticket trace-completeness check below (checkTickets) is RE-POINTED at that render — same
// path, same ticket-id key (trace.includes(id)), only the row source changed (D-04, Pitfall 4):
// it is preserved, never removed, so the trace-completeness guarantee is not silently weakened.
// The role corpus, minus the `_`-prefixed protocol file (kit-model's own filter — the protocol is
// asserted separately by checkRoleSwitchProtocol, which is why it must not be a ROLES member).
const ROLES = deriveKitNames(listRoles, "role", "agent-factory/roles");
// 11 checklist filenames (10 named + 00-index) — existence-only per §18.
const CHECKLISTS = [
    "00-index",
    "definition-of-ready",
    "definition-of-done",
    "definition-of-done-enterprise",
    "pr-review-checklist",
    "security-nfr-checklist",
    "compliance-checklist",
    "accessibility-checklist",
    "observability-slo-checklist",
    "release-readiness-checklist",
    "uat-checklist",
];
// Role section headings — match by PREFIX (^## <prefix>), never exact, never uniqueness.
// The real headers carry parenthetical suffixes (## Output (file + format), etc.), and the
// duplicate ## Scope/## Risks in two handoffs means presence>=1 is the only safe assertion
// (PROJECT.md line 96; RESEARCH Pitfall 1/2).
const ROLE_SECTIONS = [
    "## One job",
    "## Caveman prompt",
    "## Reads",
    "## Responsibilities",
    "## Output",
    "## Board moves",
    "## Trace updates",
    "## Hard limits",
];
// Workflow section headings — the §18-named sections, prefix-matched (## Metrics emitted is
// bonus and not asserted). The former "## Handoffs" section was dropped in Phase 24: workflows
// no longer produce static handoffs — role outputs are recorded as typed notes per Workflow 16,
// so a workflow has no required handoff section to assert.
const WORKFLOW_SECTIONS = [
    "## When",
    "## Agents",
    "## Inputs",
    "## Steps",
    "## Board moves",
    "## Trace updates",
    "## Stop",
    "## Done",
];
// ── Helpers ──────────────────────────────────────────────────────────────────────────────────
// `kebab` used to be declared here. It now lives in scripts/board-model.ts and is imported above,
// because the rule that joins a board column to a ticket status — `kebab(column) === status` — is
// part of the board grammar and the grammar has exactly one spelling (DASH-01 / D-06).
// Section presence by prefix: present if ANY line starts with the prefix. Handles
// "## Output (file + format)" and tolerates duplicate sections (presence, not uniqueness).
function checkSections(rel, text, sections, kind) {
    const lines = text.split("\n");
    for (const sec of sections) {
        if (!lines.some((l) => l.startsWith(sec))) {
            err(`${rel}: missing required ${kind} section "${sec}"`);
        }
    }
}
// ── Check 1: required files exist ─────────────────────────────────────────────────────────────
function checkRequiredFiles() {
    // These two loops now iterate a DERIVED set, so under normal conditions they cannot fail — a
    // deleted role file stops being a member rather than becoming a finding. They are kept, not
    // deleted, because they still catch a file that vanishes or becomes unreadable between the
    // derivation above and this check. The real "the kit set is wrong" signal moved to two places
    // that CAN see it: deriveKitNames' catch (unreadable/empty directory → a finding right here) and
    // guard_kit_counts + the KIT-03 referential-integrity oracle (exact cardinality, real kit only).
    for (const r of ROLES) {
        const rel = `agent-factory/roles/${r}.md`;
        if (!kitExists(rel))
            err(`missing required role file: ${rel}`);
    }
    for (const w of WORKFLOWS) {
        const rel = `agent-factory/workflows/${w}.md`;
        if (!kitExists(rel))
            err(`missing required workflow file: ${rel}`);
    }
    // (Phase 24) No handoff-template existence loop: the 17 static templates were deleted; role
    // output is now typed notes (Workflow 16) and the trace survives as the note-derived render.
    for (const c of CHECKLISTS) {
        const rel = `agent-factory/checklists/${c}.md`;
        if (!kitExists(rel))
            err(`missing required checklist file: ${rel}`);
    }
    // The former single mixed loop (lines ~201-211) is split by Phase-7 classification:
    // KIT refs (agent-factory/… + AGENTS.md) resolve under KIT_ROOT…
    for (const rel of [
        "agent-factory/config/factory.config.json",
        "agent-factory/config/factory.config.md",
        "agent-factory/packaging/adapters.md",
        "AGENTS.md",
    ]) {
        if (!kitExists(rel))
            err(`missing required file: ${rel}`);
    }
    // …and STATE refs (plans/…) resolve under STATE_ROOT.
    for (const rel of [
        "plans/board.md",
        "plans/traceability.md",
        "plans/nfr-catalog.md",
        "plans/metrics.md",
    ]) {
        if (!stateExists(rel))
            err(`missing required file: ${rel}`);
    }
}
// ── Check 2: role section presence ─────────────────────────────────────────────────────────────
function checkRoleSections() {
    for (const r of ROLES) {
        const rel = `agent-factory/roles/${r}.md`;
        const text = kitRead(rel);
        if (text === null)
            continue; // missing-file already reported by checkRequiredFiles
        checkSections(rel, text, ROLE_SECTIONS, "role");
    }
}
// ── Check 3: workflow section presence ──────────────────────────────────────────────────────────
function checkWorkflowSections() {
    for (const w of WORKFLOWS) {
        const rel = `agent-factory/workflows/${w}.md`;
        const text = kitRead(rel);
        if (text === null)
            continue;
        checkSections(rel, text, WORKFLOW_SECTIONS, "workflow");
    }
}
// ── Check 4: config parses + has mode/cadence (autonomy RETIRED — its presence is refused) ────
//
// ═══════════════════════════════════════════════════════════════════════════════════════════════
// (Plan 30-10, red-team surface B round 1 — FINDING B-1) THE FORM CHECK IS ONE AUTHORITY, ASKED AT
// EVERY POSITION A GOVERNANCE CONFIGURATION CAN GOVERN FROM.
//
// This check used to be a single function bound to ONE path: `agent-factory/config/factory.config.json`
// under the kit root. `readGovernanceConfig` (scripts/context-io.ts) resolves a governance
// configuration from TWO locations and prefers the repo-dropped `.grugops/factory.config.json`, so
// every finding below — the required-key loop, the retired-`autonomy` refusal, the `checkpoints`
// form check, the TINT-03 carve-out, the WR-01 deploy boolean and the dial enums — was being asked
// at the file the reader consults SECOND and never at the file that decides runtime behaviour.
//
// MEASURED, against the committed artifact, before this change: nine of nine payloads this
// validator refuses in the kit config produced `ALL CHECKS PASSED` and exit 0 when written to
// `.grugops/factory.config.json` — including `checkpoints.test_integrity: "off"`, the one value the
// TINT-03 carve-out states has no legal form, which the reader then reports as the effective
// disposition. The predicate accepted the right characters and was never consulted at the position
// that mattered; the repair is positional, and the pattern itself is unchanged.
//
// TWO PROPERTIES HOLD THE REPAIR IN PLACE, AND BOTH ARE ASSERTED IN scripts/validate.test.ts:
//   1. ONE authority. The whole per-file predicate lives in `checkConfigForm` and is called from
//      every position; there is no second, laxer copy for the second file.
//   2. The POSITIONS come from the reader. `governanceConfigCandidates` is imported, never
//      re-spelled here, so "which files are governance configuration" has one answer and a third
//      location added later reaches this gate without an edit.
// ═══════════════════════════════════════════════════════════════════════════════════════════════
// ── The BASES a governance read in the installation under test resolves against (round 2, F1) ──
//
// ROUND 1'S REPAIR CREATED THIS DEGREE OF FREEDOM AND DID NOT CLOSE IT. It took the POSITIONS from
// the reader — `governanceConfigCandidates` — and left the BASE hand-chosen at `STATE_ROOT`. The
// reader has two bases: the caller's `repoRoot`, and its own `GOVERNANCE_FALLBACK_BASE` when the
// caller supplies none, which is the declared default of `admit()`, `admitAndAppend()` and the
// `context-io.js admit` CLI, and the base the PreToolUse guard's read lands on wherever
// `CLAUDE_PROJECT_DIR` is unset. Measured before this change: identical illegal bytes produced six
// named errors at `STATE_ROOT/.grugops/factory.config.json` and `ALL CHECKS PASSED` at
// `KIT_ROOT/.grugops/factory.config.json` — the same file name, the same reader, one of them
// governing and unchecked.
//
// THE SET IS THE VALIDATOR'S OWN TWO DOCUMENTED ROOTS, AND NOTHING ELSE IS INVENTED HERE. The
// caller names a kit and a state root; those are the two trees the installation under test resolves
// against, and `GOVERNANCE_FALLBACK_BASE` is `<kit>` BY CONSTRUCTION (it is `import.meta.dirname`'s
// parent, and `context-io.js` lives at `<kit>/scripts`), so covering `KIT_ROOT` covers it.
// `scripts/validate.test.ts` asserts that construction rather than leaving it as this paragraph.
//
// The order is KIT then STATE, and it is load-bearing for the LABEL rather than for the verdict: a
// path reachable from both bases is checked once, under the first base that names it, so the
// in-kit config keeps the `agent-factory/config/factory.config.json` label it has always had.
const GOVERNANCE_BASES = [KIT_ROOT, STATE_ROOT];
/**
 * The governance positions this run actually examined, and the bases it enumerated them under.
 *
 * ═══════════════════════════════════════════════════════════════════════════════════════════════
 * (Plan 30-10, round 3, finding R4-3) THE VERDICT NAMES ITS OWN SCOPE, BECAUSE IT CANNOT DERIVE IT.
 *
 * `STATE_ROOT` falls back to `resolve(SCRIPT_DIR, "..")` — "the repo root (back-compat)". In the
 * SHARED INSTALL this project shipped in v1.1 that is the KIT, not the repository, so under the
 * validator's OWN documented single-root invocation `GOVERNANCE_BASES` becomes `[kit, kit]`, the
 * resolved-path dedupe collapses them, and the repository's `.grugops/factory.config.json` — the
 * file `readGovernanceConfig(<repo>)` actually governs from — is form-checked at no base. Measured:
 * identical governing bytes produced `ALL CHECKS PASSED` under the single-root form and 4 named
 * errors under the two-root form, depending only on whether a second environment variable was set.
 *
 * WHY THIS IS REPORTED RATHER THAN REFUSED, STATED PLAINLY RATHER THAN PREFERRED. A refusal needs a
 * predicate that separates "the kit and the state tree genuinely coincide" (the in-repo dev checkout,
 * where the default is correct) from "the state root silently aliased the kit" (the shared install).
 * The validator's inputs do not contain one: in BOTH cases `resolve(SCRIPT_DIR, "..") === KIT_ROOT`,
 * because in both cases the operator runs the kit's own script. `process.cwd()` distinguishes them
 * and is not an input this gate has ever consulted — and every fixture in `validate.test.ts` spawns
 * with the repository as cwd against a temp kit, so a cwd rule would refuse thirty legitimate runs.
 *
 * So the property the finding names — "a gate reports a verdict for a check it did not perform" — is
 * removed at its root instead: the run PUBLISHES the governance positions it examined and, when no
 * state root was supplied, says so and names the remedy. `ALL CHECKS PASSED` over an unexamined
 * governing file becomes `ALL CHECKS PASSED` beside a line saying which files were examined and
 * which class was not. The residual is recorded rather than closed, and it is recorded where the
 * operator reads it.
 * ═══════════════════════════════════════════════════════════════════════════════════════════════
 */
const governanceExamined = [];
/**
 * How many NEW candidate paths each base contributed, indexed by its position in `GOVERNANCE_BASES`.
 *
 * An ARRAY and not a map keyed by the base string: when the two roots are the same tree they are the
 * same key, and a map would report the kit's own contribution for the state base. The loop's answer
 * has to be per POSITION.
 */
const governanceBaseContributions = [];
/**
 * A base as the filesystem knows it, so two SPELLINGS of one tree cannot look like two trees.
 *
 * (Round 4, finding R6-2.) `resolve()` normalises `.` and `..` and does not follow symlinks, so a
 * symlinked kit path — macOS `/tmp` and the whole default `TMPDIR` under `/var`, a symlinked
 * `~/.grugops`, a Windows junction — made the two bases compare unequal, the caveat vanish and the
 * SCOPE line double-list the same file. Resolving the BASE (which exists, or the run has already
 * failed elsewhere) rather than each candidate keeps this out of the throwing path that
 * `V-30-10-04` item 1 records as the reason the dedupe was left spelling-based.
 */
function canonicalBase(base) {
    try {
        return realpathSync(base);
    }
    catch {
        return resolve(base);
    }
}
function checkConfig() {
    // The in-kit config's resolved path — the ONE position at which `mode` and `cadence` are read by
    // anything, and therefore the one at which their absence is a finding (reviewer 4 obs. 4).
    // Built from the CANONICAL base, exactly as the loop's own candidates are — otherwise a symlinked
    // temp root makes this identity test miss the very file the loop is about to check (round 4).
    const kitConfigAbs = resolve(join(canonicalBase(KIT_ROOT), "agent-factory", "config", "factory.config.json"));
    // ONE LOOP, ONE READ, ONE PREDICATE — the kit arm is gone (round 2, F3).
    //
    // It used to be a separate arm reading through `kitRead`, which catches every error to `null` and
    // therefore conflates ABSENT with UNREADABLE. The arm treated `null` as absence, and round 1's
    // resolved-path dedupe then skipped the state arm — the only one that knows how to say "exists
    // but could not be read" — for exactly that path. An unreadable governing config produced
    // `ALL CHECKS PASSED`: a gate reporting a verdict for a check it did not perform, which is the
    // Phase 28 AP-1 anti-pattern at severity `blocking` that this phase carries forward.
    //
    // Folding the kit path into the candidate loop deletes that second arm rather than teaching it a
    // third outcome. There is now one existence test, one read, one unreadable message and one form
    // check, asked at every position under every base.
    const seen = new Set();
    for (let b = 0; b < GOVERNANCE_BASES.length; b += 1) {
        const base = canonicalBase(GOVERNANCE_BASES[b]);
        governanceBaseContributions[b] = 0;
        for (const abs of governanceConfigCandidates(base)) {
            const key = resolve(abs);
            if (seen.has(key))
                continue; // one file, one verdict — a positional repair must not double-report
            seen.add(key);
            governanceBaseContributions[b] += 1;
            // ABSENT is the documented lean default and never a finding (SC4 / AUTO-07). A missing in-kit
            // config is separately reported by the required-file check, so absence stays silent here.
            if (!existsSync(abs))
                continue;
            let raw;
            try {
                raw = readFileSync(abs, "utf8");
            }
            catch {
                raw = null;
            }
            const label = relativeToBase(base, abs);
            governanceExamined.push(label);
            if (raw === null) {
                // It EXISTS and could not be read. The reader calls that `unreadable` and fails closed on
                // it; this gate says so rather than passing over a file it could not examine.
                err(`${label}: exists but could not be read`);
                continue;
            }
            // THE REQUIRED-KEY LOOP RUNS ONLY WHERE THOSE KEYS ARE READ (round 3, reviewer 4 obs. 4).
            //
            // F1 applied the WHOLE per-file predicate at a position that previously had no predicate, so
            // the most natural use of the first candidate — a repository dropping a checkpoints-only
            // override — was refused for `missing or empty required key "mode"`. The reader reads such a
            // file happily and governs from it, and NOTHING reads `mode` or `cadence` out of it: every
            // consumer of those two keys reads the in-kit config by its own fixed path. A false red on a
            // position's natural use is exactly the pressure that gets a positional repair widened back
            // out, so the requirement MOVES to its point of effect rather than being dropped or endured.
            //
            // EXACTLY ONE ARM IS SCOPED. Every other form check — the retired scalar, the checkpoint
            // matrix, the TINT-03 carve-out, the WR-01 boolean, the dial enums, the JSON shape — runs at
            // every position under every base, and `scripts/validate.test.ts` asserts both halves.
            checkConfigForm(label, raw, resolve(abs) === kitConfigAbs);
        }
    }
}
/** A path under `base`, rendered base-relative with POSIX separators for the finding line. */
function relativeToBase(base, abs) {
    const prefix = base.endsWith(sep) ? base : base + sep;
    const rel = abs.startsWith(prefix) ? abs.slice(prefix.length) : abs;
    return rel.split(sep).join("/");
}
/**
 * The per-file governance-config form check. ONE predicate, called once per position.
 *
 * `rel` is the label every finding is reported under, so a reader is told WHICH configuration is
 * malformed — the two positions produce identical findings against identical bytes, differing only
 * in the path they name.
 */
function checkConfigForm(rel, raw, requireBaseKeys) {
    let cfg;
    try {
        cfg = JSON.parse(raw);
    }
    catch {
        err(`${rel}: not valid JSON`);
        return;
    }
    // JSON.parse("null") returns null WITHOUT throwing (so does a bare array / primitive),
    // slipping past the try/catch above; the cfg[key] deref below would then crash with an
    // uncaught TypeError, violating the file-header fail-closed invariant. Reject any
    // non-object parse result as a greppable finding before dereferencing (CR-03 / GAP-3).
    if (cfg === null || typeof cfg !== "object" || Array.isArray(cfg)) {
        err(`${rel}: not a JSON object`);
        return;
    }
    const cfgObj = cfg;
    if (requireBaseKeys) {
        for (const key of ["mode", "cadence"]) {
            if (typeof cfgObj[key] !== "string" || cfgObj[key].trim() === "") {
                err(`${rel}: missing or empty required key "${key}"`);
            }
        }
    }
    // ── The RETIRED `autonomy` scalar — a POLARITY FLIP, not an addition (Phase 30, D-05) ────────
    // This validator refused the ABSENCE of `autonomy` until this phase; it now refuses its
    // PRESENCE. The scalar was documentary — it graded `diff | branch | pr` and no mechanism read it
    // — and Phase 30 replaces it with the enforced per-checkpoint `checkpoints` matrix. There is no
    // coexistence mode and no conflict-resolution rule: two live vocabularies over one question is
    // the second-authority defect this milestone exists to close, so a config carrying the old key
    // is refused rather than read alongside the new one.
    //
    // The message names the REPLACEMENT and the TABLE, so a user reading a red run can migrate
    // without opening a document to find out what to do.
    if ("autonomy" in cfgObj) {
        err(`${rel}: the retired "autonomy" key is present. It is replaced by the per-checkpoint ` +
            `"checkpoints" object (each id set to ${DISPOSITIONS.join("|")}); translate the old ` +
            `diff/branch/pr value with the legacy grade table in ` +
            `agent-factory/config/factory.config.md and delete the key`);
    }
    // ── Optional-enum recognition of the 8 new v1.2 dial keys (SDLC-03 / D-14) ──────────────────
    // ACTIVE-WHEN-PRESENT, LENIENT-WHEN-ABSENT — the opposite contract to the required-string loop
    // above: a MISSING key is its documented lean default (NEVER an error — preserves SC4
    // zero-config); only an INVALID PRESENT value is an err() (always nonzero, even bare — RESEARCH
    // Security row 5, never warn()). Every check is guarded by `if (key in obj)`, never the
    // unconditional loop, so a config without these keys still passes (Pitfall 5 / D-14).
    // The trace-integrity enum is ["warn","block"] — disabling it is deliberately EXCLUDED
    // (TINT-03 safety carve-out: trace-integrity is never fully dialable off).
    const ENUMS = {
        bdd: ["off", "lean", "strict"],
    };
    const Q_ENUMS = {
        tdd: ["off", "encouraged", "required"],
        ui_e2e: ["off", "ui-or-critical-path", "always"],
        test_integrity: ["warn", "block"], // disabling EXCLUDED — TINT-03 carve-out
        gate_enforcement: ["advisory", "blocking"],
    };
    const SEC_ENUMS = {
        asvs_level: ["L1", "L2", "L3"],
        block_on: ["none", "low", "medium", "high"],
    };
    // top-level bdd — presence-guarded; absent = lean default, no error (SC4).
    if ("bdd" in cfgObj && !ENUMS.bdd.includes(cfgObj.bdd)) {
        err(`${rel}: invalid "bdd" value "${cfgObj.bdd}" (allowed: ${ENUMS.bdd.join("|")})`);
    }
    // quality.* enums — only if quality is a non-null, non-array object.
    const quality = cfgObj.quality;
    if (quality && typeof quality === "object" && !Array.isArray(quality)) {
        const q = quality;
        for (const [k, allowed] of Object.entries(Q_ENUMS)) {
            if (k in q && !allowed.includes(q[k])) {
                err(`${rel}: invalid "quality.${k}" value "${q[k]}" (allowed: ${allowed.join("|")})`);
            }
        }
        // quality.lint is an OBJECT { strict:bool, autofix:bool } — SHAPE-check, not enum (D-12).
        if ("lint" in q) {
            const l = q.lint;
            if (l === null || typeof l !== "object" || Array.isArray(l)) {
                err(`${rel}: "quality.lint" must be an object { strict, autofix }`);
            }
            else {
                const lint = l;
                if ("strict" in lint && typeof lint.strict !== "boolean") {
                    err(`${rel}: "quality.lint.strict" must be boolean`);
                }
                if ("autofix" in lint && typeof lint.autofix !== "boolean") {
                    err(`${rel}: "quality.lint.autofix" must be boolean`);
                }
            }
        }
    }
    // security.* enums — only if security is a non-null, non-array object.
    const security = cfgObj.security;
    if (security && typeof security === "object" && !Array.isArray(security)) {
        const s = security;
        for (const [k, allowed] of Object.entries(SEC_ENUMS)) {
            if (k in s && !allowed.includes(s[k])) {
                err(`${rel}: invalid "security.${k}" value "${s[k]}" (allowed: ${allowed.join("|")})`);
            }
        }
    }
    // ── The `checkpoints` matrix — form-checked against the IMPORTED roster (Phase 30, D-08) ─────
    // IT INHERITS THE CONTRACT STATED ABOVE, VERBATIM: ACTIVE-WHEN-PRESENT, LENIENT-WHEN-ABSENT.
    // An absent `checkpoints` object and an absent individual id are both the documented lean
    // default and NEVER an error (AUTO-07 — a repository that configures nothing keeps the
    // un-lowered posture, which is exactly what the roster's own defaults give it). Only a PRESENT
    // invalid declaration is refused. Every check below is reached only through a presence test; no
    // loop over the roster can produce a finding for an id the config does not mention.
    //
    // TWO THINGS DIFFER FROM THE `quality` BLOCK ABOVE, AND BOTH ARE DELIBERATE.
    //   1. The legal KEY set is the imported roster rather than a table written here. Nothing in this
    //      file lists checkpoint ids.
    //   2. An UNKNOWN key is itself a refusal, which the quality block has no arm for. A checkpoint
    //      id the roster does not carry cannot be gated by anything, so accepting it would let a
    //      typo read as a configured stop that never fires — silently, and in the permissive
    //      direction. The refusal names the offending id and quotes the roster back.
    if ("checkpoints" in cfgObj) {
        const ck = cfgObj.checkpoints;
        if (ck === null || typeof ck !== "object" || Array.isArray(ck)) {
            err(`${rel}: "checkpoints" must be an object mapping checkpoint ids to ` +
                `${DISPOSITIONS.join("|")} (a matrix cannot come out of the value written here)`);
        }
        else {
            const legalIds = new Set(CHECKPOINTS);
            const rosterList = [...CHECKPOINTS].sort().join(", ");
            for (const [id, value] of Object.entries(ck)) {
                if (!legalIds.has(id)) {
                    err(`${rel}: unknown checkpoint id "checkpoints.${id}" — the roster is closed ` +
                        `(allowed ids: ${rosterList})`);
                    continue;
                }
                if (typeof value !== "string" || !DISPOSITIONS.includes(value)) {
                    err(`${rel}: invalid "checkpoints.${id}" value ${JSON.stringify(value)} ` +
                        `(allowed: ${DISPOSITIONS.join("|")})`);
                    continue;
                }
                // The TINT-03 carve-out, restated at the ONE place a checkpoint value is judged. Trace
                // integrity is never fully dialable off — the same floor `quality.test_integrity`'s
                // warn|block enum carries, expressed in the matrix's own vocabulary. `notify` is the
                // matrix spelling of `warn` and remains legal; `off` is the value that has no legal form.
                if (id === "test_integrity" && value === "off") {
                    err(`${rel}: "checkpoints.test_integrity" must not be "off" (TINT-03 trace-integrity ` +
                        `safety carve-out — the gate must never silently accept a hollowed-out test suite; ` +
                        `use "notify" for the advisory posture)`);
                }
            }
        }
    }
    // ── Safety invariant: production_requires_human_confirmation must be true (WR-01) ────────────
    // The ONE field in the schema with a hardcoded safety floor ("Must stay `true`",
    // factory.config.md:28) — the mechanical form of the no-agent-deploy rule (agents never deploy
    // to production alone; a named human always confirms). Mirrors the TINT-03 carve-out: there is
    // NO false value in ANY mode. Presence-guarded so an ABSENT key stays the lean `true` default
    // (preserving SC4 zero-config — only an explicit `false` is rejected); an err() (always nonzero,
    // even bare — never warn()) because a silently-dialed-off deploy guard is a safety regression.
    if ("production_requires_human_confirmation" in cfgObj &&
        cfgObj.production_requires_human_confirmation !== true) {
        err(`${rel}: "production_requires_human_confirmation" must be true (agents never deploy to production alone)`);
    }
}
function frontMatter(text) {
    const col = text.match(/^column:\s*(.+)$/m);
    const status = text.match(/^status:\s*(.+)$/m);
    return {
        column: col ? col[1].trim() : null,
        status: status ? status[1].trim() : null,
    };
}
function checkTickets() {
    const ticketFiles = stateListDir("plans/tickets").filter((f) => f.endsWith(".md"));
    if (ticketFiles.length === 0)
        return; // D-43 vacuity: zero tickets → green
    const board = stateRead("plans/board.md") || "";
    const trace = stateRead("plans/traceability.md") || "";
    // WHICH HEADINGS OPEN A COLUMN IS ASKED OF THE GRAMMAR, NOT ANSWERED HERE (DASH-01 / D-06).
    // The rule lives in `boardColumnName`/`boardHasColumn` in scripts/board-model.ts and is stated in
    // prose in agent-factory/contracts/board.md §Headings: exactly three legal suffixes, exact-name
    // equality after the strip, and every other `##` line opening no column at all.
    const boardModel = parseBoard(board);
    for (const f of ticketFiles) {
        const rel = `plans/tickets/${f}`;
        const text = stateRead(rel);
        if (text === null)
            continue;
        const { column, status } = frontMatter(text);
        if (column && !boardHasColumn(boardModel, column)) {
            err(`${rel}: column "${column}" is not a board column`);
        }
        if (column && status && kebab(column) !== status) {
            err(`${rel}: status "${status}" does not match column "${column}" (expected kebab "${kebab(column)}")`);
        }
        // Traceability completeness — WARNING (D-44). Ticket id = filename without extension.
        const id = f.replace(/\.md$/, "");
        if (!trace.includes(id)) {
            warn(`${rel}: no traceability row for ticket "${id}"`);
        }
    }
}
// ── Check 7: packaging present + plugin.json has a name ───────────────────────────────────────
function checkPackaging() {
    if (!kitExists("agent-factory/packaging/adapters.md")) {
        err("missing required packaging file: agent-factory/packaging/adapters.md");
    }
    const rel = ".claude-plugin/plugin.json";
    if (kitExists(rel)) {
        const raw = kitRead(rel);
        if (raw === null) {
            // Present but unreadable (EACCES, transient I/O error, or path is a directory).
            // JSON.parse(null) returns null (it does NOT throw), so without this guard the
            // manifest.name deref below crashes with an uncaught TypeError — violating the
            // file's fail-closed invariant. Mirror checkConfig's early return (line 239).
            err(`${rel}: present but unreadable`);
            return;
        }
        let manifest;
        try {
            manifest = JSON.parse(raw);
        }
        catch {
            err(`${rel}: not valid JSON`);
            return;
        }
        // Twin of checkConfig's guard: JSON.parse("null") returns null without throwing (so does
        // an array / primitive), and the manifest.name deref below would crash with an uncaught
        // TypeError. Reject any non-object parse result as a greppable finding (CR-03 / GAP-3).
        if (manifest === null || typeof manifest !== "object" || Array.isArray(manifest)) {
            err(`${rel}: not a JSON object`);
            return;
        }
        const m = manifest;
        if (typeof m.name !== "string" || m.name.trim() === "") {
            err(`${rel}: missing or empty required field "name"`);
        }
    }
}
// ── Check 8: role-switch protocol exists + is referenced by the Orchestrator ──────────────────
// Structural only: the protocol file is present AND orchestrator.md points at it by path. We
// assert the reference (a substring), never the protocol's prose — presence, not behavior.
function checkRoleSwitchProtocol() {
    const protocolRel = "agent-factory/roles/_role-switch-protocol.md";
    if (!kitExists(protocolRel)) {
        err(`missing required file: ${protocolRel}`);
    }
    const orchRel = "agent-factory/roles/orchestrator.md";
    const orch = kitRead(orchRel);
    if (orch === null)
        return; // missing-file already reported by checkRequiredFiles
    if (!orch.includes("_role-switch-protocol")) {
        err(`${orchRel}: does not reference the role-switch protocol (_role-switch-protocol)`);
    }
}
// ── Check 9: commit-convention file exists ────────────────────────────────────────────────────
function checkCommitConvention() {
    const rel = "agent-factory/_commit-convention.md";
    if (!kitExists(rel)) {
        err(`missing required file: ${rel}`);
    }
}
// ── Check 10: every workflow has a "## Commit" section ────────────────────────────────────────
// Prefix-match (a line that startsWith "## Commit"), consistent with checkSections — tolerates a
// parenthetical suffix. Structural presence only.
function checkWorkflowCommit() {
    for (const w of WORKFLOWS) {
        const rel = `agent-factory/workflows/${w}.md`;
        const text = kitRead(rel);
        if (text === null)
            continue; // missing-file already reported by checkRequiredFiles
        const hasCommit = text.split("\n").some((l) => l.startsWith("## Commit"));
        if (!hasCommit) {
            err(`${rel}: missing required "## Commit" section`);
        }
    }
}
// ── Run all checks ───────────────────────────────────────────────────────────────────────────
checkRequiredFiles();
checkRoleSections();
checkWorkflowSections();
checkConfig();
checkTickets();
checkPackaging();
checkRoleSwitchProtocol();
checkCommitConvention();
checkWorkflowCommit();
// ── The governance SCOPE line, printed on every run (round 3, R4-3) ───────────────────────────
// A verdict that does not name its own scope is a verdict about an unstated set. This says which
// governance configurations were examined and, when the state root was not supplied, that the run
// examined none outside the kit and how to change that.
const stateRootSupplied = SUPPLIED_STATE_ROOT !== null;
// (Round 4, finding R6-2) THE BASE IDENTITY IS THE LOOP'S OWN BEHAVIOUR, NOT A SECOND STRING TEST.
//
// It was `resolve(KIT_ROOT) === resolve(STATE_ROOT)` — the operator's SPELLING of the kit compared
// against a realpath-resolved `import.meta.dirname`. Any symlinked ancestor on the kit path (macOS
// `/tmp` and the whole default `TMPDIR` under `/var`, a symlinked `~/.grugops`, a Windows junction)
// makes two spellings of one tree compare unequal, so the caveat vanished from the exact invocation
// R4-3 was written for and the SCOPE line double-listed the in-kit config instead. It also inverted
// a recorded residual: `V-30-10-04` item 1 disposes of the `resolve()`-not-`realpathSync` dedupe as
// "noisy, never permissive", which stopped being true the moment that identity test acquired a
// second consumer whose false negative suppresses a disclosure.
//
// So the question is answered by the candidate loop itself: the state base COLLAPSED onto the kit
// base exactly when it contributed no resolved path the kit base had not already contributed. One
// authority, no spelling, and a future candidate-list change moves it automatically.
const basesCollapsed = governanceBaseContributions[1] === 0;
console.error(`  SCOPE    governance configurations examined: ` +
    (governanceExamined.length === 0
        ? "none (no config file at any candidate under either root)"
        : governanceExamined.join(", ")) +
    (stateRootSupplied
        ? ""
        : basesCollapsed
            ? "; VALIDATE_ROOT was not supplied, so the state root defaulted to this script's own tree " +
                "and both bases resolved to it — a repository-level .grugops/factory.config.json outside " +
                "that tree was NOT examined. Pass VALIDATE_ROOT=<repo> to check it."
            : "") +
    // (Round 4, reviewer 6 observation 1) PRECEDENCE IS REPLACE, NOT MERGE, AND THE LINE SAID
    // NOTHING ABOUT IT. `readGovernanceConfig` takes the FIRST candidate it finds ENTIRELY; a
    // repository-level file that mentions no checkpoints at all silently voids a kit-level
    // tightening, with no refusal and a banner reading `all checkpoints at default`. Listing two
    // files as "examined" told a reader two files were consulted where one governs.
    (governanceExamined.length > 1
        ? " — of these the FIRST is the one that governs: precedence is replace, not merge, so a " +
            "repository-level file voids the kit's declarations entirely rather than overlaying them."
        : ""));
// ── Render + exit ──────────────────────────────────────────────────────────────────────────────
for (const e of errors)
    console.error(`  ERROR    ${e}`);
for (const w of warnings)
    console.error(`  WARNING  ${w}`);
const failed = errors.length + (STRICT ? warnings.length : 0);
if (failed === 0) {
    console.log("ALL CHECKS PASSED");
    process.exit(0);
}
console.error(`${failed} ERROR(S)${STRICT ? " (--strict: warnings promoted)" : ""}`);
process.exit(1);

// model-tiers.ts — the per-role model alias resolver (MODEL-01…MODEL-05, Phase 29.1).
//
// THIS MODULE IS THE SINGLE ANSWER TO "WHICH MODEL ALIAS DOES ROLE X GET". Every consumer that
// needs one — the adapter generator, the installer's doctor, the assignment guard — asks here and
// nowhere else, so no two of them can disagree about a role's tier.
//
// WHY IT IS A SIBLING OF kit-model.ts RATHER THAN A SECTION INSIDE IT. kit-model is the kit-SET
// authority: which roles exist, which workflows exist, how many of each. The tier table this module
// grows carries a REQUIRED per-role rationale — argued prose about why a role earns a stronger or a
// cheaper model — and that prose has no business inside the module every guard, validator and
// generator in the repository imports for its set derivations. The dependency runs one way: this
// module asks kit-model for the pinned cardinality, and kit-model does not know this module exists.
//
// THE D-11 CONSUMER SPLIT, which is why the return type is a discriminated result and not a map.
// MODEL-04 ("full model ids are refused") and MODEL-05 ("fail-closed to `inherit`, never to a pinned
// tier") describe DIFFERENT INPUTS, not a contradiction:
//
//   - ABSENT value        → `inherit`. That is the zero-config contract, not an error.
//   - PRESENT but ILLEGAL → a REFUSAL. The generator turns that refusal into exit 1 naming the role,
//                           the offending value and the legal set, and writes NOTHING — its existing
//                           all-or-nothing posture (T-27-32), not a new behaviour.
//   - Every OTHER consumer of a resolved model — the doctor, any runtime reader — degrades to
//                           `inherit`, and NEVER to a pinned tier. Silently upgrading a user to a
//                           model their account may not carry is a worse failure than reading the
//                           session default.
//
// Returning a result rather than throwing is what lets one reader serve all three: the generator
// branches on `ok:false` and dies; a degrading consumer branches on it and substitutes `inherit`.
// A throw would force every degrading consumer to write a catch, and a catch is where a refusal
// quietly becomes a default nobody chose.
//
// COUPLING RISK, RECORDED SO PHASE 30'S AUTHOR FINDS IT RATHER THAN DISCOVERS IT. Phase 30 collapses
// `readGovernanceConfig` and `readGovernanceConfigResult` in scripts/context-io.ts into ONE
// discriminated-result config reader. This module is deliberately written in that same shape so that
// it does not become the THIRD config reader in the tree while a plan is actively deleting the
// second. An author unifying those two should read this module's reader as a fourth caller of the
// pattern they are settling, not as an unrelated module to leave alone.
//
// NO MEASUREMENT IS TAKEN HERE AND NO COST CLAIM IS MADE (MODEL-07 / D-14). Assigning a role a
// cheaper model is not evidence that anything was saved, and this module states no saving, implies
// none, and records no benchmark. scripts/measure-cost.ts holds the repository's standing
// `UNKNOWN - verify` on the usage schema and is untouched by this phase.
//
// UNKNOWN - verify: THE ALIAS VOCABULARY ITSELF (assumption A1, recorded confidence LOW).
// Claude Code's `model:` frontmatter accepts the bare aliases `opus` / `sonnet` / `haiku` in a
// sub-agent adapter, with the same meaning as in the CLI. THE ONLY SOURCE FOR THIS IS CLAUDE.md:84
// (`sonnet | opus | haiku | full model id | inherit (the default)`), which is this repository's own
// recorded research; it was NOT re-verified against vendor documentation during phase 29.1's
// research, and no other source is named here.
//
// WHAT IS AT RISK, AND WHAT IS NOT. If the platform rejects a bare alias, every adapter emitted under
// the `tiered` preset fails to load; the remedy is a one-line change to MODEL_ALIASES below plus a
// regeneration. The ZERO-CONFIG path is unaffected in every case, because it emits `inherit`, which
// is the documented default under the same source.
//
// RATIFIED 2026-08-19 by Olger Oeselg (plan 29.1-02 Task 1, option `ratify-as-specified`). The
// `models` config key shape and the closed preset-name set ship as D-05 and D-07 wrote them, and A1
// ships as this recorded note rather than as an unstated fact. The ratifying session cross-checked
// the vocabulary and agreed with CLAUDE.md:84 — that agreement is a SESSION-LEVEL CROSS-CHECK, NOT a
// fetched vendor-documentation citation, and it does not upgrade this note or add a source to it.
//
// SCOPE, AS OF PHASE 29.2. The module is complete: the closed alias vocabulary, the closed preset
// vocabulary, the shipped `tiered` table with a rationale required by the type, the two-location
// config read with every illegal input refused by name, and the sparse-override contract. What is
// NOT here, deliberately: the exact live-tree cardinality, which is adjudicated in
// `guard_model_assignment` (plan 29.1-04) and by nothing in this file.
//
// WHERE THE RESOLVED ANSWER GOES. This module resolves the block. scripts/generate-role-adapters.ts
// is the one emitter of the `model:` line from that resolution. install/install.ts renders a target
// repository's adapters by spawning that generator against THAT repository's own configuration file,
// so installing a repository from the checkout delivers that repository's `models` block into the
// adapters its session loads. Delivery happens at install time and only there: a block edited
// afterwards reaches the repository on the next install run against it from the checkout, and the
// installer's `--check` mode names every adapter an edit has not reached yet. The 29.1 increment
// disclosed this delivery path as absent; that disclosure described 29.1 and is not true of the
// tree as it stands.
//
// DELIBERATELY NOT IMPORTED: `listRoles`. The role-set authority is still the only source of stems,
// but this module never derives them itself — `resolveModels` and `readModelsConfig` both TAKE the
// stems their caller already derived (the generator derives them through `listRoles`, and
// scripts/model-tiers.test.ts derives its corpus the same way). What this module takes from
// kit-model is the pinned CARDINALITY. There is no private readdir here or anywhere downstream of
// here. `noUnusedLocals` is on in tsconfig.json, so importing a symbol this module does not call
// would not compile in any case.
//
// WHAT TOUCHES THE FILESYSTEM AND WHAT DOES NOT. `resolveModels` is PURE — it opens no file, reads
// no environment variable and joins no path, which is what lets the generator and the doctor share
// it. `readModelsConfig` is the module's ONLY I/O, and it opens exactly two paths, both built from
// the repo root its caller handed it. Zero npm dependencies either way.
//
// WHERE MODEL-04 IS ENFORCED, STATED HERE BECAUSE THE OBVIOUS GUESS IS WRONG. It is enforced in
// `readModelsConfig` below, by exact string equality against the four `MODEL_ALIASES` constants, and
// it is NOT enforced by the canonical admission reader. `scripts/canonical-frontmatter.ts` already
// carries `model` in `CANONICAL_SCHEMA`, and a full model id such as `claude-3-5-sonnet-20241022` is
// a perfectly legal PLAIN SCALAR under `PLAIN_SCALAR_ALPHABET` — `admit()` would accept it without
// complaint, because admission decides what is a canonical YAML shape and not what is a legal model.
// A reader who assumes the admission layer closes MODEL-04 would find the hole only in production.
//
// THE ASVS V12 CONTROL, ALSO STATED RATHER THAN IMPLIED. A `roles` key is a user-authored string. It
// is compared against the caller's DERIVED stem set BEFORE it is used anywhere, and it is NEVER
// joined onto a path, passed to a filesystem call, or used to build one. An unknown key is a refusal
// naming the key and the valid set (D-06), so a key shaped like a traversal never reaches a syscall
// to be defended against.
//
// THE TIE-BREAKING RULE, WHICH IS A CONTRACT AND NOT AN INSERTION ORDER. `preset` resolves first and
// produces a BASE assignment for every stem; `roles` is a SPARSE override applied on top of it. When
// a stem appears in both, THE OVERRIDE WINS — deliberately, because a user who names a role
// explicitly means that name more than they mean the preset they also selected. This is stated here
// so that the precedence is a property of the design rather than of which loop happened to run last.
//
// NO THIRD CONFIG READER. `readModelsConfig` IMITATES the candidate order and the shape discipline
// of `readGovernanceConfig` in scripts/context-io.ts; it does not import it, does not wrap it and
// does not extend it. It also deliberately does NOT copy that reader's verdict: `readGovernanceConfig`
// records an explicit fail-OPEN contract and returns a present value VERBATIM without validating it,
// which is correct for a governance dial whose consumer decides, and fatal here — a verbatim
// unvalidated value is exactly the full model id MODEL-04 exists to refuse.
//
// Findings are written in CLEAR PROFESSIONAL VOICE. A model tier is a money topic, and CLAUDE.md's
// voice discipline makes clear voice mandatory for money, security and compliance — never caveman.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { ROLE_COUNT } from "./kit-model.js";
// ── The closed alias vocabulary ───────────────────────────────────────────────────────────────
//
// The TUPLE is the declaration and the UNION is derived from it, rather than both being typed out.
// Two hand-written copies of one closed set is this repository's named second systemic failure class
// — a literal that rots while the suite stays green — and here it would rot in the more dangerous
// direction: a union member absent from the tuple is an alias the type system accepts and the
// membership check refuses, which reads as a bug in the caller.
//
// FOUR MEMBERS, AND MEMBERSHIP IS EXACT STRING EQUALITY AGAINST THESE FOUR CONSTANTS — never a
// regular expression. A closed four-member allow-list is what makes a YAML-significant byte
// unreachable in the emitted frontmatter: the emitted value can only ever be one of these strings,
// so a colon, a quote, a newline or a leading dash cannot arrive there at all. A pattern match would
// instead admit whatever the pattern happened not to exclude, which is a property nobody can state.
//
// Full model ids are NOT members, deliberately (MODEL-04): an id like a dated model string is the
// hand-maintained stale literal this milestone exists to eliminate, and an alias degrades gracefully
// for a user whose account does not carry the stronger tier.
export const MODEL_ALIASES = ["inherit", "opus", "sonnet", "haiku"];
/**
 * Alias membership, decided by EXACT STRING EQUALITY against the four constants.
 *
 * Takes `unknown` rather than `string` on purpose: a `models` block is user-authored JSON, so the
 * value arriving here may be a number, a null or an object, and each must be refused rather than
 * coerced. There is no regular expression in this function and there must never be one — see the
 * argument above the tuple.
 */
export function isModelAlias(value) {
    if (typeof value !== "string")
        return false;
    return MODEL_ALIASES.some((alias) => alias === value);
}
// ── PRESET_NAMES — the closed preset vocabulary (D-07, D-08) ──────────────────────────────────
//
// THE SET IS CLOSED AND EXACTLY ONE PRESET SHIPS BESIDE THE DEFAULT. `none` is the zero-config
// position — every role `inherit` — and `tiered` is the one shipped opinion. Any other value is a
// refusal naming the value and this set (D-07). Adding a second preset later is therefore a VISIBLE
// SOURCE CHANGE that an author makes here, with a rationale table beside it, rather than a
// config-side surprise a user discovers by typing a name that happens to resolve.
//
// WHY THE NAME IS `tiered` AND NOT `cost` (D-08). `"preset": "cost"` is itself a cost claim, and
// MODEL-07 forbids shipping an unmeasured one. No measurement is taken in this phase, so the name
// states the MECHANISM — roles sit at different tiers — and asserts nothing about spend.
//
// The TUPLE is the declaration and the union is derived from it, for the same reason MODEL_ALIASES
// is written that way: two hand-written copies of one closed set is the drift class this repository
// names as its second systemic failure mode.
export const PRESET_NAMES = ["none", "tiered"];
/**
 * Preset-name membership, decided by EXACT STRING EQUALITY against the two constants.
 *
 * Takes `unknown` for the same reason `isModelAlias` does: the value may arrive from user-authored
 * JSON as a number, a null or an object, and each must be refused rather than coerced. No regular
 * expression decides this, here or anywhere downstream.
 */
export function isPresetName(value) {
    if (typeof value !== "string")
        return false;
    return PRESET_NAMES.some((name) => name === value);
}
// ── MODELS_KEYS — the `models` BLOCK'S OWN closed key set (plan 29.1-08, finding WR-01) ────────
//
// THE THIRD CLOSED VOCABULARY OF THIS MODULE, declared beside the other two on purpose. MODEL_ALIASES
// closes what a role may be assigned, PRESET_NAMES closes what a preset may be called, and this
// closes what the `models` block may CONTAIN. All three are decided by exact string equality against
// a tuple, never by a pattern and never by a denylist of near-miss spellings.
//
// WHY IT EXISTS. D-06 closes the key set of `models.roles` — an unknown role stem is refused naming
// the key and the valid set, because "a silently ignored override is a tier the user believes they
// set and did not". The block CONTAINING that map was open: `readModelsBlock` read `models.preset`
// and `models.roles` and enumerated nothing, so every other key was discarded in silence. The
// principle was enforced one level down and not for the level above it.
//
// THE SHAPE THAT MADE IT LOAD-BEARING is not the typo. It is `{"preset":"tiered","role":{…}}`, where
// a legal preset sits beside a near-miss overrides key: the preset APPLIES and the overrides
// silently do not. The user gets a PARTIALLY wrong tier map, a green run and no message of any kind
// — which is verbatim what this module's own `unassigned` refusal calls a tier the user believes
// they set and did not.
//
// WHAT THIS TUPLE BUYS, AND WHAT IT DOES NOT (plan 29.1-15, finding R2-WR-06). It closes PRESENCE:
// a key outside it is refused by name against the tuple, and a third legal key can only arrive by
// editing this line, which moves the MESSAGE — the refusal quotes these constants. It does NOT close
// CONSUMPTION. Adding a member here adds no reader, so `{"models":{"tiers":{…}}}` under a widened
// tuple would be admitted, ignored, and reported as the zero-config answer with no message: verbatim
// the WR-01 defect this constant exists to close, one level up. The weaker claim is the true one and
// is the one stated here.
//
// CONSUMPTION IS CLOSED BY A CASE, NAMED SO A READER CAN FIND IT rather than infer it: see
// scripts/model-tiers.test.ts, "every member of MODELS_KEYS is CONSUMED by the reader, not merely
// permitted". It drives each member through `readModelsConfig` alone and requires the answer to
// move, with the probe table's coverage of this tuple asserted in BOTH directions before the loop
// that spends it — a member added here with no probe fails that assertion rather than passing over
// its own omission.
export const MODELS_KEYS = ["preset", "roles"];
// ── MODELS_CONFIG_CANDIDATE_RELS — the two configuration LOCATIONS, declared once (WR-05) ───────
//
// THE FOURTH CLOSED VOCABULARY OF THIS MODULE, declared beside the other three for the same reason.
// MODEL_ALIASES closes what a role may be assigned, PRESET_NAMES what a preset may be called,
// MODELS_KEYS what the `models` block may contain, and this closes WHERE the block may be written.
//
// WHY IT IS A CONSTANT RATHER THAN AN INLINE ARRAY IN `readModelsConfig`. Finding WR-05 of the
// 29.1 gap-closure round reported that the shipped documentation named ONE of these two locations
// and the resolver read both. Two spellings of one fact — one in prose, one inline in a loop —
// are this repository's named second systemic failure class, and the drift was already live. The
// list is declared here so `scripts/model-dial-consistency.test.ts` can assert that EVERY member
// appears in BOTH shipped documents, which makes the prose and the code unable to name different
// files without an oracle going red.
//
// REPO-RELATIVE, POSIX-SPELLED. `readModelsConfig` splits each member on "/" and joins the segments
// against the repository root its caller handed it, so the constant stays a literal a `grep` and a
// markdown document can both carry verbatim while the path built from it is still platform-correct.
//
// THE ORDER IS THE PRECEDENCE, AND THE PRECEDENCE IS WHOLE-FILE. The reader tries these in the
// order written and returns on the FIRST one that EXISTS — regardless of whether that file carries
// a `models` key. This matches `readGovernanceConfig` in scripts/context-io.ts, which uses the same
// two locations in the same order; the two readers agree deliberately, and this is a convention
// rather than an oversight.
//
// THE CONSEQUENCE, STATED HERE BECAUSE IT IS NOT OBVIOUS FROM THE LOOP. A file present at the
// FIRST location and carrying NO `models` key SHADOWS a `models` block at the second: the first
// file wins whole, `models` is undefined in it, and the reader returns the zero-config answer
// naming that first file as its source. Under D-04 the shipped seed IS exactly such a file, so
// this is the standard installed shape rather than a contrived one. The behaviour is deliberate
// and unchanged; what WR-05 found missing was any shipped document SAYING it. That statement now
// lives in agent-factory/config/factory.config.md's `### models sub-fields` section, which is its
// single authority — this comment records the mechanism, not a second rule.
export const MODELS_CONFIG_CANDIDATE_RELS = [
    ".grugops/factory.config.json",
    "agent-factory/config/factory.config.json",
];
// ── The RESOLVED-PRESET LINE — ONE grammar, asked in both directions (plan 29.1-03) ────────────
//
// WHY THIS LIVES HERE RATHER THAN AS A LITERAL IN THE GENERATOR. The adapter generator PRINTS the
// preset its run resolved, and scripts/adapters-freshness.ts READS that line back out of the
// mirrored child's stdout and refuses anything but `none`. Those are two consumers of one grammar.
// Written as a literal at each site they would be a hand-maintained pair — this repository's named
// second systemic failure class — and the rot direction is silent in the worst possible way: the
// gate stops finding the line, and an implementation that read a missing line as agreement would go
// green on exactly the configuration drift the line exists to catch. So the emitter and the reader
// are declared together, and neither site spells the marker.
//
// WHY THE PIN EXISTS AT ALL (RESEARCH.md Pitfall 3, option (c)). The freshness gate satisfies D-04
// today by ABSENCE: its mirror copies agent-factory/roles and agent-factory/packaging and no
// configuration directory, so a config-reading generator inside it resolves nothing. Absence is not
// a pin. The day a configuration directory joins that twin list — a plausible edit, since the
// comment above the list already justifies mirroring a directory the generator does not open — the
// gate becomes config-dependent and D-04 evaporates while everything stays green. Printing the
// resolution makes it an observable property OF THE RUN rather than of what was not copied.
//
// THREE GRAMMARS LIVE IN THIS BLOCK, NOT ONE (plan 29.1-07, findings CR-01, WR-03, WR-04):
//
//   1. the RESOLVED-PRESET line   — what preset the generator's run resolved (one of two INPUTS);
//   2. the RESOLVED-ASSIGNMENT line — what the resolution actually PRODUCED (the OUTPUT);
//   3. the MIRRORED-RESOLVED-PRESET line — the freshness gate's own verdict, a DIFFERENT grammar
//      from (1) because it is a different speaker making a different claim.
//
// EVERY READER IN THIS BLOCK IS ANCHORED AT POSITION 0 (finding WR-03). The first reader here asked
// `indexOf`, so any line that MENTIONED the phrase satisfied it. Three shapes were reproduced
// against the committed .js: `WARN could not read resolved model preset: none` read back as
// `["none"]`, `echo "resolved model preset: tiered" >> log` read back as `["tiered\" >> log"]`, and
// a `# TODO:` comment mentioning it read back as `["none"]`. A gate whose "the line is present"
// branch can be satisfied by a warning ABOUT A FAILED READ is a gate that reads a diagnostic as
// consent. So each reader `trimEnd()`s the candidate line and requires the owning prefix at byte 0,
// and each EMITTER owns its full prefix end to end — no call site may prepend anything, because a
// prefixed line is a line the matching reader refuses.
//
// WHY GRAMMAR (3) EXISTS AT ALL (finding WR-04). scripts/adapters-freshness.ts used to hand-spell
// its own verdict marker, in the same file that argues this grammar must never be hand-spelled —
// and it was load-bearing rather than cosmetic, because that gate's oracle parses the gate's own
// stdout, so the success cases were reading a hand-written literal instead of anything the
// generator emits. Declaring the gate's line here with its own reader beside it means the marker
// has ONE owner per grammar and neither consumer spells it.
//
// WHY THE MEMBER COUNT TRAVELS INSIDE GRAMMAR (2). A vacuity floor catches an EMPTY resolution and
// never a silently SHORT one — the same discipline `tieredCorpusRefusals` records for the row count
// it derives independently of the loop that consumes it. So the announcement carries how many roles
// the resolution covered, and its consumer cross-checks that number against a count IT derived
// itself. An announcement that only agreed with itself would prove nothing about shortness.
/**
 * The stable, greppable marker a resolved-preset line carries.
 *
 * OWNS THE GENERATOR'S NAME. The prefix begins with the emitting script's own name so the marker
 * cannot be satisfied by a line the generator did not write, and so the emitter — not its caller —
 * owns every byte before the value. Deliberately NOT itself a legal preset name, so a reader can
 * never mistake the marker for the value it introduces.
 */
export const RESOLVED_PRESET_PREFIX = "generate-role-adapters: resolved model preset: ";
/**
 * The line a run emits to declare which preset it resolved. The EMITTING half of the grammar.
 *
 * Takes a `PresetName` rather than a string, so the only thing that can be announced is a member of
 * the closed set — an announcement is never how an unvalidated value reaches an observer.
 */
export function resolvedPresetLine(preset) {
    return `${RESOLVED_PRESET_PREFIX}${preset}`;
}
/**
 * Every preset named on a resolved-preset line in an output stream. The READING half.
 *
 * RETURNS A LIST, INCLUDING THE EMPTY ONE, AND NEVER A DEFAULT. Two properties are load-bearing:
 *
 *   • AN ABSENT LINE COMES BACK EMPTY. A reader that answered `"none"` for a stream carrying no line
 *     at all would let a caller read SILENCE AS CONSENT, which is precisely the failure the pin
 *     exists to prevent. The empty list forces the caller to write an explicit absent branch.
 *   • AN AMBIGUOUS STREAM STAYS AMBIGUOUS. Every matching line is reported rather than the first, so
 *     a caller can fail closed on "two runs disagreed" instead of silently believing one of them.
 *
 *   • AN INCIDENTAL MENTION IS NOT AN ANNOUNCEMENT. The prefix is required at BYTE 0 of the trimmed
 *     line, so a warning, a shell echo, a comment or an indented log line that merely contains the
 *     phrase comes back empty (finding WR-03).
 *
 * TRAILING WHITESPACE — INCLUDING A WINDOWS CHILD'S CARRIAGE RETURN — IS TRIMMED OFF THE LINE
 * BEFORE THE PREFIX TEST, AND THEREFORE OFF THE TAIL OF THE CAPTURED VALUE. The carriage return is
 * why the trim exists at all: `none` and `none\r` are different strings, and the difference would be
 * an equality failure with an invisible cause on the one platform this kit cannot test
 * interactively. The line is trimmed BEFORE the value is sliced out of it, so the same trim reaches
 * the value's tail. Measured: `resolvedPresetsIn(RESOLVED_PRESET_PREFIX + "none   ")` is `["none"]`.
 *
 * LEADING AND INTERNAL SPACING IS PRESERVED, so a value carrying either stays visible as wrong
 * rather than being normalised into shape. Measured: `RESOLVED_PRESET_PREFIX + " none"` reads back
 * as `[" none"]`, and `RESOLVED_PRESET_PREFIX + "no ne"` as `["no ne"]`.
 *
 * THIS DOCSTRING PREVIOUSLY CLAIMED THE TAIL WAS PRESERVED TOO (finding R3-IN-04), which the
 * mechanism never did. The CLAIM was corrected rather than the mechanism: the trim is load-bearing
 * for the carriage return, and the values this grammar carries are members of a closed set, so the
 * practical effect of the tail trim is benign. What is not benign is a published claim wider than
 * its mechanism — this module's own named defect — so both halves above are now decided by cases
 * rather than left as prose a reader has to trust.
 */
export function resolvedPresetsIn(output) {
    return anchoredValuesIn(output, RESOLVED_PRESET_PREFIX);
}
/**
 * The one anchored line reader every grammar in this block is built from.
 *
 * Declared once rather than written three times for the reason the block header states: a
 * hand-copied predicate is this repository's named second systemic failure class, and an anchor
 * that rotted in one of three copies would fail silently in exactly the direction the anchor exists
 * to close.
 */
function anchoredValuesIn(output, prefix) {
    const found = [];
    for (const line of output.split("\n")) {
        const trimmed = line.trimEnd();
        if (!trimmed.startsWith(prefix))
            continue;
        found.push(trimmed.slice(prefix.length));
    }
    return found;
}
// ── The MIRRORED-RESOLVED-PRESET LINE — the freshness gate's own verdict (finding WR-04) ──────────
/**
 * The marker scripts/adapters-freshness.ts's success verdict carries.
 *
 * A SECOND GRAMMAR RATHER THAN A REUSE OF THE FIRST, because it is a different speaker making a
 * different claim: the generator says "this is what I resolved", the gate says "this is what the
 * run I mirrored resolved". Conflating them is what let a hand-written literal in the gate stand in
 * for the generator's announcement while the gate's own oracle reported it as a round trip.
 */
export const MIRRORED_RESOLVED_PRESET_PREFIX = "Mirrored generator resolved model preset: ";
/**
 * The freshness gate's verdict line. The EMITTING half.
 *
 * NO TRAILING PUNCTUATION, deliberately: the line is parsed by the reader below, and a full stop
 * would become part of the parsed value and turn `none` into `none.`. Measured, not assumed — that
 * is exactly how the first draft of this line failed its own case.
 */
export function mirroredResolvedPresetLine(preset) {
    return `${MIRRORED_RESOLVED_PRESET_PREFIX}${preset}`;
}
/** Every preset named on a mirrored-verdict line. The READING half, anchored the same way. */
export function mirroredResolvedPresetsIn(output) {
    return anchoredValuesIn(output, MIRRORED_RESOLVED_PRESET_PREFIX);
}
/** The marker a resolved-assignment line carries. Owns the generator's name, like its sibling. */
export const RESOLVED_ASSIGNMENT_PREFIX = "generate-role-adapters: resolved model assignment: ";
/** The legal key set of the announced payload, closed BY NAME like every other vocabulary here. */
const RESOLVED_ASSIGNMENT_KEYS = ["roles", "overrides", "aliases"];
/**
 * The line a run emits to declare what its resolution produced. The EMITTING half.
 *
 * The payload is COMPACT JSON rather than prose, so no regular expression decides this — the same
 * posture the alias and preset vocabularies already take. `JSON.parse` on the reading side either
 * yields a structure or throws, and a structure of the wrong shape is refused BY NAME rather than
 * pattern-matched into one.
 *
 * Takes the resolved map itself rather than three numbers, so the member count and the alias set
 * are DERIVED from the object the generator is about to write bytes from, not restated beside it.
 */
export function resolvedAssignmentLine(resolution, overrideCount) {
    const payload = {
        roles: resolution.size,
        overrides: overrideCount,
        aliases: [...new Set(resolution.values())].sort(),
    };
    return `${RESOLVED_ASSIGNMENT_PREFIX}${JSON.stringify(payload)}`;
}
/**
 * One discriminated result per anchored assignment line. The READING half.
 *
 * A MALFORMED PAYLOAD IS A NAMED REFUSAL, NEVER A DROPPED LINE. Dropping it would collapse into the
 * absent case, and the absent case's consumer says "the run announced nothing" — a different fact
 * with a different remedy. The list-of-results shape keeps the ambiguity of a stream carrying two
 * announcements visible at the call site, exactly as `resolvedPresetsIn` does.
 */
export function resolvedAssignmentsIn(output) {
    return anchoredValuesIn(output, RESOLVED_ASSIGNMENT_PREFIX).map(readAssignmentPayload);
}
/** Validate one announced payload against the declared shape, refusing anything else by name. */
function readAssignmentPayload(payload) {
    const refuse = (what) => ({
        ok: false,
        reason: `model-tiers: the resolved model assignment payload ${quoteValue(payload)} ${what}. The ` +
            'declared shape is {"roles":<non-negative integer>,"overrides":<non-negative integer>,' +
            '"aliases":[<alias>,...]}. A payload that cannot be read is REFUSED BY NAME rather than ' +
            "dropped: a dropped line collapses into the absent case, and a consumer's absent branch " +
            "reports a run that announced nothing, which is a different fact with a different remedy.",
    });
    let parsed;
    try {
        parsed = JSON.parse(payload);
    }
    catch {
        return refuse("is not parseable JSON");
    }
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
        return refuse(`is ${describeShape(parsed)} rather than a JSON object`);
    }
    const object = parsed;
    const unknownKeys = Object.keys(object)
        .filter((k) => !RESOLVED_ASSIGNMENT_KEYS.some((legal) => legal === k))
        .sort();
    if (unknownKeys.length > 0) {
        return refuse(`carries the unexpected key(s) ${unknownKeys.map((k) => `"${k}"`).join(", ")}`);
    }
    for (const key of ["roles", "overrides"]) {
        const value = object[key];
        if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
            return refuse(`sets "${key}" to ${quoteValue(value)} rather than a non-negative integer`);
        }
    }
    const aliases = object.aliases;
    if (!Array.isArray(aliases)) {
        return refuse(`sets "aliases" to ${describeShape(aliases)} rather than an array`);
    }
    // ── THE MEMBER CHECK ENFORCES THE GRAMMAR THE REFUSAL ABOVE QUOTES (finding R2-IN-04). ────────
    //
    // This loop used to check the TYPE and stop, while the declared shape it quotes back names
    // `<alias>` — so `["not-a-model"]` read back `ok:true` against a message promising an alias. No
    // live consumer was affected, because `adapters-freshness` compares the announced set against the
    // degrading-policy authority's, but the parser was enforcing a looser grammar than it published.
    //
    // THE DISPOSITION IS THE CODE CATCHING UP TO THE MESSAGE, NOT THE MESSAGE RETREATING TO THE CODE.
    // The rejected alternative was rewording the declared shape to `[<string>,…]`, which would also
    // have made the two agree. It was rejected because the stricter grammar is the CORRECT one for
    // this field: the announced aliases are what a gate compares against the resolved alias set, and a
    // reader that admits a value no resolution can produce hands its consumer a set difference to
    // explain rather than a payload to refuse.
    //
    // ONE AUTHORITY. Membership is decided by `isModelAlias` — the module's existing closed-set
    // predicate — rather than by a second membership test written here.
    for (const alias of aliases) {
        if (typeof alias !== "string") {
            return refuse(`lists the non-string alias ${quoteValue(alias)}`);
        }
        if (!isModelAlias(alias)) {
            return refuse(`lists ${quoteValue(alias)}, which is not a legal model alias — the legal set is exactly: ` +
                MODEL_ALIASES.map((a) => `"${a}"`).join(", "));
        }
    }
    return {
        ok: true,
        value: {
            roles: object.roles,
            overrides: object.overrides,
            aliases: aliases,
        },
    };
}
// ── TIERED — the one shipped preset, one row per role, each row carrying its reason ───────────
//
// D-09 assigns `opus` to four roles and `sonnet` to the other thirteen. NO ROLE IS ASSIGNED `haiku`,
// and that is the load-bearing shape decision rather than an oversight: every role in this kit either
// writes into the shared verified context or produces an artifact a human signs off on, and the
// behavior gate catches CORRECTNESS, not JUDGMENT. A thin-model ticket, test plan or UAT pack
// degrades PAST the one mechanism that would have caught it rather than into it. `haiku` stays a
// legal alias a user may set per role; the shipped preset simply does not reach for it.
//
// The literal MODEL-03 reading — `opus` on three, `haiku` on three, `sonnet` on eleven — was
// considered and rejected in D-09: it exercises all three aliases but puts the thinnest tier exactly
// where quality degradation is least visible.
//
// EVERY ROW CARRIES A RATIONALE BECAUSE THE TYPE REQUIRES ONE (D-10). The reason is not a comment
// beside the assignment and not a prose document elsewhere in the tree; it is the same object, so it
// cannot drift away from what it explains, and a row written without one does not compile.
//
// THE ONE DELIBERATELY ARGUABLE ROW IS `incident-responder`, and D-09 records it as such: an
// incident is where time pressure and blast radius coincide, the role was considered for the
// stronger tier, and it was left on `sonnet` because it is procedural and hands to a named human.
// Its rationale says so in its own words rather than by citing D-09, because a decision identifier
// carries a digit and no rationale may carry one — see the paragraph immediately below.
//
// NO ROW ARGUES SPEND (D-14 / MODEL-07). Each rationale argues QUALITY: what a thinner model would
// degrade past rather than into, and — for the four strong roles — the specific harm D-09 records.
// No rationale asserts a saving, names a price, or contains a digit; scripts/model-tiers.test.ts
// asserts the digit half of that mechanically, so a percentage cannot be introduced without a red.
export const TIERED = [
    {
        stem: "agents-md-scribe",
        alias: "sonnet",
        rationale: "Writes the AGENTS.md substrate every host CLI reads. The work is transcription against a " +
            "stated shape rather than open judgment, and a malformed substrate is refused by the structure " +
            "validator before any agent loads it.",
    },
    {
        stem: "architect-design",
        alias: "opus",
        rationale: "Architectural boundaries are expensive to reverse. A boundary drawn in the wrong place is " +
            "caught by no behavior gate — the code that honours it passes every test — and the mistake is " +
            "paid for by every later change that has to route around it.",
    },
    {
        stem: "ba-pm",
        alias: "sonnet",
        rationale: "Turns a request into scoped epics against a stated template. The judgment is bounded by the " +
            "requirement trail, which a human reads and signs, so a weaker reading surfaces at that review " +
            "rather than silently downstream.",
    },
    {
        stem: "brownfield-mapper",
        alias: "sonnet",
        rationale: "Surveys an existing repository and records what it finds. The output is observation against " +
            "the tree, and a wrong observation is contradicted by the tree itself the moment a later role " +
            "reads it.",
    },
    {
        stem: "compliance-officer",
        alias: "opus",
        rationale: "A misclassified regulated-data field is real-world harm rather than rework. No gate in this " +
            "kit decides whether a field is regulated, so this classification is the only thing standing " +
            "between the user and a disclosure nobody authorised.",
    },
    {
        stem: "factory-coach",
        alias: "sonnet",
        rationale: "Explains the kit to the person using it. A weaker explanation is corrected by that person in " +
            "the same conversation, which is the shortest correction loop any role in this kit has.",
    },
    {
        stem: "frontend-ui",
        alias: "sonnet",
        rationale: "Implements interface work behind the same behavior gate as every other engineering role, and " +
            "its output is judged visually by a human before it merges — two independent catches on a " +
            "surface where a defect is immediately apparent.",
    },
    {
        stem: "greenfield-mapper",
        alias: "sonnet",
        rationale: "Scaffolds a new repository from a stated stack. The shape is prescribed by the kit rather " +
            "than invented, and the structure validator refuses a scaffold that does not match it.",
    },
    {
        stem: "incident-responder",
        alias: "sonnet",
        rationale: "Procedural: it follows a stated runbook and hands to a named human, so the judgment that " +
            "decides an incident is the human's rather than the model's. THIS IS THE DELIBERATELY ARGUABLE " +
            "ASSIGNMENT — an incident is where time pressure and blast radius coincide, this role " +
            "was considered for the stronger tier, and it was left here. A later reader who disputes the " +
            "call has the reasoning in front of them, which is exactly what this field exists for.",
    },
    {
        stem: "installer",
        alias: "sonnet",
        rationale: "Runs an install that is idempotent, additive and reversible by construction, with a dry-run " +
            "and a doctor that inspect it. A mistake is visible before it is applied rather than after.",
    },
    {
        stem: "orchestrator",
        alias: "opus",
        rationale: "Decomposition quality determines every downstream task. A subtask framed wrongly is executed " +
            "faithfully by every role after it, and nothing downstream asks whether the decomposition " +
            "itself was right — so this is the one place a weaker reading propagates instead of being " +
            "caught.",
    },
    {
        stem: "qe-e2e",
        alias: "sonnet",
        rationale: "Writes tests against acceptance criteria a human already signed. The criteria bound the " +
            "judgment, and a test that fails to discriminate is caught by the red-first discipline the " +
            "gate already enforces.",
    },
    {
        stem: "release-manager",
        alias: "sonnet",
        rationale: "Assembles a changelog and a release from artifacts that already exist. The human holds the " +
            "merge and the deploy mechanically, so this role proposes and never decides.",
    },
    {
        stem: "security-nfr",
        alias: "opus",
        rationale: "A missed vulnerability is real-world harm rather than rework. The behavior gate catches a " +
            "broken test and never an absent threat, so nothing downstream asks the question this role " +
            "failed to ask.",
    },
    {
        stem: "software-engineer",
        alias: "sonnet",
        rationale: "Implements a ready ticket behind the behavior gate, which is the mechanism this kit relies on " +
            "most and which judges this role's output directly. A weaker implementation degrades INTO that " +
            "gate rather than past it.",
    },
    {
        stem: "system-analyst",
        alias: "sonnet",
        rationale: "Turns an epic into a ready ticket against a stated checklist, and that ticket is read by a " +
            "human before any implementation starts — a review step sitting between this role and any " +
            "code it influences.",
    },
    {
        stem: "uat-planner",
        alias: "sonnet",
        rationale: "Assembles the acceptance scenarios a human then runs by hand. A thin scenario is felt by the " +
            "person executing it rather than accepted silently, which is the strongest form of review any " +
            "artifact in this kit receives.",
    },
];
// The tier table's exact cardinality, pinned beside the table it describes.
//
// PROMOTE TRIGGER: A NEW ROLE FILE ARRIVING under agent-factory/roles/. That is the ONLY event that
// legitimately moves this number, and it obliges the author to add a row to TIERED with a rationale
// in the same change — the whole point of MODEL-03 is that role eighteen cannot arrive unassigned.
//
// EVERY CONSUMER AN EDITOR MUST WALK BEFORE CHANGING IT: `listRoles` (scripts/kit-model.ts — the
// role-set authority this number mirrors), `resolveModels` below (which reads TIERED under the
// `tiered` preset), `guard_model_assignment` (plan 29.1-04 — where a wrong number stops a release),
// and the adapter generator's resolution call (scripts/generate-role-adapters.ts, which hands this
// resolver the stems it derived).
//
// WHERE THE EXACT CARDINALITY IS ADJUDICATED, and why it is not adjudicated here. THIS LIBRARY
// THROWS ONLY ON THE VACUOUS SET. `guard_model_assignment` owns the two-sided count over the LIVE
// tree, exactly as `guard_kit_counts` owns it for the kit sets, because this resolver sits on the
// adapter generator's hot path and that generator runs over hermetic MIRRORS holding a SUBSET of the
// role corpus — a corpus-cardinality equality on this path refuses valid runs. The same argument, in
// full, is recorded on `tieredCorpusRefusals` below, together with the reason a consumer holding only
// two counts should still derive the sets. What this library enforces instead is the strictly
// STRONGER per-stem check: every stem handed to the resolver has a row, and an unassigned stem is
// NAMED rather than reported as a number that disagrees.
export const MODEL_TIERS_COUNT = ROLE_COUNT;
// The ONE vacuity sentence, declared once and returned by both table predicates below. An empty
// table and a SHORT table are different facts and must not share a sentence; an empty table and an
// empty table must not have two.
const TIERED_VACUITY_REFUSAL = "model-tiers: the TIERED preset table is EMPTY — refusing to resolve a preset from a table with " +
    "no entries. A coverage comparison against an empty table passes without comparing anything, " +
    "which is the vacuous pass this floor exists to make impossible.";
/**
 * The tier table's OWN integrity, decidable WITHOUT knowing which roles exist on the tree.
 *
 * These are properties of the table alone — vacuity, a repeated stem, a blank reason — so they are
 * correct on a hermetic mirror as well as on the live tree, and `resolveModels` runs them on every
 * `tiered` resolution. Each finding is its OWN sentence rather than a clause of a merged one, so
 * three different mutations give three readable answers instead of one paragraph.
 *
 * Takes the table as a parameter defaulting to the shipped one, so an oracle can drive an
 * adversarial table without mutating module state and without typing a stem out.
 */
export function tieredTableRefusals(table = TIERED) {
    if (table.length === 0)
        return [TIERED_VACUITY_REFUSAL];
    const findings = [];
    // A repeated stem, reported by NAME and by COUNT rather than resolved last-wins. Counted over the
    // whole table first, then reported in SORTED stem order, so which duplicate is named is a property
    // of the table rather than of its authoring order.
    const occurrences = new Map();
    for (const row of table)
        occurrences.set(row.stem, (occurrences.get(row.stem) ?? 0) + 1);
    for (const stem of [...occurrences.keys()].sort()) {
        const count = occurrences.get(stem) ?? 0;
        if (count > 1) {
            findings.push(`model-tiers: the stem "${stem}" appears ${String(count)} times in the TIERED preset ` +
                "table — refusing a duplicated entry rather than letting the last occurrence win, because " +
                "the losing entry's assignment and its argument would both vanish with no error anywhere. " +
                "Remedy: delete the duplicate; do NOT rely on the surviving one being the intended one.");
        }
    }
    // A blank reason, which D-10 makes a defect rather than a style note.
    for (const row of [...table].sort((a, b) => a.stem.localeCompare(b.stem))) {
        if (row.rationale.trim().length === 0) {
            findings.push(`model-tiers: the TIERED entry for "${row.stem}" carries an EMPTY rationale — D-10 makes the ` +
                "rationale a REQUIRED field precisely so a later reader can dispute the tier, and an " +
                "assignment nobody argued for is an assignment nobody can challenge. Remedy: write the " +
                "quality argument for this role's tier; do NOT delete the field.");
        }
    }
    return findings;
}
/**
 * The tier table's relationship to a role corpus, asked BY A CONSUMER THAT IS JUDGING THAT CORPUS.
 * Returns every finding, or an empty array when the table and the corpus agree.
 *
 * THIS IS THE BOTH-DIRECTIONS SET EQUALITY, and both directions are separate findings on purpose. A
 * count identity passes while one stem is claimed by the table and missing from the corpus and
 * another is claimed by the corpus and missing from the table — the exact defect shape recorded in
 * scripts/check-foundation-guards.ts's set-membership-over-count-identity rule. A misspelled stem
 * moves NEITHER number, so a count-only check reads green on it.
 *
 * THE ROW COUNT IS DERIVED INDEPENDENTLY of the membership loops that follow, so a SILENTLY SHORT
 * table is caught as well as an EMPTY one: the length is read off the table itself rather than off
 * the loop that consumes it.
 *
 * WHY `resolveModels` DOES NOT CALL THIS. This predicate compares the table against A WHOLE CORPUS,
 * and the resolver runs over hermetic mirrors holding a subset of it — see MODEL_TIERS_COUNT's block
 * above. The resolver sits on the adapter generator's hot path and that generator RUNS OVER HERMETIC
 * MIRRORS holding a SUBSET of the role corpus — its own committed suite mirrors six roles, and
 * scripts/adapters-freshness.ts and the foundation-guard harnesses mirror whatever tree they are
 * judging. Measured when plan 29.1-01 first put a cardinality equality inside the resolver: a
 * six-role mirror was refused and 22 committed cases went red. A smaller set is CORRECT there, not
 * broken. The consumers that genuinely mean "is this the whole live corpus" ask this out loud.
 *
 * WHEN A CONSUMER WOULD GENUINELY WANT A CARDINALITY ANSWER, and why it should still call this
 * (plan 29.1-15, finding R2-IN-02). A consumer holding ONLY two counts — the derived stem total and
 * the kit authority's `ROLE_COUNT` — can compare them and report that two numbers disagree. That is
 * the WEAKER question, and it is weaker in the way this module refuses everywhere else: a misspelled
 * stem moves neither number, so the count-only form reads green on the exact defect a set comparison
 * NAMES. A consumer that can compare sets should compare sets; a consumer that cannot should derive
 * the sets rather than settle for the counts.
 *
 * A WEAKER UNCONSUMED TWIN OF THAT ARGUMENT EXISTED AND WAS DELETED. The count-only comparison used
 * to be its own exported predicate — ~30 lines of production code beside this one. It was found to
 * have NO production caller for a second consecutive review round, its only consumer being its own
 * oracle, and it was DELETED rather than given a caller, because "delete the second authority rather
 * than teach it a case" is this repository's own rule and a second authority for a predicate that
 * already has a stronger one is how the weaker copy comes to fire where the stronger correctly does
 * not. Nothing was lost: D-05's requirement is that role #18 cannot arrive unassigned, and
 * `resolveModels` assigns a value to EVERY stem it is handed on any tree, live or mirrored, while
 * the binding check under `tiered` is the strictly stronger "every stem has a row". The deleted
 * symbol is NOT NAMED anywhere in this tree on purpose: a shipped comment naming a symbol that does
 * not exist sends a reader to a fact that is not there, which is the defect class this change is
 * closing. Its name is recorded in the planning artefacts for 29.1-15 and in the git history.
 *
 * ITS PRODUCTION CONSUMER, NAMED (plan 29.1-09, finding IN-01). `guard_model_assignment` in
 * scripts/check-foundation-guards.ts calls this on EVERY run and appends every finding to its
 * verdict. Until that plan this function had NO caller outside its own oracle, while the accepted
 * rationale for moving the D5 cardinality floor out of `resolveModels` was that the floor now lived
 * HERE — so the floor was reachable from the suite and from nothing a build runs. The guard calls it
 * UNCONDITIONALLY rather than on the tiered path, because this repository's own tree resolves the
 * zero-config preset and a tiered-only call would never execute in continuous integration. Do not
 * narrow that call to the tiered path; the reasoning is recorded at the call site.
 */
export function tieredCorpusRefusals(stems, table = TIERED) {
    if (table.length === 0)
        return [TIERED_VACUITY_REFUSAL];
    const findings = [];
    const rowCount = table.length;
    const stemCount = stems.length;
    if (rowCount !== stemCount) {
        findings.push(`model-tiers: the TIERED preset table holds ${String(rowCount)} row(s) against the ` +
            `${String(stemCount)} role stem(s) derived from the role-set authority. The pin is ` +
            "TWO-SIDED: a table shorter than the corpus leaves roles unassigned, and a table longer " +
            "than it assigns a tier to something that is not a role. Remedy: reconcile the table with " +
            "agent-factory/roles/ and walk every consumer named on MODEL_TIERS_COUNT.");
    }
    const tableStems = new Set(table.map((r) => r.stem));
    const corpusStems = new Set(stems);
    for (const stem of [...tableStems].sort()) {
        if (!corpusStems.has(stem)) {
            findings.push(`model-tiers: the TIERED preset table assigns a tier to "${stem}", which is NOT one of the ` +
                "role stems derived from the role-set authority — direction TABLE → CORPUS. Legal stems " +
                "are whatever listRoles() returns on this tree; a stem here that is not one of them is a " +
                "typo or a role that was renamed or deleted without the table following it.");
        }
    }
    for (const stem of [...corpusStems].sort()) {
        if (!tableStems.has(stem)) {
            findings.push(`model-tiers: the role stem "${stem}" has NO entry in the TIERED preset table — direction ` +
                "CORPUS → TABLE. MODEL-03 exists so that a newly arrived role cannot be silently " +
                "unassigned; add an entry for this stem with the quality argument for its tier.");
        }
    }
    return findings;
}
/**
 * Resolve a model alias for every role stem the caller derived.
 *
 * PURE. It opens no file, reads no environment variable and joins no path. The stems come in as an
 * argument, so the caller's derivation (through the kit authority) stays the one place the role set
 * is decided.
 *
 * THE FLOORS RUN BEFORE THE MAP IS BUILT, and each states a DIFFERENT fact:
 *   0.  ILLEGAL PRESET   — a name outside the closed set, refused naming the value and the legal set.
 *   0b. OVERRIDES SHAPE  — a present-but-non-Map overrides argument, refused naming the shape found.
 *   1.  EMPTY            — a resolution over nobody is the vacuous pass, not a small clean run.
 *   2.  DUPLICATE        — a repeated stem would otherwise be silently resolved last-wins.
 *   3.  Under `tiered` only: the table's own integrity, and then the per-stem coverage check.
 *
 * THE `tiered` COVERAGE CHECK IS THE STRICTLY STRONGER FORM OF MODEL-03'S GUARANTEE. Rather than
 * comparing two numbers, it asks whether EVERY stem handed to this resolver has an entry, and NAMES
 * the ones that do not. That is correct on a hermetic mirror carrying a subset of the corpus, where
 * a cardinality equality is not — and it tells the reader WHICH role arrived unassigned instead of
 * telling them that two numbers disagreed.
 *
 * THE ROLE_COUNT RELATIONSHIP IS DELIBERATELY NOT CHECKED HERE — see `tieredCorpusRefusals` above
 * for where it went and why, and `guard_model_assignment` in scripts/check-foundation-guards.ts for
 * the consumer that adjudicates it over the LIVE tree.
 */
export function resolveModels(stems, options) {
    // ── Floor 0: the preset name, by EXACT EQUALITY against the closed set. ─────────────────────
    //
    // VALIDATED BEFORE IT IS DEFAULTED, and ONLY a strictly `undefined` preset takes the default
    // (finding WR-02). Written as `options?.preset ?? "none"` the coalesce ran first, so `null` — and
    // any other nullish value an untyped caller can hand over — was silently converted into the
    // zero-config answer and never reached this refusal at all.
    //
    // ABSENT AND NULL ARE DIFFERENT STATEMENTS, and the distinction is the whole reason for the split.
    // An ABSENT preset is the zero-config contract: the caller asked for the lean default and gets it.
    // A NULL preset is a caller who typed something that cannot mean anything, and answering it with
    // the lean default leaves them holding the same map they would have had for a correct request,
    // with nothing anywhere telling them their value was discarded. `readModelsConfig`'s Pitfall 2
    // paragraph, one function below, argues exactly this for a degenerate `models` block — '"off" and
    // "I typed something that cannot mean anything" are different statements' — and the two places
    // must agree, because they are the same claim about two doors into the same resolver.
    //
    // THE REJECTED VALUE IS RENDERED BY `quoteValue` AND NOWHERE ELSE (finding R3-WR-02). This site
    // used to spell `JSON.stringify` itself, which threw on the two shapes it could not serialise —
    // so the value that reached this refusal was the value that stopped the refusal being returned.
    // One authority, and it is total; see its docstring for the four reproduced pre-fix throws.
    const rawPreset = options?.preset;
    const preset = rawPreset === undefined ? "none" : rawPreset;
    if (!isPresetName(preset)) {
        return {
            ok: false,
            reason: `model-tiers: ${quoteValue(preset)} is not a legal preset name. The legal set is ` +
                `exactly: ${PRESET_NAMES.map((n) => `"${n}"`).join(", ")}. Remedy: use one of those two ` +
                "names; adding a third preset is a source change in scripts/model-tiers.ts, not a value a " +
                "configuration file can invent.",
        };
    }
    // ── Floor 0b: the overrides argument's SHAPE, by the same rule Floor 0 applies to the preset. ─
    //
    // (FINDING R2-WR-01) THE SAME COERCION, IN THE SAME FUNCTION, LEFT OPEN ON THE OTHER ARGUMENT.
    // Plan 29.1-08 closed `preset` and left `overrides` reading `options?.overrides ?? []` at the
    // application floor below. Reproduced against the committed `.js` before this arm was written:
    //
    //   resolveModels(['a','b'], {preset:'none', overrides: null})
    //     => {"ok":true,"value":[["a","inherit"],["b","inherit"]]}   <- silently discarded
    //   resolveModels(['a','b'], {preset:'none', overrides: {a:'opus'}})
    //     => TypeError: object is not iterable (cannot read property Symbol(Symbol.iterator))
    //
    // The first outcome is exactly the fact Floor 0 exists to distinguish. The second is a THROW out
    // of a module whose header argues that returning a result rather than throwing is what lets one
    // reader serve the generator, the installer doctor and any future runtime reader — a plain object
    // being the natural shape for a caller that read `models.roles` out of JSON without building a
    // Map, so the crashing case is the likely one rather than the exotic one.
    //
    // ABSENT AND PRESENT-BUT-WRONG ARE DIFFERENT STATEMENTS, the same argument Floor 0 makes. ONLY a
    // strictly `undefined` value takes the zero-config default here; every other value is refused by
    // name. Plan 29.1-08's recorded reason for fixing the code rather than deleting the docstring is
    // quoted rather than re-derived: the tooling layer ships as committed `.js` with no type checking
    // on hosts, so "the declared type above is advisory at run time … A floor that holds only under
    // `tsc` is not a floor."
    //
    // ORDER MEASURED, NOT CHOSEN, AND THE WEAKER TRUE CLAIM REPORTED. This arm was run both BEFORE and
    // AFTER Floor 0 and the whole oracle was executed under each: NO existing case moved under either
    // order — every case carrying a bad preset hands over no overrides and every case carrying
    // overrides hands over a legal preset, so the two floors are disjoint over the suite as it stands.
    // The measured result is therefore that placement is unobservable to the current cases, and the
    // order below is chosen for the ONE input that can tell them apart: a caller with BOTH a bad
    // preset and a bad overrides value receives the PRESET finding, because the preset decides which
    // base map is built and an overrides map is applied on top of that base — reporting the topping
    // before the base would name the second mistake first. This is recorded rather than asserted as a
    // guarantee: it is a statement about which of two refusals is returned, not about either floor's
    // reach, and this plan exists partly because a validator published a guarantee wider than its
    // mechanism.
    //
    // THE VALIDATED LOCAL IS WHAT THE APPLICATION FLOOR ITERATES, so there is ONE place the value is
    // decided rather than a check here and a coalesce there.
    const rawOverrides = options?.overrides;
    const overrides = rawOverrides === undefined
        ? new Map()
        : rawOverrides instanceof Map
            ? rawOverrides
            : null;
    if (overrides === null) {
        return {
            ok: false,
            reason: `model-tiers: the overrides argument is ${describeShape(rawOverrides)} rather than a Map ` +
                "of role stem to alias. An ABSENT overrides map is the zero-config contract; a value that " +
                "is present but not a Map is a caller whose overrides would be silently discarded, which " +
                "is a tier the caller believes they set and did not. Remedy: hand over a Map — " +
                "`readModelsConfig` is what produces a validated one — or omit the argument entirely.",
        };
    }
    // ── Floor 1: the vacuity floor. ─────────────────────────────────────────────────────────────
    if (stems.length === 0) {
        return {
            ok: false,
            reason: "model-tiers: the stem set is EMPTY — refusing to resolve a model for nobody. " +
                '"The set was empty, therefore every member is assigned" is the vacuous pass this floor ' +
                "exists to make impossible: a resolution over nothing reports a clean assignment and " +
                "carries no information about the roles it was supposed to cover.",
        };
    }
    // ── Floor 2: a duplicated stem, reported by NAME and by COUNT rather than resolved last-wins. ─
    // Counted over the whole set first, then reported in SORTED stem order, so which duplicate is
    // named is a property of the set rather than of the caller's argument order.
    const occurrences = new Map();
    for (const stem of stems)
        occurrences.set(stem, (occurrences.get(stem) ?? 0) + 1);
    for (const stem of [...occurrences.keys()].sort()) {
        const count = occurrences.get(stem) ?? 0;
        if (count > 1) {
            return {
                ok: false,
                reason: `model-tiers: the stem "${stem}" appears ${String(count)} times in the stem set — ` +
                    "refusing a duplicated stem rather than letting the last occurrence win, because the " +
                    "losing occurrence's assignment would vanish with no error anywhere.",
            };
        }
    }
    // ── The resolution. ─────────────────────────────────────────────────────────────────────────
    // SORTED BEFORE INSERTION so the map's own iteration order is a property of this expression
    // rather than of the caller's argument order. The generator writes bytes from this map, and an
    // ordering that followed the argument would be an ordering nothing in the emit path controls.
    const sorted = [...stems].sort();
    const value = new Map();
    if (preset === "tiered") {
        // ── Floor 3a: the table's own integrity, before a single stem is looked up in it. ─────────
        const tableRefusals = tieredTableRefusals();
        if (tableRefusals.length > 0) {
            // Joined with a newline rather than merged into one sentence: each refusal keeps its own
            // wording, so a reader sees how many distinct defects the table has rather than one blur.
            return { ok: false, reason: tableRefusals.join("\n") };
        }
        // ── Floor 3b: per-stem coverage, in ONE loop that both builds the map and collects the
        // stems it could not build. Two passes would be two authorities for one predicate. ─────────
        const byStem = new Map(TIERED.map((row) => [row.stem, row.alias]));
        const unassigned = [];
        for (const stem of sorted) {
            const alias = byStem.get(stem);
            if (alias === undefined) {
                unassigned.push(stem);
                continue;
            }
            value.set(stem, alias);
        }
        if (unassigned.length > 0) {
            return {
                ok: false,
                reason: `model-tiers: the "tiered" preset assigns nothing to ${String(unassigned.length)} of the ` +
                    `${String(sorted.length)} stem(s) handed to this resolver: ` +
                    `${unassigned.map((s) => `"${s}"`).join(", ")}. MODEL-03 exists so that a role cannot ` +
                    "arrive unassigned; add an entry to TIERED for each stem named here, with the quality " +
                    "argument for its tier. Remedy: do NOT fall back to `inherit` for the remainder — a " +
                    "partial preset is a tier the user believes they set and did not.",
            };
        }
    }
    else {
        // The zero-config answer and the `none` preset's answer, which are the same answer by design —
        // built through the ONE helper the degrading consumers also use, so "what does `inherit`
        // everywhere look like" has a single implementation in this module rather than three.
        for (const [stem, alias] of inheritForEveryStem(sorted))
            value.set(stem, alias);
    }
    // ── Floor 4 and the OVERRIDE application, in that order. ────────────────────────────────────
    //
    // The override wins over the preset — the tie-breaking contract stated in the module header. It is
    // applied by OVERWRITING an existing key, which leaves the map's insertion order untouched, so the
    // determinism the sort buys is not spent here.
    //
    // AN OVERRIDE FOR A STEM THIS RESOLUTION DOES NOT COVER IS REFUSED BY NAME. It used to be SKIPPED
    // — a silent `continue` — on the mirror argument: that a caller resolving a six-role mirror
    // legitimately holds overrides for roles outside it, and that "is this key a real role" belongs to
    // `readModelsConfig` alone (D-06). THAT ARGUMENT WAS REVERSED IN PLAN 29.1-21, ON TWO
    // MEASUREMENTS RATHER THAN ON A SECOND OPINION:
    //
    //   1. NOTHING DEPENDS ON THE DISCARD. The skip was replaced with a refusal and the whole suite
    //      run: 55 files, 2381 passed, 2 skipped, exit 0 — plus `check-foundation-guards`,
    //      `generate:adapters` and `freshness:adapters` all exit 0 with the adapter bytes unchanged.
    //      No case anywhere in this repository hands this loop a stem the resolution does not cover.
    //   2. NO CALLER CAN LEGITIMATELY HOLD ONE. Both production call sites —
    //      scripts/generate-role-adapters.ts:305 and scripts/check-foundation-guards.ts:2107 — pass
    //      the SAME `stems` to `readModelsConfig` and to this function, and `readModelsConfig` already
    //      refuses a `models.roles` key outside the stems it was handed, by name. The only way to
    //      arrive here with an uncovered stem is to read the configuration against a WIDER corpus than
    //      you resolve, which is a caller asking two different questions with two different sets.
    //
    // AND THE SKIP CONTRADICTED THIS MODULE'S OWN STANDING SENTENCE. Floor 0b's refusal reads "a value
    // that is present but not a Map is a caller whose overrides would be silently discarded, which is
    // a tier the caller believes they set and did not", and `readModelsConfig`'s unknown-key refusal
    // says the same thing in the same words. A resolver that refuses a whole discarded MAP and then
    // silently discards an individual ENTRY gives two answers to one question. The two doors into this
    // resolver now give one, which is what D-06's "one authority" was always for.
    //
    // ITERATES THE LOCAL FLOOR 0b VALIDATED, never `options?.overrides ?? []` again (R2-WR-01). The
    // coalesce this replaces was the whole defect: it made this loop the place a missing value was
    // decided, so a value that could not mean anything reached the same empty iteration an absent one
    // does, and a non-iterable one reached a throw instead of a refusal.
    //
    // THIS REFUSAL ALSO RENDERS THROUGH `quoteValue` (finding R3-WR-02). It carried the SECOND
    // spelling of that operation — `String(JSON.stringify(alias))` — and the second spelling is
    // deleted rather than made total beside the first, because a module whose header forbids a second
    // implementation of one predicate does not keep two.
    //
    // ONE AUTHORITY OVER ONE OPERATION, ON THE KEY AXIS AS WELL AS THE VALUE AXIS (round-4 BLOCKER 2).
    // Both sentences below used to route their ALIAS through `quoteValue` and interpolate their STEM
    // raw inside hand-written quotation marks. Two positions in ONE sentence disagreeing about who
    // quotes is precisely the shape the round-4 verifier named: the guarded position proves nothing
    // about the sentence, because the un-guarded one beside it kills the same message. A Map key can
    // be any value at all — the type above is advisory at run time, which is this module's own
    // standing reason for every floor it has — so a Symbol key, or a key whose string conversion
    // throws, killed the refusal that existed to reject it. Both positions in both sentences now come
    // from the one function, and the literal quotation marks are gone because the authority supplies
    // them for a string.
    //
    // MEASURED ACROSS THREE COMMITTED BUILDS BEFORE THE CHANGE, not inherited from the report that
    // found it. A Symbol key with a LEGAL alias and a throwing-conversion key with a legal alias both
    // returned `{ok:true}` at `e9907f5` and both THREW at `ad033f0` — the reversal of the silent skip
    // above routed keys that never reached a template before into one that could not render them. A
    // Symbol key with an ILLEGAL alias threw at BOTH, because the alias sentence's raw stem position
    // predates the reversal; that third input is why this is a fix at two sites and not one.
    //
    // EVERY LEGAL KEY'S WORDING IS UNMOVED, and that is a property of the authority rather than a
    // hope: `quoteValue` renders through `JSON.stringify` and returns `String(...)` of the result, so
    // an ordinary stem still arrives carrying its own quotation marks and nothing else in either
    // sentence moves. Only the shapes that THREW change behaviour, and they change from a throw to a
    // description. Proven by diffing pre-change against post-change reasons rather than by reading
    // them; see model-tiers.test.ts, "a Symbol key is REFUSED and NAMED rather than crashing the
    // sentence that rejects it" and the byte-identity regression control beside it.
    for (const [stem, alias] of overrides) {
        if (!isModelAlias(alias)) {
            return {
                ok: false,
                reason: `model-tiers: the override for role ${quoteValue(stem)} is ${quoteValue(alias)}, which ` +
                    `is not a legal model alias. The legal set is exactly: ` +
                    `${MODEL_ALIASES.map((a) => `"${a}"`).join(", ")}. This floor exists because the resolved ` +
                    "value is written straight into emitted frontmatter, and the closed allow-list is the only " +
                    "thing keeping a YAML-significant byte out of it.",
            };
        }
        if (!value.has(stem)) {
            return {
                ok: false,
                reason: `model-tiers: the override names the role stem ${quoteValue(stem)}, which is not one of ` +
                    `the ${String(sorted.length)} stem(s) this resolution covers: ` +
                    `${sorted.map((s) => quoteValue(s)).join(", ")}. An override this resolver drops is a tier the ` +
                    "caller believes they set and did not, which is the same fact Floor 0b refuses a discarded " +
                    "overrides MAP for — so a discarded ENTRY is refused on the same grounds. Remedy: correct " +
                    "the stem, or resolve against the corpus the overrides were read for; `readModelsConfig` " +
                    "refuses an unknown role key by name against the stems it is handed (D-06).",
            };
        }
        value.set(stem, alias);
    }
    return { ok: true, value };
}
/**
 * `inherit` for every stem — THE DEGRADING POLICY, in one implementation the degrading consumers share.
 *
 * D-11 splits by consumer: the GENERATOR turns a refusal into exit 1 writing nothing, and EVERY OTHER
 * consumer — the installer's `--check` doctor, any future runtime reader — degrades to `inherit` and
 * NEVER to a pinned tier. This is that degradation, exported so the two do not each write their own.
 *
 * WHY `inherit` AND NOT THE PRESET'S GUESS. Silently upgrading a user to a model their account may
 * not carry is a worse failure than reading the session default: the first fails at load time on a
 * value nobody chose, the second is the documented default behaviour.
 *
 * Sorted for the same reason `resolveModels` sorts — an ordering a caller's argument controls is an
 * ordering nothing in an emit path controls.
 */
export function inheritForEveryStem(stems) {
    const value = new Map();
    for (const stem of [...stems].sort())
        value.set(stem, "inherit");
    return value;
}
/** The zero-config answer, named once so the four arms that reach it cannot drift apart. */
function zeroConfigModels(source) {
    return { ok: true, value: { preset: "none", overrides: new Map(), source } };
}
/**
 * A JSON value's shape, in words, so a refusal can name what it found rather than what it wanted.
 *
 * THE ARTICLE AGREES WITH THE WORD IT PRECEDES. `typeof` yields two vowel-initial results —
 * `"object"` and `"undefined"` — and the fixed `a` this replaces rendered them as "a object" and
 * "a undefined". Both were reachable before this change (an `aliases` key set to an object or left
 * out reaches this helper through `readAssignmentPayload`) and finding R2-WR-01's new Floor 0b makes
 * the object case the LIKELY one: a plain object is the natural shape for a caller that read
 * `models.roles` out of JSON without building a Map. A refusal is a safety surface and the only
 * channel telling a caller their value was rejected, so it is written in correct English. Decided by
 * a first-character lookup rather than a pattern, like every other decision in this module.
 */
function describeShape(value) {
    if (value === null)
        return "null";
    if (Array.isArray(value))
        return "an array";
    const shape = typeof value;
    return `${"aeiou".includes(shape[0]) ? "an" : "a"} ${shape}`;
}
/**
 * A value quoted back to the user exactly as they typed it, including a non-JSON-serialisable one.
 *
 * THE ONE AUTHORITY FOR QUOTING A VALUE INTO A REFUSAL, AND IT IS TOTAL (finding R3-WR-02). Until
 * this guard was written the docstring line above was FALSE: `JSON.stringify` throws on a circular
 * object and on a BigInt, so a non-serialisable value was the one shape this function could not
 * quote. Worse, two other sites spelled the same operation themselves — Floor 0's preset refusal and
 * the override-alias refusal below — which is a second implementation of one predicate in a module
 * whose header argues against exactly that. Both now ask here, and this is the only place the
 * operation is written.
 *
 * REPRODUCED AGAINST THE COMMITTED .js AT 2f6098c BEFORE THIS GUARD EXISTED. Four shapes, four
 * throws out of a refusal path whose module header promises a returned result:
 *
 *   resolveModels(stems, {preset: circular})                   -> TypeError: Converting circular structure to JSON
 *   resolveModels(stems, {preset: 1n})                         -> TypeError: Do not know how to serialize a BigInt
 *   resolveModels(stems, {overrides: Map(stem -> circular)})   -> TypeError: Converting circular structure to JSON
 *   resolveModels(stems, {overrides: Map(stem -> 1n)})         -> TypeError: Do not know how to serialize a BigInt
 *
 * The value that reached the refusal was the value that prevented the refusal from being RETURNED.
 *
 * WHY IT DESCRIBES RATHER THAN DIES, AND WHY THE REFUSAL IS NOT SHORTENED INSTEAD. A value JSON
 * cannot render is still a value the user handed over, and the refusal is the ONLY channel telling
 * them it was rejected; a generic message would leave them holding a rejection with no way to tell
 * which of their values caused it. So the fallback is built from `describeShape` — this module's
 * existing English-correct shape describer — rather than from a third rendering invented here, and
 * it is wrapped in angle brackets so a reader can tell a DESCRIPTION from a rendered value at a
 * glance. The catch is deliberately unconditional: it is not only `TypeError` that can arrive here,
 * because a getter that throws inside the object under serialisation surfaces its own error.
 *
 * `String(...)` IS LOAD-BEARING AND PREDATES THIS CHANGE. `JSON.stringify` RETURNS `undefined` —
 * not a string, and without throwing — for `undefined`, a function and a symbol, so the conversion
 * is what keeps a non-string out of the template literals that consume this. A serialisable value
 * therefore renders byte-identically before and after this change.
 *
 * THE RENDER IS ASSIGNED TO A LOCAL RATHER THAN RETURNED FROM INSIDE THE `try`, so the composed
 * spelling `String(JSON.stringify(` — the one the deleted second site used — exists NOWHERE in this
 * module. That makes a scan for it a real predicate rather than one this function would satisfy
 * itself, and keeps the `try` around the single expression that can actually throw.
 */
function quoteValue(value) {
    let rendered;
    try {
        rendered = JSON.stringify(value);
    }
    catch {
        return `<${describeShape(value)} that cannot be serialised>`;
    }
    return String(rendered);
}
/**
 * Read and validate a `models` block that has already been established to be a JSON object.
 *
 * Split out so the FILE-shaped refusals (absent, unparseable, not an object, no `models` key) and the
 * BLOCK-shaped refusals (illegal preset, unknown role key, illegal alias) are two readable halves
 * rather than one function with seven early returns at two levels of nesting.
 */
function readModelsBlock(models, path, stems) {
    // ── The BLOCK'S OWN KEY SET, adjudicated BEFORE a single value is read (WR-01, extending D-06). ─
    //
    // WHAT PRESENCE CLOSES, AND WHAT PLACEMENT DECIDES — measured by mutation, not assumed.
    //
    // PRESENCE closes the partial application. Against the pre-fix committed .js,
    // `{"preset":"tiered","role":{"orchestrator":"opus"}}` resolved `tiered` with zero overrides and
    // no message: the preset applied and the overrides silently did not. Deleting this check was
    // observed to turn that case and four others RED.
    //
    // PLACEMENT decides WHICH FINDING the user is handed, and nothing more. Moving this check below
    // the preset read was ALSO measured, and the partial-application case stayed GREEN — a refusal
    // short-circuits the function either way, so reading a legal preset into a local applies nothing.
    // The one case that moved was the ordering case: `{"presets":"tiered","preset":"bogus"}` reported
    // the illegal preset VALUE instead of the unknown KEY, sending the author to fix `"bogus"` inside
    // a key that has to be deleted regardless, and only then telling them about the key. The block's
    // SHAPE is adjudicated before any of its values because the shape is the more basic fact, not
    // because a later placement would let half a block through. Stating the weaker true claim here is
    // the point: this plan exists to close a validator that published a guarantee wider than its
    // mechanism, and repeating that habit in the fix would be the same defect wearing a patch.
    //
    // EVERY offending key is reported, sorted, in ONE refusal: a user with two typos should be told
    // about two typos rather than sent round the loop once per mistake, and the sort makes which key
    // is named first a property of the set rather than of JSON key order.
    const unknownKeys = Object.keys(models)
        .filter((key) => !MODELS_KEYS.some((legal) => legal === key))
        .sort();
    if (unknownKeys.length > 0) {
        // The clause agrees in number with the list it follows. A refusal is a safety surface and the
        // only channel telling a user their configuration did not do what they meant; "which is not a
        // key" after a two-item list reads as though one of the two were legal.
        const notAKey = unknownKeys.length === 1 ? "which is not a key" : "none of which is a key";
        return {
            ok: false,
            reason: `model-tiers: ${path} sets ` +
                `${unknownKeys.map((key) => `\`models.${key}\``).join(", ")}, ${notAKey} of the ` +
                `\`models\` block. The legal set is exactly: ` +
                `${MODELS_KEYS.map((key) => `"${key}"`).join(", ")}. Membership is EXACT STRING EQUALITY ` +
                "against those constants, so a case-varied spelling is an unknown key rather than a match. " +
                "Remedy: correct the key. A silently ignored key is a tier the user believes they set and " +
                "did not (D-06), so it is refused rather than skipped — and it is refused BEFORE any legal " +
                "key beside it is read, because a preset applying while its overrides are dropped is a " +
                "partially wrong tier map delivered by a green run.",
        };
    }
    // ── WHAT THIS CLOSES, AND WHAT IT DOES NOT — the disclosed residual (WR-01, T-29.1-17). ────────
    //
    // CLOSED: the `models` block's key set, immediately above, and the `models.roles` key set below.
    // Both are decided against an allow-list by exact string equality, and both name every offending
    // member.
    //
    // NOT CLOSED: the configuration FILE's own top-level key set. That file legitimately carries the
    // other dials this repository documents — `governance`, `quality`, `queue`, `context`, `bdd`,
    // `wip_limits` and more — and each is read by a different consumer. A near-miss key at FILE level,
    // `{"model":{"preset":"tiered"}}` singular being the reproduced example, therefore reaches outcome
    // 4 of `readModelsConfig` and yields the zero-config answer with no message.
    //
    // THE DIRECTION OF THAT RESIDUAL, stated rather than left to be inferred from silence: the user
    // gets the lean default — every role `inherit` — and cannot distinguish it from a dial that did
    // nothing. That is the same conflation this module refuses everywhere else, and it is ACCEPTED
    // here rather than fixed.
    //
    // WHY CLOSING IT IS NOT ATTEMPTED: enumerating the file's legal top-level keys would require a
    // registry of every reader that consumes that file, and no such registry exists in this tree.
    // Building one from a hand-written list would be this repository's named second systemic failure
    // class — a set literal that rots while the suite stays green — installed at the exact surface
    // whose whole purpose is refusing silently dropped configuration. The residual is pinned by a case
    // whose title states it is a residual, and stated in agent-factory/config/factory.config.md, so no
    // shipped sentence publishes a guarantee wider than the mechanism behind it.
    // ── `preset`, by EXACT EQUALITY against the closed set (D-07). ───────────────────────────────
    let preset = "none";
    const rawPreset = models.preset;
    if (rawPreset !== undefined) {
        if (!isPresetName(rawPreset)) {
            return {
                ok: false,
                reason: `model-tiers: ${path} sets \`models.preset\` to ${quoteValue(rawPreset)}, which is not a ` +
                    `legal preset name. The legal set is exactly: ` +
                    `${PRESET_NAMES.map((n) => `"${n}"`).join(", ")}. Remedy: use one of those names. Adding ` +
                    "a third preset is a source change in scripts/model-tiers.ts with a rationale table " +
                    "beside it, not a value a configuration file can invent.",
            };
        }
        preset = rawPreset;
    }
    // ── `roles`, a SPARSE override map. ─────────────────────────────────────────────────────────
    const overrides = new Map();
    const rawRoles = models.roles;
    if (rawRoles === undefined)
        return { ok: true, value: { preset, overrides, source: path } };
    if (rawRoles === null || typeof rawRoles !== "object" || Array.isArray(rawRoles)) {
        return {
            ok: false,
            reason: `model-tiers: the \`models.roles\` key in ${path} is ${describeShape(rawRoles)} rather than ` +
                "a JSON object of role-stem-to-alias pairs. Remedy: write it as an object, or remove it " +
                "entirely — an absent `roles` key is legal and means the preset's answer stands unmodified.",
        };
    }
    const rolesObject = rawRoles;
    const validStems = new Set(stems);
    const validStemList = [...stems].sort().join(", ");
    // EVERY KEY IS VALIDATED BEFORE ANY VALUE IS READ, and before any key is used anywhere. This is
    // the ASVS V12 control recorded in the module header: a config-derived string is compared against
    // a derived set and never joined onto a path.
    for (const key of Object.keys(rolesObject).sort()) {
        if (validStems.has(key))
            continue;
        return {
            ok: false,
            reason: `model-tiers: ${path} sets \`models.roles\` for "${key}", which is NOT one of the role ` +
                `stems derived from the role-set authority. The valid set on this tree is: ` +
                `${validStemList}. Remedy: correct the key. A silently ignored override is a tier the user ` +
                "believes they set and did not (D-06), so an unknown key is refused rather than skipped.",
        };
    }
    for (const key of Object.keys(rolesObject).sort()) {
        const value = rolesObject[key];
        if (!isModelAlias(value)) {
            return {
                ok: false,
                reason: `model-tiers: ${path} assigns role "${key}" the value ${quoteValue(value)}, which is not ` +
                    `a legal model alias. The legal set is exactly: ` +
                    `${MODEL_ALIASES.map((a) => `"${a}"`).join(", ")}. Membership is EXACT STRING EQUALITY ` +
                    "against those four constants and never a pattern, which is what keeps a YAML-significant " +
                    "byte out of the emitted frontmatter. A full model id is refused deliberately (MODEL-04): " +
                    "it is the hand-maintained stale literal this milestone exists to eliminate, and an alias " +
                    "degrades gracefully for a user whose account does not carry the stronger tier.",
            };
        }
        overrides.set(key, value);
    }
    return { ok: true, value: { preset, overrides, source: path } };
}
/**
 * Resolve the `models` block from the two standard config locations, or state why it cannot be.
 *
 * FOUR DISTINCT OUTCOMES ON THE FILE ITSELF, each with its own branch and its own sentence:
 *   1. GENUINELY ABSENT at both locations                     → ok, the zero-config answer.
 *   2. PRESENT but UNPARSEABLE                                → refusal naming the file AND the error.
 *   3. PRESENT and parsed but NOT a JSON object               → refusal naming the file.
 *   4. PRESENT, an object, carrying NO `models` key           → ok, the zero-config answer.
 *
 * AND ONE MORE ON THE SUB-OBJECT, which Pitfall 2 exists to keep separate from (1): a `models` value
 * that is PRESENT but degenerate — null, an array, a string, a number — is a refusal naming the file
 * and the shape found. It is NOT folded into the absent case. Folding it there is the failure this
 * distinction prevents: a user who wrote `"models": null` meaning "off" would silently get the lean
 * default, which is the same answer they would get for a typo'd key name, and neither would tell
 * them anything. An EMPTY `models` object, by contrast, IS the zero-config answer, and legitimately.
 *
 * The stems are taken as an argument for the same reason `resolveModels` takes them — the caller's
 * derivation through the kit authority stays the one place the role set is decided.
 */
export function readModelsConfig(repoRoot, stems) {
    // The vacuity floor, before any file is opened. Validating a role key against an EMPTY valid set
    // refuses every key for the wrong reason; validating it against no set at all accepts every key.
    // Both are the vacuous pass, and neither tells the reader that the corpus derivation is what broke.
    if (stems.length === 0) {
        return {
            ok: false,
            reason: "model-tiers: the derived stem set handed to readModelsConfig is EMPTY — refusing to " +
                "validate role overrides against nobody. A key checked against an empty valid set is " +
                "refused for the wrong reason and a key checked against no set at all is accepted for no " +
                "reason; either way the answer is a vacuous one that hides a broken corpus derivation.",
        };
    }
    // Built from the ONE declaration of these two locations rather than spelled inline. See
    // MODELS_CONFIG_CANDIDATE_RELS above for why: the inline array this replaces was the second
    // spelling of a fact the shipped documentation spelled differently, which is finding WR-05.
    const candidates = MODELS_CONFIG_CANDIDATE_RELS.map((rel) => join(repoRoot, ...rel.split("/")));
    for (const path of candidates) {
        // Outcome 1, per candidate: this location holds nothing, so try the next one. The genuinely
        // absent answer is returned after the loop, once BOTH locations have been found empty.
        if (!existsSync(path))
            continue;
        let parsed;
        try {
            parsed = JSON.parse(readFileSync(path, "utf8"));
        }
        catch (error) {
            // Outcome 2. The parse error travels with the refusal: "could not be read" tells the user
            // nothing they can act on, and the message JSON.parse produces names the offending position.
            return {
                ok: false,
                reason: `model-tiers: ${path} is present but could not be parsed as JSON — ` +
                    `${error instanceof Error ? error.message : String(error)}. Remedy: fix the file. A ` +
                    "present-but-unreadable configuration is NOT treated as an absent one, because a user who " +
                    "edited that file meant something by it.",
            };
        }
        // Outcome 3.
        if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
            return {
                ok: false,
                reason: `model-tiers: ${path} parses, but the configuration file as a whole is ` +
                    `${describeShape(parsed)} rather than a JSON object. This is a distinct fact from a ` +
                    "degenerate `models` sub-object — the whole file is the wrong shape, so no key in it can " +
                    "be read. Remedy: make the file a JSON object.",
            };
        }
        const models = parsed.models;
        // Outcome 4. A valid configuration with models simply unconfigured — the zero-config contract,
        // and indistinguishable from outcome 1 by design.
        if (models === undefined)
            return zeroConfigModels(path);
        // Pitfall 2: PRESENT but degenerate. Refused by name, never folded into the absent case.
        if (models === null || typeof models !== "object" || Array.isArray(models)) {
            return {
                ok: false,
                reason: `model-tiers: the \`models\` key in ${path} is ${describeShape(models)} rather than a ` +
                    "JSON object. A present-but-degenerate `models` is refused rather than read as an absent " +
                    'one: "off" and "I typed something that cannot mean anything" are different statements, ' +
                    "and collapsing them leaves the user with the lean default and no indication why. " +
                    'Remedy: write `"models": {}` for the zero-config answer, or remove the key entirely.',
            };
        }
        // An EMPTY object reaches readModelsBlock and comes back as the zero-config answer with no
        // special case, because an empty block genuinely has nothing illegal in it.
        return readModelsBlock(models, path, stems);
    }
    // Outcome 1: no configuration file at either standard location. Zero-config runs lean.
    return zeroConfigModels(null);
}

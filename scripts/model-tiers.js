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
// SCOPE, AS OF PLAN 29.1-02. The module is complete: the closed alias vocabulary, the closed preset
// vocabulary, the shipped `tiered` table with a rationale required by the type, the two-location
// config read with every illegal input refused by name, and the sparse-override contract. What is
// NOT here, deliberately: the exact live-tree cardinality (adjudicated in `guard_model_assignment`,
// plan 29.1-04) and the install-time delivery of a per-repo `models` block (moved to phase 29.2 by
// D-17). Until 29.2 lands, a per-repo `models` block is INERT FOR AN INSTALLED TARGET — the
// mechanism resolves and emits correctly in-kit, but the adapters an installed repo loads are
// whatever the kit shipped. That is a disclosed limitation of this increment, not a defect.
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
export const MODELS_KEYS = ["preset", "roles"];
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
 * The trailing carriage return of a Windows child's stdout is trimmed off THE LINE, before the
 * prefix test, and never off the captured value: `none` and `none\r` are different strings, and the
 * difference would be an equality failure with an invisible cause on the one platform this kit
 * cannot test interactively. The captured value is NOT itself trimmed, so a value carrying internal
 * or leading spacing stays visible as wrong rather than being normalised into shape.
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
    for (const alias of aliases) {
        if (typeof alias !== "string") {
            return refuse(`lists the non-string alias ${quoteValue(alias)}`);
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
// full, is recorded on `roleCorpusCardinalityRefusal` below. What this library enforces instead is
// the strictly STRONGER per-stem check: every stem handed to the resolver has a row, and an
// unassigned stem is NAMED rather than reported as a number that disagrees.
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
 * above and `roleCorpusCardinalityRefusal` below. The consumers that genuinely mean "is this the
 * whole live corpus" ask this out loud.
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
 *   0. ILLEGAL PRESET — a name outside the closed set, refused naming the value and the legal set.
 *   1. EMPTY          — a resolution over nobody is the vacuous pass, not a small clean run.
 *   2. DUPLICATE      — a repeated stem would otherwise be silently resolved last-wins.
 *   3. Under `tiered` only: the table's own integrity, and then the per-stem coverage check.
 *
 * THE `tiered` COVERAGE CHECK IS THE STRICTLY STRONGER FORM OF MODEL-03'S GUARANTEE. Rather than
 * comparing two numbers, it asks whether EVERY stem handed to this resolver has an entry, and NAMES
 * the ones that do not. That is correct on a hermetic mirror carrying a subset of the corpus, where
 * a cardinality equality is not — and it tells the reader WHICH role arrived unassigned instead of
 * telling them that two numbers disagreed.
 *
 * THE ROLE_COUNT RELATIONSHIP IS DELIBERATELY NOT CHECKED HERE — see `roleCorpusCardinalityRefusal`
 * below for where it went and why.
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
    const rawPreset = options?.preset;
    const preset = rawPreset === undefined ? "none" : rawPreset;
    if (!isPresetName(preset)) {
        return {
            ok: false,
            reason: `model-tiers: ${JSON.stringify(preset)} is not a legal preset name. The legal set is ` +
                `exactly: ${PRESET_NAMES.map((n) => `"${n}"`).join(", ")}. Remedy: use one of those two ` +
                "names; adding a third preset is a source change in scripts/model-tiers.ts, not a value a " +
                "configuration file can invent.",
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
    // AN OVERRIDE FOR A STEM THIS RESOLUTION DOES NOT COVER IS SKIPPED, not refused, and the reason is
    // the mirror argument again: a caller resolving a six-role mirror legitimately holds overrides for
    // roles outside it. The question "is this key a real role" belongs to `readModelsConfig`, which
    // asks it against the DERIVED corpus and refuses a typo by name (D-06). One authority, asked where
    // the user's mistake actually is.
    for (const [stem, alias] of options?.overrides ?? []) {
        if (!isModelAlias(alias)) {
            return {
                ok: false,
                reason: `model-tiers: the override for role "${stem}" is ${String(JSON.stringify(alias))}, which ` +
                    `is not a legal model alias. The legal set is exactly: ` +
                    `${MODEL_ALIASES.map((a) => `"${a}"`).join(", ")}. This floor exists because the resolved ` +
                    "value is written straight into emitted frontmatter, and the closed allow-list is the only " +
                    "thing keeping a YAML-significant byte out of it.",
            };
        }
        if (!value.has(stem))
            continue;
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
/** A JSON value's shape, in words, so a refusal can name what it found rather than what it wanted. */
function describeShape(value) {
    if (value === null)
        return "null";
    if (Array.isArray(value))
        return "an array";
    return `a ${typeof value}`;
}
/** A value quoted back to the user exactly as they typed it, including a non-JSON-serialisable one. */
function quoteValue(value) {
    return String(JSON.stringify(value));
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
    const candidates = [
        join(repoRoot, ".grugops", "factory.config.json"),
        join(repoRoot, "agent-factory", "config", "factory.config.json"),
    ];
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
/**
 * The ROLE_COUNT relationship, asked BY THE CONSUMERS THAT ARE JUDGING THE LIVE ROLE CORPUS.
 * Returns the refusal reason, or `null` when the set really is the corpus.
 *
 * WHY THIS IS NOT A FLOOR INSIDE `resolveModels`, which is where plan 29.1-01 first put it and where
 * it was measurably wrong. `resolveModels` sits on the adapter generator's hot path, and that
 * generator RUNS OVER HERMETIC MIRRORS holding a SUBSET of the role corpus — its own committed suite
 * mirrors six roles, and scripts/adapters-freshness.ts and the foundation-guard harnesses mirror
 * whatever tree they are judging. Measured: with the equality inside the resolver, a six-role mirror
 * was refused and 22 committed cases went red. A smaller set is CORRECT there, not broken, so a
 * cardinality equality on that path refuses valid runs.
 *
 * IT IS ALSO A SECOND AUTHORITY FOR A PREDICATE THAT ALREADY HAS ONE, which is the deeper reason.
 * `listRoles` itself does NOT assert ROLE_COUNT — it refuses only an EMPTY corpus — and the two-sided
 * cardinality is asserted by `guard_kit_counts` over the LIVE tree. Duplicating that assertion inside
 * a shared resolver would make the weaker copy fire where the stronger one correctly does not, and
 * "delete the second authority rather than teach it a case" is this repository's own rule.
 *
 * WHAT STILL SATISFIES D-05, so nothing is lost by the move. D-05's requirement is that "role #18
 * cannot arrive unassigned". `resolveModels` assigns a value to EVERY stem it is handed, so on any
 * tree — live or mirrored — an eighteenth role is assigned rather than skipped. From plan 29.1-02,
 * when the TIERED preset carries per-role rows, the binding check becomes the strictly STRONGER
 * "every stem has a row", which names the unassigned stem instead of reporting a number that
 * disagrees, and which is correct on a mirror as well.
 *
 * WHO CALLS THIS TODAY, STATED PLAINLY (plan 29.1-09, finding IN-01). NOBODY IN PRODUCTION. Its only
 * consumer is its oracle in scripts/model-tiers.test.ts. That is an accurate description of a
 * deliberately available predicate with no caller yet, and it is written down because the sentence it
 * replaces implied otherwise: this paragraph used to end by calling itself "the place a consumer that
 * genuinely means 'is this the whole live corpus' asks that question out loud", which reads as a
 * report of consumers that did not exist. An accurate statement of a design with one test-only export
 * is honest; a stale claim that it lives in production is not.
 *
 * THE SISTER PREDICATE DOES HAVE ONE, AND THE SPLIT IS NOT AN OVERSIGHT. `tieredCorpusRefusals` above
 * is called by `guard_model_assignment` on every run. It is the stronger of the two — SET equality in
 * both directions, which names the drifted stem — so a guard that wanted a cardinality answer would
 * be taking the weaker one. This function stays exported and unconsumed for a caller that genuinely
 * has only a count to compare; a consumer that can compare sets should call the sister instead.
 */
export function roleCorpusCardinalityRefusal(stems) {
    if (stems.length === ROLE_COUNT)
        return null;
    return (`model-tiers: the stem set holds ${String(stems.length)} stem(s) against the kit authority's ` +
        `ROLE_COUNT of ${String(ROLE_COUNT)} — this consumer declared it was judging the whole live ` +
        "role corpus, and a set that is not the corpus assigns nothing to the remainder while " +
        "reporting success. If the role corpus genuinely changed, walk every derived consumer before " +
        "changing ROLE_COUNT: listRoles, the TIERED preset table, and guard_model_assignment.");
}

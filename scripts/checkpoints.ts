// checkpoints.ts — the per-checkpoint autonomy matrix's ONE roster (AUTO-01, AUTO-02, AUTO-07).
//
// WHAT THIS MODULE IS. Phase 30 replaced the documentary `autonomy` scalar with a per-checkpoint
// ternary matrix (`block` / `notify` / `off`). This file owns the roster, the ternary vocabulary,
// the fail-closed canonicalizer, the derivation that rebuilds the roster from the kit, the legacy
// grade mapping, and the one surviving grant name (the admission approval). Every other surface —
// the config reader, the admission gate, the validator, the installer cross-check — CONSULTS this
// module and declares none of it a second time.
//
// WHY IT IS ONE MODULE AND NOT A SET OF LITERALS SCATTERED ACROSS THE CONSUMERS. This repository's
// founding defect class is set-literal drift: a hand-maintained scan set / role list / allowlist
// that rots while every gate over it stays green. The remedy this tree has settled on is "derive
// the set, assert the count". So: `CHECKPOINT_DEFAULTS` is the ONLY declaration of the roster,
// `CHECKPOINTS` is `Object.keys()` over it, and the derivation's floor arm reads `SAFETY_FLOORS` —
// imported from ./audit-model.js, never restated (D-04). No second array literal of checkpoint ids
// exists in this file, and none may be added to a consumer.
//
// THE COMPILE-TIME HALF OF THE SAME RULE. `CHECKPOINT_DEFAULTS` carries
// `as const satisfies Record<Checkpoint, Disposition>`: adding a member to the `Checkpoint` union
// without giving it a default is a `tsc` diagnostic, not a runtime surprise. This is the
// `FROZEN_SOURCES` idiom from scripts/check-diff-disposition.ts, applied to the roster — Object.keys()
// over this table is the roster count, and nothing else declares it.
//
// WHO READS A CELL, AFTER PHASE 33.1 (D-17, D-26). No hook reads a checkpoint cell. The Bash command
// guard that once enforced the floor cells was retired in Phase 33.1, and its two-key lowering rule,
// its run banner and its matrix evaluator were retired with it. What remains: the installer reads
// `protected_branch_merge` and `production_requires_human_confirmation` to decide whether it writes
// Claude Code ask rules (a speed bump; the git host's branch protection and deployment environments
// are the hard floor), and the roles read every other cell as a prose-tier rule. The installer keeps
// its own canonicalizer, because install/ imports nothing from scripts/; install/install.test.ts
// holds it equal to `canonicalizeDisposition` below. See agent-factory/config/factory.config.md.

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
import {
  fencedLineFlags,
  unfencedHeadingIndices,
  unfencedHeadingNearMisses,
  unfencedMatchIndices,
} from "./frontmatter.js";

// ─────────────────────────────────────────────────────────────────────────────────────────────
// The vocabulary.
// ─────────────────────────────────────────────────────────────────────────────────────────────

/**
 * The ternary a checkpoint may be set to.
 *   block  — the human stop is enforced; the action is refused without a named human.
 *   notify — the action proceeds and is recorded (a finding note).
 *   off    — the action proceeds silently.
 * There is no fourth value, and `block` is the default for every roster member.
 */
export type Disposition = "block" | "notify" | "off";

/**
 * The closed checkpoint roster.
 *
 * SCOPE AS OF PLAN 30-04: THIRTEEN ids, and every one of them is DERIVABLE. `derivedCheckpointSet`
 * below rebuilds this union from three arms, and `assertRosterMatchesDerivation` compares the two
 * as sorted sets in BOTH directions — an id here that no arm produces is red, and an id an arm
 * produces that is missing here is equally red.
 *
 * THE D-01 AMENDMENT THIS UNION IS BUILT ON. D-01 named two tag corpora, the 17 role
 * `## Hard limits` and the 19 workflow `## Stop conditions` sections. RESEARCH F-1 established that
 * the role sections hold ZERO bullets — they are prose paragraphs, and orchestrator.md's carries
 * FOUR prohibitions in one sentence run, so D-02's "last token of the bullet" has no referent and
 * one tag would attach one id to four prohibitions. The user settled it at plan 30-04's Task 1
 * checkpoint: the TAG corpus is the workflow sections alone, and the role-tier stops come from
 * `SAFETY_FLOORS`, which D-04 already makes canonical. No prohibition is declared twice, and no
 * frozen role prose is rewritten.
 *
 * THE THREE ARMS, EACH WITH EXACTLY ONE AUTHORITY.
 *   1. the TAG arm    — ids carried by canonically tagged workflow `## Stop conditions` bullets;
 *                       authority: the corpus itself, read through `deriveCheckpoints`.
 *   2. the FLOOR arm  — `SAFETY_FLOORS` in ./audit-model.js (D-04). Imported, never restated.
 *   3. the LEGACY arm — the keys of `LEGACY_AUTONOMY_GRADES`, the D-06 mechanical mapping of the
 *                       retired `diff | branch | pr` grade. It exists because D-06 requires that
 *                       mapping to be documented and mechanical anyway; arm three READS it rather
 *                       than listing its two ids a second time.
 *
 * `commit_to_branch` reaches the roster through arm three and through NO other arm — it is not a
 * floor and no stop bullet is about committing to a branch. Without arm three it would be a
 * roster-only id and the two-sided comparison would be red on its first run, which is exactly the
 * fault the comparison is for.
 *
 * THE FLOOR HALF IS NOT DECLARED HERE. Which of these members are floor-tier is decided by
 * `SAFETY_FLOORS` in ./audit-model.js, which the derivation's floor arm reads (D-04). Four of
 * the fourteen members below are `SAFETY_FLOORS` ids; the other ten, `commit_to_branch` included,
 * are deliberately not.
 *
 * WHY `commit_to_branch` IS A ROSTER MEMBER AND NOT A FLOOR (D-06). The retired `autonomy` scalar
 * graded three steps — `diff`, `branch`, `pr` — and Phase 30 splits that grade into two independent
 * stops: may the agent commit to a branch, and may it open a pull request. `open_pr` is the
 * floor-tier half, because stopping at a pull request is what the public "a human holds the merge"
 * claims actually rest on. `commit_to_branch` is the other half and its documented grade default is
 * the permissive one, so making it a floor would give it a floor tier its own default contradicts —
 * a floor in name only.
 */
export type Checkpoint =
  // ── the floor arm: SAFETY_FLOORS' four ids (D-04) ──────────────────────────────────────────
  | "protected_branch_merge"
  | "production_requires_human_confirmation"
  | "test_integrity"
  | "open_pr"
  // ── the legacy-grade arm: the OTHER half of the retired `autonomy` scalar (D-06) ───────────
  | "commit_to_branch"
  // ── the tag arm: the ids carried by tagged workflow `## Stop conditions` bullets (D-01) ────
  | "proceed_past_blocked_risk"
  | "sign_off_acceptance"
  | "escalate_stale_blocker"
  | "exceed_wip_limit"
  | "decide_accessibility_exception"
  | "exhaust_self_fix_budget"
  | "override_finding_severity"
  | "escalate_unadjudicable_result"
  | "accept_human_only_failure";

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
} as const satisfies Record<Checkpoint, Disposition>;

/**
 * The roster, DERIVED. Never a second array literal of checkpoint ids (D-01).
 *
 * Iteration order is the declaration order of `CHECKPOINT_DEFAULTS` and nothing else declares it.
 * Consumers that COMPARE sets must sort both sides first, so that ordering can never change a
 * verdict — see `sortedIds()`.
 */
export const CHECKPOINTS = Object.keys(CHECKPOINT_DEFAULTS) as readonly Checkpoint[];

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
export const STRICTEST_MATRIX: Readonly<Record<Checkpoint, Disposition>> = Object.freeze(
  Object.fromEntries(CHECKPOINTS.map((id) => [id, "block"])) as Record<Checkpoint, Disposition>,
);

/** The canonical spellings of `Disposition`, derived from nothing else and used by the validator. */
export const DISPOSITIONS: readonly Disposition[] = ["block", "notify", "off"];

// ─────────────────────────────────────────────────────────────────────────────────────────────
// THE GRANT — the one variable a human sets to authorize something, read by one hook.
// ─────────────────────────────────────────────────────────────────────────────────────────────
//
// WHAT IS LEFT, AND WHY IT IS ONE NAME (33.1 D-17, D-24, D-26). One grant survives: the admission
// approval. `hooks/admission-guard.ts` imports its name from here and reads it with `grantedBy` from
// its OWN process environment on every gated admission, so an agent's `export` in a child shell never
// reaches it. Its behaviour is unchanged by Phase 33.1 (D-24).
//
// WHAT WAS RETIRED. The grant vocabulary used to hold more members: a per-action production-deploy
// approval, and a per-floor family of session variables that authorized lowering a floor checkpoint
// (the two-key rule), plus a table, a pattern and a predicate over all of them. Their only runtime
// reader was the Bash command guard. That guard was retired in Phase 33.1 (D-17), and the deploy
// approval and the whole floor family went with it (D-17, D-26). No hook reads a checkpoint cell now.

/** The environment shape `grantedBy` reads. Narrower than `process.env`, so a test can pass a literal. */
export type EnvLike = Readonly<Record<string, string | undefined>>;

/** The human-admission approval. `hooks/admission-guard.ts` imports this rather than spelling it. */
export const ADMISSION_APPROVAL_ENV_VAR = "GRUGOPS_ADMISSION_APPROVED_BY" as const;

/**
 * Read a grant out of an environment: the human's NAME, or `null` when nobody is named.
 *
 * WHY IT TRIMS (plan 30-11, finding A-4). A presence test of `raw.length > 0` once let a grant of a
 * single space authorize, attributed to a name that renders as nothing. The value of a grant is the
 * human's name; that is its entire content and the whole reason the record exists. A value that names
 * nobody is not a grant: surrounding whitespace is dropped, and a value that is empty after trimming
 * authorizes nothing.
 */
export function grantedBy(env: EnvLike, name: string): string | null {
  const raw = env[name];
  if (typeof raw !== "string") return null;
  const named = raw.trim();
  return named.length > 0 ? named : null;
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
export function canonicalizeDisposition(raw: unknown): Disposition {
  if (raw === "block") return "block";
  if (raw === "notify") return "notify";
  if (raw === "off") return "off";
  return "block";
}

/** Sorted copy of an id list, so a set comparison cannot be decided by iteration order. */
export function sortedIds(ids: readonly string[]): readonly string[] {
  return [...ids].sort();
}

// ─────────────────────────────────────────────────────────────────────────────────────────────
// THE DERIVATION (plan 30-04 — D-01, D-02, D-03, AUTO-01).
// ─────────────────────────────────────────────────────────────────────────────────────────────
//
// WHY NOTHING BELOW RUNS AT MODULE LOAD. `hooks/admission-guard.js` imports this module on EVERY
// gated admission call. A derivation at module scope would read nineteen kit files per call and, worse,
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
export const CHECKPOINT_TAG_RE = new RegExp(
  "^[ \\t]*[-*][ \\t]+\\S.*[ \\t]" +
    BACKTICK +
    TAG_KEYWORD +
    ": ([a-z][a-z0-9]*(?:_[a-z0-9]+)*)" +
    BACKTICK +
    "$",
);

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

/** Where one tag was found: the workflow file's name and its 1-based line number. */
export interface CheckpointSite {
  readonly file: string;
  readonly line: number;
}

/** What one walk of the tag corpus produced. */
export interface CheckpointDerivation {
  /** The distinct ids found, sorted. */
  readonly ids: readonly string[];
  /** id → every site that declares it, in corpus order. */
  readonly sites: ReadonlyMap<string, readonly CheckpointSite[]>;
  /** How many sites in total — the sum of the map's list lengths. */
  readonly totalSites: number;
  /** Bullets the COLLECTING walk examined. */
  readonly examinedBullets: number;
  /** Bullets a SECOND, independent pass counted. Equal to `examinedBullets` or the walk is refused. */
  readonly countedBullets: number;
  /** How many `## Stop conditions` sections were located. */
  readonly sectionsFound: number;
  /** How many workflow files the lister returned. */
  readonly filesWalked: number;
}

/** Thrown by every refusal in this derivation, so a caller can tell it from an I/O failure. */
export class CheckpointDerivationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CheckpointDerivationError";
  }
}

/**
 * The count equality, as its own exported function so a test can drive it with a PLANTED
 * disagreement. An assertion that is only ever reached in the passing state is not an assertion.
 */
export function assertBulletCount(examined: number, counted: number, where: string): void {
  if (examined !== counted) {
    throw new CheckpointDerivationError(
      `checkpoints: the tag walk examined ${examined} stop bullet(s) in ${where} while an ` +
        `independent pass counted ${counted}. The two numbers come from different traversals ` +
        `precisely so a silently SHORT walk disagrees with the count instead of reporting a clean ` +
        `run over the bullets it never reached`,
    );
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
export function deriveCheckpoints(root: string = DEFAULT_ROOT): CheckpointDerivation {
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
    throw new CheckpointDerivationError(
      `checkpoints: ${WORKFLOWS_SUBPATH} carries ${unadmitted.length} entr(ies) the workflow corpus ` +
        `does not admit — ${unadmitted.join(", ")}. A stop declared in a file the corpus rule drops ` +
        `is walked by nothing: it has no roster member, no config cell and no enforcement, and no ` +
        `cardinality anywhere can see that it is missing. Rename it into the numbered corpus, move ` +
        `it out of the workflows directory, or add it to WORKFLOW_DIR_EXEMPT in scripts/kit-model.ts ` +
        `with a reason`,
    );
  }

  const sites = new Map<string, CheckpointSite[]>();
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
      throw new CheckpointDerivationError(
        `checkpoints: ${file} carries ${occurrences.length} \`${WORKFLOW_STOP_HEADING}\` ` +
          `sections (lines ${occurrences.map((i) => i + 1).join(", ")}). The tag corpus is ONE ` +
          `stop section per workflow: only the first is located, so a bullet in any later one is ` +
          `neither collected nor refused nor counted, and a tag written there would declare a stop ` +
          `nothing governs. Merge the sections rather than repeating the heading`,
      );
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
      throw new CheckpointDerivationError(
        `checkpoints: ${file} carries ${imitations.length} heading(s) that RENDER as ` +
          `\`${WORKFLOW_STOP_HEADING}\` but are not spelled as it (lines ` +
          `${imitations.map((i) => i + 1).join(", ")}): ` +
          `${imitations.map((i) => JSON.stringify(text.split("\n")[i])).join(", ")}. A reader sees ` +
          `a stop section there and the corpus does not, so a tag written under one declares a stop ` +
          `nothing governs. The canonical spelling is the only one this corpus admits — write the ` +
          `heading exactly, rather than widening what counts as it`,
      );
    }
    const range = locateSection(text, WORKFLOW_STOP_HEADING);
    if (range === null) {
      throw new CheckpointDerivationError(
        `checkpoints: ${file} carries no \`${WORKFLOW_STOP_HEADING}\` section. The tag corpus is ` +
          `every workflow's stop section, so a workflow without one is a hole in the corpus and is ` +
          `refused rather than skipped — a skipped file lowers the count silently`,
      );
    }
    sectionsFound += 1;

    const lines = text.split("\n");
    const flags = fencedLineFlags(text);
    // `locateSection` answers in 1-based inclusive line numbers, so `range.from` is the heading's
    // own line number and the section BODY is the 0-based index range [range.from, range.to).
    const inSection = (i: number): boolean => i >= range.from && i < range.to;

    // ── PASS A — the collecting walk ────────────────────────────────────────────────────────
    for (let i = range.from; i < range.to; i++) {
      if (flags[i]) continue;
      const line = lines[i];
      const lineNo = i + 1;
      const isBullet = STOP_BULLET_RE.test(line);
      if (isBullet) examinedBullets += 1;
      if (!CHECKPOINT_KEYWORD_RE.test(line)) continue;

      const mentions = line.split(new RegExp(TAG_KEYWORD, "gi")).length - 1;
      if (mentions !== 1) {
        throw new CheckpointDerivationError(
          `checkpoints: ${file} line ${lineNo} mentions the tag keyword ${mentions} times. One ` +
            `bullet declares at most one checkpoint; two tags on one bullet is two declarations of ` +
            `a stop and is refused rather than resolved by taking the last one`,
        );
      }
      const m = line.match(CHECKPOINT_TAG_RE);
      if (m === null) {
        throw new CheckpointDerivationError(
          `checkpoints: ${file} line ${lineNo} mentions the tag keyword but is not the canonical ` +
            `form \`- <sentence>. ${BACKTICK}${TAG_KEYWORD}: <snake_case_id>${BACKTICK}\` — ` +
            `${JSON.stringify(line.trim())}. The pattern is an allow-list: the BULLET takes the ` +
            `canonical form, the pattern is never widened to accept the bullet`,
        );
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
    throw new CheckpointDerivationError(
      `checkpoints: the tag walk found no tagged stop bullets across ${examinedBullets} bullet(s) ` +
        `in ${files.length} workflow file(s). An empty derived set would make the two-sided ` +
        `roster comparison report every roster member as unsupported, or — read the other way — ` +
        `would let a roster of anything at all pass against a corpus that declares nothing. It is ` +
        `refused, never returned as an empty set`,
    );
  }

  let totalSites = 0;
  for (const list of sites.values()) totalSites += list.length;

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
export function checkpointSites(
  root: string = DEFAULT_ROOT,
): ReadonlyMap<string, readonly CheckpointSite[]> {
  return deriveCheckpoints(root).sites;
}

// ─────────────────────────────────────────────────────────────────────────────────────────────
// Arm three — the legacy grade table (D-06).
// ─────────────────────────────────────────────────────────────────────────────────────────────

/** The retired `autonomy` scalar's three grades. */
export type LegacyAutonomyGrade = "diff" | "branch" | "pr";

/** The two checkpoints the retired grade split into. */
export type LegacyGradeCheckpoint = "commit_to_branch" | "open_pr";

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
} as const satisfies Record<LegacyAutonomyGrade, Record<LegacyGradeCheckpoint, Disposition>>;

/**
 * Arm three's ids, DERIVED from the table's rows rather than listed beside it. Adding a checkpoint
 * to the legacy mapping puts it in the derived set automatically; listing them here as well would
 * be the second declaration this whole module exists to refuse.
 */
export function legacyGradeCheckpoints(): readonly string[] {
  const ids = new Set<string>();
  for (const row of Object.values(LEGACY_AUTONOMY_GRADES)) {
    for (const id of Object.keys(row)) ids.add(id);
  }
  return [...ids].sort();
}

// ─────────────────────────────────────────────────────────────────────────────────────────────
// The three-arm union and the TWO-SIDED comparison.
// ─────────────────────────────────────────────────────────────────────────────────────────────

/** The full derived checkpoint set: the tag arm ∪ the floor arm ∪ the legacy arm, sorted. */
export function derivedCheckpointSet(root: string = DEFAULT_ROOT): readonly string[] {
  const ids = new Set<string>(deriveCheckpoints(root).ids);
  for (const f of SAFETY_FLOORS) ids.add(f.id);
  for (const id of legacyGradeCheckpoints()) ids.add(id);
  return [...ids].sort();
}

/** The result of comparing the derived set against the exported roster. */
export interface RosterComparison {
  readonly ok: boolean;
  /** In the roster, produced by no arm. */
  readonly rosterOnly: readonly string[];
  /** Produced by an arm, absent from the roster. */
  readonly corpusOnly: readonly string[];
  /** One message per non-empty direction. The two directions never share wording. */
  readonly failures: readonly string[];
}

/**
 * Compare the derived set against the roster in BOTH directions.
 *
 * THE TWO DIRECTIONS ARE DIFFERENT FAULTS AND GET DIFFERENT MESSAGES. A roster-only id is a
 * checkpoint the kit no longer declares anywhere — a config cell with nothing behind it. A corpus-only id is a stop somebody tagged that the matrix has never heard of, so it
 * has no default, no cell and no enforcement. Collapsing them into one "sets differ" line would
 * hand a reader the symptom and withhold which of the two repairs to make.
 *
 * Both directions are reported when both are non-empty, rather than the first one found: reporting
 * one at a time turns a single wrong edit into two red runs.
 */
export function compareRosterToDerivation(
  derived: readonly string[],
  roster: readonly string[],
): RosterComparison {
  const d = new Set(derived);
  const r = new Set(roster);
  const rosterOnly = [...r].filter((id) => !d.has(id)).sort();
  const corpusOnly = [...d].filter((id) => !r.has(id)).sort();
  const failures: string[] = [];
  if (rosterOnly.length > 0) {
    failures.push(
      `checkpoints: the roster declares ${rosterOnly.length} id(s) that NO arm of the derivation ` +
        `produces — [${rosterOnly.join(", ")}]. A roster member nothing declares is a config cell ` +
        `with no stop behind it. Either tag the bullet, add the floor, or ` +
        `remove the member`,
    );
  }
  if (corpusOnly.length > 0) {
    failures.push(
      `checkpoints: the derivation produces ${corpusOnly.length} id(s) the roster does not admit ` +
        `— [${corpusOnly.join(", ")}]. A declared stop that is not a roster member has no default, ` +
        `no config cell and no enforcement, so it reads as governed while being governed by nothing`,
    );
  }
  return { ok: failures.length === 0, rosterOnly, corpusOnly, failures };
}

/** Compare the live corpus against the live roster, throwing with every direction's message. */
export function assertRosterMatchesDerivation(root: string = DEFAULT_ROOT): void {
  const c = compareRosterToDerivation(derivedCheckpointSet(root), CHECKPOINTS);
  if (!c.ok) throw new CheckpointDerivationError(c.failures.join("\n"));
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
} as const satisfies Record<Checkpoint, number>;

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
export function assertSiteCounts(
  sites: ReadonlyMap<string, readonly CheckpointSite[]>,
  recorded: Readonly<Record<string, number>>,
): void {
  const problems: string[] = [];
  for (const [id, want] of Object.entries(recorded)) {
    const got = sites.get(id)?.length ?? 0;
    if (got !== want) {
      problems.push(
        `${id}: recorded ${want} site(s), derived ${got}` +
          (got === 0 ? " (no bullet in the corpus carries this tag)" : ""),
      );
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
    throw new CheckpointDerivationError(
      `checkpoints: the derived id→sites map disagrees with the recorded site counts — ` +
        problems.join("; ") +
        `. A tag added or removed anywhere is meant to land here rather than pass silently (D-03)`,
    );
  }
}

/**
 * The FULL-CARDINALITY anchors, for the live tree only.
 *
 * Kept out of `deriveCheckpoints` on purpose: that function must run over a two-file fixture, and a
 * derivation that refused anything other than nineteen sections could never be driven by a probe.
 * The cardinality question belongs to the LIVE corpus and is asked of it by name.
 */
export function assertLiveCorpusCardinality(d: CheckpointDerivation): void {
  if (d.sectionsFound !== d.filesWalked) {
    throw new CheckpointDerivationError(
      `checkpoints: located ${d.sectionsFound} stop section(s) across ${d.filesWalked} workflow ` +
        `file(s) — every workflow owes one`,
    );
  }
  if (d.countedBullets !== WORKFLOW_STOP_BULLET_COUNT) {
    throw new CheckpointDerivationError(
      `checkpoints: the live stop corpus holds ${d.countedBullets} bullet(s) against the recorded ` +
        `${WORKFLOW_STOP_BULLET_COUNT}. Enforcement is two-sided: a bullet added or deleted anywhere ` +
        `lands here, and bumping the anchor obliges a re-walk of the tagging list`,
    );
  }
}

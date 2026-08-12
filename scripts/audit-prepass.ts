// audit-prepass.ts — the D-06 mechanical evidence pre-pass over the Phase 28 audit set (AUDIT-01).
//
//   node scripts/audit-prepass.js     # writes docs/audit/28-prepass-evidence.md
//
// EXIT-CODE CONTRACT, AND IT IS NOT A GATE'S. This is a REPORTER. It exits 0 whether it emits
// thirty evidence rows or none — finding evidence is its JOB, not a failure. The only things that
// make it exit non-zero are refusals to report at all: a missing file in the audit set, a derived
// set that does not match its pinned cardinality, or a lister that threw. Wiring this into CI as a
// pass/fail gate would be a category error; it is wired as `npm run audit:prepass` and its OUTPUT is
// the artifact.
//
// Node stdlib ONLY — node:fs + node:path. Zero npm dependencies.
//
// Clear professional voice throughout (CLAUDE.md hard rule — this is a quality/trace surface).
//
// ---------------------------------------------------------------------------------------------
// WHAT THIS FILE IS FOR, AND THE THING IT MUST NEVER BE MISTAKEN FOR.
//
// D-06 requires the read pass to be a re-runnable mechanical pre-pass UNDER a full human-equivalent
// read — never instead of one. This module is the mechanical half. It exists because an inline-only
// read leaves nothing re-runnable, so a regression AFTER the audit would be invisible; the evidence
// file it writes survives the phase precisely so a later `diff` has something to compare against.
// That `diff` is a MANUAL act by a reader, and the artifact is a DATED point-in-time record that
// nothing gates — see renderEvidence's note for why gating it was considered and declined, and for
// the one line a reader must discount before treating a divergence as a tree change (28-REVIEW
// WR-04).
//
// AN ABSENCE OF MECHANICAL HITS IS NOT A VERDICT OF CORRECT. The predicates below are greppable and
// the D-07 rubric is not. Category 1 asks whether a file describes the architecture that actually
// ships; category 6 asks whether two agents reading a step would reach the same act. No regular
// expression answers either. A file that produces zero rows here has been measured against four
// narrow mechanical questions and against nothing else, and the register's `observation` column
// exists to carry what a reader found — which is why a row whose observation is only a mechanical
// hit is not a completed row, and why the gate refuses an observation that says nothing.
//
// THIS MODULE READS scripts/dead-vocabulary.ts; IT DOES NOT CONSUME IT AS A GUARD. That list has
// exactly three ENFORCEMENT consumers — check-kit-refs Assertion 2 (path form, shipped kit),
// guard_adapter_body (prose forms, adapter bodies), and check-public-docs-vocabulary (both forms,
// public documents). This is a fourth READ and not a fourth consumer: nothing here fails a build,
// and a hit becomes a row a human adjudicates. A later editor counting enforcement consumers must
// not count this file among them, and a later editor tempted to make this file fail red should
// instead ask which of the three existing gates should have covered the surface.
// ---------------------------------------------------------------------------------------------

import { readFileSync, existsSync, writeFileSync, mkdirSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { pathToFileURL } from "node:url";
import {
  listRoles,
  listWorkflows,
  ROLE_COUNT,
  WORKFLOW_COUNT,
} from "./kit-model.js";
// READ, not consumed as a guard — see the module header. Both arrays are taken whole; neither is
// filtered, sliced or re-declared here.
import { RETIRED_PATH_FORMS, RETIRED_PROSE_FORMS } from "./dead-vocabulary.js";

// CHECK_ROOT override is load-bearing: the Vitest harness synthesizes a hermetic mirror and points
// CHECK_ROOT at it, then spawns this committed .js against the mirror.
const ROOT = process.env.CHECK_ROOT
  ? process.env.CHECK_ROOT
  : join(import.meta.dirname, "..");

const ROLES_SUBPATH = "agent-factory/roles";
const WORKFLOWS_SUBPATH = "agent-factory/workflows";

// The D-02 protocol file, as a LITERAL with its reason.
//
// listRoles() drops underscore-prefixed entries by derivation, which is exactly what makes the role
// count 17 rather than 18. That derivation is correct and is not being worked around: the file is
// OUT-OF-SET FOR COUNTING and IN-SET FOR READING. It is read because docs/design/shared-install.md
// records that its step 4 demanded a handoff file under agent-factory/handoffs/ — an artifact
// Phase 24 deleted — which makes it one of the likeliest drift carriers in the tree. Dropping it
// silently is the exact failure shape this project keeps hitting.
//
// It is also the ONLY hand-listed member of the audit set, and therefore the only member the
// missing-file check below can ever fire on. Every other member is derived, and a derived member
// that vanishes does not go "missing" — it stops being enumerated, which is a COUNT failure. The
// two mechanisms answer different questions and neither is redundant.
export const PROTOCOL_FILE = "agent-factory/roles/_role-switch-protocol.md";

// The pinned cardinality of the audit set.
//
// DERIVED FROM THE PINNED CONSTANTS, NOT FROM THE LIVE DERIVATION. `live.length === live.length`
// would be a floor written over the wrong quantity, and a floor over the wrong quantity is worse
// than no floor because the phase counts it as present while it can never fire (the correction
// recorded in check-foundation-guards.ts's adapter-body floor). ROLE_COUNT and WORKFLOW_COUNT are
// literals guard_kit_counts already holds against the live tree, so comparing the live derivation
// against them is a real two-sided check: delete a role and this fires at 36 against 37.
export const AUDIT_SET_COUNT = ROLE_COUNT + WORKFLOW_COUNT + 1;

// The generated artifact. A FIXED LITERAL joined onto ROOT, following the posture
// scripts/generate-catalog.ts takes for its OUT (ASVS V12): the root is redirected under a mirror,
// the path literal never is, and neither is ever taken from argv, env or file content.
export const EVIDENCE_PATH = "docs/audit/28-prepass-evidence.md";

// ---------------------------------------------------------------------------
// The derived audit set.
// ---------------------------------------------------------------------------

/**
 * The 37 repo-relative paths this phase audits: `listRoles()` and `listWorkflows()` prefixed back
 * to repo-relative form at the CALL SITE, plus the one protocol literal.
 *
 * The prefix is applied here rather than by changing either authority's pinned return shape for one
 * consumer — the rule check-kit-refs records at its own marker-site set.
 *
 * A `/` TEMPLATE AND NOT `join()`, AND THE RATIONALE USED TO SAY THE OPPOSITE (28-REVIEW WR-03).
 * The comment here read "`join()` and not a `/` template, so the paths are byte-identical on Windows
 * and on Unix", which is backwards: `path.join` emits `\` on win32 and `/` on posix, and a `/`
 * template is what is byte-identical. Concretely, on Windows this function returned
 * `agent-factory\roles\x.md` for its DERIVED members and `agent-factory/roles/_role-switch-
 * protocol.md` for PROTOCOL_FILE — a `/` literal twenty lines up — so one array carried two path
 * forms.
 *
 * These are repo-relative POSIX paths that must be byte-identical across platforms for two concrete
 * reasons: they land in a COMMITTED artifact (docs/audit/28-prepass-evidence.md), and they are
 * set-compared against check-audit-register.ts's own derivation, which builds the same paths with a
 * `/` template. Two Phase-28 modules disagreeing about path form on Windows is a difference that
 * would surface as a spurious set-equality failure rather than as a path bug.
 */
export function auditSetFiles(root: string = ROOT): string[] {
  const roles = listRoles(root).map((f) => `${ROLES_SUBPATH}/${f}`);
  const workflows = listWorkflows(root).map((f) => `${WORKFLOWS_SUBPATH}/${f}`);
  return [...roles, ...workflows, PROTOCOL_FILE];
}

// ---------------------------------------------------------------------------
// The predicate table.
// ---------------------------------------------------------------------------

/** Everything a predicate needs to adjudicate a candidate against the live tree. */
export interface PrepassContext {
  readonly root: string;
  /** Bare `*.md` names that legitimately resolve somewhere in the kit. */
  readonly legalBareNames: ReadonlySet<string>;
}

export interface PrepassPredicate {
  readonly id: string;
  readonly label: string;
  /** Candidate extractor, applied per line. Every match is a CANDIDATE, not yet a hit. */
  readonly re: RegExp;
  /** What this predicate can and cannot see, in plain words. Printed into the evidence file. */
  readonly what: string;
  /** A line this predicate hits and no other predicate hits. Asserted in the test suite. */
  readonly fixture: string;
  /** Adjudicator. Absent means every candidate is a hit. */
  readonly isHit?: (candidate: string, ctx: PrepassContext) => boolean;
}

function escapeLiteral(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// The retired-vocabulary alternation, built from the ONE list. No literal is retyped here.
const RETIRED_ALTERNATION = [...RETIRED_PATH_FORMS, ...RETIRED_PROSE_FORMS]
  .map(escapeLiteral)
  .join("|");

// A reference candidate: either a slashed repo-relative path with a known extension, or a bare
// `*.md` filename. Both are adjudicated against the live tree by `isHit` below.
const REFERENCE_RE = new RegExp(
  "(?:[A-Za-z0-9._-]+/)+[A-Za-z0-9._-]+\\.(?:md|ts|js|json|ya?ml)" +
    "|(?<![A-Za-z0-9._/-])[A-Za-z0-9._-]+\\.md",
  "g",
);

export const PREPASS_PREDICATES: readonly PrepassPredicate[] = [
  {
    id: "retired-vocabulary",
    label: "Retired grugops vocabulary",
    re: new RegExp(RETIRED_ALTERNATION, "gi"),
    what:
      "Sees the exact literals scripts/dead-vocabulary.ts declares retired, case-insensitively. " +
      "It CANNOT see a passage that describes the deleted relay in words the list does not carry, " +
      "and it cannot tell a retired phrase quoted as history from one asserted as current.",
    fixture: "A handoff packet carries the memory between roles.",
  },
  {
    id: "unresolvable-reference",
    label: "References that do not resolve on disk",
    re: REFERENCE_RE,
    what:
      "Sees slashed repo-relative paths and bare `*.md` filenames, and adjudicates each against " +
      "the live tree. It CANNOT see a CONFIG-KEY reference: there is no non-heuristic way to tell " +
      "a config key from any other snake_case word in prose, so config keys are adjudicated by the " +
      "reader during the D-06 read rather than guessed at here. It also cannot see a reference " +
      "that resolves to the wrong file, only one that resolves to no file.",
    fixture: "See agent-factory/roles/does-not-exist.md for details.",
    isHit: (candidate, ctx): boolean => {
      if (candidate.includes("/")) return !existsSync(join(ctx.root, candidate));
      return !ctx.legalBareNames.has(candidate);
    },
  },
  {
    id: "stale-count-or-version",
    label: "Numeric claims about the kit's size, and version strings",
    re: /\b\d+\s+(?:roles?|workflows?|checklists?|adapters?|skills?|templates?|agents?|gates?)\b|\bv?\d+\.\d+(?:\.\d+)?\b/g,
    what:
      "Sees a number adjacent to a kit noun, and anything shaped like a version. It CANNOT tell a " +
      "stale count from a correct one — resolving that is the reader's job, and it is exactly the " +
      "kind of claim a grep must hand to a human rather than settle.",
    fixture: "The kit ships 18 roles today.",
  },
  {
    id: "unknown-verify",
    label: "`UNKNOWN - verify` markers",
    re: /UNKNOWN\s*-\s*verify/g,
    what:
      "Sees the project's standing honesty marker. It CANNOT tell a marker that is still genuinely " +
      "unknown from one whose question was answered without the marker being cleared, which is the " +
      "only reason these are worth listing.",
    fixture: "The command is UNKNOWN - verify before use.",
  },
];

export const PREPASS_PREDICATE_COUNT = 4;

/** Build the adjudication context: the legal bare `*.md` names, derived from the live tree. */
export function buildPrepassContext(root: string = ROOT): PrepassContext {
  const legal = new Set<string>();
  // Derived from the tree rather than from a hard-coded list of legal names: a new checklist enters
  // this set by existing. Directories that are absent contribute nothing rather than throwing —
  // this is an adjudication aid, and the audit set's own membership is pinned elsewhere.
  const dirs = [
    ROLES_SUBPATH,
    WORKFLOWS_SUBPATH,
    "agent-factory/checklists",
    "agent-factory/packaging",
    "agent-factory/contracts",
    "agent-factory/templates",
    "agent-factory/config",
    "examples",
    "docs",
  ];
  for (const d of dirs) {
    const abs = join(root, d);
    if (!existsSync(abs)) continue;
    for (const entry of readdirSync(abs)) {
      if (entry.endsWith(".md")) legal.add(entry);
    }
  }
  for (const entry of readdirSync(root)) {
    if (entry.endsWith(".md")) legal.add(entry);
  }
  return { root, legalBareNames: legal };
}

/**
 * The candidates on `line` that this predicate considers HITS.
 *
 * A fresh RegExp is constructed per call rather than reusing the table's own object: a `g`-flagged
 * regex carries `lastIndex` across calls, so a shared instance would make the result depend on
 * which line was scanned previously. Two runs over one tree must be byte-identical.
 */
export function predicateHits(
  predicate: PrepassPredicate,
  line: string,
  ctx: PrepassContext,
): string[] {
  const re = new RegExp(predicate.re.source, predicate.re.flags);
  const matched = line.match(re) ?? [];
  const decide = predicate.isHit ?? ((): boolean => true);
  return matched.filter((c) => decide(c, ctx));
}

// ---------------------------------------------------------------------------
// The run.
// ---------------------------------------------------------------------------

export interface PrepassResult {
  /** `path:lineno:label:line`, ordered by file in the derived order, then by line number. */
  readonly rows: readonly string[];
  /** Reasons this run declined to report. Non-empty means a non-zero exit. */
  readonly refusals: readonly string[];
  readonly files: readonly string[];
  /** Row counts per predicate id, including the zero ones. */
  readonly perPredicate: ReadonlyMap<string, number>;
}

export function runPrepass(root: string = ROOT): PrepassResult {
  const refusals: string[] = [];
  const rows: string[] = [];
  const perPredicate = new Map<string, number>(PREPASS_PREDICATES.map((p) => [p.id, 0]));

  let files: string[] = [];
  try {
    files = auditSetFiles(root);
  } catch (e) {
    // kit-model is a library and throws on an unreadable or vacuous directory. This is a reporter,
    // so the throw is RECORDED and turned into a refusal rather than allowed to abort — the
    // throw-versus-report split kit-model documents against its install/kit-source.ts twin.
    refusals.push(`the audit set could not be derived — ${(e as Error).message}`);
    return { rows, refusals, files, perPredicate };
  }

  // THE MISSING-FILE CHECK RUNS FIRST, BEFORE ANY PREDICATE SEES ANY LINE. Without it a deleted
  // file reads as a file with no findings, which is the exact opposite of what it is — and "no
  // findings" is the single most consequential thing this artifact can say wrongly.
  for (const f of files) {
    if (!existsSync(join(root, f))) {
      refusals.push(
        `${f} is in the audit set but does not exist on disk — refusing to run any predicate. A ` +
          `missing file that is scanned anyway produces ZERO evidence rows, which is indistinguishable ` +
          `from a file that was read and found clean`,
      );
    }
  }
  if (refusals.length > 0) return { rows, refusals, files, perPredicate };

  // THE PINNED CARDINALITY, two-sided against kit-model's own constants.
  if (files.length !== AUDIT_SET_COUNT) {
    refusals.push(
      `the derived audit set holds ${files.length} file(s), expected exactly ${AUDIT_SET_COUNT} ` +
        `(ROLE_COUNT ${ROLE_COUNT} + WORKFLOW_COUNT ${WORKFLOW_COUNT} + 1 protocol file) — walk ` +
        `scripts/kit-model.ts's counts and the disposition register's Table A BEFORE treating this ` +
        `as a pin to move. An audit set that silently shrank reports clean evidence over the files ` +
        `it stopped reading`,
    );
    return { rows, refusals, files, perPredicate };
  }

  const ctx = buildPrepassContext(root);

  // Deterministic by construction: files in the DERIVED order (both listers `.sort()` before
  // returning), lines in file order, predicates in table order — so `runPrepass()`'s ROWS are
  // byte-identical across two runs over one tree.
  //
  // THE CLAIM APPLIES TO THE ROWS AND NOT TO THE RENDERED ARTIFACT (28-REVIEW WR-04). This comment
  // used to end "…so a diff of the committed evidence means a real change in the tree", which is
  // false as written: `renderEvidence` stamps `- **Generated:** <date>` from `new Date()`, so two
  // runs on different days differ regardless of the tree. See renderEvidence's own note for the
  // rest of the honest statement.
  for (const f of files) {
    const lines = readFileSync(join(root, f), "utf8").split("\n");
    for (let i = 0; i < lines.length; i++) {
      for (const p of PREPASS_PREDICATES) {
        const hits = predicateHits(p, lines[i], ctx);
        if (hits.length === 0) continue;
        // One row per LINE per predicate — a line carrying two candidates for one predicate is one
        // place a reader has to look, and the candidates are named inside the row.
        perPredicate.set(p.id, (perPredicate.get(p.id) ?? 0) + 1);
        rows.push(`${f}:${i + 1}:${p.id}:${lines[i]}`);
      }
    }
  }

  return { rows, refusals, files, perPredicate };
}

// ---------------------------------------------------------------------------
// The generated artifact.
// ---------------------------------------------------------------------------

/**
 * WHAT THE COMMITTED ARTIFACT IS, AND WHAT IT IS NOT (28-REVIEW WR-04).
 *
 * IT IS A POINT-IN-TIME RECORD, NOT A LIVE INVARIANT. It is the mechanical half of the D-06 read
 * pass as it stood on the stamped date, under a human-equivalent read that happened once. That is
 * why the date is stamped and why the date is not a defect.
 *
 * IT IS THEREFORE NOT DETERMINISTIC AND NOT FRESHNESS-GATED, and both facts are stated here rather
 * than implied away:
 *
 *   * NOT DETERMINISTIC. `- **Generated:**` comes from `new Date()`, so two runs on different days
 *     differ regardless of the tree. `runPrepass()`'s ROWS are deterministic; this rendering is not.
 *     A `diff` of the committed evidence is evidence of a tree change only once that line is
 *     discounted.
 *   * NOT FRESHNESS-GATED, DELIBERATELY. Unlike docs/audit/28-safety-surface-exclusions.md — whose
 *     freshness IS folded into check-audit-register — nothing reds when this file drifts from the
 *     tree, and it has drifted (measured 2026-08-12: the committed rows still quote kit prose that a
 *     later plan rewrote). Gating it was CONSIDERED AND DECLINED. Phase 29 rewrites this very prose
 *     for a living, so a freshness gate would red on every unrelated edit — the failure mode that
 *     trains people to ignore a red gate — and the only way to clear it would be to regenerate rows
 *     that NOBODY ADJUDICATED and publish them as the evidence for a read that did not re-happen.
 *     That is fabricating evidence, which is worse than a stale record honestly labelled.
 *
 * A reader comparing this artifact against the live tree must therefore treat a divergence as
 * "the tree moved since the read", never as "the pre-pass is broken". `UNKNOWN - verify` whether a
 * future phase wants a re-run; if it does, the answer is a NEW dated artifact, not a gate over this
 * one.
 */
function renderEvidence(result: PrepassResult, today: string): string {
  const out: string[] = [];
  out.push("# Phase 28 mechanical pre-pass evidence (AUDIT-01 / D-06)");
  out.push("");
  out.push("> **GENERATED — do not hand-edit.** Regenerate with:");
  out.push(">");
  out.push("> ```");
  out.push("> node scripts/audit-prepass.js");
  out.push("> ```");
  out.push("");
  out.push(`- **Generated:** ${today}`);
  out.push(`- **Audit set:** ${result.files.length} file(s) (pinned at ${AUDIT_SET_COUNT})`);
  out.push(
    `- **Predicates:** ${PREPASS_PREDICATES.length} (pinned at ${PREPASS_PREDICATE_COUNT}) — ` +
      `${PREPASS_PREDICATES.map((p) => `\`${p.id}\``).join(", ")}`,
  );
  out.push(`- **Total evidence rows:** ${result.rows.length}`);
  out.push("");
  out.push("## This file is evidence, and it is not a verdict");
  out.push("");
  out.push(
    "Every row below is a mechanical hit a human still has to adjudicate. A row is not a finding " +
      "until a reader says it is, and a file with **no rows here has not been found correct** — it " +
      "has been measured against four narrow greppable questions and against nothing else.",
  );
  out.push("");
  out.push(
    "The D-07 rubric asks things no regular expression answers: whether a file describes the " +
      "architecture that actually ships, and whether two agents reading a step would reach the same " +
      "act. This pre-pass runs **under** a full human-equivalent read, never instead of one. Its " +
      "purpose is to pre-seed that read and to leave something re-runnable behind, so a regression " +
      "after the audit is a `diff` rather than an invisible change.",
  );
  out.push("");
  out.push("## Predicates, and what each one cannot see");
  out.push("");
  out.push("| id | predicate | rows | what it cannot see |");
  out.push("|---|---|---|---|");
  for (const p of PREPASS_PREDICATES) {
    out.push(
      `| \`${p.id}\` | ${p.label} | ${result.perPredicate.get(p.id) ?? 0} | ${p.what} |`,
    );
  }
  out.push("");

  for (const p of PREPASS_PREDICATES) {
    out.push(`## ${p.label} (\`${p.id}\`)`);
    out.push("");
    const rows = result.rows.filter((r) => rowPredicateId(r) === p.id);
    if (rows.length === 0) {
      // A predicate with zero rows is still printed. Silence about a predicate reads as "it found
      // nothing", which is indistinguishable from "it did not run".
      out.push("No rows. This predicate ran over every file in the audit set and matched nothing.");
      out.push("");
      continue;
    }
    out.push("```");
    for (const r of rows) out.push(r);
    out.push("```");
    out.push("");
  }
  return `${out.join("\n")}\n`;
}

// A row is `path:lineno:predicateId:line`. The path may itself contain no colon (repo-relative
// POSIX-joined paths do not), and the predicate id is the third field.
function rowPredicateId(row: string): string {
  return row.split(":")[2] ?? "";
}

function main(): void {
  const result = runPrepass(ROOT);
  if (result.refusals.length > 0) {
    for (const r of result.refusals) {
      process.stdout.write(`  REFUSED  ${r}\n`);
    }
    process.stdout.write(
      `\naudit-prepass: ${result.refusals.length} refusal(s) — no evidence file was written\n`,
    );
    process.exit(1);
  }

  const today = new Date().toISOString().slice(0, 10);
  const out = join(ROOT, EVIDENCE_PATH);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, renderEvidence(result, today), "utf8");

  process.stdout.write(
    `audit-prepass: ${result.rows.length} evidence row(s) across ${result.files.length} file(s) ` +
      `from ${PREPASS_PREDICATES.length} predicate(s) -> ${EVIDENCE_PATH}\n`,
  );
  for (const p of PREPASS_PREDICATES) {
    process.stdout.write(`  ${p.id}: ${result.perPredicate.get(p.id) ?? 0}\n`);
  }
  process.stdout.write(
    "\nThis output is EVIDENCE, not a verdict. A file with zero rows has not been found correct.\n",
  );
  process.exit(0);
}

// Entry check: true only when launched directly. pathToFileURL rather than a hand-built
// `file://${argv[1]}` — the hand-built form does not match on Windows, which would make a direct
// run emit nothing and exit 0, a fabricated green. It is also what lets the test file import the
// exported pins without the import running the pre-pass inside the vitest worker.
const isEntry =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isEntry) {
  main();
}

// board-readonly.test.ts — the board projector CANNOT WRITE, and that is decided by a MECHANISM.
//
// WHY THIS FILE EXISTS. Every comparable tool in this space is a control plane: it reads a board and
// then acts on it. grugops's projector is deliberately not one — it renders state and changes
// nothing — and CLAUDE.md's hard safety rule is that such a property is enforced mechanically rather
// than asserted in a docblock. A sentence saying "this module is read-only" is true until the next
// commit and says nothing afterwards. This file re-decides the property from the bytes on every run.
//
// WHAT IT DECIDES. Four claims, all over the transitive closure of the COMPILED artifact
// `scripts/board-dashboard.js` — the thing a host actually runs, not the `.ts` a reader sees:
//
//   1. No mutating `node:fs` / `node:fs/promises` symbol is reachable from that closure (DASH-06).
//   2. The closure reaches NO BUILTIN outside a named allow-list, which subsumes the socket /
//      process-spawning ban (DASH-08, "no socket") and refuses every other builtin by construction.
//   3. The closure reaches no member path on a capability-bearing global outside a named census —
//      the rule for a capability reached WITHOUT a module at all.
//   4. A module identity is established in this closure by exactly ONE shape, a static import
//      declaration with a string-literal specifier; every other acquisition is refused.
//
// CLAIMS 2, 3 AND 4 WERE ADDED IN 32-20, AND THE REASON IS A MEASUREMENT, NOT A TIDY-UP. Before it,
// claim 2 was a deny-list of fifteen hand-typed names and claims 3 and 4 did not exist. Nine
// distinct ways to reach a file-writing or code-executing capability from inside this closure were
// measured GREEN against the committed `.js` — exit 0, 59 passed / 59 on every one, including an
// ordinary unobfuscated `import { writeHeapSnapshot } from "node:v8"`. The transcripts are in
// `.planning/phases/32-board-projector-cli-dashboard/32-20-RED-baseline.txt`, and the after side,
// with the mutation transcripts that prove each rule decides something, is in `32-20-GREEN-proof.txt`.
//
// BOTH SIDES ARE DERIVED, NOT TYPED OUT. This repository's recorded second systemic failure class is
// a hand-maintained set literal that rots while every gate over it stays green — the spawn defect
// shipped seven granted role names against zero adapter files, and the suite was green throughout
// ([[grugops-set-literal-drift]]). So:
//
//   • the MODULE set comes from `jsImportClosure`, computed from the bytes of the files themselves;
//   • the per-module `node:fs` SYMBOL set comes from the TypeScript AST, the way
//     `scripts/context-io-writer-set.test.ts` derives its note-writer set;
//   • the MUTATING set comes from enumerating the runtime's own `node:fs` exports against the D-21
//     write-class stems.
//
// Only ONE set in this file is hand-named: the three stem false positives, whose cardinality is
// asserted two-sided with a decision-shaped message, so a fourth exclusion is a decision somebody
// makes rather than a constant somebody bumps.
//
// EVERY EMPTINESS CLAIM IS PRECEDED BY A PREMISE. "The intersection is empty" is trivially true of an
// empty closure, and "no banned module is imported" is trivially true of an empty specifier set. This
// repository's history records six instances across four consecutive verification rounds of a harness
// producing a FALSE result because its own premise was never asserted. So the premises here are
// failing assertions carrying a `PREMISE:` message, never assumptions.
//
// WHICH PIN IS THE BLOCKING ONE, AND WHY IT IS NOT THE RUNTIME COUNT. The two-sided pin that can red
// this file is the CLOSURE'S OWN `node:fs` symbol set — the handful of read symbols the dashboard
// actually imports. That number is a function of this repository's code, so no Node upgrade can move
// it. The runtime enumeration's cardinality is a function of the Node version instead: CI pins Node
// 22 and this tree's developer machine is on Node 24, so a bare two-sided pin over it would be red on
// one and green on the other for a reason that has nothing to do with the dashboard — and a pin that
// reds for an unrelated reason gets loosened until it stops noticing. It is therefore PRINTED and
// VERSION-LABELLED on every run and asserted only to be non-empty. A mutating symbol added by a
// future Node still reds this file the moment any closure module imports it, because the closure-side
// intersection is what decides, not the count.
//
// WHAT IT CLOSES BY REFUSAL RATHER THAN BY RECOGNITION (32-11, closing CR-01). An fs namespace
// binding has exactly ONE admitted use: as the object of a member access. Every other read of that
// binding — destructured, aliased, spread, passed as an argument, placed in a literal, re-exported,
// returned from a function — is REFUSED by name as an opaque acquisition, and an fs module identity
// handed as a string-literal argument to ANY call is refused the same way. Before 32-11 the
// destructure in particular was neither recognised nor refused: `import * as fsns from "node:fs";
// const { writeFileSync, rmSync } = fsns;` contributed nothing to either set, and this guard
// reported 24 passed and exit 0 over a module that wrote and deleted files
// (`.planning/phases/32-board-projector-cli-dashboard/32-11-RED-baseline.txt`). The rule is stated
// as the canonical form and the complement is refused, because widening a matcher once per
// counter-example is the failure this repository has paid for twice.
//
// WHAT IT DOES NOT CLOSE — REWRITTEN IN 32-20, AND EVERY BOUNDARY BELOW WAS MEASURED DURING IT
// RATHER THAN REMEMBERED. The list a maintainer inherits is only useful if each line is a thing
// somebody looked at; the two lines this plan CLOSED (the runtime-assembled identity, and a builtin
// outside a deny-list) were deleted from it rather than left standing as folklore.
//
//   • THE DERIVATION IS SYNTACTIC: IT PARSES, IT DOES NOT EXECUTE. What that buys is that the guard
//     runs in under two seconds over the real committed artifact with no sandbox and no side effect,
//     on every commit, which is why it is reachable at all. What it costs is that any route whose
//     identity only exists at RUN time is undecidable here — and the answer to undecidable is
//     REFUSAL, not a cleverer pass (`ModuleFacts.acquisitions`). An aliased re-export of a writer
//     through an intermediate module is named only where a specifier names it.
//   • A WRITER VALUE RECEIVED AT RUNTIME from outside the closure — a callback parameter that
//     happens to be `writeFileSync` — is not decidable syntactically at all. The
//     zero-runtime-dependency assertion in PART SIX and the relative-only closure walk are what
//     bound how such a value could arrive.
//   • THE CAPABILITY-GLOBAL CENSUS IS ROOTED AT THREE IDENTIFIER SPELLINGS (`process`, `globalThis`,
//     `global`). MEASURED THIS PLAN: `import.meta` is a META-PROPERTY rather than an identifier, so
//     a member reached on it is outside this census by construction — and the live closure does
//     reach two (`import.meta.url` in scripts/is-entry.js and scripts/board-dashboard.js,
//     `import.meta.dirname` in scripts/kit-model.js). Both are read-only path plumbing today.
//     `import.meta.resolve` would not be. This is the nearest open edge to the rules 32-20 added.
//   • THE SUBJECT IS THE COMMITTED `.js`. A writer added to a `.ts` and not rebuilt is a program
//     this guard never saw. PART SIX asserts the binding to `check:build-parity`, which is the
//     mechanism that makes the analysed `.js` the same program as its `.ts`.
//   • `open` and `openSync` STAY IN the mutating set. Their write-ness depends on a flag literal and
//     a name-based derivation cannot decide it, so the safe direction for a safety guard is to refuse.
//   • `jsImportClosure` follows RELATIVE specifiers only. A `node_modules` import would be invisible
//     here; this repository ships zero runtime dependencies, which is what makes that acceptable, and
//     the `dependencies === undefined` assertion in this file is what keeps it true.
//
// HOW IT IS REACHED, AND THE ONE DEVIATION THAT BUYS IT — RECORDED SO IT IS A DECISION.
//
// D-21 requires this guard to run in the repository suite AND as a named `check:*` npm script. The
// entry added for it is:
//
//     "check:dashboard-readonly": "npx vitest run scripts/board-readonly.test.ts"
//
// It is the FIRST `check:*` entry in this repository that is not the two-step
// `tsc --outDir .tmp-build && node scripts/<x>.js` shape every other one uses. That is a deviation,
// and the reason is a measurement: the AST derivation above needs `typescript`, and zero of the 25
// committed runnable `scripts/*.ts` files import anything other than a `node:` builtin or a relative
// `./*.js`. All five files in this tree that import `typescript` are `.test.ts`. A runnable
// `scripts/check-dashboard-readonly.ts` importing a devDependency would be the first to break that
// 25-of-25 invariant and the first `check:*` script unrunnable from a checkout.
//
// THE ALTERNATIVE WAS REJECTED, AND THE REJECTION IS THE POINT. The other way to keep the script
// shape is a stdlib-only regex scanner over the compiled closure, kept ALONGSIDE this AST test. That
// would give ONE PREDICATE TWO AUTHORITIES — two implementations of "is this closure read-only",
// free to disagree, each green on its own. That is precisely the Phase 29 failure this repository
// spent five rounds on: LANG-04's enumeration was relocated into a second hand-authored list, and the
// relocated copy passed everything the first one refused. One authority, one implementation. The
// cost is that this check needs `node_modules`, exactly as `npm test` already does.
//
// NO DUPLICATE CI STEP, ALSO BY DECISION. This file already runs in CI through the suite step named
// `Vitest (e2e lane excluded)` (`.github/workflows/ci.yml:173-174`,
// `npx vitest run --exclude '**/scripts/e2e/**'`). A second workflow step invoking
// `npm run check:dashboard-readonly` would run the same file twice and would be the same
// two-authorities smell one level up, in the workflow file. The absence of a named CI step for this
// gate is therefore a recorded decision, not an oversight.
//
// HOW THIS GATE IS REACHED, AND WHAT WOULD HAPPEN IF IT WERE NOT — the question the round-1
// adversarial review found UNASKED (F-01). Asking what a gate refuses, without asking how it is
// reached, is how this repository once shipped a gate that "passed for a whole round by never
// running". So, stated plainly:
//
//   • REACHED TODAY: through the unconditional suite step above. `npx vitest list --exclude
//     '**/scripts/e2e/**'` reports this file's cases, so the CI suite runs them on every push. The
//     named `check:dashboard-readonly` script is the human-facing handle on the same file.
//   • IF IT WERE NOT: every claim in this file would be true only on a developer's machine, and the
//     first commit to introduce a writer would be the commit that discovered nobody was looking.
//   • WHAT IS MISSING IS THE MECHANICAL PROOF OF THAT REACHABILITY, not the reachability.
//     `scripts/check-foundation-guards.test.ts` derives "every `check:*` script names a gate CI
//     runs" by extracting `/node (scripts\/[\w.-]+\.js)/` from each command and SKIPPING the script
//     when that pattern does not match — which silently skips this one, because its command is
//     `npx vitest run …`. Plan 32-21 closes that half by classifying every `check:*` script into a
//     named class with a reachability proof per class. It is cross-referenced here rather than
//     duplicated, because two files deciding one question is the failure this file's own docblock
//     already refuses twice over.
//
// Vitest `globals: false` (the repo default) → the test functions are imported explicitly.

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import ts from "typescript";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import * as nodeFs from "node:fs";
import * as nodeFsPromises from "node:fs/promises";
import { dirname, join } from "node:path";
import { execFileSync } from "node:child_process";

// ONE AUTHORITY ON A SPECIFIER'S CLASS (32-31). `classifySpecifier` is imported rather than
// re-implemented here, because the two hand-written predicates that used to decide this question —
// this file's `isBareSpecifier` and the walker's three dot-leading patterns — were a COMPLEMENT
// rather than a partition and disagreed about every specifier beginning with `/`. `32-24-RED-baseline.txt`
// measured three such spellings at exit 0 with a live writer behind them.
import {
  classifySpecifier,
  copyImportClosure,
  jsImportClosure,
  jsImportClosureFacts,
  moduleSpecifiers,
  SPECIFIER_CLASSES,
  type SpecifierClass,
} from "./js-import-closure.js";

// THE THIRD SIDE OF THE CLOSURE ORACLE (Phase 32.1, D-09). Node's own ESM resolver, recorded while
// the dashboard closure loads for real. Imported rather than inlined for the same reason every other
// shared authority on this tree is: the two shapings that make a loader oracle VACUOUS are subtle,
// measured, and written down once in that module's header — not rediscovered per consumer.
import {
  recordRuntimeAcquisitions,
  type RuntimeAcquisitions,
} from "./loader-oracle.test-support.js";

const ROOT = join(import.meta.dirname, "..");

/** The compiled entry the guard walks — the artifact a host runs, never the `.ts`. */
const DASHBOARD_ENTRY = "scripts/board-dashboard.js";
/** The pure model, whose own closure must not reach `node:fs` at all (D-15, D-23). */
const MODEL_ENTRY = "scripts/board-model.js";

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// THE AST DERIVATION — one pass per closure module, over the bytes of the committed `.js`.
// ═══════════════════════════════════════════════════════════════════════════════════════════════

/** Both spellings of both filesystem modules. A guard that only knew `node:fs` would miss `fs`. */
const FS_MODULE_IDENTITIES = Object.freeze(["fs", "fs/promises"]);

/** `node:net` and `net` are the same module; the ban is over identity, not over spelling. */
function normalizeSpecifier(specifier: string): string {
  return specifier.startsWith("node:") ? specifier.slice("node:".length) : specifier;
}

function isFsSpecifier(specifier: string): boolean {
  return FS_MODULE_IDENTITIES.includes(normalizeSpecifier(specifier));
}

// `isBareSpecifier` USED TO LIVE HERE, and it was `!startsWith(".") && !startsWith("/")` — a chain
// of negations, which admits every spelling nobody thought to subtract. It was deleted in 32-31
// rather than widened: the class of a specifier is now decided in exactly ONE function in this
// repository, `classifySpecifier` in scripts/js-import-closure.ts, which both the closure walker
// and this census ask. A fourth prefix test beside the existing ones is the shape that round exists
// to stop, so there is no longer a place in this file to add one.

/**
 * THE GLOBALS THAT CARRY CAPABILITIES, and therefore the roots of the member-path census (32-20).
 *
 * A module-identity rule cannot see a capability reached WITHOUT a module, and one of the writers
 * measured in `32-20-RED-baseline.txt` has no import anywhere in it:
 *
 *     export const dump = (p) => process.report.writeReport(p);
 *          npm run check:dashboard-readonly → exit 0, 59 passed / 59
 *
 * `process.report.writeReport` creates and writes a JSON file at any path handed to it. So the
 * member paths reached on these roots are censused and pinned two-sided, exactly as the builtin
 * identities are. `globalThis` and `global` are here because they are the OTHER spellings of the
 * same reach: `globalThis.process.report` is the same capability with four more characters.
 *
 * THE BOUNDARY, NAMED RATHER THAN IMPLIED: this is a ROOT SET, so a capability reached through a
 * global spelling that is not in it is outside what this census decides. It is pinned by count for
 * that reason — a fourth root is a decision — and the residual is restated in the docblock's "what
 * this does not close" list.
 */
const CAPABILITY_GLOBAL_ROOTS = Object.freeze(["process", "globalThis", "global"]);

/** The cardinality of the root set. A fourth spelling is a decision, never a bumped constant. */
const CAPABILITY_GLOBAL_ROOT_COUNT = 3;

/** The segment a COMPUTED key contributes to a member path. It names a key nobody can read here. */
const COMPUTED_PATH_SEGMENT = "[computed]";

/**
 * THE MEMBER PATHS THE CLOSURE LEGITIMATELY REACHES ON THOSE ROOTS — measured, pinned two-sided.
 *
 * Only MAXIMAL paths are censused, so `process.report.writeReport` is compared as itself rather
 * than as its admitted-looking prefix. ONE DERIVATION ANSWERS TWO OF THE MEASURED BYPASSES: the
 * process report writer and the runtime-assembled module identity are both a member reached on a
 * capability-bearing global, and both are absent from this list.
 *
 * `[computed]` is a real segment, not a wildcard: it says "a key this pass cannot read", and the
 * two places the closure legitimately uses one are pinned individually below.
 */
const EXPECTED_GLOBAL_MEMBER_PATHS = Object.freeze([
  // scripts/is-entry.js — `process.argv[1]`, the entrypoint comparison. Read-only.
  `process.argv.${COMPUTED_PATH_SEGMENT}`,
  // scripts/board-dashboard.js — `process.argv.slice(2)`, the argument vector the CLI parses.
  "process.argv.slice",
  // scripts/board-dashboard.js — the default repo root when none is given on the command line.
  "process.cwd",
  // scripts/board-dashboard.js — `process.env[name]`, read for NO_COLOR / TERM / COLUMNS.
  `process.env.${COMPUTED_PATH_SEGMENT}`,
  // scripts/board-dashboard.js — the exit code on `--once` and on a usage error.
  "process.exit",
  // scripts/board-dashboard.js — `process.on("SIGINT", …)`, the interrupt handler.
  "process.on",
  // scripts/board-dashboard.js — the stderr channel handed to the io seam. A DIAGNOSTIC channel.
  "process.stderr",
  // scripts/board-dashboard.js — the stdout channel handed to the io seam. The RENDER channel.
  "process.stdout",
  // scripts/board-dashboard.js — terminal width for the column layout.
  "process.stdout.columns",
  // scripts/board-dashboard.js — the TTY test that selects the degraded renderer.
  "process.stdout.isTTY",
]);

/**
 * The cardinality of the census. An ELEVENTH member path is a DECISION: the projector would be
 * reaching a platform capability it could not reach before, and `process.report.writeReport` is the
 * measured proof that a member nobody weighed can write a file. Never a bumped constant.
 */
const EXPECTED_GLOBAL_MEMBER_PATH_COUNT = 10;

/**
 * THE MEMBER PATHS THE CLOSURE MAY READ SOMEWHERE OTHER THAN A CALLEE POSITION — the SECOND set,
 * and the reason re-greening this guard over a writer is no longer one edit (32-32, F-08 / WR-02).
 *
 * THE SHAPE OF THE DEFECT THIS CLOSES, IN ONE SENTENCE. Until this round the position rule existed
 * only at the ROOT level: arm 4 states that the one admitted read of `process` / `globalThis` /
 * `global` is as the OBJECT of a member access, so binding the root reds the write-detection
 * mechanism. The same sentence was never asked one level down, of a MEMBER path — so
 *
 *     const __r = process.report;
 *     export const wB = (p) => __r.writeReport(p);
 *
 * censused `process.report`, red the two-sided pin and the positive control, and left the
 * acquisitions PREMISE case GREEN with `0 refused acquisitions`. Adding `"process.report"` above
 * and moving the count from 10 to 11 then returned the WHOLE guard to `exit 0, 135 passed (135)`
 * with a module in the closure that writes a JSON file at any path handed to it — measured, with the
 * created file's 53389 bytes, in `32-32-RED-baseline.txt` §§ 1-3.
 *
 * TWO SETS, TWO COUNTS, TWO WRITTEN CLAIMS. The rule below is over the POSITION; this list is over
 * the PATH; BOTH must say yes. So recording a path in `EXPECTED_GLOBAL_MEMBER_PATHS` no longer buys
 * anything on its own — a maintainer who wants the guard green over a bound read must ALSO record
 * the path here, with the reason a BINDING of it is read-only, and move a second count. That is the
 * claim `process.report` cannot survive: a binding of it hands the caller `writeReport`.
 *
 * MEASURED, NOT RECALLED. These are exactly the six non-callee maximal paths the live closure reads,
 * enumerated over the walker's own module set in `32-32-RED-baseline.txt` § 5 with the site of each.
 * The other four censused paths (`process.argv.slice`, `process.cwd`, `process.exit`, `process.on`)
 * appear ONLY as callees and therefore need no entry here; 6 + 4 = 10 accounts for the whole census
 * with nothing left over. A rule of this kind declared from memory refuses the shipped program and
 * gets loosened within a day, which is the failure direction this file may not fail in.
 */
const ADMITTED_BOUND_MEMBER_PATHS = Object.freeze([
  // scripts/is-entry.js:39 — `const argv1 = process.argv[1];`. A STRING is read out of the argument
  // vector and compared against a resolved href. A binding of it carries no capability at all.
  `process.argv.${COMPUTED_PATH_SEGMENT}`,
  // scripts/board-dashboard.js:661 — `process.env[FORCE_WATCH_ERROR_ENV] ?? ""`. A STRING read,
  // coalesced and split. No closure module assigns to `process.env` anywhere.
  `process.env.${COMPUTED_PATH_SEGMENT}`,
  // scripts/board-dashboard.js:947 — `stderr: process.stderr` in `defaultIo()`. A binding of the
  // DIAGNOSTIC channel can write to a terminal and to nothing else; it opens no path on disk.
  "process.stderr",
  // scripts/board-dashboard.js:946 — `stdout: process.stdout` in `defaultIo()`. Same claim for the
  // RENDER channel: it is the thing the projector exists to write to, and it is not a file handle.
  "process.stdout",
  // scripts/board-dashboard.js:951 — `columns: process.stdout.columns`. A NUMBER read for layout.
  "process.stdout.columns",
  // scripts/board-dashboard.js:948 — `process.stdout.isTTY === true`. A BOOLEAN read selecting the
  // degraded renderer.
  "process.stdout.isTTY",
]);

/**
 * The cardinality of the admitted-bound set. A SEVENTH entry is a decision that says, in writing,
 * "a binding of this capability is read-only" — the claim, not the spelling. Never a bumped
 * constant, and asserted a SUBSET of `EXPECTED_GLOBAL_MEMBER_PATHS` so the two cannot drift apart.
 */
const ADMITTED_BOUND_MEMBER_PATH_COUNT = 6;

/**
 * THE CALLEES ADMITTED WITHOUT A DECLARATION — the named-exclusion posture `STEM_FALSE_POSITIVES`
 * already takes, applied to the resolution rule (32-20).
 *
 * The canonical form below refuses a call through an identifier this pass cannot resolve. Five
 * platform globals and five value constructors are called in the live closure with no declaration
 * anywhere, and every one of them is inert: none opens a file, starts a process, or returns a
 * module. They are named here WITH the reason, and pinned two-sided, so an eleventh is a decision
 * somebody records rather than a condition somebody appends.
 *
 * WHAT IS DELIBERATELY NOT HERE, AND WHY THE LIST IS THE INTERESTING PART: `eval`, `Function`,
 * `require`, `createRequire`, `fetch`, `structuredClone`. Each of those either executes source or
 * returns something this pass would then have to reason about. They are refused by their ABSENCE,
 * which is what makes this an allow-list rather than a fifteenth deny-list.
 */
const ADMITTED_GLOBAL_CALLEES = Object.freeze([
  "Date", // scripts/board-read.js — `new Date(...)` for the mtime column. A value, no I/O.
  "Error", // scripts/board-dashboard.js, scripts/kit-model.js — thrown diagnostics.
  "Map", // four closure modules — ordinary keyed collections.
  "Set", // four closure modules — ordinary de-duplication.
  "String", // scripts/board-dashboard.js, scripts/board-model.js — the string coercion.
  "TextDecoder", // scripts/board-read.js — decodes bytes ALREADY read; it opens nothing itself.
  "clearInterval", // scripts/board-dashboard.js — tears the poll loop down on SIGINT.
  "clearTimeout", // scripts/board-dashboard.js — cancels a pending debounce.
  "setInterval", // scripts/board-dashboard.js — the mandatory poll floor.
  "setTimeout", // scripts/board-dashboard.js — the watch debounce.
]);

/** The cardinality of the exemption set. An eleventh admitted global is a DECISION with a reason. */
const ADMITTED_GLOBAL_CALLEE_COUNT = 10;

/**
 * THE KINDS OF DECLARATION THAT MAY RESOLVE A CALLEE — the SECOND axis of the resolution, pinned so
 * that "resolved" cannot quietly start meaning something new (32-20).
 *
 * The first axis is `ADMITTED_GLOBAL_CALLEES`: what may be called with NO declaration. This is the
 * converse: the shapes of declaration that admit a callee. Measured over the live closure; a sixth
 * kind means a callee is now admitted by a route nobody has weighed.
 */
const RESOLVING_DECLARATION_KINDS = Object.freeze([
  "ClassDeclaration",
  "FunctionDeclaration",
  "FunctionName",
  "ImportSpecifier",
  "Parameter",
  "VariableDeclaration",
]);

/** The cardinality of the resolution-kind set. A seventh shape is a decision. */
const RESOLVING_DECLARATION_KIND_COUNT = 6;

interface ModuleFacts {
  /** Top-level statement count. Zero means the parse read nothing and every claim below is vacuous. */
  readonly statements: number;
  /** Syntactic parse diagnostics. A file the parser could not read must RED the guard, never pass it. */
  readonly parseErrors: readonly string[];
  /** Every `node:fs` / `node:fs/promises` symbol imported by name or reached through a namespace. */
  readonly fsSymbols: ReadonlySet<string>;
  /** Every bare specifier — the set `jsImportClosure` deliberately skips, and the socket ban's input. */
  readonly bareSpecifiers: ReadonlySet<string>;
  /**
   * EVERY FOREIGN SPECIFIER — the third bucket of the partition, and the one that exists so no
   * spelling can fall outside all three (32-31).
   *
   * A foreign specifier names a module reached by a route this repository never read: an absolute
   * or protocol-relative path, a `file:`/`data:` URL, a Windows drive-letter path, a `#`-prefixed
   * subpath import. The closure walk cannot mirror it and this syntactic pass cannot name a single
   * symbol inside it, so admitting one would CLAIM that a module nobody here has read is
   * nevertheless known to hold no writer. It is therefore collected AND pushed into `acquisitions`,
   * so it reds the write-detection MECHANISM — the `PREMISE:` case over `acquisitions` — rather
   * than only moving a census count somebody could re-green by extending a list.
   */
  readonly foreignSpecifiers: readonly string[];
  /**
   * Acquisitions of a filesystem module whose symbols this syntactic pass CANNOT name: a dynamic
   * `import("node:fs")`, a `require("node:fs")`, an `export * from "node:fs"`, or a computed member
   * access on an fs namespace. Each one is a route the derivation cannot decide, so each is collected
   * and asserted absent rather than silently producing a short symbol set.
   */
  readonly opaqueFsAcquisitions: readonly string[];
  /** Module specifiers that are not string literals — a computed `import(expr)`. Same fail-closed rule. */
  readonly opaqueSpecifiers: readonly string[];
  /**
   * EVERY MODULE ACQUISITION THAT IS NOT THE ONE ADMITTED SHAPE (32-20).
   *
   * THE CANONICAL FORM, IN ONE SENTENCE: in this closure a module identity is established by
   * exactly one shape — a STATIC IMPORT DECLARATION WHOSE SPECIFIER IS A STRING LITERAL. Every
   * other way of obtaining one is collected here and asserted absent: a dynamic `import()` whatever
   * its argument, a call or construction through an identifier this pass cannot resolve, a call
   * reached through an unadmitted member path on a capability-bearing global, and any read of such
   * a global that is not the object of a member access.
   *
   * WHY REFUSAL RATHER THAN A CLEVERER PASS. The obvious alternative is to constant-fold the
   * argument of `process.getBuiltinModule("node:" + "fs")` and decide the identity. 32-11 declined
   * that because it changes what this syntactic pass IS, and that argument still holds — but the
   * reason to refuse is stronger than the reason to decline: AN UNPROVABLE IDENTITY IS NOT A SAFE
   * IDENTITY. A guard that cannot decide must refuse, exactly as `open`/`openSync` stay in the
   * mutating set because a name cannot read their flag literal. The next reader's instinct will be
   * to make the pass cleverer instead; this paragraph is here to be read before that edit.
   */
  readonly acquisitions: readonly string[];
  /**
   * Called or constructed identifiers this pass could not resolve to an import binding or to a
   * declaration in an ENCLOSING scope, minus `ADMITTED_GLOBAL_CALLEES`. Each is also an
   * `acquisition`; this set exists so the failure message can name the identifier.
   */
  readonly unresolvedCallees: readonly string[];
  /**
   * The converse census: every resolved callee WITH the declaration kind and the line that resolved
   * it. Pinned by KIND rather than by name — see `RESOLVING_DECLARATION_KINDS` and the case that
   * asserts it — so that "resolved" cannot start meaning something new without somebody noticing.
   */
  readonly resolvedCallees: readonly string[];
  /** Every member path rooted at a capability-bearing global, normalized to a dotted string. */
  readonly globalMemberPaths: ReadonlySet<string>;
}

function analyzeModule(absPath: string, label: string): ModuleFacts {
  const source = ts.createSourceFile(label, readFileSync(absPath, "utf8"), ts.ScriptTarget.Latest, true);

  // `parseDiagnostics` is not on the public `SourceFile` type, but it is the only place the syntactic
  // errors of a standalone parse are recorded. Read defensively: absent means "this TypeScript build
  // does not expose it", which the statement-count premise still covers.
  const parseErrors = (
    (source as unknown as { parseDiagnostics?: readonly ts.Diagnostic[] }).parseDiagnostics ?? []
  ).map((d) => ts.flattenDiagnosticMessageText(d.messageText, " "));

  const fsSymbols = new Set<string>();
  const bareSpecifiers = new Set<string>();
  const foreignSpecifiers: string[] = [];
  const fsNamespaceBindings = new Set<string>();
  /**
   * THE LOCAL NAMES A CAPABILITY-BEARING MEMBER PATH WAS READ INTO, mapped to the path they carry
   * (32-32). `fsNamespaceBindings` one register over: that set tracks a name holding a MODULE, this
   * map tracks a name holding a member reached on a capability-bearing GLOBAL.
   *
   * A LOCAL ALIAS IS NOT A NEW ROOT. Without this map `__r.writeReport(p)` after `const __r =
   * process.report` is rooted at `__r`, which is not in `CAPABILITY_GLOBAL_ROOTS`, so
   * `globalMemberPathOf` answers null and the call contributes NOTHING to the census — the maximal
   * path stops at the binding site. With it, the aliased call resolves to exactly the path the
   * direct spelling produces, so the census cannot be walked around by inserting a name.
   */
  const capabilityBindings = new Map<string, string>();
  const opaqueFsAcquisitions: string[] = [];
  const opaqueSpecifiers: string[] = [];
  const acquisitions: string[] = [];
  const unresolvedCallees: string[] = [];
  const resolvedCallees: string[] = [];
  const globalMemberPaths = new Set<string>();

  const literalText = (node: ts.Node | undefined): string | null =>
    node !== undefined && ts.isStringLiteralLike(node) ? node.text : null;

  /**
   * THE CENSUS ASKS THE SAME AUTHORITY THE WALKER ASKS (32-31).
   *
   * A switch over the three-way partition, with no fall-through and no "otherwise". Each arm is a
   * decision written here rather than a consequence of a prefix test:
   *
   *   `bare`     — a node builtin or a package identity. Fed to `bareSpecifiers`, which the builtin
   *                ALLOW-LIST equality then decides.
   *   `relative` — an edge inside the tree. The closure walk follows it and analyses the target as
   *                its own module, so recording it a second time here would say nothing new.
   *   `foreign`  — REFUSED. Collected for attribution AND pushed into `acquisitions`, so the write-
   *                detection premise reds rather than a count moving.
   */
  const noteSpecifier = (specifier: string): void => {
    switch (classifySpecifier(specifier)) {
      case "bare":
        bareSpecifiers.add(specifier);
        return;
      case "relative":
        return;
      case "foreign":
        foreignSpecifiers.push(specifier);
        acquisitions.push(briefly(`FOREIGN SPECIFIER "${specifier}"`));
        return;
    }
  };

  /** Refusal messages carry source text; a whole call or declaration can be long, so flatten and cap. */
  const briefly = (text: string): string => {
    const flat = text.replace(/\s+/g, " ").trim();
    return flat.length > 140 ? `${flat.slice(0, 137)}...` : flat;
  };

  /**
   * THE ONE PLACE A MEMBER NAME OF A FILESYSTEM MODULE BECOMES A CLAIM (plan 32-14, finding F-02).
   *
   * A NAME lands in `fsSymbols` from FOUR syntactic positions, and the re-entry rule 32-11 added was
   * asked at only TWO of them:
   *
   *   1. a property access on an fs namespace       — `fsns.promises`        (asked, 32-11)
   *   2. a string-literal element access on one     — `fsns["promises"]`     (asked, 32-11)
   *   3. a NAMED IMPORT from an fs specifier        — `import { promises }`  (NOT asked)
   *   4. a NAMED RE-EXPORT from an fs specifier     — `export { promises }`  (NOT asked)
   *
   * Positions 3 and 4 are the same capability by another spelling: `promises` and `default` are
   * THEMSELVES namespaces holding the whole writer set, so a named import of one hands a module
   * every writer in `node:fs` under a name that matches no write-class stem. The guard still went
   * red on that shape — but on the CARDINALITY pin, whose failure message tells a maintainer to
   * "weigh the new symbol … it is a decision". A maintainer who weighs `promises` against
   * `MUTATING_FS_SYMBOLS`, finds it absent, and adds it to `EXPECTED_CLOSURE_FS_SYMBOLS` re-greens
   * the guard over a full writer in ONE edit. A pin catching a writer by accident is not the
   * intersection deciding it — the same sentence 32-11 wrote about the namespace route, which is
   * why the fix is to ask the SAME derived predicate at the remaining two positions rather than to
   * add a third rule.
   */
  const noteFsMember = (name: string, sourceText: string): void => {
    if (NAMESPACE_REENTRY_MEMBERS.includes(name)) {
      opaqueFsAcquisitions.push(briefly(sourceText));
    } else fsSymbols.add(name);
  };

  const collectSpecifiers = (node: ts.Node): void => {
    if (ts.isImportDeclaration(node)) {
      const specifier = literalText(node.moduleSpecifier);
      if (specifier === null) {
        opaqueSpecifiers.push(node.getText());
      } else {
        noteSpecifier(specifier);
        if (isFsSpecifier(specifier)) {
          const clause = node.importClause;
          // A default import of a builtin under esModuleInterop IS the namespace object, so it is
          // treated as one rather than ignored.
          if (clause?.name) fsNamespaceBindings.add(clause.name.text);
          const bindings = clause?.namedBindings;
          if (bindings !== undefined && ts.isNamespaceImport(bindings)) {
            fsNamespaceBindings.add(bindings.name.text);
          }
          if (bindings !== undefined && ts.isNamedImports(bindings)) {
            for (const element of bindings.elements) {
              noteFsMember((element.propertyName ?? element.name).text, element.getText());
            }
          }
        }
      }
    } else if (ts.isExportDeclaration(node) && node.moduleSpecifier !== undefined) {
      const specifier = literalText(node.moduleSpecifier);
      if (specifier === null) {
        opaqueSpecifiers.push(node.getText());
      } else {
        noteSpecifier(specifier);
        if (isFsSpecifier(specifier)) {
          const clause = node.exportClause;
          if (clause !== undefined && ts.isNamedExports(clause)) {
            for (const element of clause.elements) {
              noteFsMember((element.propertyName ?? element.name).text, element.getText());
            }
          } else {
            // `export * from "node:fs"` re-exports every symbol including every writer, and no name
            // in the source says so. Opaque, therefore refused.
            opaqueFsAcquisitions.push(node.getText());
          }
        }
      }
    } else if (ts.isCallExpression(node)) {
      const isDynamicImport = node.expression.kind === ts.SyntaxKind.ImportKeyword;
      const isRequire = ts.isIdentifier(node.expression) && node.expression.text === "require";
      if (isDynamicImport || isRequire) {
        const specifier = literalText(node.arguments[0]);
        if (specifier === null) {
          opaqueSpecifiers.push(node.getText());
        } else {
          noteSpecifier(specifier);
          if (isFsSpecifier(specifier)) opaqueFsAcquisitions.push(node.getText());
        }
      } else {
        // THE ACQUISITION ARM, GENERALISED (deviation, Rule 2 — recorded in 32-11-SUMMARY.md).
        // `import(…)` and `require(…)` are two SPELLINGS of "hand a module identity to a function
        // and get the module back", and they are not the only ones: `createRequire(url)("node:fs")`
        // never spells `require` at the call site, and `process.getBuiltinModule("node:fs")` and
        // `process.binding("fs")` return the real module without any module-system call at all.
        // Rather than name those three (one more heuristic per counter-example, the failure this
        // file's docblock already refuses), the rule is over the ARGUMENT: a filesystem module
        // IDENTITY appearing as a string-literal argument to ANY call is an acquisition this
        // syntactic pass cannot follow, so it is refused.
        //
        // It is deliberately NOT routed through `noteSpecifier`. A plain call's string argument is
        // not a module-identity position, and folding it into `bareSpecifiers` would make a
        // harmless `f("net")` read as an import of node:net and red the DASH-08 ban for a reason
        // that has nothing to do with a socket. Refusal here, no specifier claim.
        for (const argument of node.arguments) {
          const literal = literalText(argument);
          if (literal !== null && isFsSpecifier(literal)) {
            opaqueFsAcquisitions.push(briefly(node.getText()));
            break;
          }
        }
      }
    }
    ts.forEachChild(node, collectSpecifiers);
  };
  collectSpecifiers(source);

  /**
   * THE CANONICAL FORM (32-11, closing CR-01).
   *
   * An identifier bound to an fs namespace may appear in exactly ONE position that is not its own
   * binding site: as the OBJECT of a member access. That is the whole admitted use. Every other
   * READ of the binding — destructured, aliased, spread, passed as an argument, put in a literal,
   * re-exported, returned — hands the namespace object to a route this syntactic pass cannot
   * follow, and each of those routes reaches every writer in `node:fs` without naming one.
   *
   * The rule is therefore stated as an ALLOW-LIST and everything outside it is refused. The
   * alternative — teaching the matcher to also recognise a destructuring pattern — is one more
   * heuristic per counter-example, which is the shape this repository has spent eight rounds on
   * twice ([[grugops-safety-invariant-green-suite-insufficient]]).
   *
   * THE EXEMPTIONS ARE EXACTLY TWO, AND BOTH ARE BINDING SITES RATHER THAN READS. A THIRD
   * EXEMPTION IS A DECISION SOMEBODY RECORDS HERE WITH ITS REASON, never a condition somebody
   * appends — the same posture the three named stem exclusions below already take.
   */
  const isAdmittedNamespacePosition = (node: ts.Identifier): boolean => {
    const parent = node.parent as ts.Node | undefined;
    if (parent === undefined) return false;
    // Exemption 1 — the binding site of `import * as fsns from "node:fs"`.
    if (ts.isNamespaceImport(parent) && parent.name === node) return true;
    // Exemption 2 — the binding site of `import fs from "node:fs"`, which `collectSpecifiers`
    // already treats as a namespace object under esModuleInterop.
    if (ts.isImportClause(parent) && parent.name === node) return true;
    // The ONE admitted read: the object of a property or element access.
    if (ts.isPropertyAccessExpression(parent) && parent.expression === node) return true;
    if (ts.isElementAccessExpression(parent) && parent.expression === node) return true;
    return false;
  };

  /**
   * TWO PROPERTIES OF THIS PASS, WRITTEN DOWN SO A LATER READER DOES NOT "FIX" THEM:
   *
   *   • THE PASS IS NAME-SCOPED, NOT BINDING-SCOPED. A parameter or a local that happens to reuse a
   *     namespace identifier's spelling is treated as the namespace. The imprecision runs in the
   *     direction of REFUSAL, which is the only direction a safety guard may be imprecise in;
   *     loosening it to be scope-accurate would trade a false red for a possible false green.
   *   • THE ELEMENT-ACCESS ARM IS UNCHANGED. A computed key is already an opaque acquisition and a
   *     string-literal key still names its symbol. The canonical form is a UNION with that arm, not
   *     a replacement for it, and `NAMESPACE_ESCAPE_SHAPES` tests the union.
   */
  const collectNamespaceUses = (node: ts.Node): void => {
    if (
      ts.isPropertyAccessExpression(node) &&
      ts.isIdentifier(node.expression) &&
      fsNamespaceBindings.has(node.expression.text)
    ) {
      // `fsns.default` and `fsns.promises` are THEMSELVES namespaces holding the whole writer set.
      // Every member read off one of them is a property access whose own expression is not an
      // identifier, so this pass would name `default`/`promises` and nothing behind it. Refused
      // rather than named (deviation, Rule 2), over a set DERIVED from the runtime.
      noteFsMember(node.name.text, node.getText());
    } else if (
      ts.isElementAccessExpression(node) &&
      ts.isIdentifier(node.expression) &&
      fsNamespaceBindings.has(node.expression.text)
    ) {
      const key = literalText(node.argumentExpression);
      // A COMPUTED key is refused here rather than in `noteFsMember`: it carries no name to ask the
      // re-entry rule about, which is a different reason from "this name re-enters a namespace".
      if (key === null) opaqueFsAcquisitions.push(briefly(node.getText()));
      else noteFsMember(key, node.getText());
    } else if (
      ts.isIdentifier(node) &&
      fsNamespaceBindings.has(node.text) &&
      !isAdmittedNamespacePosition(node)
    ) {
      opaqueFsAcquisitions.push(briefly((node.parent ?? node).getText()));
    }
    ts.forEachChild(node, collectNamespaceUses);
  };
  if (fsNamespaceBindings.size > 0) collectNamespaceUses(source);

  // ───────────────────────────────────────────────────────────────────────────────────────────
  // THE ACQUISITION CANONICAL FORM AND THE GLOBAL MEMBER-PATH CENSUS (32-20).
  // ───────────────────────────────────────────────────────────────────────────────────────────

  const lineOf = (node: ts.Node): number =>
    source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1;

  const addBindingNames = (
    name: ts.BindingName,
    into: Map<string, string>,
    kind: string,
    line: number,
  ): void => {
    if (ts.isIdentifier(name)) into.set(name.text, `${kind}@${label}:${line}`);
    else for (const element of name.elements) {
      if (ts.isBindingElement(element)) addBindingNames(element.name, into, kind, line);
    }
  };

  /**
   * THE NAMES DECLARED DIRECTLY IN ONE NODE — deliberately NOT a file-level census.
   *
   * A file-level set of declared names is the "ONE DEAD DECLARATION DISABLES THE BAN" shape this
   * repository has already measured once (P31 round 6): a block-scoped declaration in a scope the
   * call site is not inside would silently convert an unresolved callee into a resolved one, while
   * the call itself still reached the real global. So resolution walks the ANCESTOR CHAIN from the
   * call site and asks each enclosing node what IT declares. A name declared in a sibling scope
   * does not resolve, and the imprecision therefore runs toward REFUSAL — the only direction a
   * safety guard may be imprecise in.
   */
  const declaredCache = new Map<ts.Node, Map<string, string>>();
  const declaredDirectlyIn = (node: ts.Node): Map<string, string> => {
    const cached = declaredCache.get(node);
    if (cached !== undefined) return cached;
    const declared = new Map<string, string>();
    const fromStatements = (statements: readonly ts.Statement[]): void => {
      for (const statement of statements) {
        if (ts.isImportDeclaration(statement) && statement.importClause !== undefined) {
          const clause = statement.importClause;
          const line = lineOf(statement);
          if (clause.name) declared.set(clause.name.text, `ImportClause@${label}:${line}`);
          const bindings = clause.namedBindings;
          if (bindings !== undefined && ts.isNamespaceImport(bindings)) {
            declared.set(bindings.name.text, `NamespaceImport@${label}:${line}`);
          }
          if (bindings !== undefined && ts.isNamedImports(bindings)) {
            for (const element of bindings.elements) {
              declared.set(element.name.text, `ImportSpecifier@${label}:${line}`);
            }
          }
        } else if (ts.isFunctionDeclaration(statement) && statement.name !== undefined) {
          declared.set(statement.name.text, `FunctionDeclaration@${label}:${lineOf(statement)}`);
        } else if (ts.isClassDeclaration(statement) && statement.name !== undefined) {
          declared.set(statement.name.text, `ClassDeclaration@${label}:${lineOf(statement)}`);
        } else if (ts.isVariableStatement(statement)) {
          for (const declaration of statement.declarationList.declarations) {
            addBindingNames(declaration.name, declared, "VariableDeclaration", lineOf(declaration));
          }
        }
      }
    };
    if (
      ts.isSourceFile(node) ||
      ts.isBlock(node) ||
      ts.isModuleBlock(node) ||
      ts.isCaseClause(node) ||
      ts.isDefaultClause(node)
    ) {
      fromStatements(node.statements);
    }
    if (ts.isFunctionLike(node)) {
      for (const parameter of node.parameters) {
        addBindingNames(parameter.name, declared, "Parameter", lineOf(parameter));
      }
      if ((ts.isFunctionExpression(node) || ts.isFunctionDeclaration(node)) && node.name) {
        declared.set(node.name.text, `FunctionName@${label}:${lineOf(node)}`);
      }
    }
    if (ts.isForStatement(node) && node.initializer !== undefined && ts.isVariableDeclarationList(node.initializer)) {
      for (const declaration of node.initializer.declarations) {
        addBindingNames(declaration.name, declared, "VariableDeclaration", lineOf(declaration));
      }
    }
    if (
      (ts.isForInStatement(node) || ts.isForOfStatement(node)) &&
      ts.isVariableDeclarationList(node.initializer)
    ) {
      for (const declaration of node.initializer.declarations) {
        addBindingNames(declaration.name, declared, "VariableDeclaration", lineOf(declaration));
      }
    }
    if (ts.isCatchClause(node) && node.variableDeclaration !== undefined) {
      addBindingNames(
        node.variableDeclaration.name,
        declared,
        "CatchVariable",
        lineOf(node.variableDeclaration),
      );
    }
    declaredCache.set(node, declared);
    return declared;
  };

  const resolveCallee = (callee: ts.Identifier): string | null => {
    let cursor: ts.Node | undefined = callee.parent;
    while (cursor !== undefined) {
      const hit = declaredDirectlyIn(cursor).get(callee.text);
      if (hit !== undefined) return hit;
      cursor = cursor.parent;
    }
    return null;
  };

  /**
   * The normalized dotted path of a member chain rooted at a capability-bearing global, or null.
   *
   * THE ROOT OF A CHAIN IS EITHER A CAPABILITY-BEARING GLOBAL OR A LOCAL NAME CARRYING ONE (32-32).
   * The second arm is what makes an intermediate binding transparent: the bound path is the prefix
   * and the chain's own segments are appended to it, so `__r.writeReport` with `__r` carrying
   * `process.report` yields `process.report.writeReport` — byte for byte the path the direct
   * spelling produces, reported with the SAME message. Nothing is hidden by an intermediate name.
   */
  const globalMemberPathOf = (node: ts.Node): string | null => {
    const segments: string[] = [];
    let cursor: ts.Node = node;
    while (ts.isPropertyAccessExpression(cursor) || ts.isElementAccessExpression(cursor)) {
      if (ts.isPropertyAccessExpression(cursor)) segments.unshift(cursor.name.text);
      else {
        const key = literalText(cursor.argumentExpression);
        segments.unshift(key === null ? COMPUTED_PATH_SEGMENT : key);
      }
      cursor = cursor.expression;
    }
    if (!ts.isIdentifier(cursor)) return null;
    if (CAPABILITY_GLOBAL_ROOTS.includes(cursor.text)) return [cursor.text, ...segments].join(".");
    const bound = capabilityBindings.get(cursor.text);
    if (bound === undefined) return null;
    return [bound, ...segments].join(".");
  };

  // ───────────────────────────────────────────────────────────────────────────────────────────────
  // THE CAPABILITY-BINDING PRE-PASS — run to completion BEFORE any acquisition is collected, because
  // the census below asks `globalMemberPathOf`, and that function's answer depends on this map.
  //
  // AN UNPROVABLE BINDING IS NOT A SAFE BINDING. This is the posture the acquisition rule already
  // takes for an unprovable module IDENTITY, stated here for a name: a binding is tracked only when
  // the pass can see EXACTLY ONE value-write to it. A name written more than once — declared with a
  // capability path and reassigned, or assigned twice — carries a value this syntactic pass cannot
  // decide, so it is REFUSED (pushed into `acquisitions`) rather than tracked with a path that may
  // be false. The instinct to follow the reassignment and pick the "real" value is the cleverer-pass
  // instinct the acquisitions docblock already refuses; this paragraph is here to be read first.
  // ───────────────────────────────────────────────────────────────────────────────────────────────

  /** Every name bound by a binding name/pattern, with the property path each element reaches. */
  const boundNamesOf = (name: ts.BindingName, prefix: readonly string[]): [string, string[]][] => {
    if (ts.isIdentifier(name)) return [[name.text, [...prefix]]];
    const out: [string, string[]][] = [];
    for (const element of name.elements) {
      if (ts.isOmittedExpression(element)) continue;
      // An ARRAY element and a COMPUTED property name both reach a key this pass cannot read, so
      // both contribute the same `[computed]` segment the member-path census already uses.
      let segment = COMPUTED_PATH_SEGMENT;
      if (ts.isObjectBindingPattern(name)) {
        const key = element.propertyName ?? element.name;
        if (ts.isIdentifier(key)) segment = key.text;
        else if (ts.isStringLiteralLike(key) || ts.isNumericLiteral(key)) segment = key.text;
      }
      out.push(...boundNamesOf(element.name, [...prefix, segment]));
    }
    return out;
  };

  /** Value-write sites per NAME, name-scoped like the rest of this pass. One is provable; two is not. */
  const valueWrites = new Map<string, number>();
  const countWrites = (node: ts.Node): void => {
    if (ts.isVariableDeclaration(node) && node.initializer !== undefined) {
      for (const [bound] of boundNamesOf(node.name, [])) {
        valueWrites.set(bound, (valueWrites.get(bound) ?? 0) + 1);
      }
    }
    const bump = (target: ts.Node): void => {
      if (ts.isIdentifier(target)) valueWrites.set(target.text, (valueWrites.get(target.text) ?? 0) + 1);
    };
    // The assignment operators are taken from TypeScript's OWN boundary markers rather than from a
    // hand-typed list of `=`, `+=`, `??=`, … — a hand-typed list of operators is the set-literal
    // drift class one register over, and it would silently stop counting the day a new compound
    // assignment operator is added to the language.
    if (
      ts.isBinaryExpression(node) &&
      node.operatorToken.kind >= ts.SyntaxKind.FirstAssignment &&
      node.operatorToken.kind <= ts.SyntaxKind.LastAssignment
    ) {
      bump(node.left);
    }
    if (ts.isPrefixUnaryExpression(node) || ts.isPostfixUnaryExpression(node)) {
      if (
        node.operator === ts.SyntaxKind.PlusPlusToken ||
        node.operator === ts.SyntaxKind.MinusMinusToken
      ) {
        bump(node.operand);
      }
    }
    ts.forEachChild(node, countWrites);
  };
  countWrites(source);

  /**
   * Establish the map in SOURCE ORDER, resolving each initializer against the map built so far, so
   * a CHAINED alias (a binding of a binding, to any depth) resolves by construction rather than by
   * a special case counting links.
   */
  const establishBindings = (node: ts.Node): void => {
    const note = (name: ts.BindingName, valuePath: string): void => {
      for (const [bound, segments] of boundNamesOf(name, [])) {
        const path = [valuePath, ...segments].join(".");
        if ((valueWrites.get(bound) ?? 0) > 1) {
          acquisitions.push(
            briefly(
              `UNPROVABLE CAPABILITY BINDING "${bound}" (${label}:${lineOf(node)}) would carry ` +
                `${path} but is written more than once: ${node.getText()}`,
            ),
          );
          continue;
        }
        capabilityBindings.set(bound, path);
      }
    };
    if (ts.isVariableDeclaration(node) && node.initializer !== undefined) {
      const initializer = node.initializer;
      // A bare capability ROOT is the zero-segment chain; `const a = process` is tracked so the
      // root-alias spelling resolves too. Arm 4 refuses that read separately and both are wanted.
      if (ts.isIdentifier(initializer) && CAPABILITY_GLOBAL_ROOTS.includes(initializer.text)) {
        note(node.name, initializer.text);
      } else {
        const path = globalMemberPathOf(initializer);
        if (path !== null) note(node.name, path);
        else if (ts.isIdentifier(initializer)) {
          const bound = capabilityBindings.get(initializer.text);
          if (bound !== undefined) note(node.name, bound);
        }
      }
    }
    if (
      ts.isBinaryExpression(node) &&
      node.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
      ts.isIdentifier(node.left)
    ) {
      const path = globalMemberPathOf(node.right);
      if (path !== null) {
        if ((valueWrites.get(node.left.text) ?? 0) > 1) {
          acquisitions.push(
            briefly(
              `UNPROVABLE CAPABILITY BINDING "${node.left.text}" (${label}:${lineOf(node)}) would ` +
                `carry ${path} but is written more than once: ${node.getText()}`,
            ),
          );
        } else capabilityBindings.set(node.left.text, path);
      }
    }
    ts.forEachChild(node, establishBindings);
  };
  establishBindings(source);

  /**
   * THE CANONICAL FORM, ASKED ONE LEVEL DOWN (32-32). Arm 4 states that the ONE admitted read of a
   * capability-bearing ROOT is as the object of a member access. This is the same sentence about a
   * capability-bearing MEMBER PATH, and the admitted reads are exactly TWO:
   *
   *   1. as the OBJECT of a further member access — the inner link of a chain, which is not a
   *      maximal path at all and is therefore never censused as one;
   *   2. as the CALLEE of a call or construction whose maximal path is in
   *      `EXPECTED_GLOBAL_MEMBER_PATHS` — the shape `process.exit(1)` and `process.cwd()` take.
   *
   * EVERY OTHER POSITION IS AN ACQUISITION unless the path is in `ADMITTED_BOUND_MEMBER_PATHS`. The
   * rule here is over the POSITION; that list is over the PATH; both must say yes. Splitting the
   * decision in two is the point: it is what makes re-greening the guard over a bound writer cost a
   * second recorded claim instead of a second line in one list.
   */
  const isAdmittedMemberPathPosition = (node: ts.Node, parent: ts.Node | undefined): boolean => {
    if (parent === undefined) return false;
    if (
      (ts.isPropertyAccessExpression(parent) || ts.isElementAccessExpression(parent)) &&
      parent.expression === node
    ) {
      return true;
    }
    if ((ts.isCallExpression(parent) || ts.isNewExpression(parent)) && parent.expression === node) {
      const path = globalMemberPathOf(node);
      return path !== null && EXPECTED_GLOBAL_MEMBER_PATHS.includes(path);
    }
    return false;
  };

  /**
   * THE CANONICAL FORM FOR A CAPABILITY-BEARING GLOBAL, the same sentence the fs namespace rule
   * already states one register over: the ONE admitted read is as the OBJECT of a member access.
   * The binding-site positions are exempt (a parameter or variable may be NAMED `process`), and a
   * member NAME that happens to spell one is not a read of the global at all.
   *
   * THE PASS IS NAME-SCOPED, NOT BINDING-SCOPED, AND THAT IS DELIBERATE. A local that reuses one of
   * these spellings is treated as the global, so a shadowed-global local still reds this guard. The
   * imprecision runs toward REFUSAL. Measured on the live closure: ZERO reads of `process`,
   * `globalThis` or `global` outside a member access, so the rule costs the legitimate closure
   * nothing — which is what the positive controls below assert.
   */
  const isAdmittedGlobalPosition = (node: ts.Identifier): boolean => {
    const parent = node.parent as ts.Node | undefined;
    if (parent === undefined) return false;
    if (ts.isPropertyAccessExpression(parent) && parent.expression === node) return true;
    if (ts.isElementAccessExpression(parent) && parent.expression === node) return true;
    // A member NAME (`options.process`) is not a read of the global.
    if (ts.isPropertyAccessExpression(parent) && parent.name === node) return true;
    // Binding sites: a parameter, a variable, a destructured element or a function may be so named.
    if (ts.isParameter(parent) && parent.name === node) return true;
    if (ts.isVariableDeclaration(parent) && parent.name === node) return true;
    if (ts.isBindingElement(parent) && (parent.name === node || parent.propertyName === node)) return true;
    if (ts.isFunctionDeclaration(parent) && parent.name === node) return true;
    if (ts.isPropertyAssignment(parent) && parent.name === node) return true;
    return false;
  };

  const collectAcquisitions = (node: ts.Node): void => {
    // 1 — a dynamic import, WHATEVER its argument. A literal one is decidable and still not the
    //     admitted shape; a computed one is not decidable at all. Both are collected.
    if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) {
      acquisitions.push(briefly(node.getText()));
    }
    // 2 — a call or construction through an identifier, resolved against the ENCLOSING scopes.
    if ((ts.isCallExpression(node) || ts.isNewExpression(node)) && ts.isIdentifier(node.expression)) {
      const name = node.expression.text;
      const resolution = resolveCallee(node.expression);
      if (resolution !== null) resolvedCallees.push(`${name} <- ${resolution}`);
      else if (!ADMITTED_GLOBAL_CALLEES.includes(name)) {
        unresolvedCallees.push(`${name} (${label}:${lineOf(node)}) ${briefly(node.getText())}`);
        acquisitions.push(briefly(node.getText()));
      }
    }
    // 3 — the member-path census on the capability-bearing globals. Only MAXIMAL paths are
    //     recorded, so `process.report.writeReport` is censused as itself rather than as the
    //     admitted prefix `process.report` would have been.
    //
    //     THE RULE IS OVER THE POSITION AND THE ALLOW-LIST IS OVER THE PATH; BOTH MUST SAY YES
    //     (32-32). Until this round the only position that could produce an acquisition was
    //     CALLEE, so a path read into a binding first moved a census count and nothing else — and
    //     the edit that count's failing message invited returned the whole guard to green over a
    //     live writer (32-32-RED-baseline.txt §§ 1-3). Now a maximal path in ANY position other
    //     than the two `isAdmittedMemberPathPosition` names is an acquisition unless the path
    //     itself carries a written read-only claim in `ADMITTED_BOUND_MEMBER_PATHS`.
    if (ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node)) {
      const parent = node.parent as ts.Node | undefined;
      const isInnerOfChain =
        parent !== undefined &&
        (ts.isPropertyAccessExpression(parent) || ts.isElementAccessExpression(parent)) &&
        parent.expression === node;
      const path = isInnerOfChain ? null : globalMemberPathOf(node);
      if (path !== null) {
        globalMemberPaths.add(path);
        if (
          !isAdmittedMemberPathPosition(node, parent) &&
          !ADMITTED_BOUND_MEMBER_PATHS.includes(path)
        ) {
          acquisitions.push(briefly(`${path} read at ${(parent ?? node).getText()}`));
        }
      }
    }
    // 4 — the canonical form: any other read of a capability-bearing global identifier.
    if (
      ts.isIdentifier(node) &&
      CAPABILITY_GLOBAL_ROOTS.includes(node.text) &&
      !isAdmittedGlobalPosition(node)
    ) {
      acquisitions.push(briefly((node.parent ?? node).getText()));
    }
    ts.forEachChild(node, collectAcquisitions);
  };
  collectAcquisitions(source);

  return {
    statements: source.statements.length,
    parseErrors,
    fsSymbols,
    bareSpecifiers,
    foreignSpecifiers,
    opaqueFsAcquisitions,
    opaqueSpecifiers,
    acquisitions,
    unresolvedCallees,
    resolvedCallees,
    globalMemberPaths,
  };
}

interface ClosureFacts {
  readonly modules: readonly string[];
  readonly perModule: ReadonlyMap<string, ModuleFacts>;
  /** The union of every module's `node:fs` symbols, sorted. */
  readonly fsSymbols: readonly string[];
  /** The union of every module's bare specifiers, sorted. */
  readonly bareSpecifiers: readonly string[];
  /**
   * The union of every module's FOREIGN specifiers, PLUS every foreign edge the WALK itself refused
   * to follow (32-31).
   *
   * Both sources are merged deliberately. A foreign specifier in a module the walk reached is found
   * by the per-module analysis; a foreign specifier is ALSO the reason the walk did not reach some
   * target, and that edge would otherwise be censused by nobody — the module holding it is analysed,
   * so the two sources overlap for a reachable module and only the walk can see the edge from a
   * module the walk itself declined to enter. Merging is what makes the census two-sided.
   */
  readonly foreignSpecifiers: readonly string[];
  readonly opaqueFsAcquisitions: readonly string[];
  readonly opaqueSpecifiers: readonly string[];
  readonly acquisitions: readonly string[];
  readonly unresolvedCallees: readonly string[];
  readonly resolvedCallees: readonly string[];
  /** The union of every module's capability-global member paths, sorted. */
  readonly globalMemberPaths: readonly string[];
}

/**
 * THE DERIVATION: walk one entry's committed-`.js` closure and analyze every module in it.
 *
 * Takes `root` rather than closing over `ROOT` so the discrimination cases can point it at a mirror
 * built from the live sources and watch the same predicate fail.
 */
function analyzeClosure(root: string, entryRel: string): ClosureFacts {
  // `jsImportClosureFacts` rather than `jsImportClosure` (32-31). The wrapper THROWS on a foreign
  // edge, and a throw here would make this census unreachable at exactly the moment it has something
  // to say — the guard would die before recording the specifier a reader needs named. The walk
  // reports the edge instead, and this function is the position where it becomes a refusal.
  const { modules, foreignEdges } = jsImportClosureFacts(root, entryRel);
  const perModule = new Map<string, ModuleFacts>();
  const fsSymbols = new Set<string>();
  const bareSpecifiers = new Set<string>();
  const foreignSpecifiers = new Set<string>();
  for (const edge of foreignEdges) foreignSpecifiers.add(`${edge.module}: ${edge.specifier}`);
  const opaqueFsAcquisitions: string[] = [];
  const opaqueSpecifiers: string[] = [];
  const acquisitions: string[] = [];
  const unresolvedCallees: string[] = [];
  const resolvedCallees: string[] = [];
  const globalMemberPaths = new Set<string>();
  for (const rel of modules) {
    const facts = analyzeModule(join(root, rel), rel);
    perModule.set(rel, facts);
    for (const symbol of facts.fsSymbols) fsSymbols.add(symbol);
    for (const specifier of facts.bareSpecifiers) bareSpecifiers.add(specifier);
    for (const specifier of facts.foreignSpecifiers) foreignSpecifiers.add(`${rel}: ${specifier}`);
    for (const text of facts.opaqueFsAcquisitions) opaqueFsAcquisitions.push(`${rel}: ${text}`);
    for (const text of facts.opaqueSpecifiers) opaqueSpecifiers.push(`${rel}: ${text}`);
    for (const text of facts.acquisitions) acquisitions.push(`${rel}: ${text}`);
    for (const text of facts.unresolvedCallees) unresolvedCallees.push(`${rel}: ${text}`);
    for (const text of facts.resolvedCallees) resolvedCallees.push(`${rel}: ${text}`);
    for (const path of facts.globalMemberPaths) globalMemberPaths.add(path);
  }
  return {
    modules,
    perModule,
    fsSymbols: [...fsSymbols].sort(),
    bareSpecifiers: [...bareSpecifiers].sort(),
    foreignSpecifiers: [...foreignSpecifiers].sort(),
    opaqueFsAcquisitions,
    opaqueSpecifiers,
    acquisitions,
    unresolvedCallees,
    resolvedCallees,
    globalMemberPaths: [...globalMemberPaths].sort(),
  };
}

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// THE THREE SETS.
// ═══════════════════════════════════════════════════════════════════════════════════════════════

/** The modules the closure MUST contain. An absentee means the walk measured something else. */
const REQUIRED_CLOSURE_MODULES = Object.freeze([
  "scripts/board-dashboard.js",
  "scripts/board-read.js",
  "scripts/board-model.js",
]);

/**
 * The `node:fs` symbols the dashboard closure actually holds. MEASURED, not aspirational:
 *
 *   scripts/board-dashboard.js  existsSync, watch      (the watch loop and its guard)
 *   scripts/board-read.js       existsSync, readFileSync, readdirSync, realpathSync, statSync
 *   scripts/is-entry.js         realpathSync
 *   scripts/kit-model.js        existsSync, readFileSync, readdirSync, realpathSync, statSync
 *
 * Every one is a reader. THIS IS THE BLOCKING PIN: it is a function of this repository's code, so a
 * Node upgrade cannot move it, and it is the number the phase actually cares about.
 */
const EXPECTED_CLOSURE_FS_SYMBOLS = Object.freeze([
  "existsSync",
  "readFileSync",
  "readdirSync",
  "realpathSync",
  "statSync",
  "watch",
]);

/** The cardinality of that set. A seventh symbol is a decision, never a bumped constant. */
const EXPECTED_CLOSURE_FS_SYMBOL_COUNT = 6;

/**
 * D-21's write-class name stems, verbatim.
 *
 * They are hand-named because D-21 names them — a stem is the DEFINITION of "write-class", not a
 * membership list. What is derived is which of the RUNTIME's symbols they match, which is the set
 * that rots when Node adds a writer.
 */
const WRITE_CLASS_STEMS = Object.freeze([
  "write",
  "append",
  "rename",
  "unlink",
  "rm",
  "mkdir",
  "mkdtemp",
  "copy",
  "cp",
  "chmod",
  "chown",
  "truncate",
  "utimes",
  "link",
  "symlink",
  "open",
]);

/**
 * The descriptor prefixes POSIX-derived `fs` names carry in front of a stem: `f` for the
 * file-descriptor form (`ftruncate`, `futimes`, `fchmod`), `l` for the don't-follow-symlinks form
 * (`lchmod`, `lutimes`), and `create` / `file` for the stream constructors (`createWriteStream`,
 * `FileWriteStream`).
 *
 * This is a RULE rather than a hand-listed set of variants, which matters in both directions. A bare
 * substring match would also catch `readlink` and `readlinkSync` — read-only symbols that would then
 * red the guard for no reason, and a guard that reds for no reason is a guard that gets loosened.
 * Anchoring at a descriptor prefix admits `ftruncate` and refuses `readlink` by construction.
 */
const DESCRIPTOR_PREFIXES = Object.freeze(["", "f", "l", "create", "file"]);

function matchesWriteClassStem(name: string): boolean {
  const lower = name.toLowerCase();
  return WRITE_CLASS_STEMS.some((stem) => DESCRIPTOR_PREFIXES.some((d) => lower.startsWith(d + stem)));
}

/** Every symbol the RUNTIME exports from either filesystem module whose name matches a write stem. */
function stemMatchedRuntimeSymbols(): readonly string[] {
  const all = new Set<string>([...Object.keys(nodeFs), ...Object.keys(nodeFsPromises)]);
  return [...all].filter(matchesWriteClassStem).sort();
}

/**
 * The three symbols the stems catch that are NOT writers, each named with its reason:
 *
 *   opendir / opendirSync   read-only directory iterators; the bounded walk may legitimately want
 *                           `opendirSync`, and both are caught only by sharing the `open` stem
 *   openAsBlob              read-only; same stem, same accident
 *
 * `open` and `openSync` are deliberately NOT here. Their write-ness depends on a flag literal, a
 * name-based derivation cannot decide it, and the safe direction for a safety guard is to refuse.
 */
const STEM_FALSE_POSITIVES = Object.freeze(["openAsBlob", "opendir", "opendirSync"]);

/**
 * The cardinality of the exclusion set. A FOURTH exclusion is a decision: it means somebody has
 * judged a stem-matched symbol read-only, and that judgment belongs in the list above with its
 * reason, not in a bumped constant.
 */
const STEM_FALSE_POSITIVE_COUNT = 3;

/**
 * THE NAMESPACE RE-ENTRY MEMBERS — DERIVED FROM THE RUNTIME, never typed out (32-11).
 *
 * Some members of the `node:fs` namespace are themselves namespaces holding the whole writer set:
 * `fsns.promises.writeFile(p, "x")` and `fsns.default.writeFileSync(p, "x")` both write, and both
 * reach the writer through a SECOND member access whose own expression is not an identifier — which
 * this pass does not follow. Measured before this rule existed: a mirror planted with
 * `fsns.promises.writeFile` produced `opaqueFsAcquisitions: []` and a mutating-symbol intersection
 * of `[]`, i.e. the case that names the danger stayed green. (The two-sided closure pin did move,
 * because `promises` entered `fsSymbols` — but a cardinality pin catching a writer by accident is
 * not the same as the intersection deciding it.)
 *
 * So a member access naming a re-entry is REFUSED rather than named. The set is derived by asking
 * the runtime which object-valued members of `node:fs` carry a mutating symbol as a function, so a
 * future Node adding a third one is covered without anybody editing this file — the set-literal
 * drift class this repository has already paid for ([[grugops-set-literal-drift]]).
 */
function namespaceReentryMembers(): readonly string[] {
  const found = new Set<string>();
  for (const [key, value] of Object.entries(nodeFs as unknown as Record<string, unknown>)) {
    if (value === null || typeof value !== "object") continue;
    const inner = value as Record<string, unknown>;
    if (MUTATING_FS_SYMBOLS.some((symbol) => typeof inner[symbol] === "function")) found.add(key);
  }
  return [...found].sort();
}

/** The ambiguous pair that stays IN the mutating set, by decision rather than by omission. */
const AMBIGUOUS_RETAINED = Object.freeze(["open", "openSync"]);

const STEM_MATCHED_FS_SYMBOLS = stemMatchedRuntimeSymbols();
const MUTATING_FS_SYMBOLS = Object.freeze(
  STEM_MATCHED_FS_SYMBOLS.filter((name) => !STEM_FALSE_POSITIVES.includes(name)),
);

/** Derived, not typed: the `node:fs` members that are themselves namespaces holding the writers. */
const NAMESPACE_REENTRY_MEMBERS = Object.freeze(namespaceReentryMembers());

// The runtime-side observation, PRINTED AND VERSION-LABELLED on every run rather than pinned across
// Node majors. A reader comparing a CI log against a local log can see at a glance whether a
// disagreement is about the dashboard or about the runtime underneath it.
//
// Two shapes here were MEASURED rather than assumed, because "printed on every run" is a claim that
// is easy to make and easy to have no output behind. Against vitest 4.1.8's DEFAULT reporter:
//   • module-scope `console.log`  → printed NOTHING (collection-time console output is not surfaced)
//   • in-test / in-hook `console.log` → printed NOTHING (the default reporter surfaces console output
//     only for failing tests; `--reporter=verbose` shows it, and CI does not pass that flag)
//   • `process.stdout.write`      → printed, under the default reporter, from a hook and from a test
// So the write is direct, and it is emitted from a FILE-LEVEL `beforeAll` so that a filtered run
// (`-t "no socket"`) still carries the label.
beforeAll(() => {
  process.stdout.write(
    `board-readonly: mutating fs symbols ${MUTATING_FS_SYMBOLS.length} ` +
      `(stem-matched ${STEM_MATCHED_FS_SYMBOLS.length} minus ${STEM_FALSE_POSITIVE_COUNT} named ` +
      `exclusions) on node ${process.versions.node}\n`,
  );
  // THE RESOLUTION CENSUS IS RECORDED ON EVERY RUN (32-20). The kind and line of every admission
  // live in `resolvedCallees`; pinning those names and lines would red on any unrelated edit, so
  // what is PINNED is the kind set and what is PRINTED is the shape of the census behind it. A
  // reader comparing two runs can see whether a disagreement is about capability or about churn.
  const facts = analyzeClosure(ROOT, DASHBOARD_ENTRY);
  const kinds = new Map<string, number>();
  for (const entry of facts.resolvedCallees) {
    const kind = (entry.split("<-")[1] ?? "").trim().split("@")[0] ?? "";
    kinds.set(kind, (kinds.get(kind) ?? 0) + 1);
  }
  process.stdout.write(
    `board-readonly: ${facts.resolvedCallees.length} resolved call sites ` +
      `[${[...kinds].sort().map(([k, n]) => `${k} ${n}`).join(", ")}], ` +
      `${facts.unresolvedCallees.length} unresolved, ` +
      `${facts.globalMemberPaths.length} capability-global member paths, ` +
      `${facts.acquisitions.length} refused acquisitions\n`,
  );
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// PART ONE — the premises. Asserted BEFORE anything downstream is claimed empty.
// ═══════════════════════════════════════════════════════════════════════════════════════════════

describe("32-06 — the read-only guard asserts its own premises first", () => {
  it("PREMISE: the dashboard closure is non-empty and contains the modules under test", () => {
    const { modules } = analyzeClosure(ROOT, DASHBOARD_ENTRY);
    expect(
      modules.length,
      `PREMISE: jsImportClosure(ROOT, "${DASHBOARD_ENTRY}") returned an EMPTY closure, so every ` +
        "intersection claimed empty below measured nothing at all",
    ).toBeGreaterThan(0);
    const missing = REQUIRED_CLOSURE_MODULES.filter((m) => !modules.includes(m));
    expect(
      missing,
      `PREMISE: the closure is missing ${missing.join(", ") || "(nothing)"} — the walk reached ` +
        `something other than the dashboard's real module graph. It found: ${modules.join(", ")}`,
    ).toEqual([]);
  });

  it("PREMISE: every closure module parsed, and none parsed to nothing", () => {
    const { perModule } = analyzeClosure(ROOT, DASHBOARD_ENTRY);
    for (const [rel, facts] of perModule) {
      expect(
        facts.parseErrors,
        `PREMISE: ${rel} produced syntactic parse errors, so its symbol set is whatever the parser ` +
          "managed before giving up. An unreadable module must RED this guard, never pass it",
      ).toEqual([]);
      expect(
        facts.statements,
        `PREMISE: the parse of ${rel} yielded ZERO top-level statements, so its contribution to ` +
          "every derived set below is an empty set that means nothing",
      ).toBeGreaterThan(0);
    }
  });

  it("PREMISE: the runtime enumeration matched at least one write-class symbol", () => {
    expect(
      STEM_MATCHED_FS_SYMBOLS.length,
      "PREMISE: the write-class stems matched ZERO of the runtime's fs exports, so the mutating set " +
        "is empty and the intersection below is empty for a reason that has nothing to do with the " +
        "dashboard",
    ).toBeGreaterThan(0);
    expect(MUTATING_FS_SYMBOLS.length).toBeGreaterThan(0);
  });

  it("PREMISE: no closure module acquires a module by a route that is not a static literal import", () => {
    const facts = analyzeClosure(ROOT, DASHBOARD_ENTRY);
    // THE CANONICAL FORM, ASSERTED WHERE THE FS VERSION OF IT ALREADY WAS (32-20). A refusal of the
    // new rule reds the gate through an assertion that was already here rather than through a
    // brand-new one, so the discrimination cases and the live claim cannot drift apart.
    expect(
      facts.acquisitions,
      "PREMISE: a closure module obtains a module identity by a shape that is not a STATIC IMPORT " +
        "DECLARATION WITH A STRING-LITERAL SPECIFIER — a dynamic import, a call or construction " +
        "through an identifier no enclosing scope declares, a call reached through an unadmitted " +
        "member path on process/globalThis/global, or a read of one of those globals that is not " +
        "the object of a member access. An unprovable identity is not a safe identity, so the " +
        "acquisition is REFUSED rather than folded, guessed, or ignored",
    ).toEqual([]);
    expect(
      facts.unresolvedCallees,
      "PREMISE: a closure module calls or constructs through an identifier this pass cannot " +
        "resolve to an import binding or to a declaration in an ENCLOSING scope, and which is not " +
        "one of the named ADMITTED_GLOBAL_CALLEES. It could be anything, including a require " +
        "equivalent handing back a module",
    ).toEqual([]);
    expect(
      facts.opaqueFsAcquisitions,
      "PREMISE: a closure module reaches node:fs through a route this syntactic pass cannot " +
        "follow — a dynamic import, a require, an `export * from`, an fs module identity handed " +
        "to another call, a computed member access, or a READ of an fs-namespace binding that is " +
        "not a direct member access (a destructure, an alias, a spread, an argument, a re-export). " +
        "The derivation cannot name the symbols behind such a route, so it refuses rather than " +
        "reporting a short set",
    ).toEqual([]);
    expect(
      facts.opaqueSpecifiers,
      "PREMISE: a closure module imports from a COMPUTED specifier. The module identity behind it " +
        "is undecidable here, so the ban below could not have been asked of it",
    ).toEqual([]);
    expect(
      facts.foreignSpecifiers,
      "PREMISE: a closure module names a module by a specifier that is neither RELATIVE (./…, ../…) " +
        "nor BARE (a node builtin or a package) — an absolute or protocol-relative path, a file: or " +
        "data: URL, a drive-letter path, a #-prefixed subpath import. Admitting one CLAIMS that a " +
        "module reached by a route this repository never read is nevertheless known to hold no " +
        "writer, and no derivation in this file can make that claim: the walk cannot mirror the " +
        "target and this syntactic pass cannot name one symbol inside it. The specifier is therefore " +
        "REFUSED. It is not a list that wants another entry",
    ).toEqual([]);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// PART ONE-A — the PARTITION itself (32-31, gap-closure round 3).
//
// Everything above rests on the closure being the dashboard's real module graph, and that rests on
// every module specifier having a CLASS. Until this plan the class was decided twice, by two
// hand-written predicates that disagreed: `isBareSpecifier` here was `!startsWith(".") &&
// !startsWith("/")`, and the walker's three patterns each required a leading `.`, so the `/` prefix
// was subtracted by one and never added by the other. `32-24-RED-baseline.txt` § 4 records the ten
// spellings that measurement was taken over.
//
// The cases below assert the partition is TOTAL and that its cardinality is a value somebody moved
// on purpose, not a shape a reader infers from a union type.
// ═══════════════════════════════════════════════════════════════════════════════════════════════

/**
 * THE SPELLINGS, HELD AS DATA — one row per spelling, each with the class the one authority must
 * give it (32-31). The posture `MODULE_IDENTITY_SHAPES` established one part down: a spelling is a
 * ROW, so adding one is adding a row and moving a number somebody looks at.
 *
 * THE ROW SET IS NOT A GUESS. It contains every spelling of `32-24-RED-baseline.txt` § 4's
 * ten-spelling partition table — measured against BOTH shipped predicates, verbatim — plus the four
 * DEGENERATE members (`#internal`, `.`, `..`, the empty string) that a prefix test answers by
 * accident and a partition has to answer on purpose.
 */
const SPECIFIER_CLASS_ROWS: readonly {
  readonly name: string;
  readonly specifier: string;
  readonly cls: SpecifierClass;
}[] = Object.freeze([
  // The three the baseline measured GREEN over a live writer — in NEITHER shipped set.
  { name: "absolute POSIX path", specifier: "/abs/writer.mjs", cls: "foreign" },
  { name: "protocol-relative, resolvable host", specifier: "//localhost/abs/writer.mjs", cls: "foreign" },
  { name: "protocol-relative, UNC host", specifier: "//host/x.js", cls: "foreign" },
  // The three whose refusing authority MOVES: censused as BARE today, foreign after the cutover.
  { name: "file:// URL", specifier: "file:///abs/writer.mjs", cls: "foreign" },
  { name: "Windows drive-letter path", specifier: "C:\\x\\writer.mjs", cls: "foreign" },
  // FOUND BY MUTATION, NOT BY READING (32-31). Dropping the backslash clause from
  // `classifySpecifier` reclassified NOTHING in the table as it then stood — `C:\x\writer.mjs` is
  // already refused by the scheme check, because `C` is not `node`. The clause's only load-bearing
  // input is a backslash path with NO drive letter, which starts with an ASCII letter and carries
  // no colon, so without the clause it reads as a package called `probe`. The mutation that found
  // this is recorded in 32-31-GREEN-proof.txt; the row is what makes the clause decide something.
  { name: "Windows relative path, no drive letter", specifier: "probe\\writer.mjs", cls: "foreign" },
  { name: "data: URL", specifier: "data:text/javascript,export const a=1", cls: "foreign" },
  // The two the walk follows.
  { name: "same-directory relative", specifier: "./relative.js", cls: "relative" },
  { name: "parent-directory relative", specifier: "../up/relative.js", cls: "relative" },
  // The two the walk legitimately skips.
  { name: "node builtin, prefixed", specifier: "node:fs", cls: "bare" },
  { name: "scoped package", specifier: "@scope/pkg", cls: "bare" },
  // The degenerate members. A prefix test answers these by accident; a partition answers on purpose.
  { name: "subpath import through the manifest's import map", specifier: "#internal", cls: "foreign" },
  { name: "the current directory", specifier: ".", cls: "foreign" },
  { name: "the parent directory", specifier: "..", cls: "foreign" },
  { name: "the empty specifier", specifier: "", cls: "foreign" },
]);

/**
 * The cardinality of the spelling table. A SIXTEENTH spelling is a DECISION: it belongs above as a
 * row with the class the authority gives it, never as a bumped constant. The number is asserted
 * two-sided, because a row silently dropped and a row silently added are the same green otherwise.
 */
const SPECIFIER_CLASS_ROW_COUNT = 15;

describe("32-31 — a module specifier's class is a TOTAL partition decided in ONE place", () => {
  it("PREMISE: the partition has exactly three classes and they are the three named ones", () => {
    expect(
      SPECIFIER_CLASSES.length,
      "a FOURTH specifier class is a DECISION recorded in scripts/js-import-closure.ts with the " +
        "rule that admits it and the consumer that acts on it. Two consumers read this partition — " +
        "the closure walker and this census — and a class only one of them handles is precisely the " +
        "disagreement this cutover removed",
    ).toBe(3);
    expect([...SPECIFIER_CLASSES].sort()).toEqual(["bare", "foreign", "relative"]);
  });

  it("the spelling table has exactly the number of rows its decision records", () => {
    expect(
      SPECIFIER_CLASS_ROWS.length,
      "a SIXTEENTH spelling is a DECISION recorded as a row in SPECIFIER_CLASS_ROWS with the class " +
        "the authority gives it. It is never a bumped constant",
    ).toBe(SPECIFIER_CLASS_ROW_COUNT);
    expect(
      new Set(SPECIFIER_CLASS_ROWS.map((r) => r.specifier)).size,
      "two rows carry the same specifier, so the table's cardinality overstates what it tests",
    ).toBe(SPECIFIER_CLASS_ROW_COUNT);
  });

  it("the classes the spelling table EXERCISES are exactly the classes the partition has", () => {
    // A class nobody exercised is a class nobody has watched work. Asserting the exercised set
    // EQUALS SPECIFIER_CLASSES makes a new class visible from the moment it is added: it arrives
    // unexercised and this case says so.
    expect(
      [...new Set(SPECIFIER_CLASS_ROWS.map((r) => r.cls))].sort(),
      "the spelling table exercises a different set of classes than the partition declares, so " +
        "either a class has no row or a row names a class the partition does not have",
    ).toEqual([...SPECIFIER_CLASSES].sort());
  });

  for (const row of SPECIFIER_CLASS_ROWS) {
    it(`${row.name} (${JSON.stringify(row.specifier)}) classifies as ${row.cls}`, () => {
      expect(
        classifySpecifier(row.specifier),
        `the one authority gave ${JSON.stringify(row.specifier)} a class other than "${row.cls}". ` +
          "32-24-RED-baseline.txt § 4 records what the two predecessor predicates each answered for " +
          "this spelling; a disagreement here is the partition losing its totality",
      ).toBe(row.cls);
    });
  }

  it("this file decides no specifier's class itself — it asks the one authority", () => {
    // THE STRUCTURAL HALF OF THE CUTOVER. A rule stated once and re-implemented once is two rules,
    // and the second one is the one that goes stale while every gate over it stays green — this
    // repository's recorded second systemic failure class ([[grugops-set-literal-drift]]). So the
    // absence of a second class-deciding predicate in this file is itself asserted, over this
    // file's own bytes, rather than left to a reviewer to notice.
    const ownSource = readFileSync(join(ROOT, "scripts", "board-readonly.test.ts"), "utf8");
    const parsed = ts.createSourceFile(
      "board-readonly.test.ts",
      ownSource,
      ts.ScriptTarget.Latest,
      true,
    );
    // A class decision reads as a prefix test on a specifier-shaped value. Any `startsWith` call
    // whose argument is one of the class-bearing prefixes is one, wherever it is written.
    const CLASS_PREFIXES = Object.freeze(["./", "../", ".", "/", "node:", "@", "file:", "data:"]);
    // THE ONE NAMED EXCLUSION, in the `STEM_FALSE_POSITIVES` posture this file already uses.
    // `normalizeSpecifier` tests `node:` to answer a DIFFERENT question — module IDENTITY, whether
    // `node:fs` and `fs` are the same module — and that question is neither asked nor answered by
    // the partition. It is excluded BY NAME with its reason rather than by loosening the prefix set,
    // because dropping `node:` from the set above would let a real second class test in beside it.
    const CLASS_PREDICATE_EXCLUSIONS = Object.freeze(["normalizeSpecifier"]);
    const CLASS_PREDICATE_EXCLUSION_COUNT = 1;
    expect(
      CLASS_PREDICATE_EXCLUSIONS.length,
      "a SECOND function in this file is excused from the one-authority rule. That is a DECISION: " +
        "name it above with the different question it answers, or move its prefix test into " +
        "classifySpecifier. It is never a bumped constant",
    ).toBe(CLASS_PREDICATE_EXCLUSION_COUNT);

    const offenders: string[] = [];
    const visit = (node: ts.Node, enclosing: string): void => {
      let scope = enclosing;
      if (ts.isFunctionDeclaration(node) && node.name) scope = node.name.text;
      else if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name)) scope = node.name.text;
      if (
        ts.isCallExpression(node) &&
        ts.isPropertyAccessExpression(node.expression) &&
        node.expression.name.text === "startsWith"
      ) {
        const argument = node.arguments[0];
        if (
          argument !== undefined &&
          ts.isStringLiteralLike(argument) &&
          CLASS_PREFIXES.includes(argument.text) &&
          !CLASS_PREDICATE_EXCLUSIONS.includes(scope)
        ) {
          offenders.push(`${scope}: ${node.getText().replace(/\s+/g, " ").slice(0, 100)}`);
        }
      }
      ts.forEachChild(node, (child) => visit(child, scope));
    };
    visit(parsed, "(top level)");
    // THE EXCLUSION'S OWN PREMISE. A named exclusion for a function that no longer carries the test
    // is a permanent widening nobody notices — the drift class this repository has already paid for.
    expect(
      ownSource,
      "normalizeSpecifier is excused from the one-authority rule, and it no longer tests the " +
        '"node:" prefix. Remove the exclusion (and its count) rather than leaving the door open',
    ).toContain('specifier.startsWith("node:")');
    expect(
      offenders,
      `this file tests a class-bearing specifier prefix itself: ${offenders.join(" | ")}. The class ` +
        "of a module specifier is decided by classifySpecifier in scripts/js-import-closure.ts and " +
        "nowhere else, because a second prefix test beside it is how the walker's follow-set and " +
        "this census-set came to own different prefixes. A FOURTH ARM IS THE SHAPE THIS RULE EXISTS " +
        "TO STOP: if a spelling is misclassified, fix classifySpecifier",
    ).toEqual([]);
  });

  it("every class in the partition is REACHED by a real specifier in the live closure or refused", () => {
    // The converse of totality: a partition whose third bucket nothing ever lands in is a bucket
    // nobody has watched work. `bare` and `relative` are exercised by the live tree; `foreign` is
    // exercised by the planted rows in PART FIVE, and this case asserts the first two here so a
    // cutover that silently stopped classifying anything would be visible.
    const facts = analyzeClosure(ROOT, DASHBOARD_ENTRY);
    expect(
      facts.bareSpecifiers.length,
      "PREMISE: the live dashboard closure carries NO bare specifier, so the allow-list equality " +
        "below is a claim about an empty set",
    ).toBeGreaterThan(0);
    expect(
      facts.modules.length,
      "PREMISE: the live dashboard closure has one module, so no relative specifier was followed " +
        "and the `relative` arm of the partition was never exercised",
    ).toBeGreaterThan(1);
    expect(facts.foreignSpecifiers).toEqual([]);
  });

  it("CONVERSE: the wrapper every production caller uses does NOT refuse the legitimate tree", () => {
    // The refusal added here reaches seven production callers through `jsImportClosure`. A rule
    // that also refuses the legitimate shape is a regression, and this is where it is caught —
    // `analyzeClosure` deliberately calls the non-throwing `jsImportClosureFacts`, so without this
    // case the whole file could be green while every freshness gate in the repository was red.
    expect(() => jsImportClosure(ROOT, DASHBOARD_ENTRY)).not.toThrow();
    expect(() => jsImportClosure(ROOT, MODEL_ENTRY)).not.toThrow();
    expect(jsImportClosure(ROOT, DASHBOARD_ENTRY)).toEqual(
      analyzeClosure(ROOT, DASHBOARD_ENTRY).modules,
    );
  });

  it("the specifier scan's INPUT is code: a foreign spelling in a comment yields no row", () => {
    // THE CONVERSE FOR stripNonCode, first half. The patterns are regexes over file bytes, so prose
    // can manufacture a specifier no import statement carries — and now that `foreign` is a
    // REFUSAL rather than one harmless extra file in a mirror, a false positive is a gate that
    // refuses a tree with nothing wrong with it.
    const commented =
      "// a line comment mentioning: import { w } from \"/abs/writer.mjs\";\n" +
      "/* and a block comment: export { w } from \"//host/writer.mjs\"; */\n" +
      'import { join } from "node:path";\n' +
      'import { real } from "./real.js";\n' +
      "export const use = () => join(real);";
    const rows = moduleSpecifiers(commented);
    expect(
      rows.filter((r) => r.cls === "foreign"),
      "a specifier written only inside a comment produced a FOREIGN row, so the scan is reading " +
        "prose as code and the walk would refuse a tree that imports nothing of the kind",
    ).toEqual([]);
    expect(rows.map((r) => r.specifier).sort()).toEqual(["./real.js", "node:path"]);
  });

  it("the specifier scan's INPUT is code: a foreign spelling in a template literal yields no row", () => {
    // THE CONVERSE FOR stripNonCode, second half. This module's OWN refusal message is a template
    // literal reading `imports "${spec}"`, and scripts/compactor.js carries `"${rawVal}"` — both
    // were foreign-classified captures before this function existed.
    const templated =
      "const msg = `the module imports \"/abs/writer.mjs\" which is refused`;\n" +
      "const nested = `outer ${ `inner import \"//host/x.js\"` } tail`;\n" +
      'import { join } from "node:path";\n' +
      "export const use = () => join(msg, nested);";
    const rows = moduleSpecifiers(templated);
    expect(
      rows.filter((r) => r.cls === "foreign"),
      "a specifier written only inside a template literal produced a FOREIGN row — including a " +
        "NESTED template, which is the shape a single-level scan misses",
    ).toEqual([]);
    expect(rows.map((r) => r.specifier)).toEqual(["node:path"]);
  });

  it("stripNonCode removes no real code: a substitution's code survives, and length is preserved", () => {
    // The direction that would be silent: blanking a template literal WHOLE would delete the code
    // inside `${…}`, and a specifier the walk needs would vanish from the closure with no error
    // anywhere. The prohibition this cutover carries is explicit — never narrow the scan's input by
    // a rule that could remove a real import statement — so the converse is asserted here, and
    // CLOSURE_BASELINES asserts it again over every caller's real mirror.
    const withSubstitution =
      'const tag = `prefix ${ (await import("./inside.js")).name } suffix`;\n' +
      "export const use = () => tag;";
    const rows = moduleSpecifiers(withSubstitution);
    expect(
      rows.map((r) => r.specifier),
      "a relative import written inside a template SUBSTITUTION was blanked away with the " +
        "surrounding prose. That is real code, and a closure missing it is a mirror missing " +
        "exactly the file the walk could not see",
    ).toEqual(["./inside.js"]);
  });

  // ═════════════════════════════════════════════════════════════════════════════════════════════
  // 32-38 / review CR-01 — THE THIRD PROSE CARRIER: an ordinary string literal.
  //
  // The two cases above close the COMMENT and TEMPLATE carriers. The string-literal carrier was
  // left open by decision ("blanking them would change what the patterns see inside real code"),
  // and it was the one with a LIVE instance in the tree: `install/install.js` carries a generated
  // source line inside a single-quoted string, the `from` pattern read it as a real relative
  // specifier, and `jsImportClosure(ROOT, "install/install.js")` refused on an edge nobody wrote.
  //
  // The census that backed the old rule counted the FOREIGN class only. The live false positive
  // was in the RELATIVE class, which was never censused — the repository's own recorded probe
  // (ASK WHICH SET THE PREDICATE ENUMERATES) applied to the measurement rather than to the code.
  // The oracle below is therefore TWO-SIDED and over BOTH classes, so neither direction can rot.
  // ═════════════════════════════════════════════════════════════════════════════════════════════

  it("WR-06: a bare specifier is decided by its INTRODUCER, so a package it says it skips is not refused", () => {
    // The module's docblock says "A bare specifier is therefore skipped, not refused". The
    // implementation used to require an ASCII letter or `@`, so it REFUSED members of the class it
    // says it skips — each one a hard throw out of `jsImportClosure` rather than a skip, which is
    // the same "a gate that cannot start" shape as CR-01. RED before the fix: all four were
    // `foreign`.
    for (const pkg of ["7zip-bin", "1pkg", "_under", "\u30ce\u30fc\u30c9"]) {
      expect(
        classifySpecifier(pkg),
        `${pkg} is a legitimate package identity — npm permits a leading digit, legacy names may ` +
          "lead with an underscore, and a package name may be non-ASCII. Refusing it makes the " +
          "module's two statements about the same class disagree",
      ).toBe("bare");
    }

    // THE CONVERSE, AND IT IS THE LOAD-BEARING HALF: widening `bare` must move NOTHING out of the
    // foreign bucket, because foreign is what carries the refusal. Every introducer the bucket
    // exists for is asserted individually.
    const mustStayForeign = [
      "/abs/writer.mjs",
      "//localhost/abs/writer.mjs",
      "//host/share/writer.mjs",
      "file:///tmp/writer.mjs",
      "C:\\tmp\\writer.mjs",
      "\\\\unc\\share\\writer.mjs",
      "data:text/javascript,export const w=1",
      "#subpath/writer",
      "%2e%2e/escape.mjs",
      "",
    ];
    for (const spec of mustStayForeign) {
      expect(
        classifySpecifier(spec),
        `${JSON.stringify(spec)} LEFT the foreign bucket when the bare arm widened. Foreign is ` +
          "the arm that REFUSES, so a spelling leaving it is a refusal that silently stopped",
      ).toBe("foreign");
    }

    // AND THE PARTITION IS STILL TOTAL over the union of both lists plus the relative arm.
    for (const spec of [...mustStayForeign, "7zip-bin", "./a.js", "../b.js", "node:fs", "@s/p"]) {
      expect(SPECIFIER_CLASSES).toContain(classifySpecifier(spec));
    }
  });

  it("the specifier scan's INPUT is code: a specifier spelled inside a STRING LITERAL yields no row", () => {
    // THE CONVERSE FOR stripNonCode, third half. RED on the pre-fix scanner: the first source
    // yielded a `relative` row for "./model-tiers.js" and the second a `foreign` row for
    // "/etc/passwd", and `jsImportClosure` throws on either.
    const stringed =
      "const generated = 'import { resolvedAssignmentsIn } from \"./model-tiers.js\";';\n" +
      "const msg = \"the dial was read from '/etc/passwd'\";\n" +
      'import { join } from "node:path";\n' +
      'import { real } from "./real.js";\n' +
      "export const use = () => join(real, generated, msg);";
    const rows = moduleSpecifiers(stringed);
    expect(
      rows.map((r) => r.specifier).sort(),
      "a specifier written only inside an ordinary STRING LITERAL produced a row. Both directions " +
        "are a live refusal: a relative one names a file that does not exist, and a foreign one is " +
        "refused outright — either way a gate that cannot start looks exactly like a gate that ran " +
        "and refused, which is the failure this module's opening paragraph exists to prevent",
    ).toEqual(["./real.js", "node:path"]);
  });

  it("the walk no longer refuses install/install.js, whose strings carry a generated import line", () => {
    // The LIVE instance, asserted against the real tree rather than a fixture. No current caller
    // passes this entry, which is exactly why it went unnoticed — so it is pinned here.
    expect(
      existsSync(join(ROOT, "install/install.js")),
      "PREMISE: install/install.js does not exist, so the refusal asserted below measured nothing",
    ).toBe(true);
    expect(
      () => jsImportClosure(ROOT, "install/install.js"),
      "jsImportClosure refused install/install.js. Its strings carry a generated source line, and " +
        "reading that as an import manufactures an unresolvable edge out of prose",
    ).not.toThrow();
  });

  it("moduleSpecifiers EQUALS a real TypeScript parse over every tracked .js/.mjs — both directions", () => {
    // THE TWO-SIDED PARSER ORACLE. A one-sided check ("nothing was missed") is what let CR-01 sit
    // green: the fail-SHORT direction was clean and the fail-LONG direction was never asked over
    // the relative class. This asserts SET EQUALITY against an independent authority — the
    // TypeScript parser — so a fabricated specifier and a missed one both red, and the corpus is
    // DERIVED from the tree rather than hand-listed, so it cannot rot as files are added.
    // THE CORPUS IS DERIVED FROM GIT, not hand-listed and not walked. `git ls-files` is the same
    // definition of "tracked" the review's census used, it cannot rot as files are added, and it
    // excludes the UNTRACKED build mirrors under `.tmp-build/` that a freshness check leaves
    // behind — a walk would make this oracle's corpus depend on whether a build had just run.
    const corpus = execFileSync("git", ["ls-files", "*.js", "*.mjs"], {
      cwd: ROOT,
      encoding: "utf8",
    })
      .split("\n")
      .filter((line) => line !== "");

    expect(
      corpus.length,
      "PREMISE: the derived corpus is EMPTY, so the equality below compared nothing. A vacuous " +
        "oracle is the shape that passes while proving nothing",
    ).toBeGreaterThan(40);

    /** The independent authority: every specifier a real parse attributes to an import/export. */
    const parsed = (source: string, label: string): string[] => {
      const sf = ts.createSourceFile(label, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
      const found: string[] = [];
      const visit = (node: ts.Node): void => {
        if (
          (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
          node.moduleSpecifier !== undefined &&
          ts.isStringLiteral(node.moduleSpecifier)
        ) {
          found.push(node.moduleSpecifier.text);
        }
        if (
          ts.isCallExpression(node) &&
          node.expression.kind === ts.SyntaxKind.ImportKeyword &&
          node.arguments[0] !== undefined &&
          ts.isStringLiteral(node.arguments[0])
        ) {
          found.push(node.arguments[0].text);
        }
        ts.forEachChild(node, visit);
      };
      visit(sf);
      return found;
    };

    const fabricated: string[] = [];
    const missed: string[] = [];
    for (const rel of corpus) {
      const source = readFileSync(join(ROOT, rel), "utf8");
      const scanned = moduleSpecifiers(source).map((r) => r.specifier);
      const truth = parsed(source, rel);
      for (const spec of new Set(scanned)) {
        if (!truth.includes(spec)) fabricated.push(`${rel}: "${spec}" (${classifySpecifier(spec)})`);
      }
      for (const spec of new Set(truth)) {
        if (!scanned.includes(spec)) missed.push(`${rel}: "${spec}" (${classifySpecifier(spec)})`);
      }
    }

    expect(
      fabricated,
      "moduleSpecifiers reported a specifier NO import statement carries. Prose manufactured it, " +
        "and since the walk REFUSES an edge it cannot resolve, a fabricated specifier is a gate " +
        "that cannot start. Fix the scan's input in stripNonCode — do NOT widen the patterns and " +
        "do NOT exempt the file",
    ).toEqual([]);
    expect(
      missed,
      "moduleSpecifiers MISSED a real specifier, so a mirror built from this closure is short by " +
        "exactly the file the walk could not see and the gate that spawns it dies with " +
        "ERR_MODULE_NOT_FOUND. This is the direction that costs a crash rather than a file",
    ).toEqual([]);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// PART ONE-C — THE THIRD SIDE: NODE'S OWN LOADER (Phase 32.1, plan 32.1-01, D-09).
//
// The oracle immediately above is two-sided and both of its sides are PARSERS. That is exactly
// finding F-17: the shared regex scanner and the TypeScript parse read the same bytes with the same
// idea of what an import looks like, so a shape neither recognises is invisible to both and the
// equality stays green over a hole. An independent third side cannot be a third parser. It has to be
// the runtime — what Node's own ESM resolver was actually ASKED FOR while the closure loaded.
//
// WHAT IT BUYS, BEYOND A THIRD OPINION. The builtins Node was asked to resolve are a RUNTIME
// authority over `ALLOWED_BUILTIN_SPECIFIERS`, which until now was pinned only by reading source
// (D-10 asks for two independent predicates; this is the second, obtained for free), and the
// before/after working-tree snapshot is the DASH-04 / DASH-08 concurrency edge asserted rather than
// argued: an interrupted or concurrent corpus load mutates nothing, and what says so is a measured
// equality, not a claim about the corpus's shape.
//
// THE RECORDING IS NOT DONE HERE. `scripts/loader-oracle.test-support.ts` owns it, and its header
// records the two measurements that rule out the shapings an author reaches for first — a `load`
// hook that short-circuits records exactly ONE edge, and a hook registered inside a vitest file
// records ZERO because Vite's transform never reaches Node's resolver. Both of those produce an
// oracle that PASSES while proving nothing, which is why they are written down rather than avoided
// by habit.
// ═══════════════════════════════════════════════════════════════════════════════════════════════

describe("32.1-01 — Node's OWN loader is the independent third side of the closure oracle (D-09)", () => {
  /**
   * ONE recording for the whole block. The load is a child process; running it once and asking it
   * four questions is both cheaper and stricter than four recordings, because all four assertions
   * are then decided over the SAME run rather than over four runs that might differ.
   */
  let recorded: RuntimeAcquisitions | null = null;
  const acquisitions = (): RuntimeAcquisitions => {
    recorded ??= recordRuntimeAcquisitions(ROOT, DASHBOARD_ENTRY);
    return recorded;
  };

  it("PREMISE: the loader recorded something at all", () => {
    // THE VACUITY FLOOR, and it is not decoration. Both of the failure modes this oracle is exposed
    // to present as an EMPTY or near-empty recording that agrees with everything: a `load` hook that
    // replaces module bodies records one edge, and a hook that never sees Node's loader records
    // none. Either one makes all three equalities below true over nothing.
    //
    // The comparison value is derived from THIS recording rather than from a typed expectation of
    // which modules should appear — the floor is deliberately well under the 13 events measured on
    // this tree, because its job is to catch a truncated recording, not to pin a closure. The
    // closure is pinned by the equality in the next case, against an independent authority.
    const { events } = acquisitions();
    expect(
      events.length,
      "PREMISE: Node's resolver recorded " +
        `${events.length} event(s) for ${DASHBOARD_ENTRY}, so every equality below compared ` +
        "nothing. The two known causes are a `load` hook that short-circuits with an inert body " +
        "(which deletes the module's imports, so the walk stops at the entry) and a hook that never " +
        "reaches Node's own loader at all",
    ).toBeGreaterThan(5);
  });

  it("the RUNTIME module set equals the STATIC closure — both directions, each side named", () => {
    const { modules } = acquisitions();
    const staticClosure = [...jsImportClosure(ROOT, DASHBOARD_ENTRY)].sort();

    expect(
      staticClosure.length,
      "PREMISE: the static closure is empty, so the equality below has nothing on its other side",
    ).toBeGreaterThan(1);

    // BOTH DIRECTIONS, AS TWO NAMED LISTS, because the two failures cost different things. A module
    // the runtime loaded that the static walk did not report is a HOLE in the walk: every guard
    // built on that closure is deciding over a smaller set than the process actually acquires. A
    // module the static walk reports that the runtime never resolved is a FABRICATED edge: prose or
    // a stripped construct manufactured it, and a mirror built from it names a file that is never
    // loaded. A single `toEqual` would call both of those "not equal" and name neither.
    const staticMissed = modules.filter((rel) => !staticClosure.includes(rel));
    const staticFabricated = staticClosure.filter((rel) => !modules.includes(rel));

    expect(
      staticMissed,
      "Node's loader resolved a module the STATIC closure does not contain. The static walk has a " +
        "hole exactly this wide, and every guard decided over that closure — the fs-symbol " +
        "intersection, the builtin allow-list, the acquisitions PREMISE — has been deciding over a " +
        "smaller set than the process actually acquires",
    ).toEqual([]);
    expect(
      staticFabricated,
      "the STATIC closure contains a module Node's loader was never asked to resolve. The edge was " +
        "manufactured — by prose the scan did not strip, or by a construct read as an import — and " +
        "a mirror built from this closure names a file nothing loads",
    ).toEqual([]);
  });

  it("the RUNTIME builtin set equals ALLOWED_BUILTIN_SPECIFIERS — the second, independent predicate", () => {
    // D-10 asks for two independent predicates over this allow-list. The static one reads source and
    // reduces bare specifiers to identity; this one is what the RUNTIME was asked for. They share no
    // code and no parser, so a fourth builtin reaching the closure has to get past both.
    const { builtins } = acquisitions();
    expect(
      builtins.length,
      "PREMISE: the recording contains no builtin resolution at all, so the equality below is " +
        "vacuous — the dashboard closure demonstrably reaches fs, path and url",
    ).toBeGreaterThan(0);
    expect(
      builtins,
      "the builtins Node's loader was asked to resolve for the dashboard closure are not the ones " +
        "ALLOWED_BUILTIN_SPECIFIERS admits. A builtin present at runtime and absent from the list " +
        "is a capability the projector reaches and nobody admitted; one present in the list and " +
        "absent at runtime means the list is pinning something this closure no longer reaches",
    ).toEqual([...ALLOWED_BUILTIN_SPECIFIERS].sort());
    expect(builtins.length).toBe(ALLOWED_BUILTIN_SPECIFIER_COUNT);
  });

  it("the corpus load mutated NOTHING — the inertness argument, asserted rather than rested on", () => {
    // The argument is that `scripts/board-dashboard.js` is `is-entry`-guarded, so importing it as a
    // non-entry runs no main, and that no module in its closure writes at module scope. That
    // argument is a sentence, and a sentence is true until the next commit. This is the evidence:
    // the working tree immediately before the load, byte-for-byte against immediately after.
    //
    // It is also the DASH-04 / DASH-08 concurrency edge. An interrupted or parallel oracle run
    // mutates nothing, and what says so is this equality rather than a claim about the corpus.
    const { treeBefore, treeAfter } = acquisitions();
    expect(
      treeAfter,
      "the working tree CHANGED across the corpus load, so a writer executed while the oracle ran. " +
        "Either a closure module gained a top-level write or the entry's is-entry guard stopped " +
        "recognising that it was imported rather than run. Do not relax this assertion: it is the " +
        "only thing standing between a runtime oracle and a test that edits the repository",
    ).toBe(treeBefore);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// PART ONE-B — the REFUSALS THAT MOVED, and the callers that must not have (32-31).
//
// A cutover that gives three spellings a refusal they did not have is only half a measurement. THREE
// OTHER SPELLINGS WERE ALREADY REFUSED, and by an authority they are now LEAVING: `file:///…`,
// `C:\x\…` and `data:text/javascript,…` all begin with a letter, so `isBareSpecifier` put them in
// `bareSpecifiers` and the BUILTIN ALLOW-LIST equality refused them. `32-24-RED-baseline.txt` §§ 3.4
// and 3.5 record the six cases each of them reds today. Once `classifySpecifier` calls them
// `foreign` they stop being bare specifiers, the allow-list stops seeing them, and the new branch
// has to carry the refusal.
//
// SO THE RELOCATION IS MEASURED PER SPELLING RATHER THAN ASSERTED. The old authority was a CENSUS
// (an equality over a set of names); the new one has to red the WRITE-DETECTION MECHANISM — the
// `PREMISE:` case over `acquisitions` — or this cutover made the tree LESS safe for three spellings
// while making it safer for three others, and that net is not a thing anybody can assert from
// reading the diff.
//
// AND THE SHARED WALKER'S OTHER CALLERS ARE RE-RUN WITH LEGITIMATE INPUT. A refusal added to
// `jsImportClosure` reaches seven production gates, and narrowing the scan's input with
// `stripNonCode` is a regression risk for every edge a comment used to contribute.
// `CLOSURE_BASELINES` pins what each of them built BEFORE the cutover.
// ═══════════════════════════════════════════════════════════════════════════════════════════════

/**
 * The name of the case a relocated refusal must red. Held as a constant rather than retyped per
 * row, and asserted to be a case this file actually declares — a row naming a case that does not
 * exist is a row whose claim nobody checks.
 */
const ACQUISITIONS_PREMISE_CASE =
  "PREMISE: no closure module acquires a module by a route that is not a static literal import";

/**
 * One row per spelling whose REFUSING AUTHORITY MOVES in this cutover.
 *
 * Each row carries the authority that refused it BEFORE, the authority that refuses it AFTER, and
 * the name of the case that must red after. "Refused" without naming the refusing predicate is how
 * a round credits a rule for a red some other rule produced — the posture `MODULE_IDENTITY_SHAPES`
 * established, applied here to a refusal that is changing hands rather than appearing.
 */
const RELOCATED_SPECIFIER_ROWS: readonly {
  readonly name: string;
  readonly specifier: string;
  readonly authorityBefore: string;
  readonly authorityAfter: string;
  readonly caseAfter: string;
}[] = Object.freeze([
  {
    name: "file:// URL (baseline § 3.4 — exit 1, 6 failed | 83, through the allow-list)",
    specifier: "file:///private/tmp/grugops-probe/writer.mjs",
    authorityBefore:
      "ALLOWED_BUILTIN_SPECIFIERS equality, reached because isBareSpecifier put it in bareSpecifiers",
    authorityAfter: "the foreign-specifier branch of classifySpecifier",
    caseAfter: ACQUISITIONS_PREMISE_CASE,
  },
  {
    name: "Windows drive-letter path (baseline § 3.5 — exit 1, 6 failed | 83, through the allow-list)",
    specifier: "C:\\probe\\writer.mjs",
    authorityBefore:
      "ALLOWED_BUILTIN_SPECIFIERS equality, reached because isBareSpecifier put it in bareSpecifiers",
    authorityAfter: "the foreign-specifier branch of classifySpecifier",
    caseAfter: ACQUISITIONS_PREMISE_CASE,
  },
  {
    name: "data: URL (baseline § 4 — measured isBareSpecifier -> true, so censused as a builtin)",
    specifier: "data:text/javascript,export const probeWrite = () => {}",
    authorityBefore:
      "ALLOWED_BUILTIN_SPECIFIERS equality, reached because isBareSpecifier put it in bareSpecifiers",
    authorityAfter: "the foreign-specifier branch of classifySpecifier",
    caseAfter: ACQUISITIONS_PREMISE_CASE,
  },
]);

/** Three spellings change hands. A FOURTH is a decision recorded above with both authorities. */
const RELOCATED_SPECIFIER_ROW_COUNT = 3;

/**
 * EVERY EXISTING CALLER ENTRY, WITH THE CLOSURE IT BUILT BEFORE THE CUTOVER.
 *
 * MEASURED, not recalled: each list was read out of the PRE-cutover committed
 * `scripts/js-import-closure.js` (tree `e87fd46c`, before commit `ee73c5a9`) by importing that file
 * from a scratch copy and calling `jsImportClosure` on each entry. The transcript is in
 * `32-31-GREEN-proof.txt`.
 *
 * WHY THIS EXISTS. `jsImportClosure` now REFUSES a foreign edge, and `moduleSpecifiers` now scans
 * a NARROWED input — comments and template-literal text are blanked. The first is a regression risk
 * for every mirror the walker builds; the second is a regression risk for every edge a comment used
 * to contribute. Both would show up as a freshness gate that can no longer build its mirror, in a
 * different repository directory, days later. They show up here instead.
 */
const CLOSURE_BASELINES: readonly { readonly entry: string; readonly modules: readonly string[] }[] =
  Object.freeze([
    {
      entry: "hooks/admission-guard.js",
      modules: [
        "hooks/admission-guard.js",
        "scripts/audit-model.js",
        "scripts/audit-prepass.js",
        "scripts/check-diff-disposition.js",
        "scripts/checkpoints.js",
        "scripts/context-io.js",
        "scripts/dead-vocabulary.js",
        "scripts/frontmatter.js",
        "scripts/generate-safety-surface.js",
        "scripts/is-entry.js",
        "scripts/kit-model.js",
        "scripts/vacuity.js",
        "scripts/voice-model.js",
      ],
    },
    {
      entry: "hooks/guard.js",
      modules: [
        "hooks/guard.js",
        "scripts/audit-model.js",
        "scripts/audit-prepass.js",
        "scripts/check-diff-disposition.js",
        "scripts/checkpoints.js",
        "scripts/context-io.js",
        "scripts/dead-vocabulary.js",
        "scripts/frontmatter.js",
        "scripts/generate-safety-surface.js",
        "scripts/is-entry.js",
        "scripts/kit-model.js",
        "scripts/vacuity.js",
        "scripts/voice-model.js",
      ],
    },
    { entry: "hooks/hook-entry.js", modules: ["hooks/hook-entry.js"] },
    {
      entry: "scripts/board-dashboard.js",
      modules: [
        "scripts/board-dashboard.js",
        "scripts/board-model.js",
        "scripts/board-read.js",
        "scripts/is-entry.js",
        "scripts/kit-model.js",
      ],
    },
    { entry: "scripts/board-model.js", modules: ["scripts/board-model.js"] },
    { entry: "scripts/claim.js", modules: ["scripts/claim.js", "scripts/is-entry.js"] },
    {
      entry: "scripts/context-io.js",
      modules: [
        "scripts/audit-model.js",
        "scripts/audit-prepass.js",
        "scripts/check-diff-disposition.js",
        "scripts/checkpoints.js",
        "scripts/context-io.js",
        "scripts/dead-vocabulary.js",
        "scripts/frontmatter.js",
        "scripts/generate-safety-surface.js",
        "scripts/is-entry.js",
        "scripts/kit-model.js",
        "scripts/vacuity.js",
        "scripts/voice-model.js",
      ],
    },
    {
      entry: "scripts/generate-guarantees.js",
      modules: [
        "scripts/audit-model.js",
        "scripts/audit-prepass.js",
        "scripts/check-diff-disposition.js",
        "scripts/checkpoints.js",
        "scripts/context-io.js",
        "scripts/dead-vocabulary.js",
        "scripts/frontmatter.js",
        "scripts/generate-guarantees.js",
        "scripts/generate-safety-surface.js",
        "scripts/is-entry.js",
        "scripts/kit-model.js",
        "scripts/vacuity.js",
        "scripts/voice-model.js",
      ],
    },
    {
      entry: "scripts/trace-render.js",
      modules: [
        "scripts/audit-model.js",
        "scripts/audit-prepass.js",
        "scripts/check-diff-disposition.js",
        "scripts/checkpoints.js",
        "scripts/context-io.js",
        "scripts/dead-vocabulary.js",
        "scripts/frontmatter.js",
        "scripts/generate-safety-surface.js",
        "scripts/is-entry.js",
        "scripts/kit-model.js",
        "scripts/trace-render.js",
        "scripts/vacuity.js",
        "scripts/voice-model.js",
      ],
    },
  ]);

/** Nine entry artifacts carry a closure a gate depends on. A tenth is a decision, recorded above. */
const CLOSURE_BASELINE_COUNT = 9;

/** The number of `.ts` modules that import the shared walker, MEASURED at the time of the cutover. */
const WALKER_IMPORTER_COUNT = 12;

describe("32-31 — the refusals that MOVED are measured at the mechanism, not assumed", () => {
  it("the relocation table has exactly the number of rows its decision records", () => {
    expect(
      RELOCATED_SPECIFIER_ROWS.length,
      "a FOURTH spelling whose refusing authority moves is a DECISION: record it above with the " +
        "authority it leaves, the authority it arrives at, and the case that must red after",
    ).toBe(RELOCATED_SPECIFIER_ROW_COUNT);
    for (const row of RELOCATED_SPECIFIER_ROWS) {
      expect(row.authorityBefore.trim().length).toBeGreaterThan(0);
      expect(row.authorityAfter.trim().length).toBeGreaterThan(0);
    }
  });

  it("every relocation row names a case this file actually declares", () => {
    // A row naming a case that does not exist is a row whose claim nobody checks — and a case
    // RENAMED without the row moving with it leaves exactly that. Asserted over this file's bytes.
    const ownSource = readFileSync(join(ROOT, "scripts", "board-readonly.test.ts"), "utf8");
    for (const row of RELOCATED_SPECIFIER_ROWS) {
      expect(
        ownSource,
        `the row "${row.name}" says it reds the case "${row.caseAfter}", and this file declares no ` +
          "case by that name. Either the case was renamed and the row did not move with it, or the " +
          "row names a refusal that was never written",
      ).toContain(row.caseAfter);
    }
  });

  for (const row of RELOCATED_SPECIFIER_ROWS) {
    it(`the refusal of ${row.name} MOVED and did not weaken`, () => {
      withLiveMirror(
        {
          module: "scripts/board-read.js",
          appendSource:
            `import { probeWrite } from "${row.specifier.replace(/\\/g, "\\\\")}";\n` +
            "export const relocatedPlant = (p, b) => probeWrite(p, b);",
        },
        (mirrorRoot) => {
          const facts = analyzeClosure(mirrorRoot, DASHBOARD_ENTRY);
          // 1. IT LEFT THE OLD AUTHORITY. The allow-list census no longer sees it at all, so the
          //    equality that used to refuse it is now green over this plant.
          expect(
            normalizedBuiltinIdentities(facts),
            `${row.specifier} is still being censused as a BUILTIN IDENTITY. Then it never left ` +
              `${row.authorityBefore}, and this row is measuring the old refusal rather than the new one`,
          ).toEqual([...ALLOWED_BUILTIN_SPECIFIERS].sort());
          // 2. IT ARRIVED AT THE NEW ONE.
          expect(
            facts.foreignSpecifiers.join("\n"),
            `${row.specifier} is in neither authority. It left ${row.authorityBefore} and did not ` +
              `arrive at ${row.authorityAfter}, so this cutover made the tree LESS safe for this ` +
              "spelling than it was before",
          ).toContain(row.specifier);
          // 3. AND THE NEW AUTHORITY REDS THE MECHANISM, not a census count. The allow-list
          //    equality it left is a census; the acquisitions premise is what decides whether a
          //    write capability was reached, and it is the assertion that must fail.
          expect(
            facts.acquisitions.length,
            `${row.specifier} moved from ${row.authorityBefore} to ${row.authorityAfter}, and the ` +
              `new branch does NOT red "${row.caseAfter}". The authority it left was a CENSUS and ` +
              "the one it arrived at must be the write-detection MECHANISM, or the relocation is a " +
              "net loss for this spelling",
          ).toBeGreaterThan(0);
          expect(facts.acquisitions.join("\n")).toContain("scripts/board-read.js");
        },
      );
    });
  }

  it("the WALKER position refuses too: jsImportClosure throws, naming the module and the specifier", () => {
    // THE SECOND POSITION THE REFUSAL IS REACHED AT, asserted rather than assumed. The cutover
    // deliberately put the refusal in TWO places — `analyzeClosure` censuses a foreign specifier
    // (this file's position) and `jsImportClosure` throws on a foreign EDGE (every other caller's
    // position). Without this case the wrapper could stop refusing entirely and every assertion in
    // this file would stay green, because `analyzeClosure` calls the non-throwing facts function.
    // That is precisely the "which POSITIONS is the predicate even ASKED at" lesson.
    withLiveMirror(
      {
        module: "scripts/board-read.js",
        appendSource:
          'import { probeWrite } from "/private/tmp/grugops-probe/writer.mjs";\n' +
          "export const walkerPlant = (p, b) => probeWrite(p, b);",
      },
      (mirrorRoot) => {
        let thrown: unknown = null;
        try {
          jsImportClosure(mirrorRoot, DASHBOARD_ENTRY);
        } catch (error) {
          thrown = error;
        }
        expect(
          thrown,
          "jsImportClosure returned a closure for a tree carrying a FOREIGN edge. A caller that " +
            "mirrors that closure gets a directory missing exactly the module the walk could not " +
            "see, and the gate it spawns dies with ERR_MODULE_NOT_FOUND — which from the outside " +
            "looks exactly like a gate that ran and refused",
        ).not.toBeNull();
        const message = String((thrown as Error).message);
        expect((thrown as Error).name).toBe("ImportClosureError");
        expect(
          message,
          "the refusal does not name the MODULE that carries the edge, so a maintainer reading it " +
            "cannot find the import it is about",
        ).toContain("scripts/board-read.js");
        expect(
          message,
          "the refusal does not name the SPECIFIER it refused",
        ).toContain("/private/tmp/grugops-probe/writer.mjs");
      },
    );
  });

  it("the live closures are unmoved: no foreign specifier, and the allow-list is still three", () => {
    // The converse of every row above. A cutover that quietly moved a legitimate builtin out of the
    // allow-list would pass all three relocation rows and break the mechanism they lean on.
    const dashboard = analyzeClosure(ROOT, DASHBOARD_ENTRY);
    const model = analyzeClosure(ROOT, MODEL_ENTRY);
    expect(dashboard.foreignSpecifiers).toEqual([]);
    expect(model.foreignSpecifiers).toEqual([]);
    expect(normalizedBuiltinIdentities(dashboard)).toEqual([...ALLOWED_BUILTIN_SPECIFIERS].sort());
    expect(normalizedBuiltinIdentities(dashboard).length).toBe(ALLOWED_BUILTIN_SPECIFIER_COUNT);
    expect(bannedModulesReached(dashboard)).toEqual([]);
    expect(
      ALL_BANNED_MODULES.filter((banned) => ALLOWED_BUILTIN_SPECIFIERS.includes(banned)),
    ).toEqual([]);
  });
});

describe("32-31 — every existing caller of the shared walker still builds the same mirror", () => {
  it("the caller-entry table has exactly the number of rows its decision records", () => {
    expect(
      CLOSURE_BASELINES.length,
      "a TENTH entry artifact whose closure a gate depends on is a DECISION: record it above with " +
        "the module list measured BEFORE the change, never with the list the changed code produces",
    ).toBe(CLOSURE_BASELINE_COUNT);
    expect(new Set(CLOSURE_BASELINES.map((r) => r.entry)).size).toBe(CLOSURE_BASELINE_COUNT);
  });

  it("the set of modules that import the shared walker is DERIVED, and its size is pinned", () => {
    // THE SET-LITERAL CONVERSE. `CLOSURE_BASELINES` is hand-held data, and hand-held data rots while
    // every gate over it stays green ([[grugops-set-literal-drift]]). A NEW caller of the walker is
    // a new mirror this table does not pin, so the importer set is derived from the tree and its
    // cardinality is a number somebody has to move on purpose.
    const importers: string[] = [];
    for (const dir of ["scripts", "hooks"]) {
      for (const name of readdirSync(join(ROOT, dir))) {
        if (!name.endsWith(".ts")) continue;
        const source = readFileSync(join(ROOT, dir, name), "utf8");
        if (/from "(?:\.\.\/scripts|\.)\/js-import-closure\.js"/.test(source)) {
          importers.push(`${dir}/${name}`);
        }
      }
    }
    expect(
      importers.length,
      `${importers.sort().join(", ")} import scripts/js-import-closure.js. That count moved, so a ` +
        "caller of the shared walker was added or removed — and a NEW caller builds a mirror no row " +
        "of CLOSURE_BASELINES pins. Add its entry artifact above with the closure measured before " +
        "the next change to the walker, and move this number with it",
    ).toBe(WALKER_IMPORTER_COUNT);
  });

  for (const row of CLOSURE_BASELINES) {
    it(`the closure of ${row.entry} is byte-for-byte what it was before the cutover`, () => {
      expect(
        existsSync(join(ROOT, row.entry)),
        `PREMISE: ${row.entry} does not exist, so the closure claimed below measured nothing`,
      ).toBe(true);
      expect(
        [...jsImportClosure(ROOT, row.entry)],
        `the closure of ${row.entry} MOVED. A module that LEFT is a mirror short by exactly the ` +
          "file the walk could not see, and the gate that spawns that mirror dies with " +
          "ERR_MODULE_NOT_FOUND — which from the outside looks exactly like a gate that ran and " +
          "refused. A module that JOINED means the narrowed scan input or the new refusal changed " +
          "what this walk follows. DO NOT adjust the expectation: name the entry, the module, and " +
          "the comment or template literal that produced the old edge, and run that caller's own gate",
      ).toEqual([...row.modules]);
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// PART TWO — the derived sets, asserted by MEMBERS and by COUNT as two separate cases.
//
// A single `toEqual([...])` reports a member change and a cardinality change as the same failure,
// and the second is the one that means "a symbol landed that nobody weighed".
// ═══════════════════════════════════════════════════════════════════════════════════════════════

describe("32-06 — the closure's own fs symbol set is the blocking pin", () => {
  it("the derived closure fs symbol set has the expected MEMBERS", () => {
    expect(analyzeClosure(ROOT, DASHBOARD_ENTRY).fsSymbols).toEqual([...EXPECTED_CLOSURE_FS_SYMBOLS]);
  });

  it("the derived closure fs symbol set has the expected COUNT", () => {
    expect(
      analyzeClosure(ROOT, DASHBOARD_ENTRY).fsSymbols.length,
      "a node:fs symbol entered or left the dashboard's import closure. This is the pin a Node " +
        "upgrade cannot move, so the move came from this repository's own code: weigh the new " +
        "symbol against the read-only property and name it above — it is a decision, never a " +
        "bumped constant",
    ).toBe(EXPECTED_CLOSURE_FS_SYMBOL_COUNT);
  });

  it("the pure model's own closure carries no node:fs specifier at all (D-15, D-23)", () => {
    // A stronger and cheaper claim than "no mutating symbol": board-model.ts is pure by
    // construction, so no board byte can reach a filesystem path from inside it.
    const facts = analyzeClosure(ROOT, MODEL_ENTRY);
    expect(facts.modules.length, "PREMISE: the model closure is empty").toBeGreaterThan(0);
    const fsSpecifiers = facts.bareSpecifiers.filter(isFsSpecifier);
    expect(
      fsSpecifiers,
      `scripts/board-model.js's closure imports ${fsSpecifiers.join(", ")}. D-15 and D-23 make the ` +
        "model pure and put every filesystem touch in scripts/board-read.ts; this is the mechanical " +
        "form of that boundary",
    ).toEqual([]);
    expect(facts.fsSymbols).toEqual([]);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// PART THREE — the mutating set, and the exclusions that are decisions rather than constants.
// ═══════════════════════════════════════════════════════════════════════════════════════════════

describe("32-06 — the mutating set is derived from the runtime, and its exclusions are named", () => {
  it("every named exclusion is actually present in the stem-matched set", () => {
    // An exclusion for a symbol the stems never matched is an exclusion silently doing nothing —
    // and it would keep the count at 3 while the reason for one of the three had evaporated.
    for (const name of STEM_FALSE_POSITIVES) {
      expect(
        STEM_MATCHED_FS_SYMBOLS,
        `the exclusion "${name}" is not in the stem-matched set on node ${process.versions.node}, ` +
          "so it excludes nothing. Either the stems changed or the runtime dropped the symbol; " +
          "either way the exclusion list below is now describing something that is not there",
      ).toContain(name);
    }
  });

  it("the exclusion set has exactly three members", () => {
    expect(
      STEM_FALSE_POSITIVES.length,
      "a fourth stem exclusion is a DECISION: it asserts that a write-stem-matched symbol is " +
        "read-only. That judgment belongs beside the other three with its reason written out, not " +
        "in a bumped constant",
    ).toBe(STEM_FALSE_POSITIVE_COUNT);
  });

  it("open and openSync remain IN the mutating set", () => {
    // Their write-ness depends on the flag literal at the call site (`"w"`, `"a"`, `O_CREAT`), which
    // a name-based derivation cannot read. A guard that cannot decide must refuse.
    for (const name of AMBIGUOUS_RETAINED) {
      expect(MUTATING_FS_SYMBOLS).toContain(name);
    }
  });

  it("the stem rule admits the descriptor forms and refuses the read-only lookalikes", () => {
    // The descriptor-prefix anchoring, exercised in both directions so the rule is a control rather
    // than a coincidence of this Node version's export list.
    for (const writer of ["ftruncate", "lchmod", "futimes", "createWriteStream", "mkdtempSync"]) {
      expect(matchesWriteClassStem(writer), `${writer} should match a write-class stem`).toBe(true);
    }
    for (const reader of ["readlink", "readlinkSync", "readFileSync", "statSync", "watch"]) {
      expect(matchesWriteClassStem(reader), `${reader} must NOT match a write-class stem`).toBe(false);
    }
  });

  it("the dashboard closure reaches NO mutating fs symbol", () => {
    const { fsSymbols } = analyzeClosure(ROOT, DASHBOARD_ENTRY);
    const reachable = fsSymbols.filter((s) => MUTATING_FS_SYMBOLS.includes(s));
    expect(
      reachable,
      `the board projector's import closure reaches the mutating node:fs symbol(s) ` +
        `${reachable.join(", ")}. The projector renders state and changes nothing (DASH-06); a ` +
        "writer in its closure makes it a control plane",
    ).toEqual([]);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// PART FOUR — module IDENTITY (DASH-06 and DASH-08 both), decided by an ALLOW-LIST.
//
// `jsImportClosure` gives the FILE list but deliberately skips BARE specifiers — its own docblock
// says so — so this part needs the second AST pass PART ONE already collected. A claim asserted over
// an empty specifier set is a green that measured nothing, so the set is asserted non-empty first.
// ═══════════════════════════════════════════════════════════════════════════════════════════════

/**
 * THE BUILTIN IDENTITIES THE DASHBOARD CLOSURE MAY REACH — MEASURED, then pinned in BOTH directions.
 *
 * WHY THIS REPLACED A DENY-LIST, WITH THE MEASUREMENT THAT FORCED IT (32-20, closing 32-REVIEW.md
 * WR-02 and 32-VERIFICATION.md gap 2). Until 32-20 the module question was decided by
 * `BANNED_MODULES` + `ADDITIONAL_BANNED_MODULES`: fifteen hand-typed names to REFUSE. Every builtin
 * outside those fifteen was admitted by construction — including three that create and write files
 * with no obfuscation whatsoever. Measured against the COMMITTED `.js` and recorded verbatim in
 * `.planning/phases/32-board-projector-cli-dashboard/32-20-RED-baseline.txt`:
 *
 *   import { writeHeapSnapshot } from "node:v8";   export const d = (p) => writeHeapSnapshot(p);
 *        npm run check:dashboard-readonly → exit 0, 59 passed / 59
 *   import { DatabaseSync } from "node:sqlite";    export const d = (p) => new DatabaseSync(p);
 *        npm run check:dashboard-readonly → exit 0, 59 passed / 59
 *   import { runInNewContext } from "node:vm";     export const e = (s) => runInNewContext(s);
 *        npm run check:dashboard-readonly → exit 0, 59 passed / 59
 *
 * So the rule is inverted, to the same posture 32-11 gave the namespace binding one register over:
 * state the CANONICAL FORM and refuse the complement. The live normalized bare-specifier set must
 * EQUAL this list — members in both directions, plus a count. Equality rather than containment is
 * the whole point: a builtin nobody has met yet is refused BY CONSTRUCTION rather than by having
 * been listed, and a new legitimate import becomes a decision somebody records here with its reason.
 *
 * WRITTEN WITHOUT THE `node:` PREFIX because the question is module IDENTITY: `v8` and `node:v8` are
 * the same module, and a rule that only knew one spelling is a rule an import walks around by
 * deleting five characters. `normalizeSpecifier` is what makes the two spellings one identity.
 */
const ALLOWED_BUILTIN_SPECIFIERS = Object.freeze([
  // "fs" — the bounded READ surface this whole file exists to bound: existsSync, readFileSync,
  //        readdirSync, realpathSync, statSync, watch. Brought in by scripts/board-dashboard.js,
  //        scripts/board-read.js, scripts/is-entry.js and scripts/kit-model.js. WHICH symbols of it
  //        are reachable is decided separately, by the two-sided pin in PART TWO.
  "fs",
  // "path" — join / dirname / relative / resolve over paths the containment authority has already
  //        decided. Brought in by scripts/board-dashboard.js, scripts/board-read.js,
  //        scripts/kit-model.js. It touches no descriptor and opens nothing.
  "path",
  // "url" — fileURLToPath / pathToFileURL, used by scripts/is-entry.js for the "was this module the
  //        entrypoint" comparison. Pure string work over a URL; it performs no I/O.
  "url",
]);

/**
 * The cardinality of the allow-list. A FOURTH admitted builtin is a DECISION: somebody has judged
 * that the projector may reach a capability it could not reach before, and that judgment belongs in
 * the list above with the reason and the module that brings it in — never in a bumped constant.
 */
const ALLOWED_BUILTIN_SPECIFIER_COUNT = 3;

/** Every bare specifier the closure reaches, reduced to module IDENTITY and de-duplicated. */
function normalizedBuiltinIdentities(facts: ClosureFacts): readonly string[] {
  return [...new Set(facts.bareSpecifiers.map(normalizeSpecifier))].sort();
}

/**
 * D-21's five banned modules, verbatim.
 *
 * WHAT THIS LIST IS NOW (32-20). It is the WRITTEN RECORD of D-21 — the decision that the projector
 * spawns nothing and listens on nothing — and it no longer DECIDES the module question on its own.
 * `ALLOWED_BUILTIN_SPECIFIERS` decides it, and it refuses all fifteen of these names plus every
 * other builtin by construction. The list is kept because deleting it would delete the record of a
 * decision, and a decision nobody can find gets re-litigated.
 *
 * THE TWO STATEMENTS MUST NOT DRIFT APART, so their disagreement is itself a case: every banned
 * identity is asserted ABSENT from the allow-list. Without that, a later edit could admit `net` in
 * one place while the other place still said it was banned, and both would be green.
 */
const BANNED_MODULES = Object.freeze([
  "child_process",
  "net",
  "http",
  "https",
  "worker_threads",
]);

/** The cardinality D-21 names. */
const BANNED_MODULE_COUNT = 5;

/**
 * The rest of the socket family, added here because the five above do not cover it and every one of
 * these opens a listening socket or forks a process (deviation from the plan text, Rule 2 — see the
 * plan summary). Each with the reason it belongs:
 *
 *   http2      a listening HTTP/2 server, and not reachable through `node:http`
 *   dgram      UDP sockets, which no member of the five above covers
 *   tls        TLS sockets and `tls.createServer`
 *   cluster    forks worker processes and shares server handles between them
 *   inspector  `inspector.open()` starts a debugger WebSocket server on a port
 *
 * This is a SECOND named set rather than five more members of the first, so that D-21's own
 * cardinality assertion stays exactly the number D-21 states and this extension stays visibly an
 * extension.
 *
 * Like `BANNED_MODULES`, and for the same reason, this is now a RECORD rather than the deciding
 * predicate (32-20): the ten names below are refused because they are not in
 * `ALLOWED_BUILTIN_SPECIFIERS`, exactly as `node:v8` and `node:sqlite` are — neither of which any
 * deny-list here ever named.
 */
const ADDITIONAL_BANNED_MODULES = Object.freeze([
  "http2",
  "dgram",
  "tls",
  "cluster",
  "inspector",
]);

/** The cardinality of the extension. A sixth is a decision, made here rather than in a constant. */
const ADDITIONAL_BANNED_MODULE_COUNT = 5;

const ALL_BANNED_MODULES = Object.freeze([...BANNED_MODULES, ...ADDITIONAL_BANNED_MODULES]);

/**
 * The banned identities a closure actually reaches, by normalized name, sorted.
 *
 * NOT THE DECIDING PREDICATE ANY MORE (32-20). It survives as the thing that puts a D-21 NAME in a
 * failure message — "the closure reaches net" reads better than "the identity set gained a member" —
 * and as the input to the two planted-socket discrimination cases. Every assertion it appears in is
 * accompanied by the allow-list equality, which is what actually refuses.
 */
function bannedModulesReached(facts: ClosureFacts): readonly string[] {
  return [
    ...new Set(
      facts.bareSpecifiers
        .map(normalizeSpecifier)
        .filter((identity) => ALL_BANNED_MODULES.includes(identity)),
    ),
  ].sort();
}

describe("32-20 — the builtin identities the closure may reach are an ALLOW-LIST, pinned two-sided", () => {
  it("PREMISE: the allow-list is non-empty and every entry is REACHABLE in the live closure", () => {
    // Two directions of the same premise. An empty allow-list would make the equality below a claim
    // about nothing; an entry the closure stopped importing would be a permanent widening nobody
    // notices — the admission stays granted long after the reason for it evaporated, which is the
    // set-literal drift class this repository has already paid for ([[grugops-set-literal-drift]]).
    expect(
      ALLOWED_BUILTIN_SPECIFIERS.length,
      "PREMISE: the builtin allow-list is EMPTY, so the equality below says the closure imports no " +
        "builtin at all, and it would be green only over a closure that imports nothing",
    ).toBeGreaterThan(0);
    const live = normalizedBuiltinIdentities(analyzeClosure(ROOT, DASHBOARD_ENTRY));
    for (const allowed of ALLOWED_BUILTIN_SPECIFIERS) {
      expect(
        live,
        `the allow-list admits "${allowed}", and no module in the dashboard closure imports it any ` +
          "more. An admission whose reason has evaporated is a permanent widening: remove the entry " +
          "(and its reason) rather than leaving the door open for the next import that wants it",
      ).toContain(allowed);
    }
  });

  it("the closure's normalized builtin identities have exactly the allowed MEMBERS", () => {
    const live = normalizedBuiltinIdentities(analyzeClosure(ROOT, DASHBOARD_ENTRY));
    const unadmitted = live.filter((identity) => !ALLOWED_BUILTIN_SPECIFIERS.includes(identity));
    expect(
      unadmitted,
      `the dashboard closure reaches the builtin(s) ${unadmitted.join(", ")}, which nobody has ` +
        "admitted. THIS IS A DECISION, not a constant: a builtin is a capability, and three of the " +
        "ones this rule refuses (node:v8's writeHeapSnapshot, node:sqlite's DatabaseSync, " +
        "node:vm) create and write files while naming no fs symbol at all. If the import is " +
        "legitimate, add the identity to ALLOWED_BUILTIN_SPECIFIERS with the reason it belongs and " +
        "the module that brings it in, and move the count with it",
    ).toEqual([]);
    expect(live).toEqual([...ALLOWED_BUILTIN_SPECIFIERS].sort());
  });

  it("the closure's normalized builtin identity set has the expected COUNT", () => {
    expect(
      normalizedBuiltinIdentities(analyzeClosure(ROOT, DASHBOARD_ENTRY)).length,
      "the number of distinct builtins the projector can reach moved. Like the fs symbol count, " +
        "this is a function of THIS repository's code rather than of the Node version, so the move " +
        "came from a commit here: weigh the change against 'the projector renders state and changes " +
        "nothing' and record it above — it is never a bumped constant",
    ).toBe(ALLOWED_BUILTIN_SPECIFIER_COUNT);
  });

  it("every banned identity is ABSENT from the allow-list, so the record and the rule cannot disagree", () => {
    // D-21's list is now documentation and the allow-list is the rule. Two statements about the same
    // question, free to drift, is the Phase 29 LANG-04 shape: the relocated copy passed everything
    // the first one refused. They are asserted to agree instead.
    const contradictions = ALL_BANNED_MODULES.filter((banned) =>
      ALLOWED_BUILTIN_SPECIFIERS.includes(banned),
    );
    expect(
      contradictions,
      `${contradictions.join(", ")} is recorded as BANNED by D-21 and simultaneously ADMITTED by ` +
        "the allow-list. One of the two statements is wrong, and while they disagree the gate is " +
        "green over a module D-21 says the projector must not reach",
    ).toEqual([]);
  });

  it("POSITIVE CONTROL: importing an ALLOW-LISTED builtin read-only leaves the gate green", () => {
    // Without this case the rule could refuse EVERY builtin — including the three the dashboard
    // legitimately needs — and still look correct. A rule with no positive control is a rule nobody
    // can tell apart from a refusal of everything, and it is the version that gets loosened.
    withLiveMirror(
      {
        module: "scripts/board-read.js",
        appendSource:
          'import { basename, extname } from "node:path";\n' +
          "export const stemOf20 = (p) => basename(p, extname(p));",
      },
      (mirrorRoot) => {
        const facts = analyzeClosure(mirrorRoot, DASHBOARD_ENTRY);
        expect(normalizedBuiltinIdentities(facts)).toEqual([...ALLOWED_BUILTIN_SPECIFIERS].sort());
        expect(normalizedBuiltinIdentities(facts).length).toBe(ALLOWED_BUILTIN_SPECIFIER_COUNT);
        expect(facts.fsSymbols).toEqual([...EXPECTED_CLOSURE_FS_SYMBOLS]);
        expect(facts.fsSymbols.length).toBe(EXPECTED_CLOSURE_FS_SYMBOL_COUNT);
        expect(facts.opaqueFsAcquisitions).toEqual([]);
      },
    );
  });
});

describe("32-20 — one admitted way to acquire a module, and a two-sided census of the globals", () => {
  it("PREMISE: the capability-global census is non-empty and its root set has three members", () => {
    const facts = analyzeClosure(ROOT, DASHBOARD_ENTRY);
    expect(
      facts.globalMemberPaths.length,
      "PREMISE: the census collected ZERO member paths on process/globalThis/global across the " +
        "whole closure, so the two-sided pin below is a statement about an empty set and the " +
        "process report writer would sail through it",
    ).toBeGreaterThan(0);
    expect(
      CAPABILITY_GLOBAL_ROOTS.length,
      "the capability-global ROOT set moved. A fourth root means a capability is now reachable " +
        "through a spelling nobody has weighed; a third removed means the census stopped looking " +
        "somewhere it used to look. Either way it is a decision recorded beside the roots",
    ).toBe(CAPABILITY_GLOBAL_ROOT_COUNT);
  });

  it("the capability-global member paths have exactly the expected MEMBERS", () => {
    const facts = analyzeClosure(ROOT, DASHBOARD_ENTRY);
    const unadmitted = facts.globalMemberPaths.filter(
      (path) => !EXPECTED_GLOBAL_MEMBER_PATHS.includes(path),
    );
    expect(
      unadmitted,
      `the closure reaches ${unadmitted.join(", ")} on a capability-bearing global, and nobody has ` +
        "admitted that path. THIS IS THE RULE THAT REFUSES A CAPABILITY REACHED WITHOUT A MODULE: " +
        "`process.report.writeReport(p)` creates and writes a file with no import anywhere, and it " +
        "was measured green over this closure before the census existed (32-20-RED-baseline.txt). " +
        "WHAT RECORDING THE PATH WOULD CLAIM, rather than what it would cost: that the projector " +
        "NEEDS this platform capability and that reaching it changes nothing outside the process. " +
        "Recording it here buys nothing on its own — the position rule is a SECOND decision. A " +
        "read of the path anywhere but as a callee of an admitted call, or as the object of a " +
        "further member access, is still an acquisition until the path is ALSO recorded in " +
        "ADMITTED_BOUND_MEMBER_PATHS with the written reason a BINDING of it is read-only, and " +
        "ADMITTED_BOUND_MEMBER_PATH_COUNT moved with it. That second claim is the one " +
        "`process.report` cannot survive: a binding of it hands the caller writeReport. This " +
        "message deliberately does not name a cheapest way back to green — the cheapest edit was " +
        "the bypass (32-32-RED-baseline.txt § 3)",
    ).toEqual([]);
    expect(facts.globalMemberPaths).toEqual([...EXPECTED_GLOBAL_MEMBER_PATHS].sort());
  });

  it("the capability-global member-path census has the expected COUNT", () => {
    expect(
      analyzeClosure(ROOT, DASHBOARD_ENTRY).globalMemberPaths.length,
      "the number of distinct platform capabilities the projector reaches moved. Like the fs " +
        "symbol count and the builtin identity count, this is a function of THIS repository's " +
        "code — weigh the change against 'it renders state and changes nothing' and record it. " +
        "WHAT MOVING THIS COUNT WOULD CLAIM: that the projector now legitimately reaches one more " +
        "platform capability than it did. It does NOT claim that a BINDING of that capability is " +
        "safe, and it does not re-green a read of it outside a callee position — that is a " +
        "separate claim carried by ADMITTED_BOUND_MEMBER_PATHS and its own count, which must move " +
        "too. Two sets, two counts, two written reasons: recording a spelling in one of them is " +
        "the bypass this pair exists to stop, measured at exit 0 / 135 passed over a live file " +
        "writer in 32-32-RED-baseline.txt § 3",
    ).toBe(EXPECTED_GLOBAL_MEMBER_PATH_COUNT);
  });

  it("every expected member path is REACHABLE, so no admission outlives its reason", () => {
    const live = analyzeClosure(ROOT, DASHBOARD_ENTRY).globalMemberPaths;
    for (const path of EXPECTED_GLOBAL_MEMBER_PATHS) {
      expect(
        live,
        `"${path}" is admitted and no closure module reaches it any more. A permanent admission ` +
          "whose reason has evaporated is the set-literal drift class this repository has paid " +
          "for: remove the entry rather than leaving the door open",
      ).toContain(path);
    }
  });

  it("PREMISE: the resolved-callee census is non-empty, so the resolution rule decided something", () => {
    expect(
      analyzeClosure(ROOT, DASHBOARD_ENTRY).resolvedCallees.length,
      "PREMISE: ZERO callees resolved across the whole closure, so either the closure calls " +
        "nothing or the resolver broke. Both make the unresolved-callee refusal a claim about an " +
        "empty denominator — the false-green this repository has recorded six instances of",
    ).toBeGreaterThan(0);
  });

  it("every resolution is by a declaration of a PINNED KIND — the converse axis", () => {
    // AXIS ONE is ADMITTED_GLOBAL_CALLEES: what may be called with no declaration at all. THIS is
    // axis two: the shapes of declaration that admit a callee. Pinning only one of the two is the
    // P31 round-2 shape — writer-set derived, predicate-set still hand-typed — so both are pinned.
    //
    // WHY THE KIND AND NOT THE NAME→LINE MAP — a deviation from this plan's text, with the
    // measurement behind it. The live closure resolves 311 call sites across its five modules (the
    // number is PRINTED by the file-level `beforeAll` on every run, so it is checkable rather than
    // remembered). A pin over those names and lines would red on any unrelated edit to any closure
    // module — a renamed helper, an inserted comment shifting a line — and this file's own docblock
    // already records what happens to a pin that reds for an unrelated reason: it gets loosened
    // until it stops noticing, which is how the runtime-cardinality pin was argued out of existence
    // twenty lines above. The KIND set is a function of capability rather than of churn. The
    // dead-declaration hazard the name→line map was meant to catch is closed STRUCTURALLY instead,
    // by resolving against the ENCLOSING scope chain rather than a file-level census of declared
    // names — see `declaredDirectlyIn` and the block-scoped discrimination case below.
    const facts = analyzeClosure(ROOT, DASHBOARD_ENTRY);
    const kindOf = (entry: string): string => (entry.split("<-")[1] ?? "").trim().split("@")[0] ?? "";
    const kinds = [...new Set(facts.resolvedCallees.map(kindOf))].sort();
    const unpinned = kinds.filter((kind) => !RESOLVING_DECLARATION_KINDS.includes(kind));
    expect(
      unpinned,
      `a callee is admitted by a declaration of kind ${unpinned.join(", ")}, which nobody has ` +
        "weighed. The offending census entries: " +
        facts.resolvedCallees.filter((entry) => unpinned.includes(kindOf(entry))).join(" | "),
    ).toEqual([]);
    expect(
      RESOLVING_DECLARATION_KINDS.length,
      "the set of declaration shapes that may admit a callee moved. It is what 'resolved' MEANS " +
        "here, and it is a decision",
    ).toBe(RESOLVING_DECLARATION_KIND_COUNT);
  });

  it("the admitted-global callee set is exactly ten, and every member is actually called", () => {
    expect(
      ADMITTED_GLOBAL_CALLEES.length,
      "an eleventh callee admitted WITHOUT a declaration is a DECISION: it asserts that a global " +
        "this pass cannot see is inert. `eval`, `Function`, `require` and `createRequire` are " +
        "deliberately absent — they are refused by that absence, which is what makes this an " +
        "allow-list rather than a sixteenth deny-list",
    ).toBe(ADMITTED_GLOBAL_CALLEE_COUNT);
    expect(new Set(ADMITTED_GLOBAL_CALLEES).size).toBe(ADMITTED_GLOBAL_CALLEES.length);
    // An exemption for a callee nobody calls is an exemption silently doing nothing, while keeping
    // the count at ten and the door open. Derived from the live closure, never assumed.
    const called = new Set<string>();
    for (const rel of analyzeClosure(ROOT, DASHBOARD_ENTRY).modules) {
      const text = readFileSync(join(ROOT, rel), "utf8");
      for (const name of ADMITTED_GLOBAL_CALLEES) {
        if (new RegExp(`(?:^|[^\\w.$])${name}\\s*\\(`).test(text)) called.add(name);
      }
    }
    const idle = ADMITTED_GLOBAL_CALLEES.filter((name) => !called.has(name));
    expect(
      idle,
      `the admitted-global callee(s) ${idle.join(", ")} are not called anywhere in the closure, so ` +
        "the exemption grants something nobody uses. Remove it with its reason",
    ).toEqual([]);
  });

  it("a RUNTIME-ASSEMBLED module identity is refused (F-03, the residual 32-11 named)", () => {
    // MEASURED GREEN BEFORE THIS RULE, verbatim from 32-20-RED-baseline.txt and from
    // 32-14-ADVERSARIAL-REVIEW.md §F-03: exit 0, 59 passed / 59 over a module that writes any path
    // handed to it. The identity is not a literal, so the fs-namespace rule could not see it by
    // construction — and the answer is refusal, not a cleverer pass.
    withLiveMirror(
      {
        module: "scripts/board-read.js",
        appendSource:
          'const assembled20 = process.getBuiltinModule("node:" + "fs");\n' +
          'export const writeVia20 = (p) => assembled20.writeFileSync(p, "x");',
      },
      (mirrorRoot) => {
        const facts = analyzeClosure(mirrorRoot, DASHBOARD_ENTRY);
        expect(
          facts.acquisitions.length,
          "a runtime-assembled module identity was NOT refused. Collected: " +
            `[${facts.acquisitions.join(" | ")}]`,
        ).toBeGreaterThan(0);
        expect(facts.acquisitions.join("\n")).toContain("scripts/board-read.js");
        expect(facts.globalMemberPaths).toContain("process.getBuiltinModule");
      },
    );
  });

  it("a write capability reached through a GLOBAL with no import at all is refused (WR-02)", () => {
    withLiveMirror(
      {
        module: "scripts/board-read.js",
        appendSource: "export const dump20 = (p) => process.report.writeReport(p);",
      },
      (mirrorRoot) => {
        const facts = analyzeClosure(mirrorRoot, DASHBOARD_ENTRY);
        expect(facts.globalMemberPaths).toContain("process.report.writeReport");
        expect(
          facts.globalMemberPaths.filter((p) => !EXPECTED_GLOBAL_MEMBER_PATHS.includes(p)),
          "process.report.writeReport creates and writes a JSON file at any path handed to it, " +
            "with NO import anywhere in the module. The census is the only thing that can see it",
        ).not.toEqual([]);
        expect(facts.acquisitions.length).toBeGreaterThan(0);
        // …and NOTHING else in this file moved: no fs symbol, no builtin identity, no banned module.
        expect(facts.fsSymbols).toEqual([...EXPECTED_CLOSURE_FS_SYMBOLS]);
        expect(normalizedBuiltinIdentities(facts)).toEqual([...ALLOWED_BUILTIN_SPECIFIERS].sort());
        expect(bannedModulesReached(facts)).toEqual([]);
      },
    );
  });

  it("a DYNAMIC IMPORT of any specifier is an acquisition, fs or not", () => {
    withLiveMirror(
      {
        module: "scripts/board-read.js",
        appendSource:
          'const dyn20 = await import("node:v8");\nexport const heap20 = (p) => dyn20.writeHeapSnapshot(p);',
      },
      (mirrorRoot) => {
        const facts = analyzeClosure(mirrorRoot, DASHBOARD_ENTRY);
        expect(facts.acquisitions.length).toBeGreaterThan(0);
        expect(facts.acquisitions.join("\n")).toContain("scripts/board-read.js");
      },
    );
  });

  it("a REQUIRE-EQUIVALENT through an unresolvable callee is refused by name", () => {
    withLiveMirror(
      {
        module: "scripts/board-read.js",
        appendSource: 'export const req20 = (p) => __acquire20("node:v8").writeHeapSnapshot(p);',
      },
      (mirrorRoot) => {
        const facts = analyzeClosure(mirrorRoot, DASHBOARD_ENTRY);
        expect(facts.unresolvedCallees.join("\n")).toContain("__acquire20");
        expect(facts.acquisitions.length).toBeGreaterThan(0);
      },
    );
  });

  it("a DEAD BLOCK-SCOPED declaration does NOT resolve a callee in an outer scope", () => {
    // THE "ONE DEAD DECLARATION DISABLES THE BAN" SHAPE, refused by construction. Resolution walks
    // the ancestor chain from the call site, so a declaration in a scope the call is not inside
    // resolves nothing. A file-level census of declared names — the obvious implementation — would
    // admit this callee, and the call would still reach the real global at runtime.
    withLiveMirror(
      {
        module: "scripts/board-read.js",
        appendSource:
          "{\n  const __acquire21 = (s) => s;\n  void __acquire21;\n}\n" +
          'export const req21 = (p) => __acquire21("node:v8").writeHeapSnapshot(p);',
      },
      (mirrorRoot) => {
        const facts = analyzeClosure(mirrorRoot, DASHBOARD_ENTRY);
        expect(
          facts.unresolvedCallees.join("\n"),
          "a block-scoped declaration in a scope the call site is not inside resolved the callee, " +
            "so a dead `const` now admits a call that reaches whatever the real binding is",
        ).toContain("__acquire21");
      },
    );
  });

  it("a LOCAL SHADOWING a capability-bearing global is still censused (name-scoped, toward refusal)", () => {
    withLiveMirror(
      {
        module: "scripts/board-read.js",
        appendSource:
          'function shadow20(process) { return process.report.writeReport("/tmp/x"); }\n' +
          "export const wShadow20 = shadow20;",
      },
      (mirrorRoot) => {
        const facts = analyzeClosure(mirrorRoot, DASHBOARD_ENTRY);
        expect(
          facts.globalMemberPaths,
          "the census is NAME-scoped rather than binding-scoped on purpose: a parameter that " +
            "reuses a capability-bearing global's spelling is treated as the global, because the " +
            "imprecision then runs toward REFUSAL — the only direction a safety guard may be " +
            "imprecise in",
        ).toContain("process.report.writeReport");
      },
    );
  });

  it("an ALIAS of a capability-bearing global is refused: the one admitted read is a member access", () => {
    // Without this, the census is walked around in two lines: bind the global to another name and
    // the member path is no longer rooted at a spelling the census knows. Same canonical form the
    // fs namespace rule states, one register over.
    withLiveMirror(
      {
        module: "scripts/board-read.js",
        appendSource:
          "const aliased20 = process;\n" +
          'export const wAlias20 = (p) => aliased20.report.writeReport(p);',
      },
      (mirrorRoot) => {
        const facts = analyzeClosure(mirrorRoot, DASHBOARD_ENTRY);
        expect(
          facts.acquisitions.length,
          "a capability-bearing global was READ outside a member access — aliased, destructured, " +
            "spread, passed or returned — and the member paths reached through the new name are " +
            `invisible to the census. Collected: [${facts.acquisitions.join(" | ")}]`,
        ).toBeGreaterThan(0);
      },
    );
  });

  it("POSITIVE CONTROLS: the four capabilities the closure legitimately uses stay admitted", () => {
    // A rule with no positive control is a rule nobody can tell apart from a refusal of everything.
    // The argument vector, both output channels, the exit function and the environment are what the
    // dashboard is FOR; if this rule refused them it would be loosened within a day.
    withLiveMirror(
      {
        module: "scripts/board-read.js",
        appendSource:
          // The environment read uses a COMPUTED key because that is the shape the live closure
          // uses and therefore the shape that is pinned. A LITERAL key normalizes to a DIFFERENT
          // path (`process.env.NO_COLOR`), which this rule refuses until somebody records it —
          // measured while writing this case, and kept as-is: naming which variable the projector
          // reads is exactly the kind of thing that should be a decision.
          "export const control20 = () => {\n" +
          "  const argv = process.argv.slice(2);\n" +
          '  const width = process.stdout.columns;\n' +
          '  const envKey = ["NO", "COLOR"].join("_");\n' +
          "  const quiet = process.env[envKey];\n" +
          "  if (argv.length < 0) process.exit(1);\n" +
          "  return [argv, width, quiet, process.stderr, process.stdout, process.cwd()];\n" +
          "};",
      },
      (mirrorRoot) => {
        const facts = analyzeClosure(mirrorRoot, DASHBOARD_ENTRY);
        expect(
          facts.globalMemberPaths.filter((p) => !EXPECTED_GLOBAL_MEMBER_PATHS.includes(p)),
          "a member path the dashboard legitimately uses was refused. Over-refusal is not the safe " +
            "direction here: a rule that reds the real closure gets loosened under that pressure " +
            "and ends weaker than the rule it replaced",
        ).toEqual([]);
        expect(facts.acquisitions).toEqual([]);
        expect(facts.unresolvedCallees).toEqual([]);
        expect(facts.fsSymbols).toEqual([...EXPECTED_CLOSURE_FS_SYMBOLS]);
        expect(facts.fsSymbols.length).toBe(EXPECTED_CLOSURE_FS_SYMBOL_COUNT);
      },
    );
  });
});

describe("32-06 — the dashboard opens no socket and spawns no process", () => {
  it("PREMISE: the collected bare-specifier set is non-empty", () => {
    // The closure walker skips bare specifiers, so this set is produced by a DIFFERENT pass than the
    // module list. If that pass collected nothing, the ban below is a statement about an empty set.
    const { bareSpecifiers } = analyzeClosure(ROOT, DASHBOARD_ENTRY);
    expect(
      bareSpecifiers.length,
      "PREMISE: the second AST pass collected ZERO bare specifiers across the whole dashboard " +
        "closure, so the module ban below was asked of nothing at all",
    ).toBeGreaterThan(0);
    // `node:url` arrives transitively through scripts/is-entry.js and is a known-safe read-only
    // builtin. It is named here so a reader can tell "the pass sees transitive specifiers" from
    // "the pass only sees the entry's own".
    expect(bareSpecifiers).toContain("node:url");
  });

  it("the banned list has exactly the five members D-21 names", () => {
    expect(
      BANNED_MODULES.length,
      "the D-21 ban list moved. Adding or removing a banned module changes what 'no socket' means " +
        "for the projector — it is a decision, never a bumped constant",
    ).toBe(BANNED_MODULE_COUNT);
    expect([...BANNED_MODULES].sort()).toEqual([
      "child_process",
      "http",
      "https",
      "net",
      "worker_threads",
    ]);
  });

  it("the socket-family extension has exactly five members", () => {
    expect(
      ADDITIONAL_BANNED_MODULES.length,
      "the socket-family extension moved. Every member of it opens a listening socket or forks a " +
        "process, so a sixth is a decision that belongs beside the other five with its reason",
    ).toBe(ADDITIONAL_BANNED_MODULE_COUNT);
  });

  it("the dashboard closure imports no banned module (a COROLLARY of the allow-list, not the rule)", () => {
    // This case names D-21's modules in its failure message, which is worth keeping. It is NOT what
    // decides: the allow-list above refuses these fifteen and every other builtin, and it is
    // asserted here beside the corollary so this case cannot be green while the rule is red.
    const facts = analyzeClosure(ROOT, DASHBOARD_ENTRY);
    const reached = bannedModulesReached(facts);
    expect(
      reached,
      `the board projector's import closure reaches ${reached.join(", ")}. The projector renders ` +
        "state over a filesystem read; it listens on nothing and spawns nothing (DASH-08)",
    ).toEqual([]);
    expect(normalizedBuiltinIdentities(facts)).toEqual([...ALLOWED_BUILTIN_SPECIFIERS].sort());
  });
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// PART FIVE — the discrimination. Every green above is worth exactly as much as this part.
//
// A structural assertion nobody has watched FAIL is not yet a control. Every mirror is built FROM
// THE LIVE SOURCES at test time, so a refactor of a real module cannot leave a fixture behind
// asserting something the tree no longer says.
//
// WHAT IS TESTED HERE IS THE UNION OF THREE RULES (32-20). The namespace rule (32-11), the
// acquisition rule and the module-identity rule each have their own table of spellings, and all
// three tables are planted by ONE iteration against the SAME mirror, each row asserting the derived
// set its OWN rule produces. Three rules that each pass their own rows and were never run together
// is precisely how a round closes a spelling and reopens the capability one register over — which
// is what the last four verification rounds of this phase measured, every time.
// ═══════════════════════════════════════════════════════════════════════════════════════════════

/**
 * The repository's scratch root (`.gitignore:19`), which vitest is also told not to COLLECT from
 * (`vitest.config.ts`). Both matter: a planted `.js` beside the real modules would be a file the
 * default include glob could pick up, and a `git status`-based residue check is blind to a
 * gitignored path — so the residue predicate here is a REAL LISTING of this directory.
 */
const SCRATCH_ROOT = join(ROOT, ".temp", "board-readonly");

/** The symbol planted to make the intersection case fail. A writer, and unambiguously one. */
const PLANTED_WRITER = "writeFileSync";

/**
 * Copy the live closure into a fresh mirror root, apply one plant, and hand the mirror root to
 * `use`. The mirror is removed in a `finally`, so a failing assertion cannot leave residue.
 */
function withLiveMirror(
  plant: { readonly module: string; readonly appendSource: string },
  use: (mirrorRoot: string) => void,
): void {
  mkdirSync(SCRATCH_ROOT, { recursive: true });
  const mirrorRoot = mkdtempSync(join(SCRATCH_ROOT, "board-readonly-mirror-"));
  try {
    copyImportClosure(ROOT, DASHBOARD_ENTRY, (rel) => {
      const destination = join(mirrorRoot, rel);
      mkdirSync(dirname(destination), { recursive: true });
      copyFileSync(join(ROOT, rel), destination);
    });
    const planted = join(mirrorRoot, plant.module);
    expect(
      existsSync(planted),
      `PREMISE: the mirror does not contain ${plant.module}, so the plant had nothing to modify`,
    ).toBe(true);
    // ESM import declarations are hoisted, so appending one is a valid module. The mirror is only
    // ever PARSED here, never executed.
    writeFileSync(planted, `${readFileSync(planted, "utf8")}\n${plant.appendSource}\n`);
    use(mirrorRoot);
  } finally {
    rmSync(mirrorRoot, { recursive: true, force: true });
  }
}

/**
 * THE ESCAPE SHAPES, HELD AS DATA (32-11).
 *
 * A hand-maintained list of `it(…)` blocks is the set-literal drift class this repository has
 * already paid for — seven granted role names against zero adapter files, green throughout
 * ([[grugops-set-literal-drift]]). So the spellings are ROWS, the block below is one iteration over
 * them, and adding a spelling is adding a row.
 *
 * Every row is a DISTINCT SPELLING of the same escape: a module that binds `node:fs` (or
 * `node:fs/promises`) and then reaches a writer through it by a route that is not a direct member
 * access. One predicate decides all of them — after planting, `analyzeClosure` returns a non-empty
 * `opaqueFsAcquisitions` naming the planted module — and it is the SAME predicate PART ONE's premise
 * case asserts against the live tree, so the discrimination and the live assertion cannot drift
 * apart.
 *
 * Row 10 (the computed element access) was refused BEFORE 32-11 by the older element-access arm. It
 * is kept in the enumeration so that what is tested is the UNION of the old arm and the new rule,
 * not the new rule alone.
 */
/** The derived sets a planted row may be refused BY. Named so a row can say which one it expects. */
type WitnessKey =
  | "opaqueFsAcquisitions"
  | "acquisitions"
  | "unresolvedCallees"
  | "unadmittedBuiltinIdentity"
  | "unadmittedGlobalMemberPath";

/** One planted spelling: a name, the source to append, and (optionally) the set that refuses it. */
interface EscapeShape {
  readonly name: string;
  readonly appendSource: string;
  readonly witness?: WitnessKey;
}

const NAMESPACE_ESCAPE_SHAPES: readonly EscapeShape[] = Object.freeze([
  {
    name: "destructuring bind of two writers from a namespace",
    appendSource:
      'import * as fsns from "node:fs";\n' +
      "const { writeFileSync, rmSync } = fsns;\n" +
      'export const escape01 = (p) => { writeFileSync(p, "x"); rmSync(p); };',
  },
  {
    name: "rest-element destructure of a namespace",
    appendSource:
      'import * as fsns from "node:fs";\n' +
      "const { readFileSync: readAlias, ...restOfFs } = fsns;\n" +
      'export const escape02 = (p) => { void readAlias; return restOfFs.writeFileSync(p, "x"); };',
  },
  {
    name: "plain alias assignment of the namespace to another identifier",
    appendSource:
      'import * as fsns from "node:fs";\n' +
      "const aliasedFs = fsns;\n" +
      'export const escape03 = (p) => aliasedFs.writeFileSync(p, "x");',
  },
  {
    name: "the namespace passed as a call argument",
    appendSource:
      'import * as fsns from "node:fs";\n' +
      'const writeThrough = (mod, p) => mod.writeFileSync(p, "x");\n' +
      "export const escape04 = (p) => writeThrough(fsns, p);",
  },
  {
    name: "object spread of the namespace into a literal",
    appendSource:
      'import * as fsns from "node:fs";\n' +
      "const spreadFs = { ...fsns };\n" +
      'export const escape05 = (p) => spreadFs.writeFileSync(p, "x");',
  },
  {
    name: "the namespace inside an array literal",
    appendSource:
      'import * as fsns from "node:fs";\n' +
      "const fsSlots = [fsns];\n" +
      'export const escape06 = (p) => fsSlots[0].writeFileSync(p, "x");',
  },
  {
    name: "the namespace as a shorthand property of an object literal",
    appendSource:
      'import * as fsns from "node:fs";\n' +
      "const bag = { fsns };\n" +
      'export const escape07 = (p) => bag.fsns.writeFileSync(p, "x");',
  },
  {
    name: "Object.values over the namespace",
    appendSource:
      'import * as fsns from "node:fs";\n' +
      "export const escape08 = (p) => Object.values(fsns)[0](p);",
  },
  {
    name: "Reflect.get over the namespace with a string key",
    appendSource:
      'import * as fsns from "node:fs";\n' +
      'export const escape09 = (p) => Reflect.get(fsns, "writeFileSync")(p, "x");',
  },
  {
    name: "element access with a COMPUTED key (refused before 32-11; kept so the UNION is tested)",
    appendSource:
      'import * as fsns from "node:fs";\n' +
      'const computedKey = "writeFileSync";\n' +
      'export const escape10 = (p) => fsns[computedKey](p, "x");',
  },
  {
    name: "a re-export of the namespace binding",
    appendSource: 'import * as fsns from "node:fs";\nexport { fsns as escape11 };',
  },
  {
    name: "the namespace returned from an exported arrow function",
    appendSource: 'import * as fsns from "node:fs";\nexport const escape12 = () => fsns;',
  },
  {
    name: "a DEFAULT import of node:fs destructured (the esModuleInterop spelling)",
    appendSource:
      'import fsDefault from "node:fs";\n' +
      "const { writeFileSync: writeViaDefault } = fsDefault;\n" +
      'export const escape13 = (p) => writeViaDefault(p, "x");',
  },
  {
    name: "a namespace import of node:fs/promises destructured (the second module identity)",
    appendSource:
      'import * as fspns from "node:fs/promises";\n' +
      "const { writeFile } = fspns;\n" +
      'export const escape14 = (p) => writeFile(p, "x");',
  },
]);

/**
 * The cardinality of the enumeration. A FIFTEENTH spelling is a DECISION recorded as a row above
 * with its name, never a constant somebody bumps — the same posture as the stem-exclusion count and
 * the two banned-module counts.
 */
const NAMESPACE_ESCAPE_SHAPE_COUNT = 14;

/**
 * THE ACQUISITION SHAPES — a SECOND table, deliberately not fifteen more rows of the first.
 *
 * These are not namespace escapes: no namespace binding exists in any of them. They are the other
 * way a module obtains `node:fs` — hand a module identity to something and get the module back —
 * and they are refused by `collectSpecifiers` rather than by the canonical form. Keeping them in
 * their own table with their own pin is what lets the first table's count stay exactly the number of
 * namespace-escape spellings.
 *
 * Rows 1-3 were already refused before 32-11; the prose claim in this file's docblock that they were
 * is now a row each, because a claim without a case is the thing 32-11 exists to remove. Rows 4-6
 * are refused by the generalised argument arm added in 32-11 (deviation, Rule 2): none of them
 * spells `require` or `import` at the call site, and all three return the real `node:fs`.
 */
const ACQUISITION_SHAPES: readonly EscapeShape[] = Object.freeze([
  {
    name: "require(\"node:fs\") — refused by the require arm of collectSpecifiers",
    appendSource:
      'import { createRequire } from "node:module";\n' +
      "const require = createRequire(import.meta.url);\n" +
      'export const acquire01 = (p) => require("node:fs").writeFileSync(p, "x");',
  },
  {
    name: 'export * from "node:fs" — refused by the export arm of collectSpecifiers',
    appendSource: 'export * from "node:fs";',
  },
  {
    name: 'await import("node:fs") — refused by the dynamic-import arm of collectSpecifiers',
    appendSource: 'const acquired03 = await import("node:fs");\nvoid acquired03;',
  },
  {
    name: "createRequire(url)(\"node:fs\") — the require alias that never spells `require`",
    appendSource:
      'import { createRequire } from "node:module";\n' +
      'export const acquire04 = (p) => createRequire(import.meta.url)("node:fs").writeFileSync(p, "x");',
  },
  {
    name: 'process.getBuiltinModule("node:fs") — no module-system call at all',
    appendSource:
      'export const acquire05 = (p) => process.getBuiltinModule("node:fs").writeFileSync(p, "x");',
  },
  {
    name: 'process.binding("fs") — the legacy internal binding',
    appendSource: 'export const acquire06 = () => process.binding("fs");',
  },
  // ── Plan 32-14, finding F-02: the re-entry rule asked at the two remaining positions ──────────
  // Before this round these two rows were GREEN on `opaqueFsAcquisitions` and red only on the
  // cardinality pin — `promises` matches no write-class stem, so the intersection never saw the
  // writer. `noteFsMember` is now asked at the named-import and named-re-export positions too, so
  // both rows are refused for the reason they are dangerous rather than because a count moved.
  {
    name: 'import { promises } from "node:fs" — a NAMED IMPORT of a namespace re-entry member',
    appendSource:
      'import { promises as fsp07 } from "node:fs";\n' +
      'export const acquire07 = (p) => fsp07.writeFile(p, "x");',
  },
  {
    name: 'export { promises } from "node:fs" — the same re-entry as a NAMED RE-EXPORT',
    appendSource: 'export { promises as acquire08 } from "node:fs";',
  },
]);

/** The cardinality of the acquisition table. A ninth route is a decision, recorded as a row. */
const ACQUISITION_SHAPE_COUNT = 8;

/**
 * THE MODULE-IDENTITY SHAPES — the THIRD table, one row per spelling plan 32-20 closes.
 *
 * These are neither namespace escapes nor fs acquisitions. Not one of them names a filesystem
 * module anywhere, and four of them import nothing at all: they reach a file-writing or
 * code-executing capability through a builtin the old deny-list never named, through a module
 * identity assembled at runtime, or through a global. Every one of them was MEASURED GREEN against
 * the committed `.js` before this plan — exit 0, 59 passed / 59, transcripts in
 * `32-20-RED-baseline.txt` — and each is refused now by a NAMED derived set rather than by a
 * cardinality pin catching it sideways.
 *
 * `witness` is which derived set must become non-empty for the row to count as refused. It is part
 * of the row because "refused" without naming the refusing predicate is how a round credits a rule
 * for a red some other rule produced — this repository has recorded that shape twice.
 */
const MODULE_IDENTITY_SHAPES: readonly EscapeShape[] = Object.freeze([
  {
    name: "the heap-snapshot writer imported from node:v8 (zero obfuscation; verifier gap 2)",
    appendSource:
      'import { writeHeapSnapshot } from "node:v8";\n' +
      "export const identity01 = (p) => writeHeapSnapshot(p);",
    witness: "unadmittedBuiltinIdentity",
  },
  {
    name: "the embedded database imported from node:sqlite, which creates and writes its file",
    appendSource:
      'import { DatabaseSync } from "node:sqlite";\n' +
      "export const identity02 = (p) => new DatabaseSync(p);",
    witness: "unadmittedBuiltinIdentity",
  },
  {
    name: "the virtual machine imported from node:vm, which executes source",
    appendSource:
      'import { runInNewContext } from "node:vm";\n' +
      "export const identity03 = (s) => runInNewContext(s);",
    witness: "unadmittedBuiltinIdentity",
  },
  {
    name: "the UN-PREFIXED spelling of the heap-snapshot builtin (`v8`, not `node:v8`)",
    appendSource:
      'import { writeHeapSnapshot as heap04 } from "v8";\n' +
      "export const identity04 = (p) => heap04(p);",
    witness: "unadmittedBuiltinIdentity",
  },
  {
    name: "a module identity ASSEMBLED at runtime and a writer called through it (F-03)",
    appendSource:
      'const assembled05 = process.getBuiltinModule("node:" + "fs");\n' +
      'export const identity05 = (p) => assembled05.writeFileSync(p, "x");',
    witness: "acquisitions",
  },
  {
    name: "a DYNAMIC IMPORT of a non-fs builtin, which the fs-only arm never refused",
    appendSource:
      'const dynamic06 = await import("node:v8");\n' +
      "export const identity06 = (p) => dynamic06.writeHeapSnapshot(p);",
    witness: "acquisitions",
  },
  {
    name: "a REQUIRE-EQUIVALENT reached through a callee no enclosing scope declares",
    appendSource: 'export const identity07 = (p) => __acquire07("node:v8").writeHeapSnapshot(p);',
    witness: "unresolvedCallees",
  },
  {
    name: "the PROCESS REPORT WRITER, a file writer with no import anywhere (review WR-02)",
    appendSource: "export const identity08 = (p) => process.report.writeReport(p);",
    witness: "unadmittedGlobalMemberPath",
  },
  {
    name: "a LOCAL SHADOWING a capability-bearing global, still censused by name",
    appendSource:
      'function identity09(process) { return process.report.writeReport("/tmp/x"); }\n' +
      "export const shadow09 = identity09;",
    witness: "unadmittedGlobalMemberPath",
  },
  {
    name: "an ALIAS of a capability-bearing global, reaching the same member under a new root",
    appendSource:
      "const aliased10 = process;\n" +
      "export const identity10 = (p) => aliased10.report.writeReport(p);",
    witness: "acquisitions",
  },
]);

/**
 * The cardinality of the module-identity table. An ELEVENTH spelling is a DECISION recorded as a
 * row above with its source and the derived set that refuses it — never a bumped constant.
 */
const MODULE_IDENTITY_SHAPE_COUNT = 10;

/**
 * THE WITNESSES — which derived set refuses which row, held as data so the iteration can name it.
 *
 * Each entry answers "what became non-empty when the plant landed". A row whose witness stays empty
 * is a row nothing refused, however many OTHER cases in this file happen to be red at the time.
 */
const REFUSAL_WITNESSES: Readonly<Record<WitnessKey, (facts: ClosureFacts) => readonly string[]>> =
  Object.freeze({
    opaqueFsAcquisitions: (facts) => facts.opaqueFsAcquisitions,
    acquisitions: (facts) => facts.acquisitions,
    unresolvedCallees: (facts) => facts.unresolvedCallees,
    unadmittedBuiltinIdentity: (facts) =>
      normalizedBuiltinIdentities(facts).filter(
        (identity) => !ALLOWED_BUILTIN_SPECIFIERS.includes(identity),
      ),
    unadmittedGlobalMemberPath: (facts) =>
      facts.globalMemberPaths.filter((path) => !EXPECTED_GLOBAL_MEMBER_PATHS.includes(path)),
  });

/**
 * THE THREE TABLES, ITERATED IN ONE PASS — because what is tested is their UNION (32-20).
 *
 * The namespace rule, the acquisition rule and the identity rule each pass their own rows. Three
 * rules that were never run TOGETHER is exactly how a round closes a spelling and reopens a
 * capability one register over, which is what the last four verification rounds of this phase
 * measured. So every row of every table is planted against the SAME live mirror by the SAME loop,
 * and each asserts the named witness its own rule produces.
 */
const ESCAPE_TABLES: readonly {
  readonly label: string;
  readonly caseLabel: string;
  readonly defaultWitness: WitnessKey;
  readonly rows: readonly EscapeShape[];
}[] = Object.freeze([
  {
    label: "NAMESPACE_ESCAPE_SHAPES",
    caseLabel: "namespace escape is REFUSED",
    defaultWitness: "opaqueFsAcquisitions",
    rows: NAMESPACE_ESCAPE_SHAPES,
  },
  {
    label: "ACQUISITION_SHAPES",
    caseLabel: "fs acquisition is REFUSED",
    defaultWitness: "opaqueFsAcquisitions",
    rows: ACQUISITION_SHAPES,
  },
  {
    label: "MODULE_IDENTITY_SHAPES",
    caseLabel: "module identity is REFUSED",
    defaultWitness: "acquisitions",
    rows: MODULE_IDENTITY_SHAPES,
  },
]);

describe("32-06 — the guard discriminates: both halves are shown to fail", () => {
  it("CONTROL: an UNPLANTED mirror of the live closure is still green", () => {
    // Without this, a red against a planted mirror could be caused by the mirroring itself rather
    // than by the plant, and the discrimination would be measuring the harness.
    withLiveMirror({ module: DASHBOARD_ENTRY, appendSource: "// no plant" }, (mirrorRoot) => {
      const facts = analyzeClosure(mirrorRoot, DASHBOARD_ENTRY);
      expect(facts.modules.length).toBe(analyzeClosure(ROOT, DASHBOARD_ENTRY).modules.length);
      expect(facts.fsSymbols).toEqual([...EXPECTED_CLOSURE_FS_SYMBOLS]);
      expect(bannedModulesReached(facts)).toEqual([]);
    });
  });

  it("a planted mutating fs symbol makes the intersection case FAIL", () => {
    withLiveMirror(
      {
        module: "scripts/board-read.js",
        appendSource: `import { ${PLANTED_WRITER} } from "node:fs";`,
      },
      (mirrorRoot) => {
        const { fsSymbols } = analyzeClosure(mirrorRoot, DASHBOARD_ENTRY);
        const reachable = fsSymbols.filter((s) => MUTATING_FS_SYMBOLS.includes(s));
        expect(reachable).toContain(PLANTED_WRITER);
        expect(reachable).not.toEqual([]);
        // …and the blocking two-sided pin moves by exactly one, so the difference is caused by the
        // plant rather than by a derivation that broke and started reporting some other set.
        expect(fsSymbols.length).toBe(EXPECTED_CLOSURE_FS_SYMBOL_COUNT + 1);
      },
    );
  });

  it("a planted node:net import makes the module-ban case FAIL", () => {
    withLiveMirror(
      {
        module: DASHBOARD_ENTRY,
        appendSource: 'import { createServer } from "node:net";',
      },
      (mirrorRoot) => {
        const facts = analyzeClosure(mirrorRoot, DASHBOARD_ENTRY);
        expect(bannedModulesReached(facts)).toEqual(["net"]);
        // …and the ALLOW-LIST refuses it too, which is what makes the same plant fail for a module
        // the deny-list never named (32-20). Both sides are asserted so the corollary cannot outlive
        // the rule.
        expect(normalizedBuiltinIdentities(facts)).toContain("net");
        expect(normalizedBuiltinIdentities(facts).length).toBe(ALLOWED_BUILTIN_SPECIFIER_COUNT + 1);
      },
    );
  });

  it("the UN-PREFIXED spelling of a banned module is caught too", () => {
    // `net` and `node:net` are the same module. A ban that only knew the prefixed spelling would be
    // a ban an import walks around by deleting five characters.
    withLiveMirror(
      {
        module: DASHBOARD_ENTRY,
        appendSource: 'import { createServer } from "net";',
      },
      (mirrorRoot) => {
        const facts = analyzeClosure(mirrorRoot, DASHBOARD_ENTRY);
        expect(bannedModulesReached(facts)).toEqual(["net"]);
        expect(normalizedBuiltinIdentities(facts)).toContain("net");
      },
    );
  });

  it("a module acquiring node:fs by a route the pass cannot name is REFUSED, not ignored", () => {
    // Fail-closed, the direction that matters: an undecidable acquisition must red the guard rather
    // than quietly contribute an empty symbol set to the union.
    withLiveMirror(
      {
        module: "scripts/board-read.js",
        appendSource: 'const dynamicFs = await import("node:fs");\nvoid dynamicFs;',
      },
      (mirrorRoot) => {
        const facts = analyzeClosure(mirrorRoot, DASHBOARD_ENTRY);
        expect(facts.opaqueFsAcquisitions.length).toBeGreaterThan(0);
        expect(facts.opaqueFsAcquisitions.join("\n")).toContain("scripts/board-read.js");
      },
    );
  });

  it("a namespace DESTRUCTURE of node:fs is REFUSED, not invisible (CR-01)", () => {
    // THE FINDING THIS CASE EXISTS FOR, verbatim from the verifier's own probe
    // (32-VERIFICATION.md, CR-01 transcript): an ordinary two-line ESM pattern shipped a module
    // that writes AND deletes files past a fully green guard. The old derivation named an fs symbol
    // only on a DIRECT member access, so the destructuring bind below contributed nothing to
    // `fsSymbols` and nothing to `opaqueFsAcquisitions`, the pinned closure count did not move, and
    // `npm run check:dashboard-readonly` exited 0 over `nuke`.
    withLiveMirror(
      {
        module: "scripts/board-read.js",
        appendSource:
          'import * as fsns from "node:fs";\n' +
          "const { writeFileSync, rmSync } = fsns;\n" +
          'export function nuke(p) { writeFileSync(p, "x"); rmSync(p); }',
      },
      (mirrorRoot) => {
        const facts = analyzeClosure(mirrorRoot, DASHBOARD_ENTRY);
        expect(
          facts.opaqueFsAcquisitions.length,
          "a closure module bound node:fs as a namespace and then READ that binding by a route " +
            "other than a member access. The symbols behind such a read cannot be named " +
            "syntactically, so the acquisition must be REFUSED — this is the exact shape that " +
            "shipped a full writer past a green guard (CR-01). Collected instead: " +
            `[${facts.opaqueFsAcquisitions.join(" | ")}], fsSymbols [${facts.fsSymbols.join(", ")}]`,
        ).toBeGreaterThan(0);
        expect(facts.opaqueFsAcquisitions.join("\n")).toContain("scripts/board-read.js");
      },
    );
  });

  it("POSITIVE CONTROL: a DIRECT member access on an fs namespace is still admitted and still named", () => {
    // Without this case the rule above could refuse EVERY namespace and still look right. The guard
    // refuses escapes, not namespaces: `readFileSync` is already one of the six, so a correct rule
    // moves nothing at all.
    withLiveMirror(
      {
        module: "scripts/board-read.js",
        appendSource:
          'import * as fsns from "node:fs";\n' +
          'export const readViaNamespace = (p) => fsns.readFileSync(p, "utf8");',
      },
      (mirrorRoot) => {
        const facts = analyzeClosure(mirrorRoot, DASHBOARD_ENTRY);
        expect(
          facts.opaqueFsAcquisitions,
          "a DIRECT member access on an fs namespace is the ONE admitted use of the binding. " +
            "Refusing it would red the live closure the moment anybody wrote the legitimate shape, " +
            "the rule would be loosened under that pressure, and the result would be weaker than " +
            "the rule it replaced",
        ).toEqual([]);
        expect(facts.fsSymbols).toContain("readFileSync");
        expect(facts.fsSymbols).toEqual([...EXPECTED_CLOSURE_FS_SYMBOLS]);
        expect(facts.fsSymbols.length).toBe(EXPECTED_CLOSURE_FS_SYMBOL_COUNT);
      },
    );
  });

  it("a STRING-LITERAL element access on an fs namespace still names its symbol", () => {
    // The element-access arm is UNCHANGED by the canonical form: a literal key still names, and the
    // new rule is a UNION with it rather than a replacement for it.
    withLiveMirror(
      {
        module: "scripts/board-read.js",
        appendSource:
          'import * as fsns from "node:fs";\n' +
          'export const statViaKey = (p) => fsns["statSync"](p);',
      },
      (mirrorRoot) => {
        const facts = analyzeClosure(mirrorRoot, DASHBOARD_ENTRY);
        expect(facts.opaqueFsAcquisitions).toEqual([]);
        expect(facts.fsSymbols).toContain("statSync");
        expect(facts.fsSymbols.length).toBe(EXPECTED_CLOSURE_FS_SYMBOL_COUNT);
      },
    );
  });

  it("a COMPUTED element access on an fs namespace is still refused (the older arm survives the union)", () => {
    withLiveMirror(
      {
        module: "scripts/board-read.js",
        appendSource:
          'import * as fsns from "node:fs";\n' +
          'const key = "writeFileSync";\n' +
          'export const w = (p) => fsns[key](p, "x");',
      },
      (mirrorRoot) => {
        const facts = analyzeClosure(mirrorRoot, DASHBOARD_ENTRY);
        expect(facts.opaqueFsAcquisitions.length).toBeGreaterThan(0);
        expect(facts.opaqueFsAcquisitions.join("\n")).toContain("scripts/board-read.js");
      },
    );
  });

  it("PREMISE: the derived namespace re-entry set is non-empty and holds both known re-entries", () => {
    // Derived by asking the runtime, so a future Node adding a third re-entry is covered without
    // an edit here. Asserted non-empty because a refusal over an empty set refuses nothing, and
    // asserted to hold the two this repository has actually measured, because a derivation that
    // silently stopped finding them would leave the refusal below green and vacuous.
    expect(
      NAMESPACE_REENTRY_MEMBERS.length,
      "PREMISE: no member of node:fs was derived as a namespace re-entry on node " +
        `${process.versions.node}, so the refusal of `.concat(
          "`fsns.promises` / `fsns.default` refuses nothing at all",
        ),
    ).toBeGreaterThan(0);
    for (const member of ["default", "promises"]) {
      expect(
        NAMESPACE_REENTRY_MEMBERS,
        `"${member}" is a member of node:fs whose own object carries the writer set, and the ` +
          "derivation no longer finds it. Either the runtime changed shape or the derivation broke; " +
          "either way a writer is reachable through it with nothing refusing the route",
      ).toContain(member);
    }
  });

  for (const member of ["default", "promises"]) {
    it(`a member access naming \`${member}\` RE-ENTERS a namespace and is refused (deviation, Rule 2)`, () => {
      // Both plants are working writers. MEASURED before this rule existed (recorded in
      // 32-11-GREEN-proof.txt): `fsns.promises.writeFile` produced `opaqueFsAcquisitions: []` AND a
      // mutating-symbol intersection of `[]` — the case that names the danger stayed green, and the
      // only thing that moved was the cardinality pin gaining the member name `promises`. A pin
      // catching a writer by accident is not the same as the intersection deciding it.
      withLiveMirror(
        {
          module: "scripts/board-read.js",
          appendSource:
            'import * as fsns from "node:fs";\n' +
            `export const nukeVia_${member} = (p) => fsns.${member}.writeFileSync(p, "x");`,
        },
        (mirrorRoot) => {
          const facts = analyzeClosure(mirrorRoot, DASHBOARD_ENTRY);
          expect(facts.opaqueFsAcquisitions.length).toBeGreaterThan(0);
          expect(facts.opaqueFsAcquisitions.join("\n")).toContain("scripts/board-read.js");
          expect(
            facts.fsSymbols,
            `"${member}" must not be NAMED as an fs symbol: naming it would put a namespace object ` +
              "in the symbol set, where the mutating-set intersection would then ask whether the " +
              `string "${member}" is a writer and answer no`,
          ).not.toContain(member);
        },
      );
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────────────────────
  // THE ENUMERATION (32-11). Both tables are asserted non-empty and pinned two-sided BEFORE the
  // iterations claim anything, because an emptiness claim over an empty denominator is the
  // false-green this repository has recorded six instances of.
  // ─────────────────────────────────────────────────────────────────────────────────────────────

  it("PREMISE: all THREE escape tables are non-empty before any iteration over them claims anything", () => {
    for (const table of ESCAPE_TABLES) {
      expect(
        table.rows.length,
        `PREMISE: ${table.label} is EMPTY, so the block below iterates over nothing and every ` +
          "refusal it appears to prove was never asked for",
      ).toBeGreaterThan(0);
    }
    expect(
      ESCAPE_TABLES.length,
      "PREMISE: the iteration below is over fewer than three tables, so the UNION it claims to " +
        "test is not the union of the namespace rule, the acquisition rule and the identity rule",
    ).toBe(3);
  });

  it("each table has exactly the number of rows its decision records", () => {
    expect(
      NAMESPACE_ESCAPE_SHAPES.length,
      "a FIFTEENTH namespace-escape spelling is a DECISION: it belongs in NAMESPACE_ESCAPE_SHAPES " +
        "as a named row with the source that spells it, so the enumeration and the count move " +
        "together. It is never a bumped constant",
    ).toBe(NAMESPACE_ESCAPE_SHAPE_COUNT);
    expect(
      ACQUISITION_SHAPES.length,
      "a NINTH acquisition route is a DECISION, recorded as a row in ACQUISITION_SHAPES with the " +
        "source that reaches node:fs through it",
    ).toBe(ACQUISITION_SHAPE_COUNT);
    expect(
      MODULE_IDENTITY_SHAPES.length,
      "an ELEVENTH module-identity spelling is a DECISION, recorded as a row in " +
        "MODULE_IDENTITY_SHAPES with the source that reaches a capability through it AND the " +
        "derived set that refuses it",
    ).toBe(MODULE_IDENTITY_SHAPE_COUNT);
  });

  it("no two rows in ANY table share a name, and every row names a real witness", () => {
    // A table whose rows silently collapse is a table that tests fewer things than it counts: two
    // identically-named `it(…)` blocks still both run, but a reader counting names in the reporter
    // would credit the enumeration with coverage it does not have.
    const allNames: string[] = [];
    for (const table of ESCAPE_TABLES) {
      const names = table.rows.map((row) => row.name);
      expect(
        new Set(names).size,
        `${table.label} carries duplicate row names, so its cardinality overstates what it tests`,
      ).toBe(names.length);
      for (const name of names) expect(name.trim().length).toBeGreaterThan(0);
      for (const row of table.rows) {
        const witness = row.witness ?? table.defaultWitness;
        expect(
          Object.keys(REFUSAL_WITNESSES),
          `the row "${row.name}" names the witness "${witness}", which is not a derived set this ` +
            "file computes. A row whose witness does not exist is a row nothing can refuse",
        ).toContain(witness);
      }
      allNames.push(...names);
    }
    expect(
      new Set(allNames).size,
      "two tables share a row name, so the reporter shows one case name for two different plants",
    ).toBe(allNames.length);
  });

  // ONE ITERATION, THREE TABLES — the UNION is what is tested (32-20). Each row asserts the set its
  // OWN rule produces, so a red caused by some other rule cannot be credited to it.
  for (const table of ESCAPE_TABLES) {
    for (const shape of table.rows) {
      it(`${table.caseLabel}: ${shape.name}`, () => {
        const witness = shape.witness ?? table.defaultWitness;
        withLiveMirror(
          { module: "scripts/board-read.js", appendSource: shape.appendSource },
          (mirrorRoot) => {
            const facts = analyzeClosure(mirrorRoot, DASHBOARD_ENTRY);
            const collected = REFUSAL_WITNESSES[witness](facts);
            expect(
              collected.length,
              `the spelling "${shape.name}" (${table.label}) was NOT refused by ${witness}, the ` +
                "set its own rule produces. It reaches a file-writing, process-starting or " +
                "code-executing capability from inside the dashboard's own import closure, so a " +
                "guard that neither names it nor refuses it is green over a writer. Collected: " +
                `[${collected.join(" | ")}]`,
            ).toBeGreaterThan(0);
            // Where the witness carries module attribution, the refusal must name the module the
            // plant landed in — otherwise a refusal produced somewhere else would pass for this row.
            if (collected.some((entry) => entry.includes(": "))) {
              expect(collected.join("\n")).toContain("scripts/board-read.js");
            }
          },
        );
      });
    }
  }

  it("CONTROL: a call carrying a NON-fs string literal is neither refused nor read as an import", () => {
    // The generalised argument arm refuses a call whose string argument is an fs module IDENTITY. It
    // must not also turn every string argument into a module specifier: if it did, a harmless
    // `["net", "http"].join()` would red the DASH-08 socket ban, the arm would be loosened under
    // that pressure, and the result would be weaker than the arm it replaced.
    withLiveMirror(
      {
        module: "scripts/board-read.js",
        appendSource:
          'export const harmless = () => ["net", "http", "child_process"].join(",");\n' +
          'export const alsoHarmless = (p) => String(p).padEnd(4, "fsx");',
      },
      (mirrorRoot) => {
        const facts = analyzeClosure(mirrorRoot, DASHBOARD_ENTRY);
        expect(facts.opaqueFsAcquisitions).toEqual([]);
        expect(bannedModulesReached(facts)).toEqual([]);
        expect(facts.fsSymbols).toEqual([...EXPECTED_CLOSURE_FS_SYMBOLS]);
      },
    );
  });

  // ═════════════════════════════════════════════════════════════════════════════════════════════
  // THE THREE SPELLINGS THE SHIPPED GATE WAS MEASURED GREEN OVER (32-31, gap-closure round 3).
  //
  // `32-24-RED-baseline.txt` § 2 measured six module-specifier spellings against the COMMITTED
  // `scripts/board-read.js` with a live writer behind each one. THREE of them left
  // `npm run check:dashboard-readonly` at exit 0 with its full 89/89, and two of those three wrote
  // a file on the measuring machine through a function the dashboard closure exports:
  //
  //     /abs/…/writer.mjs              exit 0, 89 passed (89), writer live, 77 bytes
  //     //localhost/abs/…/writer.mjs   exit 0, 89 passed (89), writer live, 83 bytes
  //     //host/probe/writer.mjs        exit 0, 89 passed (89), unresolvable on darwin
  //
  // WHY THEY WERE GREEN, IN ONE SENTENCE: the two authorities that decide a specifier's class are a
  // COMPLEMENT rather than a PARTITION — `isBareSpecifier` was `!startsWith(".") && !startsWith("/")`
  // and the walker's three patterns each required a leading `.`, so every spelling beginning with
  // `/` that is not `./` or `../` was subtracted by the first and never added by the second.
  //
  // THESE ROWS ARE HELD AS DATA, and each names the WITNESS it must be refused by, for the reason
  // `MODULE_IDENTITY_SHAPES` gives one table up: "refused" without naming the refusing predicate is
  // how a round credits a rule for a red some other rule produced.
  // ═════════════════════════════════════════════════════════════════════════════════════════════

  /** The writer module every row below imports. Outside the tree, and unambiguously a writer. */
  const FOREIGN_WRITER_BODY = "probeWrite";

  /**
   * One row per spelling `32-24-RED-baseline.txt` measured at exit 0 over a live writer. The
   * `baseline` field is the transcript this row is proved against, quoted so a reader comparing the
   * two files compares numbers rather than recollections.
   */
  const BASELINE_GREEN_SPECIFIER_ROWS: readonly {
    readonly name: string;
    readonly specifier: string;
    readonly baseline: string;
  }[] = Object.freeze([
    {
      name: "an ABSOLUTE POSIX path, static import (baseline § 3.1 — exit 0, writer live)",
      specifier: "/private/tmp/grugops-probe/writer.mjs",
      baseline: "32-24-RED-baseline.txt § 3.1: exit 0, 89 passed (89), LIVE_WRITER=yes 77 bytes",
    },
    {
      name: "a PROTOCOL-RELATIVE //localhost path, static import (baseline § 3.2 — exit 0, writer live)",
      specifier: "//localhost/private/tmp/grugops-probe/writer.mjs",
      baseline: "32-24-RED-baseline.txt § 3.2: exit 0, 89 passed (89), LIVE_WRITER=yes 83 bytes",
    },
    {
      name: "a PROTOCOL-RELATIVE //host path, static import (baseline § 3.3 — exit 0)",
      specifier: "//host/probe/writer.mjs",
      baseline: "32-24-RED-baseline.txt § 3.3: exit 0, 89 passed (89), unresolvable on darwin",
    },
  ]);

  /** Three rows, because the baseline measured three green spellings. A fourth is a decision. */
  const BASELINE_GREEN_SPECIFIER_ROW_COUNT = 3;

  it("the baseline-green row table has exactly the number of rows the baseline measured", () => {
    expect(
      BASELINE_GREEN_SPECIFIER_ROWS.length,
      "a FOURTH spelling measured green over a live writer is a DECISION: it belongs in " +
        "BASELINE_GREEN_SPECIFIER_ROWS as a named row carrying the transcript that measured it, " +
        "never in a bumped constant",
    ).toBe(BASELINE_GREEN_SPECIFIER_ROW_COUNT);
    expect(new Set(BASELINE_GREEN_SPECIFIER_ROWS.map((r) => r.specifier)).size).toBe(
      BASELINE_GREEN_SPECIFIER_ROW_COUNT,
    );
  });

  for (const row of BASELINE_GREEN_SPECIFIER_ROWS) {
    it(`a writer imported through ${row.name} is REFUSED`, () => {
      withLiveMirror(
        {
          module: "scripts/board-read.js",
          appendSource:
            `import { ${FOREIGN_WRITER_BODY} } from "${row.specifier}";\n` +
            `export const foreignPlant = (p, b) => ${FOREIGN_WRITER_BODY}(p, b);`,
        },
        (mirrorRoot) => {
          const facts = analyzeClosure(mirrorRoot, DASHBOARD_ENTRY);
          expect(
            facts.acquisitions.length,
            `the specifier "${row.specifier}" reaches a module this walk cannot mirror and this ` +
              "syntactic pass cannot vouch for, and NOTHING refused it. Measured green over a " +
              `live writer: ${row.baseline}. Admitting it CLAIMS that a module reached by a path ` +
              "this repository never read is nevertheless known to hold no writer — a claim no " +
              "derivation here can make. Collected acquisitions: " +
              `[${facts.acquisitions.join(" | ")}]`,
          ).toBeGreaterThan(0);
          expect(facts.acquisitions.join("\n")).toContain("scripts/board-read.js");
        },
      );
    });
  }

  it("the scratch root is left with no mirror residue", () => {
    // A real LISTING, not `git status`: `.temp/` is gitignored, so a git-based residue check is
    // blind to exactly the directory the mirrors live in (the round-5 lesson recorded in
    // vitest.config.ts).
    const survivors = existsSync(SCRATCH_ROOT) ? readdirSync(SCRATCH_ROOT) : [];
    expect(survivors, `mirror residue survived under ${SCRATCH_ROOT}`).toEqual([]);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// PART FIVE-A — EVERY POSITION A CAPABILITY MEMBER PATH CAN BE CONSUMED FROM (32-32, round 3).
//
// The finding this part closes was not a missing spelling; it was a missing QUESTION. Arm 4 asks
// "in what position may a capability-bearing ROOT be read?" and answers with one admitted position.
// Nothing asked the same question of a capability-bearing MEMBER PATH, so the only position that
// could produce an acquisition was CALLEE — and every other position moved a census count instead,
// which the count's own failing message then invited a maintainer to re-green in one edit
// (32-32-RED-baseline.txt §§ 1-3: exit 0, 135 passed, over a module that wrote 53389 bytes to a
// caller-chosen path).
//
// ONE EXAMPLE IS WHAT LEFT THE GAP OPEN LAST ROUND. So the positions are ROWS — the posture
// `MODULE_IDENTITY_SHAPES` already establishes in this file — one per syntactic position a value
// can be consumed from, each carrying the source to plant and each planted TWICE: once with a
// non-admitted path, which must red the write-detection mechanism, and once with an admitted-bound
// path, which must not. A rule with no converse is a rule nobody can tell apart from a refusal of
// everything, and over-refusal here gets loosened within a day.
// ═══════════════════════════════════════════════════════════════════════════════════════════════

/** The path with no read-only claim anywhere. A binding of it hands the caller a file writer. */
const NON_ADMITTED_PROBE_PATH = "process.report";

/** The path both sets admit, with the written reason. The converse every row is planted with. */
const ADMITTED_PROBE_PATH = "process.stdout";

/** One consumption position: what to call it, and the two sources that differ only in the path. */
interface MemberPathPositionRow {
  /** The syntactic position, named as the AST names it. */
  readonly position: string;
  /** Source planted with `NON_ADMITTED_PROBE_PATH`. Must make the acquisitions PREMISE case fail. */
  readonly nonAdmitted: string;
  /** The same source with `ADMITTED_PROBE_PATH`. Must leave `acquisitions` empty. */
  readonly admitted: string;
}

/**
 * THE CONSUMPTION POSITIONS, HELD AS DATA. Each pair differs in exactly one token — the path — so a
 * row that reds for the non-admitted source and greens for the admitted one has isolated the PATH
 * as the cause rather than the shape of the plant.
 */
const MEMBER_PATH_POSITION_ROWS: readonly MemberPathPositionRow[] = Object.freeze([
  {
    position: "variable initializer",
    nonAdmitted: `const p32a = ${NON_ADMITTED_PROBE_PATH};\nexport const u32a = () => p32a;`,
    admitted: `const p32a = ${ADMITTED_PROBE_PATH};\nexport const u32a = () => p32a;`,
  },
  {
    position: "initializer of a DESTRUCTURING declaration",
    nonAdmitted:
      `const { writeReport: w32b } = ${NON_ADMITTED_PROBE_PATH};\nexport const u32b = () => w32b;`,
    admitted:
      `const { writeReport: w32b } = ${ADMITTED_PROBE_PATH};\nexport const u32b = () => w32b;`,
  },
  {
    position: "object property value",
    nonAdmitted: `export const o32c = { r32c: ${NON_ADMITTED_PROBE_PATH} };`,
    admitted: `export const o32c = { r32c: ${ADMITTED_PROBE_PATH} };`,
  },
  {
    position: "array element",
    nonAdmitted: `export const a32d = [${NON_ADMITTED_PROBE_PATH}];`,
    admitted: `export const a32d = [${ADMITTED_PROBE_PATH}];`,
  },
  {
    position: "call argument",
    nonAdmitted: `export const c32e = (f32e) => f32e(${NON_ADMITTED_PROBE_PATH});`,
    admitted: `export const c32e = (f32e) => f32e(${ADMITTED_PROBE_PATH});`,
  },
  {
    position: "return statement",
    nonAdmitted: `export function r32f() {\n  return ${NON_ADMITTED_PROBE_PATH};\n}`,
    admitted: `export function r32f() {\n  return ${ADMITTED_PROBE_PATH};\n}`,
  },
  {
    position: "arrow-function body",
    nonAdmitted: `export const b32g = () => ${NON_ADMITTED_PROBE_PATH};`,
    admitted: `export const b32g = () => ${ADMITTED_PROBE_PATH};`,
  },
  {
    position: "assignment right-hand side",
    nonAdmitted: `let x32h;\nx32h = ${NON_ADMITTED_PROBE_PATH};\nexport const u32h = () => x32h;`,
    admitted: `let x32h;\nx32h = ${ADMITTED_PROBE_PATH};\nexport const u32h = () => x32h;`,
  },
  {
    position: "spread element",
    nonAdmitted: `export const s32i = { ...${NON_ADMITTED_PROBE_PATH} };`,
    admitted: `export const s32i = { ...${ADMITTED_PROBE_PATH} };`,
  },
  {
    position: "default parameter value",
    nonAdmitted: `export const d32j = (v32j = ${NON_ADMITTED_PROBE_PATH}) => v32j;`,
    admitted: `export const d32j = (v32j = ${ADMITTED_PROBE_PATH}) => v32j;`,
  },
  {
    position: "template-literal interpolation",
    nonAdmitted: "export const t32k = () => `${" + NON_ADMITTED_PROBE_PATH + "}`;",
    admitted: "export const t32k = () => `${" + ADMITTED_PROBE_PATH + "}`;",
  },
  {
    position: "conditional-expression branch",
    nonAdmitted: `export const q32l = (c32l) => (c32l ? ${NON_ADMITTED_PROBE_PATH} : null);`,
    admitted: `export const q32l = (c32l) => (c32l ? ${ADMITTED_PROBE_PATH} : null);`,
  },
  {
    position: "binary-expression operand",
    nonAdmitted: `export const n32m = () => ${NON_ADMITTED_PROBE_PATH} === undefined;`,
    admitted: `export const n32m = () => ${ADMITTED_PROBE_PATH} === undefined;`,
  },
  {
    position: "bare expression statement",
    nonAdmitted: `export const e32n = () => {\n  ${NON_ADMITTED_PROBE_PATH};\n};`,
    admitted: `export const e32n = () => {\n  ${ADMITTED_PROBE_PATH};\n};`,
  },
]);

/**
 * The cardinality of the position table. A FIFTEENTH position is a decision recorded as a row with
 * both of its sources — never a bumped constant, and never "the rule obviously covers it".
 */
const MEMBER_PATH_POSITION_ROW_COUNT = 14;

describe("32-32 — a capability member path is refused in every position but the two admitted ones", () => {
  it("the admitted-bound set is a SUBSET of the census, with its own pinned count", () => {
    expect(
      ADMITTED_BOUND_MEMBER_PATHS.length,
      "the admitted-bound set moved. A SEVENTH entry claims, in writing, that a BINDING of one " +
        "more platform capability is read-only — a stronger claim than admitting the path to the " +
        "census, because a binding can be called through later. Record the reason beside the " +
        "entry; never bump this constant",
    ).toBe(ADMITTED_BOUND_MEMBER_PATH_COUNT);
    expect(new Set(ADMITTED_BOUND_MEMBER_PATHS).size).toBe(ADMITTED_BOUND_MEMBER_PATHS.length);
    const strays = ADMITTED_BOUND_MEMBER_PATHS.filter(
      (path) => !EXPECTED_GLOBAL_MEMBER_PATHS.includes(path),
    );
    expect(
      strays,
      `${strays.join(", ")} is admitted as a BOUND read while the census does not admit the path ` +
        "at all. The two sets would then disagree about the same capability, and the one a reader " +
        "checks would decide the answer. The bound set is a SUBSET of the census by construction",
    ).toEqual([]);
  });

  it("the position table has exactly the number of rows it pins, and no duplicate position", () => {
    expect(
      MEMBER_PATH_POSITION_ROWS.length,
      "a position was added or removed. Every position a value can be consumed from is a place a " +
        "capability can be reached, so the table's size is a decision recorded as a row",
    ).toBe(MEMBER_PATH_POSITION_ROW_COUNT);
    expect(new Set(MEMBER_PATH_POSITION_ROWS.map((r) => r.position)).size).toBe(
      MEMBER_PATH_POSITION_ROW_COUNT,
    );
    // The pair differs in exactly one token. A row whose two sources differ in anything else is a
    // row measuring the shape of the plant rather than the path.
    for (const row of MEMBER_PATH_POSITION_ROWS) {
      expect(
        row.nonAdmitted.split(NON_ADMITTED_PROBE_PATH).join(ADMITTED_PROBE_PATH),
        `the two sources for "${row.position}" differ in more than the path, so a red on one and a ` +
          "green on the other does not isolate the path as the cause",
      ).toBe(row.admitted);
    }
  });

  for (const row of MEMBER_PATH_POSITION_ROWS) {
    it(`a NON-ADMITTED capability path read at a ${row.position} is an acquisition`, () => {
      withLiveMirror(
        { module: "scripts/board-read.js", appendSource: row.nonAdmitted },
        (mirrorRoot) => {
          const facts = analyzeClosure(mirrorRoot, DASHBOARD_ENTRY);
          expect(
            facts.acquisitions.length,
            `"${NON_ADMITTED_PROBE_PATH}" was read at a ${row.position} and the write-detection ` +
              "MECHANISM did not fire. This is the F-08 shape exactly: the census will still move " +
              "a count, and recording the spelling re-greens the whole guard over a live writer. " +
              `Collected acquisitions: [${facts.acquisitions.join(" | ")}]`,
          ).toBeGreaterThan(0);
          expect(
            facts.acquisitions.join("\n"),
            "something refused this plant, but not the member-path position rule — the row would " +
              "then credit arm 3 for a red another arm produced",
          ).toContain(NON_ADMITTED_PROBE_PATH);
          expect(facts.acquisitions.join("\n")).toContain("scripts/board-read.js");
        },
      );
    });

    it(`an ADMITTED-BOUND capability path read at a ${row.position} stays green (the converse)`, () => {
      withLiveMirror({ module: "scripts/board-read.js", appendSource: row.admitted }, (mirrorRoot) => {
        const facts = analyzeClosure(mirrorRoot, DASHBOARD_ENTRY);
        expect(
          facts.acquisitions,
          `"${ADMITTED_PROBE_PATH}" carries a written read-only claim in ` +
            `ADMITTED_BOUND_MEMBER_PATHS and was refused at a ${row.position} anyway. Over-refusal ` +
            "is not the safe direction here: the shipped closure hands both output channels to the " +
            "io seam through exactly this shape, so a rule that reds it gets loosened under that " +
            "pressure and ends weaker than the rule it replaced",
        ).toEqual([]);
        expect(
          facts.globalMemberPaths.filter((p) => !EXPECTED_GLOBAL_MEMBER_PATHS.includes(p)),
          "the converse plant moved the census as well as passing the position rule",
        ).toEqual([]);
      });
    });
  }

  it("a LOCAL ALIAS of a member path censuses the SAME maximal path as the direct spelling", () => {
    // THE TRUTH THE WHOLE ROUND RESTS ON. If the aliased call produced a DIFFERENT path, the
    // position rule could be satisfied while the census still reported something else, and a
    // maintainer reading the census would be reading a different program than the one that runs.
    const direct = "export const wDirect32 = (p) => process.report.writeReport(p);";
    const aliased = "const __r32 = process.report;\nexport const wAlias32 = (p) => __r32.writeReport(p);";
    const pathsOf = (appendSource: string): readonly string[] => {
      let seen: readonly string[] = [];
      withLiveMirror({ module: "scripts/board-read.js", appendSource }, (mirrorRoot) => {
        seen = analyzeClosure(mirrorRoot, DASHBOARD_ENTRY).globalMemberPaths.filter(
          (p) => !EXPECTED_GLOBAL_MEMBER_PATHS.includes(p),
        );
      });
      return seen;
    };
    expect(
      pathsOf(direct),
      "PREMISE: the DIRECT spelling of the process report writer is not censused as an unadmitted " +
        "path, so the comparison below has no left-hand side",
    ).toContain("process.report.writeReport");
    expect(
      pathsOf(aliased),
      "an intermediate binding changed the path the census sees. The alias must extend the bound " +
        "path rather than start a new root, or the guard reds with a DIFFERENT message for the " +
        "same capability and the two spellings drift apart (32-32-RED-baseline.txt § 1: before " +
        "this rule the aliased call contributed NOTHING and the maximal path stopped at the " +
        "binding site)",
    ).toContain("process.report.writeReport");
  });

  it("a CHAINED alias, two links deep, resolves to the same path", () => {
    withLiveMirror(
      {
        module: "scripts/board-read.js",
        appendSource:
          "const __c32a = process.report;\nconst __c32b = __c32a;\n" +
          "export const wChain32 = (p) => __c32b.writeReport(p);",
      },
      (mirrorRoot) => {
        const facts = analyzeClosure(mirrorRoot, DASHBOARD_ENTRY);
        expect(
          facts.globalMemberPaths,
          "a binding of a binding hid the path. The map is built in SOURCE ORDER against itself " +
            "precisely so depth costs nothing — a rule that counts links is a rule with a next link",
        ).toContain("process.report.writeReport");
        expect(facts.acquisitions.length).toBeGreaterThan(0);
      },
    );
  });

  it("a name ASSIGNED a capability path twice is REFUSED rather than tracked", () => {
    // THE ROW THAT ISOLATES THE ASSIGNMENT-SITE ARM. The declaration here carries NO initializer, so
    // the declaration-site arm cannot fire and only the assignment arm can refuse. Mutation M4b
    // (delete the assignment arm) reddened NOTHING until this row existed — the same "a clause no
    // mutation can red decides nothing" check that found 32-31's missing row.
    withLiveMirror(
      {
        module: "scripts/board-read.js",
        appendSource:
          "let __p32;\n__p32 = process.report;\n__p32 = process.stdout;\n" +
          "export const wTwice32 = (p) => __p32.writeReport(p);",
      },
      (mirrorRoot) => {
        const facts = analyzeClosure(mirrorRoot, DASHBOARD_ENTRY);
        expect(
          facts.acquisitions.join("\n"),
          "a name written more than once carries a value this syntactic pass cannot decide. " +
            "Following the reassignment and picking the 'real' value is the cleverer-pass instinct " +
            "the acquisition rule already refuses one register over — the pass REFUSES instead",
        ).toContain("UNPROVABLE CAPABILITY BINDING");
        expect(facts.acquisitions.length).toBeGreaterThan(0);
      },
    );
  });

  it("a binding DECLARED with a capability path and later reassigned to something harmless is refused", () => {
    // THE ROW THAT ISOLATES THE DECLARATION-SITE ARM. The reassignment case above is refused by the
    // ASSIGNMENT arm, because its right-hand side is itself a capability path — so with the
    // declaration-site arm deleted that case still passed (mutation M4a, measured: 170 passed).
    // A clause no mutation can red is a clause that decides nothing, which is how 32-31 found its
    // missing row. Here the reassignment is to `null`, so the assignment arm cannot fire and only
    // the DECLARATION-site arm can refuse.
    withLiveMirror(
      {
        module: "scripts/board-read.js",
        appendSource:
          "let __n32 = process.report;\n__n32 = null;\n" +
          "export const wHarmless32 = (p) => __n32.writeReport(p);",
      },
      (mirrorRoot) => {
        const facts = analyzeClosure(mirrorRoot, DASHBOARD_ENTRY);
        expect(
          facts.acquisitions.join("\n"),
          "a name DECLARED with a capability path and written again elsewhere was tracked as if " +
            "its value were decided. Whichever write the pass believed, the other one is a value " +
            "it guessed — and the guess would be recorded as a fact in the census. An unprovable " +
            "binding is not a safe binding",
        ).toContain("UNPROVABLE CAPABILITY BINDING");
      },
    );
  });

  it("POSITIVE CONTROL: the UNPLANTED live closure is unmoved by the position rule", () => {
    // Without this the rule could refuse everything and every row above would still be green.
    const facts = analyzeClosure(ROOT, DASHBOARD_ENTRY);
    expect(
      facts.acquisitions,
      "the position rule refuses something the SHIPPED dashboard already does. The admitted-bound " +
        "set is declared from a measurement of this exact closure (32-32-RED-baseline.txt § 5); a " +
        "red here means the measurement and the rule have come apart",
    ).toEqual([]);
    expect(
      facts.globalMemberPaths.length,
      "the capability-global census moved while the closure did not — the position rule changed " +
        "what the census REPORTS rather than what it refuses",
    ).toBe(EXPECTED_GLOBAL_MEMBER_PATH_COUNT);
    expect(
      normalizedBuiltinIdentities(facts).length,
      "the builtin identity count moved, so this round changed something outside the member-path " +
        "census it was scoped to",
    ).toBe(ALLOWED_BUILTIN_SPECIFIER_COUNT);
  });

  it("every admitted-bound path is REACHABLE in the live closure, so no admission outlives its reason", () => {
    const live = analyzeClosure(ROOT, DASHBOARD_ENTRY).globalMemberPaths;
    for (const path of ADMITTED_BOUND_MEMBER_PATHS) {
      expect(
        live,
        `"${path}" carries a written read-only claim and no closure module reaches it any more. A ` +
          "permanent admission whose reason has evaporated is the set-literal drift class this " +
          "repository has paid for: remove the entry rather than leaving the door open",
      ).toContain(path);
    }
  });
});

afterAll(() => {
  // Belt and braces for a crashed run: `withLiveMirror`'s `finally` removes each mirror, and this
  // removes the parent so no empty scratch directory survives either.
  rmSync(SCRATCH_ROOT, { recursive: true, force: true });
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// PART SIX — the ABSENCE of a runtime dependency, asserted rather than assumed.
//
// The whole closure walk rests on "this repository ships zero runtime dependencies": bare specifiers
// are node builtins, so skipping them loses nothing. The day a `dependencies` key appears, that
// premise is false and the closure above is silently short by everything under node_modules. So the
// premise is a failing assertion here, the same fail-closed posture `check:build-parity` uses.
// ═══════════════════════════════════════════════════════════════════════════════════════════════

describe("32-06 — the guard adds no runtime dependency", () => {
  it("package.json still has no `dependencies` key", () => {
    const manifest = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8")) as {
      readonly dependencies?: unknown;
      readonly scripts?: Record<string, string>;
    };
    expect(
      manifest.dependencies,
      "a `dependencies` key appeared in package.json. jsImportClosure follows RELATIVE specifiers " +
        "only, so a runtime dependency is invisible to the closure this guard walks — the guard " +
        "would stay green while reporting a set that is short by everything under node_modules",
    ).toBeUndefined();
  });

  it("every closure module under scripts/ has a sibling .ts source (32-11)", () => {
    // ASK WHAT THE GUARD IS ASKED OF, NOT ONLY WHAT IT REFUSES. `analyzeClosure` walks
    // `scripts/board-dashboard.js` — the COMMITTED BUILD OUTPUT. A `.js` in that closure with no
    // `.ts` beside it is a program no source in this repository describes, and nothing else in this
    // file would notice it. The list is DERIVED from the closure's own module list rather than
    // typed out, because a typed list is the drift class this repository has already paid for.
    const { modules } = analyzeClosure(ROOT, DASHBOARD_ENTRY);
    expect(
      modules.length,
      "PREMISE: the closure is empty, so the source-parity claim below is a statement about no " +
        "modules at all",
    ).toBeGreaterThan(0);
    const scriptModules = modules.filter((rel) => rel.startsWith("scripts/") && rel.endsWith(".js"));
    expect(
      scriptModules.length,
      "PREMISE: no closure module is a scripts/*.js, so the sibling-source claim measured nothing",
    ).toBeGreaterThan(0);
    const sourceless = scriptModules.filter(
      (rel) => !existsSync(join(ROOT, `${rel.slice(0, -".js".length)}.ts`)),
    );
    expect(
      sourceless,
      `the dashboard closure contains committed build output with no TypeScript source: ` +
        `${sourceless.join(", ")}. CLAUDE.md's tooling-layer contract is that every runnable .js is ` +
        "compiled from a .ts in this tree; a .js without one is a program this repository cannot " +
        "rebuild, and this guard would keep analysing it forever",
    ).toEqual([]);
  });

  it("check:build-parity exists and CI runs it — it is what makes the analysed .js the real program (32-11)", () => {
    // THIS GUARD'S ANSWER IS ONLY AS GOOD AS THE BUILD'S FRESHNESS. A writer introduced in a `.ts`
    // and not rebuilt is invisible here, because the subject of every assertion above is the
    // committed `.js`. That precondition lives in a DIFFERENT script, so the dependency is asserted
    // rather than left for a reader to infer.
    const manifest = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8")) as {
      readonly scripts?: Record<string, string>;
    };
    expect(
      manifest.scripts?.["check:build-parity"],
      "package.json no longer carries a `check:build-parity` entry. This guard decides a question " +
        "about the COMMITTED .js, and check:build-parity is the mechanism that makes that .js the " +
        "same program as its .ts. Without it, a green here is green over whatever was last committed",
    ).toBeDefined();

    const workflowPath = join(ROOT, ".github", "workflows", "ci.yml");
    expect(
      existsSync(workflowPath),
      `PREMISE: ${workflowPath} is absent, so the claim that CI runs the parity check could not be ` +
        "measured. Record `UNKNOWN - verify` rather than asserting a green that was not measured",
    ).toBe(true);
    expect(
      readFileSync(workflowPath, "utf8"),
      "the CI workflow no longer invokes `npm run check:build-parity`. The freshness precondition " +
        "this guard depends on would then hold only on a developer's machine",
    ).toContain("npm run check:build-parity");
  });

  it("the check:dashboard-readonly entry runs exactly this file", () => {
    // One authority, one implementation: the named command and the suite must not be able to drift
    // apart, which they cannot if the command IS the suite pointed at one file.
    const manifest = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8")) as {
      readonly scripts?: Record<string, string>;
    };
    expect(manifest.scripts?.["check:dashboard-readonly"]).toBe(
      "npx vitest run scripts/board-readonly.test.ts",
    );
  });
});

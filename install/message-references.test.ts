// message-references.test.ts — the MSG-1 class on the install side (phase 34.1 gap round 1, D-26;
// 34.1-GAP-PLANNING-BRIEF.md §1 MSG-1, §2.1).
//
// THE RULE. Every user-facing reference names something this run printed or something a user can open: a "line above"
// follows a line with that label in the same run, a "line about X" has such a line naming X, a planning decision ID is
// never printed (a user cannot look it up), a README section that is named exists, and a command that names agents is
// built by host-tools.ts agentCommand, the one builder that spells the agent flags. A remedy is tested by running it.
//
// WHAT IS HELD HERE. The product module set is every install/*.ts that is not a .test.ts, .test-support.ts or .d.ts,
// derived from git and counted. A TypeScript syntax-tree walk (never a line regex) collects every string fragment:
// StringLiteral, NoSubstitutionTemplateLiteral and template head, middle and tail nodes. Then:
//   (a) no fragment carries a planning ID (a decision ID such as D-04, or a plan ID such as `plan 34-28`);
//   (b) the fragments that point at another line (above, below, the next line, the {label} line about X) equal, both
//       ways, REFERENCE_TABLE, each row classed by what prints the referenced line on the same path; per-module counts;
//   (c) the fragments that name install.js or uninstall.js (with or without `node` and the `install/` prefix; the word
//       boundary keeps `.grugops/install.json` out) equal, both ways, COMMAND_TABLE, each classed "agentCommand",
//       "names no agent flag" (with the reason) or "file text"; and no string expression that names a binary holds an
//       agent flag, as a literal or through agentFlag: agent flags reach a printed command only through agentCommand;
//   (d) the README section the unattended selection's legacy reason names exists;
//   (e) the scenario matrix M1-M6: scratch runs whose every "the {label} line(s) above", "the {label} line about X" and
//       "the line above about X" is checked against the same run's output, and whose printed commands are run;
//   (f) the install-side re-run remedies (every product module except uninstall.ts, whose re-run remedies
//       install/agents-record.test.ts's uninstall re-run census owns) equal, both ways, RERUN_TABLE, each classed
//       "same-run command" (a counted verify of the install mode, finished by the command the install INCOMPLETE
//       banner prints, agentCommand("install.js", TARGET, SELECTION, COMMAND_CONTEXT)), "agentCommand", or
//       agent-independent with the reason; per-class counts are pinned, and each same-run row's path to a counted
//       verify is asserted by the parser.
//
// The tables were derived at execution of plan 34.1-15 (after plan 34.1-14 and this plan's Task 3 landed), not copied
// from the plan's sibling tables. A new fragment fails here as unclassified; classify it only once the message does
// what its class says (a breaking site is fixed in the product, never classified into a table to pass).
//
// Hermetic: every scratch run sets GRUGOPS_HOME and HOME to scratch directories under one root, removed in afterAll.
// Drives the COMMITTED install/install.js and install/uninstall.js (npm run build first).
//
// Clear professional voice: this is test infrastructure for an installer safety surface. Vitest `globals: false`.

import { describe, it, expect, afterAll } from "vitest";
import ts from "typescript";
import { execFileSync } from "node:child_process";
import { existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { HOST_TOOLS, PI_PROMPT_REL, agentCommand, agentFlag } from "./host-tools.js";
import {
  INSTALL_JS,
  MARKER_REL,
  commandContextFor,
  printedCommand,
  runInstall,
  runPrintedCommand,
  runUninstall,
  spawnBin,
  type Run,
} from "./installer-paths.test-support.js";
import { readMarkerObject, withLedger } from "./ledger.test-support.js";

const REPO_ROOT = resolve(import.meta.dirname, "..");
const SCRATCH = realpathSync(mkdtempSync(join(tmpdir(), "grugops-msgref-")));
afterAll(() => rmSync(SCRATCH, { recursive: true, force: true }));

// ── the fragments ────────────────────────────────────────────────────────────────────────────────────────────────

/** The product modules counted when this census landed (plan 34.1-15): agent-picker, checkpoint-ask-rules, host-tools,
 *  install-marker, install, json-text, kit-source, uninstall, user-file. */
const PRODUCT_MODULE_COUNT = 9;

/** Every tracked install/*.ts that is not a test, test-support or declaration file, from git. */
function productModules(): string[] {
  const listed = execFileSync("git", ["ls-files", "--", "install"], { cwd: REPO_ROOT, encoding: "utf8" });
  return listed
    .split("\n")
    .filter((f) => /^install\/[^/]+\.ts$/.test(f) && !/\.(test|test-support|d)\.ts$/.test(f))
    .map((f) => f.slice("install/".length))
    .sort();
}

interface Fragment {
  readonly module: string;
  readonly text: string;
  readonly node: ts.Node;
  readonly src: ts.SourceFile;
}
const norm = (s: string): string => s.replace(/\s+/g, " ").trim();
const parsed = new Map<string, ts.SourceFile>();
function sourceOf(module: string): ts.SourceFile {
  let s = parsed.get(module);
  if (s === undefined) {
    s = ts.createSourceFile(module, readFileSync(join(import.meta.dirname, module), "utf8"), ts.ScriptTarget.Latest, true);
    parsed.set(module, s);
  }
  return s;
}
/** Every string fragment of `modules`: string literals, no-substitution templates and template head, middle, tail. */
function fragmentsOf(modules: readonly string[]): Fragment[] {
  const out: Fragment[] = [];
  for (const module of modules) {
    const src = sourceOf(module);
    const visit = (n: ts.Node): void => {
      if (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n) || ts.isTemplateHead(n) || ts.isTemplateMiddle(n) || ts.isTemplateTail(n)) {
        out.push({ module, text: n.text, node: n, src });
      }
      ts.forEachChild(n, visit);
    };
    visit(src);
  }
  return out;
}
const where = (f: Fragment): string => `${f.module}:${f.src.getLineAndCharacterOfPosition(f.node.getStart()).line + 1}`;

/** A table row: module, the normalized fragment text, its class, and why (what prints the line, or the reason). */
type Row = readonly [module: string, text: string, cls: string, why: string];
/** A re-run row: a Row, plus, for a same-run command, how the fragment reaches a counted verify. */
type RerunRow = readonly [module: string, text: string, cls: string, why: string, via: string | null];

/** The found fragments and the table rows compared as multisets keyed by module and normalized text, both ways. */
function compareBothWays(found: readonly Fragment[], table: readonly (Row | RerunRow)[]): { unclassified: string[]; stale: string[] } {
  const key = (module: string, text: string): string => `${module} :: ${norm(text)}`;
  const want = new Map<string, number>();
  for (const r of table) want.set(key(r[0], r[1]), (want.get(key(r[0], r[1])) ?? 0) + 1);
  const unclassified: string[] = [];
  for (const f of found) {
    const k = key(f.module, f.text);
    const left = want.get(k) ?? 0;
    if (left === 0) unclassified.push(`${where(f)} :: ${norm(f.text)}`);
    else want.set(k, left - 1);
  }
  const stale = [...want].filter(([, n]) => n > 0).map(([k, n]) => `${k} (x${n})`);
  return { unclassified, stale };
}
function countBy<T>(items: readonly T[], key: (t: T) => string): Record<string, number> {
  const out: Record<string, number> = {};
  for (const i of items) out[key(i)] = (out[key(i)] ?? 0) + 1;
  return Object.fromEntries(Object.entries(out).sort(([a], [b]) => a.localeCompare(b)));
}
/** The nearest call expression around `n`, or null. */
function nearestCall(n: ts.Node): ts.CallExpression | null {
  for (let p: ts.Node | undefined = n.parent; p !== undefined; p = p.parent) if (ts.isCallExpression(p)) return p;
  return null;
}
/** The name of the nearest named declaration around `n`: a function declaration, or a const holding a function. */
function enclosingName(n: ts.Node): string | null {
  for (let p: ts.Node | undefined = n.parent; p !== undefined; p = p.parent) {
    if (ts.isFunctionDeclaration(p) && p.name !== undefined) return p.name.text;
    if (ts.isVariableDeclaration(p) && ts.isIdentifier(p.name) && p.initializer !== undefined && (ts.isArrowFunction(p.initializer) || ts.isFunctionExpression(p.initializer))) return p.name.text;
  }
  return null;
}

const PLANNING_ID = /\bD-\d{2}\b|\bplan \d+(\.\d+)?-\d+\b/;
const REFERENCE = /\b(above|below)\b|\b(next|previous|following|preceding) lines?\b|\bthe [a-z`-]+ lines? about\b/;
const COMMAND = /\b(un)?install\.js\b/;
const RERUN = /\bre-?run\b|\bthe (un)?installer\b|\brun install\b/;

// ── the tables (derived at execution of plan 34.1-15) ─────────────────────────────────────────────────────────────

const REFERENCE_TABLE: readonly Row[] = [
  ["install.ts", "# 1. (installed) the absolute kit path the installer wrote above this line.", "file text", "written into a Claude Code adapter (the KIT= slot comment), never printed"],
  ["install.ts", "any path inside the relayed message above is a temporary mirror that no longer exists.", "same block", "TEMP_MIRROR_DISCLAIMER follows the relayed generator message in the same printed line"],
  ["install.ts", "the install marker is not a record uninstall can use here (see the WARN above), so its ask-rule entry was not used and the ask rules were not checked", "printed reference", "doctor: the unbound-marker docWarn, printed earlier in the same --check run"],
  ["install.ts", "the install ledger in .grugops/install.json is malformed (see the FAIL above) — the ask rules", "printed reference", "doctor: the malformed-ledger docFail, printed earlier in the same --check run"],
  ["install.ts", "the line above about", "printed reference", "noteStrandingCarriers: only when `written` (a writer of this run visited the carrier and printed its line; D-26, WR-17)"],
  ["install.ts", "(listed above) were kept. Fix the cause and re-run with --backup-edited-kit, or restore the edited files first.", "printed reference", "backupEditedKitFiles: the backed-up lines of the same backup pass"],
  ["install.ts", "(left unchanged — it is a JSON object that is not install's marker, so it is not install's to replace; see the verify line above)", "printed reference", "writeMarker (step 8): askRulesStep's verify for the marker (step 7c, every run)"],
  ["install.ts", "(left unchanged — it could not be read; see the verify line above)", "printed reference", "writeMarker (step 8): askRulesStep's verify for the marker (step 7c, every run)"],
  ["install.ts", "refusal(s) above were found before the first change, and", "printed reference", "--migrate pre-check: its verify(why) loop, printed just before"],
  ["install.ts", "is still the old layout. Resolve each verify above and re-run --migrate.", "printed reference", "--migrate pre-check: its verify(why) loop, printed just before"],
  ["install.ts", "DRY_RUN: this run would back up plans/handoffs/ (see the would-backup line above). Nothing was changed.", "printed reference", "--migrate handoffs backup: its would-backup line, printed just before"],
  ["install.ts", "(see the backed-up line above)", "printed reference", "--migrate handoffs backup: its backed-up line, printed just before"],
  ["install.ts", "(see the note above); uninstall and --prune-old-kit leave it.", "printed reference", "--migrate handoffs backup: its note, printed just before"],
  ["install.ts", "below it was therefore neither installed nor refused by name, so the kit source was not fully", "not a line reference", "\"below it\" in the directory sense"],
  ["install.ts", "— the nested-adapter walk COULD NOT READ this directory, so anything below", "not a line reference", "\"below\" in the directory sense"],
  ["install.ts", "was left exactly as it was. Resolve each verify above and re-run.", "printed reference", "the kit step: its verify(why) loop over go.verifies, printed just before"],
  ["install.ts", "refusal(s) above", "printed reference", "the kit step: its verify(why) loop over kitPlan.refusals, printed just before"],
  ["install.ts", "verify above and re-run.", "printed reference", "the kit step: its verify(why) loop over kitPlan.refusals, printed just before"],
  ["install.ts", "the install marker could not be used (see the verify line about .grugops/install.json), so the rule could not be recorded for uninstall", "printed reference", "writeMarker's verify about .grugops/install.json (step 8, same run; a `line about`, not a position)"],
  ["install.ts", "the install ledger is malformed (see the verify line about .grugops/install.json), so the rule could not be recorded for uninstall", "printed reference", "writeMarker's verify about .grugops/install.json (step 8, same run; a `line about`, not a position)"],
  ["install.ts", "ask rule(s) an earlier install added remain (see the `left` lines above).", "printed reference", "askRulesNotes: askRulesStep's left lines (step 7c), printed before the notes"],
  ["install.ts", "No ask rule was written in this run (see the verify line above).", "printed reference", "askRulesNotes: askRulesStep's verify (step 7c), printed before the notes"],
  ["install.ts", "DRY_RUN, nothing written (the would- lines above name what a real run writes)", "printed reference", "agentClosingLines under DRY_RUN: the would- lines of the run"],
  ["install.ts", "the install record could not be read after this run (see the lines above)", "printed reference", "agentClosingLines: writeMarker's verify (step 8), printed before the notes"],
  ["install.ts", "nothing of install's is recorded for it (the lines above say why)", "printed reference", "agentClosingLines: the agent's writers' lines of the run (verify, skipped or note)"],
  ["install.ts", "Each `verify` line above names what was NOT installed and the remedy for it.", "printed reference", "the install INCOMPLETE banner: printed only when VERIFY_FINDINGS > 0, so some verify line came before"],
  ["uninstall.ts", "the install marker could not be used (see the verify line above), so there is no usable record that install appended this block — left in place;", "printed reference", "the module-top verify for an unusable marker, printed before any walk"],
  ["uninstall.ts", "the install ledger could not be used (see the verify line above) — left in place;", "printed reference", "the module-top verify for a malformed ledger, printed before any walk"],
  ["uninstall.ts", "; left in place — see the verify line above)", "printed reference", "the module-top verify for an unbound marker, printed before any walk"],
  ["uninstall.ts", "this run could not finish a recorded reversal (see the verify lines above)", "printed reference", "removeMarker: the walk's verify lines (markerDischarged false with nothing held)"],
  ["uninstall.ts", "once the cause in each verify line above is fixed", "printed reference", "removeMarker: the walk's verify lines (markerDischarged false with nothing held)"],
  ["uninstall.ts", "kept, and rewritten so its install ledger lists only what is still in place (the `left` line above says why it was kept).", "printed reference", "markerOutcomeLine: removeMarker's left line on the same arm"],
  ["uninstall.ts", "kept unchanged (the `left` line above says why it was kept).", "printed reference", "markerOutcomeLine: removeMarker's left line on the same arm"],
  ["uninstall.ts", "kept; DRY_RUN: it would be rewritten (see the would-edit line above), and nothing was changed.", "printed reference", "markerOutcomeLine: removeMarker's would-edit line on the same arm"],
  ["uninstall.ts", "kept, but not rewritten (see the verify line above).", "printed reference", "markerOutcomeLine: removeMarker's verify line on the same arm"],
  ["uninstall.ts", "kept unchanged for the agents installed here (the `kept` line above says why).", "printed reference", "markerOutcomeLine: removeMarker's kept line on the same arm"],
  ["uninstall.ts", "kept for the agents still installed here; DRY_RUN: it would be rewritten (see the would-edit line above), and nothing was changed.", "printed reference", "markerOutcomeLine: removeMarker's would-edit line on the same arm"],
  ["uninstall.ts", "kept for the agents still installed here, but not rewritten (see the verify line above).", "printed reference", "markerOutcomeLine: removeMarker's verify line on the same arm"],
  ["uninstall.ts", "left in place, untouched (the `left` or `verify` line above says why).", "printed reference", "markerOutcomeLine: removeMarker's left or verify line on the same arm"],
  ["uninstall.ts", "the install ledger could not be used (see the verify line above) — left in place", "printed reference", "the module-top verify for a malformed ledger, printed before any walk"],
  ["uninstall.ts", "(the install marker could not be used (see the verify line above), so there is no usable record of what install changed in it — left untouched)", "printed reference", "the module-top verify for an unusable marker, printed before any walk"],
  ["uninstall.ts", "(the install ledger could not be used — see the verify line above; left untouched)", "printed reference", "the module-top verify for a malformed ledger, printed before any walk"],
  ["uninstall.ts", "ask rules (the install ledger could not be used — see the verify line above; nothing removed)", "printed reference", "the module-top verify for a malformed ledger, printed before any walk"],
  ["uninstall.ts", ".grugops/ (seeded state) is kept; its install.json marker is reported on the next line.", "printed reference", "the preserved block: the marker line, printed by the next console.log"],
  ["uninstall.ts", "Each `verify` line above names what was NOT removed and the remedy for it.", "printed reference", "the uninstall INCOMPLETE banner: printed only when VERIFY_FINDINGS > 0"],
];
const COMMAND_TABLE: readonly Row[] = [
  ["host-tools.ts", "install.js", "agentCommand", "the builder itself: the binary's name in agentCommand's signature"],
  ["host-tools.ts", "uninstall.js", "agentCommand", "the builder itself: the binary's name in agentCommand's signature"],
  ["host-tools.ts", "install.js", "agentCommand", "the builder itself: the binary's name in scriptCommand's signature (agentCommand's invocation words, plan 34.1-22)"],
  ["host-tools.ts", "uninstall.js", "agentCommand", "the builder itself: the binary's name in scriptCommand's signature (agentCommand's invocation words, plan 34.1-22)"],
  ["host-tools.ts", "uninstall.js", "agentCommand", "the builder itself: scriptCommand gives an uninstall.js command no kit home and no --symlink (D-33)"],
  ["host-tools.ts", "uninstall.js", "agentCommand", "the builder itself: agentCommand refuses a mode on an uninstall.js command"],
  ["install.ts", "--target needs a directory (usage: node install/install.js --target <repo>, or --target=<path> for a", "names no agent flag", "the usage of --target; no agent is chosen at argument parsing"],
  ["install.ts", "install.js:", "names no agent flag", "the install.js: prefix of a usage message"],
  ["install.ts", "install.js: INSTALL_MODE must be copy or symlink (it is", "names no agent flag", "the install.js: prefix of a usage message"],
  ["install.ts", "it, re-run `node install/install.js --target <this repository>` from the grugops checkout. The", "file text", "written into a target file, not printed"],
  ["install.ts", "— run install.js (then install.js --check)", "names no agent flag", "no install is recorded here: install with no agent flag chooses the detected agents or refuses and names every agent flag (D-03)"],
  ["install.ts", "re-run install.js (then install.js --check)", "names no agent flag", "no usable marker: install with no agent flag chooses the detected agents or refuses and names every agent flag (D-03)"],
  ["install.ts", "and re-run install.js, which links or copies the current kit", "names no agent flag", "a link install made for an agent recorded here: install with no agent flag chooses the recorded agents (D-03)"],
  ["install.ts", "nothing was there when --check asked again, so run install.js --check again", "names no agent flag", "--check takes no agent flag (D-25)"],
  ["install.ts", "kit route cannot reach the Orchestrator. Re-run install.js (then install.js --check)", "names no agent flag", "the doctor speaks for the recorded agents, and install with no agent flag chooses that set (D-03)"],
  ["install.ts", "follows the route cannot reach the Orchestrator. Re-run install.js (then install.js --check)", "names no agent flag", "the doctor speaks for the recorded agents, and install with no agent flag chooses that set (D-03)"],
  ["install.ts", "Re-run install.js, which writes it where nothing is", "names no agent flag", "the doctor speaks for the recorded agents, and install with no agent flag chooses that set (D-03)"],
  ["install.ts", "is there now, so run install.js --check again", "names no agent flag", "--check takes no agent flag (D-25)"],
  ["install.ts", "Re-run install.js: it replaces install's own unedited copy with the current one", "names no agent flag", "the doctor speaks for the recorded agents, and install with no agent flag chooses that set (D-03)"],
  ["install.ts", "Re-run install.js: it appends install's start-here block, which carries the route", "names no agent flag", "the doctor speaks for the recorded agents, and install with no agent flag chooses that set (D-03)"],
  ["install.ts", "; otherwise re-run install.js here, which writes a marker for", "names no agent flag", "every install writes the marker, whatever agents it names (D-06)"],
  ["install.ts", "its records here and changes nothing. Re-run install.js here, then uninstall: install writes a marker with", "names no agent flag", "every install writes the marker (D-06); the uninstall half is agentCommand in the same expression"],
  ["install.ts", "uninstall.js", "agentCommand", "the doctor's unbound-marker remedy (D-26)"],
  ["install.ts", "uninstall.js", "agentCommand", "the doctor's unbound-marker remedy (D-26)"],
  ["install.ts", "install.js", "agentCommand", "the doctor's nothing-installed note (D-26, IN-21)"],
  ["install.ts", ", so NO VERDICT was reached on any agent's route to the Orchestrator. Re-run install.js with the", "names no agent flag", "no agent is recorded or detected: the text asks for the flag of each agent"],
  ["install.ts", "(run install.js to re-seed)", "names no agent flag", "the seeded state, which every install writes (D-06)"],
  ["install.ts", "run from the checkout: node install/install.js --target", "names no agent flag", "stale Claude Code adapters, checked only when Claude Code is recorded; install with no agent flag chooses the recorded set (D-03)"],
  ["install.ts", "Run `node install/install.js --check --target <repo>` to verify a repo against the refreshed kit.", "names no agent flag", "a --check hint; --check takes no agent flag (D-25)"],
  ["install.ts", "install.js: the real path of", "names no agent flag", "the install.js: prefix of a refusal before any agent is chosen"],
  ["install.ts", "install.js: the kit home", "names no agent flag", "the install.js: prefix of a refusal before any agent is chosen"],
  ["install.ts", "install.js", "agentCommand", "the route note for a carrier no writer of this run visited (D-26, WR-17)"],
  ["install.ts", "kit version to keep, so the version of the kit files in .claude is not known (install.js --check warns)", "names no agent flag", "a note about --check, which takes no agent flag (D-25)"],
  ["install.ts", "install.js:", "names no agent flag", "the install.js: prefix of the selection refusal; its example is agentCommand"],
  ["install.ts", "install.js", "agentCommand", "the selection refusal's example (D-26)"],
  ["install.ts", "uninstall.js", "agentCommand", "the ask-rules left line, for the agents owning the ask-rules entry (D-26)"],
  ["install.ts", "uninstall.js", "agentCommand", "the OpenCode other-root note, uninstall half (D-26)"],
  ["install.ts", "install.js", "agentCommand", "the OpenCode other-root note, install half (D-26)"],
  ["install.ts", "uninstall.js", "agentCommand", "the left-installed note (D-26)"],
  ["install.ts", "install.js", "agentCommand", "the install INCOMPLETE banner's same-run command (D-26)"],
  ["kit-source.ts", "install/install.js", "names no agent flag", "a path (SOURCE_MARKERS, the files that mark a kit checkout), not a command"],
  ["uninstall.ts", "--target needs a directory (usage: node install/uninstall.js --target <repo>, or --target=<path> for a", "names no agent flag", "the usage of --target; no agent is chosen at argument parsing"],
  ["uninstall.ts", "uninstall.js:", "names no agent flag", "the uninstall.js: prefix of a usage message"],
  ["uninstall.ts", "uninstall.js", "agentCommand", "rerunCommand (plan 34.1-14)"],
  ["uninstall.ts", "` again. Otherwise re-run install.js here, with any agent", "names no agent flag", "every install writes the marker, whatever agents it names (plan 34.1-14 says so in the text)"],
  ["uninstall.ts", "its records is used here, and this run removes and edits nothing. Re-run install.js here, then uninstall", "names no agent flag", "every install writes the marker, whatever agents it names (plan 34.1-14 says so in the text)"],
  ["uninstall.ts", "uninstall.js", "agentCommand", "finishCommand (plan 34.1-14)"],
  ["uninstall.ts", "uninstall.js", "agentCommand", "finishCommand (plan 34.1-14)"],
  ["uninstall.ts", "uninstall.js", "agentCommand", "finishCommand's NAMED case, split from the UNFINISHED case (plan 34.1-21, D-31); its last case is rerunCommand"],
  ["uninstall.ts", "-- reversing what the install ledger records (only what install.js wrote) --", "names no agent flag", "a section heading naming the binary, not a command"],
];
const RERUN_TABLE: readonly RerunRow[] = [
  ["install.ts", "# 1. (installed) the absolute kit path the installer wrote above this line.", "file text", "written into an adapter, not printed", null],
  ["install.ts", "it, re-run `node install/install.js --target <this repository>` from the grugops checkout. The", "file text", "written into a target file, not printed", null],
  ["install.ts", "// owns that grammar: the reader stays where it is declared, and the installer holds no copy of", "file text", "written into a temp mirror, not printed", null],
  ["install.ts", "Replace the link with a regular file (or remove it) and re-run; the installer never writes", "same-run command", "a counted verify of the install mode about Claude Code's kit, adapters or ask rules; the install INCOMPLETE banner prints agentCommand(\"install.js\", TARGET, SELECTION, COMMAND_CONTEXT)", "adapterDestHazard"],
  ["install.ts", "Check that the target directory exists and is readable, then re-run.", "same-run command", "a counted verify of the install mode about Claude Code's kit, adapters or ask rules; the install INCOMPLETE banner prints agentCommand(\"install.js\", TARGET, SELECTION, COMMAND_CONTEXT)", "adapterDestHazard"],
  ["install.ts", "a real one, or install into the directory the link points at, and re-run; the installer only", "same-run command", "a counted verify of the install mode about Claude Code's kit, adapters or ask rules; the install INCOMPLETE banner prints agentCommand(\"install.js\", TARGET, SELECTION, COMMAND_CONTEXT)", "adapterDestHazard"],
  ["install.ts", "— run install.js (then install.js --check)", "agent-independent: doctor, recorded agents", "no install is recorded: install with no agent flag detects the agents or refuses naming every flag (D-03)", null],
  ["install.ts", "re-run install.js (then install.js --check)", "agent-independent: doctor, recorded agents", "no usable marker: install with no agent flag detects the agents or refuses naming every flag (D-03)", null],
  ["install.ts", "and re-run install.js, which links or copies the current kit", "agent-independent: doctor, recorded agents", "install's own link for an agent recorded here: install with no agent flag chooses the recorded agents (D-03)", null],
  ["install.ts", "nothing was there when --check asked again, so run install.js --check again", "agent-independent: mode with no agent set", "--check takes no agent flag (D-25)", null],
  ["install.ts", "kit route cannot reach the Orchestrator. Re-run install.js (then install.js --check)", "agent-independent: doctor, recorded agents", "--check speaks for the recorded agents, and install with no agent flag chooses that set (D-03)", null],
  ["install.ts", "follows the route cannot reach the Orchestrator. Re-run install.js (then install.js --check)", "agent-independent: doctor, recorded agents", "--check speaks for the recorded agents, and install with no agent flag chooses that set (D-03)", null],
  ["install.ts", "Re-run install.js, which writes it where nothing is", "agent-independent: doctor, recorded agents", "--check speaks for the recorded agents, and install with no agent flag chooses that set (D-03)", null],
  ["install.ts", "is there now, so run install.js --check again", "agent-independent: mode with no agent set", "--check takes no agent flag (D-25)", null],
  ["install.ts", "Re-run install.js: it replaces install's own unedited copy with the current one", "agent-independent: doctor, recorded agents", "--check speaks for the recorded agents, and install with no agent flag chooses that set (D-03)", null],
  ["install.ts", "Re-run install.js: it appends install's start-here block, which carries the route", "agent-independent: doctor, recorded agents", "--check speaks for the recorded agents, and install with no agent flag chooses that set (D-03)", null],
  ["install.ts", "; otherwise re-run install.js here, which writes a marker for", "agent-independent: shared footprint", "the marker, which every install writes whatever agents it names (D-06)", null],
  ["install.ts", "its records here and changes nothing. Re-run install.js here, then uninstall: install writes a marker with", "agentCommand", "the uninstall step is agentCommand, and it says the flag-less command removes every agent", null],
  ["install.ts", ", so NO VERDICT was reached on any agent's route to the Orchestrator. Re-run install.js with the", "agent-independent: doctor, recorded agents", "none is recorded or detected: the text asks for the flag of each agent", null],
  ["install.ts", "(run install.js to re-seed)", "agent-independent: shared footprint", "the seeded state, which every install writes (D-06)", null],
  ["install.ts", "disagree; re-run --check from a complete kit", "agent-independent: mode with no agent set", "--check takes no agent flag (D-25)", null],
  ["install.ts", "disagree; re-run --check from a complete kit checkout.", "agent-independent: mode with no agent set", "--check takes no agent flag (D-25)", null],
  ["install.ts", "what differs here is what a re-run would change. That checkout is a DIFFERENT root", "agent-independent: doctor, recorded agents", "stale Claude Code adapters, checked only when Claude Code is recorded; install with no agent flag chooses the recorded set (D-03)", null],
  ["install.ts", "were not checked, and neither the installer nor the uninstaller will change them until the field is fixed", "not a remedy", "says what the installer does with a malformed ledger; asks for nothing", null],
  ["install.ts", "the install ledger records no ask rules for .claude/settings.json — re-run the installer to write them", "agent-independent: doctor, recorded agents", "printed only when Claude Code is recorded; install with no agent flag chooses the recorded set (D-03)", null],
  ["install.ts", "(re-run the installer to restore it)", "agent-independent: doctor, recorded agents", "printed only when Claude Code is recorded; install with no agent flag chooses the recorded set (D-03)", null],
  ["install.ts", "Move or remove the existing backup, then re-run --migrate.", "agent-independent: mode with no agent set", "--migrate's handoffs backup, recorded for the shared layout", null],
  ["install.ts", "and not renamed to a .bak. Replace it with a regular file (or remove it) and re-run --migrate.", "agent-independent: mode with no agent set", "--migrate's config carry, the shared layout", null],
  ["install.ts", "and re-run --migrate.", "agent-independent: mode with no agent set", "--migrate's config carry, the shared layout", null],
  ["install.ts", "copied (never overwrite a backup). Move that backup and re-run.", "agent-independent: shared footprint", "the kit home, which every install copies (D-06)", null],
  ["install.ts", "should contain is unknown rather than known to be unchanged. Re-run the installer from a", "agent-independent: shared footprint", "the kit checkout the render runs from, which no agent flag changes", null],
  ["install.ts", "directory writable — or point TMPDIR at one that is — and re-run.", "agent-independent: shared footprint", "the temporary directory the render runs in, which no agent flag changes", null],
  ["install.ts", "was produced. Re-run the installer from a complete kit checkout.", "agent-independent: shared footprint", "the kit checkout the render runs from, which no agent flag changes", null],
  ["install.ts", "file, or remove it, and re-run.", "agent-independent: shared footprint", "the temporary directory the render runs in, which no agent flag changes", null],
  ["install.ts", "was installed. Check that the system temporary directory is writable and re-run.", "agent-independent: shared footprint", "the temporary directory the render runs in, which no agent flag changes", null],
  ["install.ts", "installed. Re-run the installer from a complete kit checkout.", "agent-independent: shared footprint", "the kit checkout the render runs from, which no agent flag changes", null],
  ["install.ts", "and not unlinked, and nothing was written. Replace it with a regular file (or remove it) and re-run.", "same-run command", "a counted verify of the install mode about Claude Code's kit, adapters or ask rules; the install INCOMPLETE banner prints agentCommand(\"install.js\", TARGET, SELECTION, COMMAND_CONTEXT)", "kitDestDecision"],
  ["install.ts", "re-run with --backup-edited-kit to back them up and refresh the whole kit, or restore them first", "same-run command", "a counted verify of the install mode about Claude Code's kit, adapters or ask rules; the install INCOMPLETE banner prints agentCommand(\"install.js\", TARGET, SELECTION, COMMAND_CONTEXT); the verify names --backup-edited-kit itself", "kitWriteDecision"],
  ["install.ts", "(listed above) were kept. Fix the cause and re-run with --backup-edited-kit, or restore the edited files first.", "same-run command", "a counted verify of the install mode about Claude Code's kit, adapters or ask rules; the install INCOMPLETE banner prints agentCommand(\"install.js\", TARGET, SELECTION, COMMAND_CONTEXT); the verify names --backup-edited-kit itself", "verify"],
  ["install.ts", "is still the old layout. Resolve each verify above and re-run --migrate.", "agent-independent: mode with no agent set", "--migrate's pre-check: the migrate INCOMPLETE banner, the shared layout", null],
  ["install.ts", "unknown. No skill was installed. Re-run the installer from a complete kit checkout.", "same-run command", "a counted verify of the install mode about Claude Code's kit, adapters or ask rules; the install INCOMPLETE banner prints agentCommand(\"install.js\", TARGET, SELECTION, COMMAND_CONTEXT)", "refusals.push"],
  ["install.ts", "unknown. No adapter was installed. Re-run the installer from a complete kit checkout.", "same-run command", "a counted verify of the install mode about Claude Code's kit, adapters or ask rules; the install INCOMPLETE banner prints agentCommand(\"install.js\", TARGET, SELECTION, COMMAND_CONTEXT)", "refusals.push"],
  ["install.ts", "as it was. Re-run the installer from a complete kit checkout whose adapter directory", "same-run command", "a counted verify of the install mode about Claude Code's kit, adapters or ask rules; the install INCOMPLETE banner prints agentCommand(\"install.js\", TARGET, SELECTION, COMMAND_CONTEXT)", "refusals.push"],
  ["install.ts", "was rendered without the installer's kit slot line, so it", "not a remedy", "names the installer's kit slot line; asks for nothing", null],
  ["install.ts", "left as it was. Re-run the installer from a kit checkout whose generator and installer", "same-run command", "a counted verify of the install mode about Claude Code's kit, adapters or ask rules; the install INCOMPLETE banner prints agentCommand(\"install.js\", TARGET, SELECTION, COMMAND_CONTEXT)", "refusals.push"],
  ["install.ts", "left as it was. Re-run the installer from a kit checkout whose generator and installer", "same-run command", "a counted verify of the install mode about Claude Code's kit, adapters or ask rules; the install INCOMPLETE banner prints agentCommand(\"install.js\", TARGET, SELECTION, COMMAND_CONTEXT)", "refusals.push"],
  ["install.ts", "directory and re-run.", "same-run command", "a counted verify of the install mode about Claude Code's kit, adapters or ask rules; the install INCOMPLETE banner prints agentCommand(\"install.js\", TARGET, SELECTION, COMMAND_CONTEXT)", "refusals.push"],
  ["install.ts", "installed. Fix the permissions on it or restore the checkout, then re-run.", "same-run command", "a counted verify of the install mode about Claude Code's kit, adapters or ask rules; the install INCOMPLETE banner prints agentCommand(\"install.js\", TARGET, SELECTION, COMMAND_CONTEXT)", "refusals.push"],
  ["install.ts", "Remove the cross-linked symlinks under the adapter directory and re-run.", "same-run command", "a counted verify of the install mode about Claude Code's kit, adapters or ask rules; the install INCOMPLETE banner prints agentCommand(\"install.js\", TARGET, SELECTION, COMMAND_CONTEXT)", "refusals.push"],
  ["install.ts", "path. Re-run the installer from a kit checkout whose skill and adapter names are distinct.", "same-run command", "a counted verify of the install mode about Claude Code's kit, adapters or ask rules; the install INCOMPLETE banner prints agentCommand(\"install.js\", TARGET, SELECTION, COMMAND_CONTEXT)", "refusals.push"],
  ["install.ts", "they are ONE path, and the second write would overwrite the first. Re-run the installer from", "same-run command", "a counted verify of the install mode about Claude Code's kit, adapters or ask rules; the install INCOMPLETE banner prints agentCommand(\"install.js\", TARGET, SELECTION, COMMAND_CONTEXT)", "refusals.push"],
  ["install.ts", "was left exactly as it was. Resolve each verify above and re-run.", "same-run command", "a counted verify of the install mode about Claude Code's kit, adapters or ask rules; the install INCOMPLETE banner prints agentCommand(\"install.js\", TARGET, SELECTION, COMMAND_CONTEXT)", "report"],
  ["install.ts", "verify above and re-run.", "same-run command", "a counted verify of the install mode about Claude Code's kit, adapters or ask rules; the install INCOMPLETE banner prints agentCommand(\"install.js\", TARGET, SELECTION, COMMAND_CONTEXT)", "report"],
  ["install.ts", "and the marker was left as it was. Fix or remove the marker, then re-run the installer.", "agent-independent: shared footprint", "the marker, which every install writes (D-06)", null],
  ["install.ts", "added and the ledger is written back unchanged. Fix the ledger field, then re-run the installer.", "agent-independent: shared footprint", "the marker's ledger, which every install writes (D-06)", null],
  ["install.ts", "— left untouched; no ask rule was written. Fix the file and re-run the installer.", "same-run command", "a counted verify of the install mode about Claude Code's kit, adapters or ask rules; the install INCOMPLETE banner prints agentCommand(\"install.js\", TARGET, SELECTION, COMMAND_CONTEXT)", "verify"],
  ["install.ts", "— left untouched; no ask rule was written. Fix the file and re-run the installer.", "same-run command", "a counted verify of the install mode about Claude Code's kit, adapters or ask rules; the install INCOMPLETE banner prints agentCommand(\"install.js\", TARGET, SELECTION, COMMAND_CONTEXT)", "verify"],
  ["install.ts", "known — left untouched; no ask rule was written. Fix the file and re-run the installer.", "same-run command", "a counted verify of the install mode about Claude Code's kit, adapters or ask rules; the install INCOMPLETE banner prints agentCommand(\"install.js\", TARGET, SELECTION, COMMAND_CONTEXT)", "verify"],
  ["install.ts", "is not a JSON object — left untouched; no ask rule was written. Fix the file and re-run the installer.", "same-run command", "a counted verify of the install mode about Claude Code's kit, adapters or ask rules; the install INCOMPLETE banner prints agentCommand(\"install.js\", TARGET, SELECTION, COMMAND_CONTEXT)", "verify"],
  ["install.ts", "; the installer never", "agentCommand", "the head of the ask-rules left line, whose remedy is agentCommand", null],
  ["install.ts", "left as it was. Fix or remove the marker, then re-run the installer.", "agent-independent: shared footprint", "the marker, which every install writes (D-06)", null],
  ["user-file.ts", "is a symbolic link, and the installer never writes through a link it did not create", "not a remedy", "says what the installer never does", null],
  ["user-file.ts", ", and the installer writes only inside the target", "not a remedy", "says what the installer does", null],
];

// ── (a)-(d), (f): the censuses ──────────────────────────────────────────────────────────────────────────────────────

describe("MSG-1 census over the product modules' string fragments (D-26)", () => {
  const modules = productModules();
  const all = fragmentsOf(modules);

  it(`the product module set is derived from git and is ${PRODUCT_MODULE_COUNT} modules`, () => {
    expect(modules, modules.join(", ")).toHaveLength(PRODUCT_MODULE_COUNT);
    expect(all.length, "premise: the walk found fragments").toBeGreaterThan(1000);
  });

  it("(a) no fragment carries a planning ID (a decision ID, or a plan ID)", () => {
    expect(all.filter((f) => PLANNING_ID.test(f.text)).map((f) => `${where(f)} :: ${norm(f.text)}`)).toEqual([]);
  });

  it("(b) every fragment that points at another line is classed by what prints that line (equal both ways, with counts)", () => {
    const found = all.filter((f) => REFERENCE.test(f.text));
    expect(compareBothWays(found, REFERENCE_TABLE)).toEqual({ unclassified: [], stale: [] });
    expect(countBy(found, (f) => f.module)).toEqual({ "install.ts": 26, "uninstall.ts": 19 });
    expect(countBy(REFERENCE_TABLE, (r) => r[2])).toEqual({ "file text": 1, "not a line reference": 2, "printed reference": 41, "same block": 1 });
  });

  it("(c) every fragment that names install.js or uninstall.js is classed (equal both ways, with counts)", () => {
    const found = all.filter((f) => COMMAND.test(f.text));
    expect(compareBothWays(found, COMMAND_TABLE)).toEqual({ unclassified: [], stale: [] });
    expect(countBy(found, (f) => f.module)).toEqual({ "host-tools.ts": 6, "install.ts": 34, "kit-source.ts": 1, "uninstall.ts": 9 });
    expect(countBy(COMMAND_TABLE, (r) => r[2])).toEqual({ agentCommand: 20, "file text": 1, "names no agent flag": 29 });
  });

  // The builder is agentCommand and the invocation words it prints first, scriptCommand (plan 34.1-22, D-33): a
  // host-tools.ts fragment classed agentCommand lies inside one of those two functions, and nowhere else.
  it("(c) an agentCommand row's fragment is an argument of an agentCommand call (or inside the builder: agentCommand or scriptCommand)", () => {
    const rows = new Set(COMMAND_TABLE.filter((r) => r[2] === "agentCommand").map((r) => `${r[0]} :: ${norm(r[1])}`));
    const found = all.filter((f) => COMMAND.test(f.text) && rows.has(`${f.module} :: ${norm(f.text)}`));
    expect(found.length, "premise: the agentCommand rows are found").toBe(20);
    const builder = new Set(["agentCommand", "scriptCommand"]);
    for (const f of found) {
      const call = nearestCall(f.node);
      const ok = (call !== null && call.expression.getText(f.src) === "agentCommand") || (f.module === "host-tools.ts" && builder.has(enclosingName(f.node) ?? ""));
      expect(ok, `${where(f)} is classed agentCommand but is not an agentCommand argument`).toBe(true);
    }
  });

  it("(c) no string expression that names install.js or uninstall.js holds an agent flag, literal or through agentFlag", () => {
    const flags = HOST_TOOLS.map(agentFlag);
    const flagWord = new RegExp(`(^|[^\\w-])(${flags.map((x) => x.replace(/[-]/g, "\\-")).join("|")})(?![\\w-])`);
    /** The maximal `+` chain or template literal holding `n`, conditional arms and parentheses included. */
    const maximal = (n: ts.Node): ts.Node => {
      let cur: ts.Node = n;
      for (;;) {
        const p = cur.parent;
        if (p === undefined) return cur;
        const grows =
          ts.isTemplateSpan(p) ||
          ts.isTemplateExpression(p) ||
          ts.isParenthesizedExpression(p) ||
          (ts.isBinaryExpression(p) && p.operatorToken.kind === ts.SyntaxKind.PlusToken) ||
          (ts.isConditionalExpression(p) && (p.whenTrue === cur || p.whenFalse === cur));
        if (!grows) return cur;
        cur = p;
      }
    };
    const breaks: string[] = [];
    for (const f of all.filter((x) => COMMAND.test(x.text))) {
      const expr = maximal(f.node);
      const visit = (n: ts.Node): void => {
        if ((ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n) || ts.isTemplateHead(n) || ts.isTemplateMiddle(n) || ts.isTemplateTail(n)) && flagWord.test(n.text)) {
          breaks.push(`${where(f)}: a literal agent flag in ${JSON.stringify(n.text)}`);
        }
        if (ts.isIdentifier(n) && n.text === "agentFlag") breaks.push(`${where(f)}: agentFlag in the expression`);
        ts.forEachChild(n, visit);
      };
      visit(expr);
    }
    expect(breaks).toEqual([]);
  });

  it("(d) the README section the unattended selection's legacy reason names exists, and install.ts names it", () => {
    const section = "Which agents an unattended install is for";
    const readme = readFileSync(join(import.meta.dirname, "README.md"), "utf8").split(/\r?\n/);
    expect(readme.filter((l) => l === `#### ${section}`), "the README heading").toHaveLength(1);
    expect(fragmentsOf(["install.ts"]).filter((f) => f.text.includes(`see "${section}" in install/README.md`)).length).toBe(1);
  });

  it("(f) every install-side re-run remedy is classed (equal both ways, with class counts)", () => {
    const found = fragmentsOf(modules.filter((m) => m !== "uninstall.ts")).filter((f) => RERUN.test(f.text));
    expect(compareBothWays(found, RERUN_TABLE)).toEqual({ unclassified: [], stale: [] });
    expect(countBy(found, (f) => f.module)).toEqual({ "install.ts": 61, "user-file.ts": 2 });
    expect(countBy(RERUN_TABLE, (r) => r[2])).toEqual({
      agentCommand: 2,
      "agent-independent: doctor, recorded agents": 12,
      "agent-independent: mode with no agent set": 8,
      "agent-independent: shared footprint": 12,
      "file text": 3,
      "not a remedy": 4,
      "same-run command": 22,
    });
  });

  it("(f) each same-run command row reaches a counted verify of the install mode, by the parser", () => {
    const src = sourceOf("install.ts");
    // The two verify loops the kit step's refusals and verifies are printed by.
    const loops = new Set<string>();
    const visit = (n: ts.Node): void => {
      if (ts.isForOfStatement(n)) {
        const body = n.statement.getText(src);
        if (/^verify\(why\);?$|^\{\s*verify\(why\);?\s*\}$/.test(body.trim())) loops.add(n.expression.getText(src));
      }
      ts.forEachChild(n, visit);
    };
    visit(src);
    expect([...loops].sort(), "the verify loops").toEqual(expect.arrayContaining(["go.verifies", "kitPlan.refusals"]));
    const rows = RERUN_TABLE.filter((r) => r[2] === "same-run command");
    const found = fragmentsOf(["install.ts"]).filter((f) => RERUN.test(f.text));
    for (const r of rows) {
      const f = found.find((x) => norm(x.text) === norm(r[1]));
      expect(f, `no fragment for the same-run row ${r[1]}`).toBeDefined();
      if (f === undefined) continue;
      const call = nearestCall(f.node);
      const callee = call === null ? null : call.expression.getText(src);
      const via = r[4];
      if (via === "verify") expect(callee, where(f)).toBe("verify");
      else if (via === "refusals.push") {
        expect(callee, where(f)).toBe("refusals.push");
        expect(enclosingName(f.node), where(f)).toBe("buildKitPlan");
      } else if (via === "report") {
        expect(callee, where(f)).toBe("report");
        const stmt = call!.parent;
        const block = stmt.parent;
        expect(ts.isExpressionStatement(stmt) && ts.isBlock(block), where(f)).toBe(true);
        const stmts = (block as ts.Block).statements;
        const prev = stmts[stmts.indexOf(stmt as ts.Statement) - 1];
        expect(prev !== undefined && ts.isForOfStatement(prev) && loops.has(prev.expression.getText(src)), `${where(f)}: not right after a verify loop`).toBe(true);
      } else {
        expect(["adapterDestHazard", "kitDestDecision", "kitWriteDecision"], `${where(f)}: an unknown via ${via}`).toContain(via);
        expect(enclosingName(f.node), where(f)).toBe(via);
      }
    }
  });

  it("(f) the install INCOMPLETE banner prints agentCommand(\"install.js\", TARGET, SELECTION, COMMAND_CONTEXT)", () => {
    const src = sourceOf("install.ts");
    const hits: string[] = [];
    const visit = (n: ts.Node): void => {
      if (ts.isTemplateExpression(n) && n.head.text.includes("Once each is fixed, `")) {
        for (const span of n.templateSpans) {
          const e = span.expression;
          if (ts.isCallExpression(e) && e.expression.getText(src) === "agentCommand") hits.push(e.arguments.map((a) => a.getText(src)).join(", "));
        }
      }
      ts.forEachChild(n, visit);
    };
    visit(src);
    expect(hits).toEqual(['"install.js", TARGET, SELECTION, COMMAND_CONTEXT']);
  });
});

// ── (e) the scenario matrix ──────────────────────────────────────────────────────────────────────────────────────────

let seq = 0;
interface World {
  readonly target: string;
  readonly home: string;
  readonly kitHome: string;
}
function world(tag: string): World {
  const root = join(SCRATCH, `${tag}-${seq++}`);
  const target = join(root, "target");
  const home = join(root, "home");
  mkdirSync(target, { recursive: true });
  mkdirSync(home, { recursive: true });
  return { target, home, kitHome: join(home, ".grugops") };
}
const hostOf = (adapter: string): (typeof HOST_TOOLS)[number] => {
  const h = HOST_TOOLS.filter((x) => x.adapter === adapter);
  expect(h.length, `premise: one registry row has the ${adapter} adapter`).toBe(1);
  return h[0];
};
const install = (w: World, flags: readonly string[], opts: { kitHome?: string; dryRun?: boolean } = {}): Run =>
  runInstall(w.target, opts.kitHome ?? w.kitHome, flags, { home: w.home, dryRun: opts.dryRun, timeoutMs: 180_000 });
const check = (w: World): Run => spawnBin(INSTALL_JS, ["--check"], w.target, w.kitHome, { home: w.home, timeoutMs: 120_000 });
const uninstall = (w: World, flags: readonly string[] = []): Run => runUninstall(w.target, w.kitHome, { home: w.home, timeoutMs: 120_000 }, flags);
const at = (w: World, rel: string): string => join(w.target, ...rel.split("/"));

/** The label column of a report line (two spaces, then the label), or null. */
const labelOf = (line: string): string | null => {
  const m = /^ {2}(\S+)\s/.exec(line);
  return m === null ? null : m[1];
};
const labelMatches = (label: string, want: string): boolean => (want.endsWith("-") ? label.startsWith(want) : label === want);

/**
 * THE REFERENCE CHECK: every reference a run printed points at a line of the same run. Returns the references found
 * and the ones that point at nothing.
 *   "the {label} line(s) above" (and "the {a} or {b} line above", and "see the WARN/FAIL above"): an EARLIER line whose
 *   label column is that label (a label ending in "-" is a prefix, as in "the would- lines above");
 *   "the {label} line about X": another line of the run whose label column is that label and that names X;
 *   "the line above about X": an earlier line that names X.
 */
function referenceCheck(stdout: string): { found: number; broken: string[] } {
  const lines = stdout.split("\n");
  const broken: string[] = [];
  let found = 0;
  const earlierWith = (i: number, wants: readonly string[]): boolean =>
    lines.slice(0, i).some((l) => {
      const label = labelOf(l);
      return label !== null && wants.some((w) => labelMatches(label, w));
    });
  lines.forEach((line, i) => {
    for (const m of line.matchAll(/the `?([A-Za-z][A-Za-z-]*)`?(?: or `?([A-Za-z][A-Za-z-]*)`?)? lines? above/g)) {
      found += 1;
      const wants = [m[1], m[2]].filter((x): x is string => x !== undefined);
      if (!earlierWith(i, wants)) broken.push(`line ${i + 1} points at "${m[0]}", and no earlier ${wants.join(" or ")} line was printed: ${line}`);
    }
    for (const m of line.matchAll(/see the (WARN|FAIL) above/g)) {
      found += 1;
      if (!earlierWith(i, [m[1]])) broken.push(`line ${i + 1} points at "${m[0]}", and no earlier ${m[1]} line was printed: ${line}`);
    }
    for (const m of line.matchAll(/the `?([A-Za-z][A-Za-z-]*)`? lines? about ([^\s),;]+)/g)) {
      found += 1;
      const ok = lines.some((l, j) => j !== i && labelOf(l) !== null && labelMatches(labelOf(l) as string, m[1]) && l.includes(m[2]));
      if (!ok) broken.push(`line ${i + 1} points at "${m[0]}", and no ${m[1]} line names ${m[2]}: ${line}`);
    }
    for (const m of line.matchAll(/the line above about (\S+) says/g)) {
      found += 1;
      if (!lines.slice(0, i).some((l) => l.includes(m[1]))) broken.push(`line ${i + 1} points at "${m[0]}", and no earlier line names ${m[1]}: ${line}`);
    }
  });
  return { found, broken };
}
function expectReferences(runs: ReadonlyArray<readonly [string, Run]>, someRequired = true): void {
  let found = 0;
  for (const [what, r] of runs) {
    const c = referenceCheck(r.stdout);
    found += c.found;
    expect(c.broken, `${what}: a reference points at a line this run did not print\n${r.stdout}`).toEqual([]);
  }
  if (someRequired) expect(found, "premise: the scenario printed some reference to another line").toBeGreaterThan(0);
}

describe("(e) MSG-1 scenario matrix: every reference a run prints points at a line of the same run, and printed commands run (D-26)", () => {
  it("M1: plan 34.1-14's partial uninstall over an edited Claude Code file", () => {
    const w = world("m1");
    const claude = hostOf("claude-kit");
    const codex = HOST_TOOLS.find((h) => h.id === "codex")!;
    const i = install(w, [agentFlag(claude), agentFlag(codex)]);
    expect(i.status, i.stdout + i.stderr).toBe(0);
    const skill = at(w, ".claude/skills/grugops-gate/SKILL.md");
    writeFileSync(skill, Buffer.concat([readFileSync(skill), Buffer.from("\na line the user added\n")]));
    const u = uninstall(w, [agentFlag(claude)]);
    expect(u.status, u.stdout + u.stderr).toBe(0);
    expectReferences([["install", i], ["uninstall --claude", u]]);
  }, 240_000);

  it("M2: install, --check and uninstall over a marker whose ledger is malformed (the verify line about .grugops/install.json, and the reason that names no position)", () => {
    const w = world("m2");
    writeFileSync(at(w, "AGENTS.md"), "# My agents\n\nMy own instructions.\n");
    const flags = [agentFlag(hostOf("claude-kit")), agentFlag(hostOf("opencode-command"))];
    const first = install(w, flags);
    expect(first.status, first.stdout + first.stderr).toBe(0);
    const m = withLedger(readMarkerObject(w.target), (entries) => [...entries, { path: "x", kind: "bogus" }]);
    writeFileSync(at(w, MARKER_REL), JSON.stringify(m, null, 2) + "\n");
    const again = install(w, flags);
    const doc = check(w);
    const u = uninstall(w);
    // The reference check first, so a reason that points at a line no run printed is named by it.
    expectReferences([["install", first], ["install over the malformed ledger", again], ["--check", doc], ["uninstall", u]]);
    expect(again.status, again.stdout + again.stderr).toBe(3);
    expect(again.stdout, "premise: the OpenCode step points at the verify line about the marker").toContain("the verify line about .grugops/install.json");
    expect(doc.stdout, "premise: --check printed the malformed-ledger reason").toContain("this run reports why on its own line");
    expect(u.status, u.stdout + u.stderr).toBe(3);
  }, 240_000);

  it("M3: install --pi with the template write refused", () => {
    const w = world("m3");
    writeFileSync(at(w, "AGENTS.md"), "# My agents\n\nMy own instructions.\n");
    mkdirSync(at(w, ".pi"), { recursive: true });
    writeFileSync(at(w, ".pi/prompts"), "not a directory\n");
    const r = install(w, [agentFlag(hostOf("pi-prompt-template"))]);
    expect(r.status, r.stdout + r.stderr).toBe(3);
    expect(r.stdout, "premise: the route note points at the line above").toContain(`the line above about ${PI_PROMPT_REL}`);
    expectReferences([["install --pi", r]]);
  }, 240_000);

  it("M4: the WR-17 row A run (a Pi template deleted, then an OpenCode-only install)", () => {
    const w = world("m4");
    writeFileSync(at(w, "AGENTS.md"), "# My agents\n\nMy own instructions.\n");
    const pi = install(w, [agentFlag(hostOf("pi-prompt-template"))]);
    expect(pi.status, pi.stdout + pi.stderr).toBe(0);
    rmSync(at(w, PI_PROMPT_REL));
    const oc = install(w, [agentFlag(hostOf("opencode-command"))]);
    expect(oc.status, oc.stdout + oc.stderr).toBe(0);
    expect(oc.stdout).toContain(`\`${agentCommand("install.js", w.target, [hostOf("pi-prompt-template")], commandContextFor({ grugopsHome: w.kitHome, home: w.home }))}\` writes it`);
    // WR-17: this run prints no "line above" for the Pi template (its writer did not run), so no reference is required.
    expectReferences([["install --pi", pi], ["install --opencode", oc]], false);
  }, 240_000);

  for (const dryRun of [false, true]) {
    it(`M5${dryRun ? " (DRY_RUN)" : ""}: the install INCOMPLETE banner's command, run as printed once the settings file is fixed, writes the ask rules`, () => {
      const w = world("m5");
      mkdirSync(at(w, ".claude"), { recursive: true });
      writeFileSync(at(w, ".claude/settings.json"), "[]\n");
      const claude = hostOf("claude-kit");
      const r = install(w, [agentFlag(claude)], { dryRun });
      expect(r.status, r.stdout + r.stderr).toBe(3);
      const lines = r.stdout.split("\n");
      const at0 = lines.findIndex((l) => l.startsWith("  Each `verify` line above names"));
      expect(at0, r.stdout).toBeGreaterThan(-1);
      const banner = lines[at0 + 1] ?? "";
      expect(banner).toContain(`\`${agentCommand("install.js", w.target, [claude], commandContextFor({ grugopsHome: w.kitHome, home: w.home }))}\``);
      expectReferences([["install --claude", r]]);
      writeFileSync(at(w, ".claude/settings.json"), "{}\n");
      // Run as printed in the user's environment (D-33, WR-19): a scratch directory outside the checkout, with no
      // GRUGOPS_HOME the printed text does not set (the world's kit home is the default under its HOME).
      const ran = runPrintedCommand(banner, { home: w.home, timeoutMs: 180_000 });
      expect(ran.premise.grugopsHome, "premise: the default kit home, so the printed text sets none").toBeUndefined();
      expect(ran.status, ran.stdout + ran.stderr).toBe(0);
      const ask = (JSON.parse(readFileSync(at(w, ".claude/settings.json"), "utf8")) as { permissions?: { ask?: unknown } }).permissions?.ask;
      expect(Array.isArray(ask) && ask.length > 0, `no ask rule was written: ${JSON.stringify(ask)}`).toBe(true);
    }, 240_000);
  }

  it("M6: the OpenCode other-kit-root note: its uninstall command, then its install command, run as printed, leave the rule for the second kit root only", () => {
    const w = world("m6");
    const oc = hostOf("opencode-command");
    const first = install(w, [agentFlag(oc)]);
    expect(first.status, first.stdout + first.stderr).toBe(0);
    const kitB = join(w.home, ".grugops-b");
    const second = install(w, [agentFlag(oc)], { kitHome: kitB });
    expect(second.status, second.stdout + second.stderr).toBe(0);
    const note = second.stdout.split("\n").find((l) => l.includes("another kit root"));
    expect(note, second.stdout).toBeDefined();
    expectReferences([["install (kit root A)", first], ["install (kit root B)", second]], false);
    // The second run's context (D-33): its kit home is kitB, not the default, so its install command carries it and
    // its uninstall command carries none (uninstall.js reads no kit home). Both run as printed, in the user's
    // environment (WR-19): a scratch directory outside the checkout and no GRUGOPS_HOME the printed text does not set.
    const ctx = commandContextFor({ grugopsHome: kitB, home: w.home });
    const un = printedCommand(note!);
    expect(un).toBe(agentCommand("uninstall.js", w.target, [oc], ctx));
    const ranUn = runPrintedCommand(note!, { home: w.home, timeoutMs: 180_000 });
    expect(ranUn.premise.grugopsHome, "premise: an uninstall command sets no kit home").toBeUndefined();
    expect(ranUn.status, ranUn.stdout + ranUn.stderr).toBe(0);
    const rest = note!.slice(note!.indexOf(`\`${un}\``) + un.length + 2);
    expect(printedCommand(rest)).toBe(agentCommand("install.js", w.target, [oc], ctx));
    const ranIn = runPrintedCommand(rest, { home: w.home, timeoutMs: 180_000 });
    expect(ranIn.premise.grugopsHome, "premise: the printed install command set the second kit home").toBe(ctx.kitHome);
    expect(ranIn.status, ranIn.stdout + ranIn.stderr).toBe(0);
    const json = JSON.parse(readFileSync(at(w, "opencode.json"), "utf8")) as { permission?: { external_directory?: Record<string, unknown> } };
    expect(Object.keys(json.permission?.external_directory ?? {})).toEqual(["~/.grugops-b/agent-factory/**"]);
    expect(existsSync(at(w, MARKER_REL)) && lstatSync(at(w, MARKER_REL)).isFile(), "the marker").toBe(true);
  }, 240_000);
});

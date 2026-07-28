// check-kit-refs.ts — Phase 7 build gate (SHOME-03 / SC5).
//
// TypeScript port of check-kit-refs.sh (Phase 15, TOOL-01), since amended twice. Phase 24 flipped
// Assertion 2 to grep-to-zero. Phase 27 (KIT-02 / D-16, D-27, D-07) re-pointed the three literals
// this file carried: SCAN reaches the adapter DIRECTORY instead of one hand-named adapter file,
// MARKER_SITES is DERIVED from the adapter directories instead of four hand-listed paths, and
// Assertion 3 is a derived two-sided predicate keyed on the resolver slot instead of an
// exclusion-by-omission. The `grep -rn` over the explicit SCAN set is still a scoped recursive
// file-walk + per-line regex test — NEVER a repo-wide grep. The exclusion-by-not-listing design
// (seed/, examples/, install/, docs/, .planning/ intentionally absent) is load-bearing and is
// preserved exactly: making membership derived is NOT a licence to widen the scan.
// import.meta.dirname resolves the repo root; a CHECK_ROOT override lets a harness point the gate
// at a hermetic mirror.
//
// Proves the kit/state path rewrite is COMPLETE and cannot silently regress. It runs the two D-08
// assertions plus the recommended third assertion and an SC2 invariant-marker check over an
// EXPLICIT file set:
//
//   Assertion 1 (D-08.1): ZERO 'agent-factory/config/' refs across the scan set.
//   Assertion 2 (D-08.2): ZERO refs to the deleted handoff-template directory (flipped in Phase 24
//                         — the 17 templates were deleted, so any surviving ref is dangling). The
//                         path literal itself now lives single-source in scripts/dead-vocabulary.ts
//                         (Phase 27 / D-24).
//   Assertion 3 (SC4/O3): the kit-root env var appears in exactly the derived legal set — the
//                         resolver-slot adapters plus the packaging template — and nowhere else.
//   SC2 marker check:     the compressed kit-vs-state invariant is present at every derived
//                         marker site (two named documents + every adapter).
//
// IMPORTANT — SC5 is "zero MISCLASSIFIED refs", NOT "zero `agent-factory/` strings". The ~96
// intended kit-to-kit refs MUST survive bare. This gate proves the misclassified set is empty.
//
// Strictly READ-ONLY. Node stdlib ONLY — node:fs + node:path. Zero npm dependencies.
//
//   node scripts/check-kit-refs.js
// Exit 0 = all checks PASS; exit 1 = at least one FAIL.

import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { basename, join } from "node:path";
// Phase 27 (SPAWN-05 / D-24): the retired-vocabulary literals are single-source. This gate takes the
// PATH form; guard_adapter_body in check-foundation-guards.ts takes the PROSE forms. Two different
// predicates over two different inputs, one list.
import { RETIRED_PATH_FORMS } from "./dead-vocabulary.js";

// The .sh assumed cwd == repo root. The TS port resolves every path against the script-relative
// repo root, honoring a CHECK_ROOT override for hermetic harness runs.
const ROOT = process.env.CHECK_ROOT
  ? process.env.CHECK_ROOT
  : join(import.meta.dirname, "..");

// ---------------------------------------------------------------------------
// Explicit SCAN path list — the D-08 "shipped kit + adapters + AGENTS.md". NEVER a repo-wide
// grep. By NOT listing them, this excludes scripts/fixtures/, agent-factory/examples/,
// agent-factory/README.md, install/, root README.md, CLAUDE.md, docs/, .planning/, and this
// script itself. D-03 exclusion: agent-factory/seed/ is INTENTIONALLY NOT listed — its bundled
// files are STATE TEMPLATES whose refs resolve in the TARGET repo, not against the kit root.
// ---------------------------------------------------------------------------
// (Phase 27 / KIT-02, D-16) `.claude/agents` is the DIRECTORY, not one hand-named adapter file.
// It used to read `.claude/agents/grugops-orchestrator.md` — a single name that would have gone
// stale by sixteen the moment plan 27-07 generates one adapter per role. walk() below already
// recurses a directory entry, so naming the directory makes this membership self-deriving with no
// import at all. Every OTHER entry is unchanged: widening the scan is NOT what this change is for.
const SCAN = [
  "agent-factory/roles",
  "agent-factory/workflows",
  "agent-factory/checklists",
  "agent-factory/packaging",
  "agent-factory/_commit-convention.md",
  ".claude/skills",
  ".claude/agents",
  "skills",
  "AGENTS.md",
];

// Assertion 3, NEGATIVE half — kit prose that must be FREE of $GRUGOPS_HOME. Membership here is
// UNCHANGED and deliberately EXCLUDES agent-factory/packaging/ and the adapter dirs; those already
// self-derive through walk(), so this list needs no membership change. What changed is the CLAIM
// (D-07): this comment used to enumerate the legal sites by path — a count that nothing
// mechanically pinned, that lived ONLY in prose, and that plan 27-07 is about to make wrong by
// sixteen. That is exactly how a literal goes stale unnoticed: no test could ever see it.
// The legal set is no longer enumerated here; it is DERIVED below (ghLegal) as "every
// adapter body carrying the resolver slot, plus the packaging template", and Assertion 3 now
// asserts set EQUALITY in both directions rather than mere absence from this negative scope.
const GH_SCAN = [
  "agent-factory/roles",
  "agent-factory/workflows",
  "agent-factory/checklists",
  "agent-factory/_commit-convention.md",
  "AGENTS.md",
];

// The kit-root environment variable whose legal sites Assertion 3 pins.
const KIT_ROOT_ENV = "GRUGOPS_HOME";

// The resolver slot — the line the installer materializes the absolute kit path above (the
// MAT_SLOT constant in install/install.ts). Carrying this line is what MAKES an adapter a resolver,
// and therefore what makes it legally allowed to name the kit-root environment variable. The
// installer stays self-contained by design (D-18) so the literal is repeated rather than imported;
// that repetition is safe here because a drift does not go silent — the derived legal set would
// shrink and Assertion 3 would fail red naming the files it no longer covers.
const RESOLVER_SLOT =
  "# 1. (installed) the absolute kit path the installer wrote above this line.";

// The one packaging document that legally mirrors the resolver block for copy-ready use. It is a
// single named file, not a set, so it stays a literal.
const PACKAGING_TEMPLATE = "agent-factory/packaging/subagent.frontmatter.md";

// The two adapter directories the installer materializes into a target repo. Both the derived
// marker-site set and the derived Assertion-3 legal set read from these.
const ADAPTER_DIRS = [".claude/agents", ".claude/skills"];

// The two SINGLE DOCUMENTS carrying the compressed kit-vs-state invariant. Each is one specific
// file rather than a set, so each stays a literal: the root substrate document, and the one role
// file that carries the blockquote.
const MARKER_NAMED_SITES = ["AGENTS.md", "agent-factory/roles/orchestrator.md"];

// A stable, unique substring of the invariant blockquote (byte-identical at every site).
const MARKER = "If the kit dir is absent, STOP — do not hunt.";

let FAILS = 0;
const pass = (m: string): void => {
  process.stdout.write(`  PASS  ${m}\n`);
};
const fail = (m: string): void => {
  process.stdout.write(`  FAIL  ${m}\n`);
  FAILS += 1;
};

const abs = (rel: string): string => join(ROOT, rel);

// Recursively enumerate every file under a SCAN entry (a dir → walk; a file → itself). Missing
// entries are silently skipped (mirrors `grep -rn` on an absent path printing nothing). Returns
// repo-relative paths so the `path:lineno:line` lines match the .sh `grep -rn` output shape.
function walk(rel: string, acc: string[]): string[] {
  const a = abs(rel);
  if (!existsSync(a)) return acc;
  const st = statSync(a);
  if (st.isDirectory()) {
    for (const entry of readdirSync(a).sort()) {
      walk(join(rel, entry), acc);
    }
  } else if (st.isFile()) {
    acc.push(rel);
  }
  return acc;
}

// grep -rn over a SCAN set for a fixed substring: return `path:lineno:line` hits (1-based).
function grepSubstring(scan: string[], needle: string): string[] {
  const hits: string[] = [];
  for (const entry of scan) {
    for (const file of walk(entry, [])) {
      const lines = readText(file).split("\n");
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes(needle)) hits.push(`${file}:${i + 1}:${lines[i]}`);
      }
    }
  }
  return hits;
}

// grep -rln over a SCAN set for a fixed substring: return matching file paths (deduped, the -l
// "files-with-matches" form used by Assertion 3).
function grepFilesWithMatch(scan: string[], needle: string): string[] {
  const files = new Set<string>();
  for (const entry of scan) {
    for (const file of walk(entry, [])) {
      if (readText(file).includes(needle)) files.add(file);
    }
  }
  return [...files];
}

function readText(rel: string): string {
  return readFileSync(abs(rel), "utf8");
}

// ---------------------------------------------------------------------------
// Derived adapter set (Phase 27 / KIT-02, D-27). Every `.md` under .claude/agents plus every
// SKILL.md under .claude/skills. Declared HERE, below the helpers, because it calls walk().
//
// D-06/D-08 put the compressed kit-vs-state invariant blockquote in EVERY adapter, so the former
// four-entry hand-maintained MARKER_SITES list would have gone stale by fifteen the moment plan
// 27-07 lands the other sixteen adapters. D-27 brought it into scope for exactly that reason: it is
// the literal the original inventory missed, and leaving it hand-maintained would have shipped a
// fresh instance of the defect this phase exists to delete. Today this yields eight adapters (one
// agent + seven skills), so ten marker sites with the two named documents; after 27-07 it yields
// twenty-four, so twenty-six — with no edit here.
//
// SCOPE NOTE: the root `skills/` tree (the plugin-form mirror) is deliberately NOT an adapter dir.
// It carries no resolver block, and its SKILL.md files are the plugin packaging of the same skills.
// It remains inside SCAN, so a stray reference there is still caught by Assertions 1 and 2 and by
// the Assertion-3 equality below — where, carrying no resolver slot, it could only ever appear on
// the illegal side.
// ---------------------------------------------------------------------------
function derivedAdapterFiles(): string[] {
  const files: string[] = [];
  for (const rel of walk(".claude/agents", [])) {
    if (rel.endsWith(".md")) files.push(rel);
  }
  for (const rel of walk(".claude/skills", [])) {
    if (basename(rel) === "SKILL.md") files.push(rel);
  }
  return files.sort();
}
const ADAPTER_FILES = derivedAdapterFiles();

// Every site that must carry the invariant blockquote: the two named documents plus every adapter.
const MARKER_SITES = [...MARKER_NAMED_SITES, ...ADAPTER_FILES];

process.stdout.write("== Phase 7 kit-ref gate (SHOME-03 / SC5) ==\n");

// ---------------------------------------------------------------------------
// Vacuity floor. Deriving a set silently deletes a fail-red branch: an adapter that disappears
// stops being a member instead of becoming a finding, so an empty adapter directory would make the
// marker check and the Assertion-3 legal set both pass over nothing. The exact adapter cardinality
// is owned by guard_referential_integrity (KIT-03), which compares the adapter directory against
// the role corpus; this gate only refuses the vacuous case, which is all it can honestly assert
// against an arbitrary CHECK_ROOT mirror.
// ---------------------------------------------------------------------------
process.stdout.write(
  `\n[derivation] adapter set derived from ${ADAPTER_DIRS.join(" + ")}\n`,
);
if (ADAPTER_FILES.length === 0) {
  fail(
    `no adapter files found under ${ADAPTER_DIRS.join(" or ")} — refusing to check a vacuous set (every derived assertion below would pass over nothing)`,
  );
} else {
  pass(`${ADAPTER_FILES.length} adapter file(s) derived`);
}

// ---------------------------------------------------------------------------
// Assertion 1 (D-08.1): ZERO agent-factory/config/ refs in the scan set.
// ---------------------------------------------------------------------------
process.stdout.write(
  "\n[Assertion 1] no agent-factory/config/ refs remain (config now .grugops/factory.config.json)\n",
);
const cfg = grepSubstring(SCAN, "agent-factory/config/").join("\n");
if (cfg === "") {
  pass("no agent-factory/config/ refs remain");
} else {
  fail(
    `stray agent-factory/config/ ref(s) — config must be .grugops/factory.config.json:\n${cfg}`,
  );
}

// ---------------------------------------------------------------------------
// Assertion 2 (D-13, FLIPPED in Phase 24): ZERO refs to the deleted handoff-template DIRECTORY
// across the SCAN set.
//
// The 17 handoff templates were deleted in Phase 24 (the shared verified-context notes replaced
// the static-handoff relay). The former "known-template ALLOW ERE + template-dir/placeholder
// filters" are gone: ANY surviving ref to that directory in the shipped kit + adapters +
// AGENTS.md is now a dangling reference to a deleted artifact and FAILS. This flip IS the
// backpressure for the two-stage cut-over (D-12/D-14) — it could not go green until the Wave-1
// rewire (Plans 24-01/24-02) drove the role/workflow/packaging/AGENTS.md SCAN set to zero. The
// explicit SCAN set (~45-55) is preserved — never a repo-wide grep (D-13 token economy).
//
// (Phase 27 / SPAWN-05, D-24) The PREDICATE and the SCAN SET are unchanged; only the provenance of
// the path literal moved. It is imported from scripts/dead-vocabulary.ts, the one module that says
// which vocabulary is retired, so this gate and guard_adapter_body can never disagree about what
// "retired" means. The two are different predicates over different inputs — this one greps a
// directory path, that one greps prose containing no path — which is why a second CHECK is
// justified and a second LIST is not. The output wording is byte-identical to the inline form.
// ---------------------------------------------------------------------------
const retiredPaths = RETIRED_PATH_FORMS.join(", ");
process.stdout.write(
  `\n[Assertion 2] zero ${retiredPaths} refs remain (the 17 templates were deleted in Phase 24)\n`,
);
const stray = RETIRED_PATH_FORMS.flatMap((p) => grepSubstring(SCAN, p)).join(
  "\n",
);
if (stray === "") {
  pass(`no ${retiredPaths} refs remain`);
} else {
  fail(
    `stray ${retiredPaths} ref(s) — the handoff templates were deleted (Phase 24); rewire to the shared-context notes:\n${stray}`,
  );
}

// ---------------------------------------------------------------------------
// Assertion 3 (SC4 / O3), RESTATED as a DERIVED PREDICATE (Phase 27 / KIT-02, D-07).
//
// The claim: the kit-root environment variable appears in the generator-produced resolver adapters
// and the packaging template, and NOWHERE ELSE in the shipped kit. It is checked in two halves.
//
//   NEGATIVE half (preserved verbatim): the GH_SCAN kit prose — roles, workflows, checklists, the
//   commit convention and the root substrate document — must be free of the variable.
//
//   POSITIVE half (new, and what makes this restatement STRICTLY STRONGER than the exclusion it
//   replaces): the legal set is DERIVED as every adapter body carrying the resolver slot, plus the
//   packaging template, and the set of scanned files naming the variable must equal it EXACTLY.
//   The old form was exclusion-by-omission — a hand-written adapter carrying the variable without a
//   resolver slot passed simply by not being on a list. It now fails red. The equality is two-sided,
//   so a resolver adapter that LOST its self-heal line — and could therefore no longer find the kit
//   — also fails red, where before nothing looked.
// ---------------------------------------------------------------------------
process.stdout.write(
  `\n[Assertion 3] $${KIT_ROOT_ENV} appears in the resolver adapters + the packaging template and nowhere else\n`,
);
// Negative half — unchanged scope, unchanged meaning.
const gh = grepFilesWithMatch(GH_SCAN, KIT_ROOT_ENV).join("\n");
if (gh === "") {
  pass(
    `no kit prose / AGENTS.md names $${KIT_ROOT_ENV} (${GH_SCAN.length} scan entries compared)`,
  );
} else {
  fail(
    `kit prose names $${KIT_ROOT_ENV} (must live only in the resolver adapter self-heal):\n${gh}`,
  );
}

// Positive half — derived legal set vs the files that actually name the variable.
const ghLegal = new Set<string>(
  ADAPTER_FILES.filter((rel) => readText(rel).includes(RESOLVER_SLOT)),
);
if (existsSync(abs(PACKAGING_TEMPLATE))) ghLegal.add(PACKAGING_TEMPLATE);
const ghActual = new Set<string>(grepFilesWithMatch(SCAN, KIT_ROOT_ENV));
const ghIllegal = [...ghActual].filter((f) => !ghLegal.has(f)).sort();
const ghSilent = [...ghLegal].filter((f) => !ghActual.has(f)).sort();
if (ghIllegal.length === 0 && ghSilent.length === 0) {
  pass(
    `$${KIT_ROOT_ENV} appears in exactly the ${ghLegal.size} derived legal site(s) (resolver-slot adapters + the packaging template)`,
  );
} else {
  let why = "";
  if (ghIllegal.length > 0) {
    why += `\n  names $${KIT_ROOT_ENV} but carries no resolver slot (a hand-written adapter cannot legally hold the kit-root variable): ${ghIllegal.join(", ")}`;
  }
  if (ghSilent.length > 0) {
    why += `\n  carries the resolver slot but never names $${KIT_ROOT_ENV} (its self-heal is gone — this adapter cannot find the kit): ${ghSilent.join(", ")}`;
  }
  fail(`$${KIT_ROOT_ENV} legal-set equality does not hold:${why}`);
}

// ---------------------------------------------------------------------------
// SC2: the compressed invariant marker is present at EVERY marker site — the two named documents
// plus every derived adapter (D-27). The two failure words below are distinct on purpose and are
// preserved: `(absent)` means the file is not there at all, `(marker-missing)` means the file is
// there but has lost the blockquote. They diagnose different faults and must not be merged.
// ---------------------------------------------------------------------------
process.stdout.write(
  `\n[SC2] kit-vs-state invariant marker present at all ${MARKER_SITES.length} derived marker sites\n`,
);
let missing = "";
for (const site of MARKER_SITES) {
  if (!existsSync(abs(site))) {
    missing += ` ${site}(absent)`;
  } else if (!readText(site).includes(MARKER)) {
    missing += ` ${site}(marker-missing)`;
  }
}
if (missing === "") {
  pass(
    `invariant marker present at all ${MARKER_SITES.length} marker sites (${MARKER_NAMED_SITES.length} named + ${ADAPTER_FILES.length} derived adapters)`,
  );
} else {
  fail(`invariant marker missing from:${missing}`);
}

// ---------------------------------------------------------------------------
// Result
// ---------------------------------------------------------------------------
process.stdout.write("\n== Result ==\n");
if (FAILS === 0) {
  process.stdout.write("ALL CHECKS PASSED\n");
  process.exit(0);
} else {
  process.stdout.write(`${FAILS} CHECK(S) FAILED\n`);
  process.exit(1);
}

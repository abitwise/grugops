// check-kit-refs.ts — Phase 7 build gate (SHOME-03 / SC5).
//
// TypeScript port of check-kit-refs.sh (Phase 15, TOOL-01). This is a TRANSLATION, not a
// redesign: the SCAN/GH_SCAN/MARKER_SITES path lists, the 16-template ALLOW ERE, the MARKER
// substring, and the 3 assertions + SC2 marker check are ported verbatim. The `grep -rn` over the
// explicit SCAN set becomes a scoped recursive file-walk + per-line regex test — NEVER a repo-wide
// grep. The exclusion-by-not-listing design (seed/ intentionally absent) is load-bearing and
// preserved by the exact SCAN membership. import.meta.dirname resolves the repo root; a CHECK_ROOT
// override lets a harness point the gate at a hermetic mirror.
//
// Proves the kit/state path rewrite is COMPLETE and cannot silently regress. It runs the two D-08
// assertions plus the recommended third assertion and an SC2 invariant-marker check over an
// EXPLICIT file set:
//
//   Assertion 1 (D-08.1): ZERO 'agent-factory/config/' refs across the scan set.
//   Assertion 2 (D-08.2): every surviving `agent-factory/handoffs/` ref is a known template
//                         basename, the bare template-dir form, or the template-placeholder form.
//   Assertion 3 (SC4/O3): no kit file / AGENTS.md names `$GRUGOPS_HOME`.
//   SC2 marker check:     the compressed kit-vs-state invariant is present at all four sites.
//
// IMPORTANT — SC5 is "zero MISCLASSIFIED refs", NOT "zero `agent-factory/` strings". The ~96
// intended kit-to-kit refs MUST survive bare. This gate proves the misclassified set is empty.
//
// Strictly READ-ONLY. Node stdlib ONLY — node:fs + node:path. Zero npm dependencies.
//
//   node scripts/check-kit-refs.js
// Exit 0 = all checks PASS; exit 1 = at least one FAIL.

import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

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
const SCAN = [
  "agent-factory/roles",
  "agent-factory/workflows",
  "agent-factory/checklists",
  "agent-factory/packaging",
  "agent-factory/_commit-convention.md",
  ".claude/skills",
  ".claude/agents/grugops-orchestrator.md",
  "skills",
  "AGENTS.md",
];

// Assertion 3 scope — kit prose that must be FREE of $GRUGOPS_HOME. It deliberately EXCLUDES
// agent-factory/packaging/ and the adapter dirs (the resolver adapters legally carry it). The
// three legal sites are .claude/agents/grugops-orchestrator.md, .claude/skills/grugops/SKILL.md,
// agent-factory/packaging/subagent.frontmatter.md.
const GH_SCAN = [
  "agent-factory/roles",
  "agent-factory/workflows",
  "agent-factory/checklists",
  "agent-factory/_commit-convention.md",
  "AGENTS.md",
];

// The exhaustive 16-template ERE allowlist — verbatim from `ls agent-factory/handoffs/`.
const ALLOW =
  /agent-factory\/handoffs\/(architecture-handoff|business-handoff|implementation-handoff|implementation-ready-packet|incident-postmortem|product-handoff|qe-handoff|refinement-notes|release-handoff|retro-notes|security-nfr-handoff|sprint-plan|system-handoff|ticket-ready-packet|uat-handoff|universal-handoff)\.md/;

// The four canonical sites carrying the compressed kit-vs-state invariant (SC2).
const MARKER_SITES = [
  "AGENTS.md",
  "agent-factory/roles/orchestrator.md",
  ".claude/agents/grugops-orchestrator.md",
  ".claude/skills/grugops/SKILL.md",
];
// A stable, unique substring of the invariant blockquote (byte-identical at all 4 sites).
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

process.stdout.write("== Phase 7 kit-ref gate (SHOME-03 / SC5) ==\n");

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
// Assertion 2 (D-08.2): every agent-factory/handoffs/ ref is a known template name, the bare
// template-dir form (followed by a backtick), or the template-placeholder form. A leaked
// instance write into the kit (a ticket-scoped name) FAILS because it is none of those.
//
// The .sh chains three `grep -Ev` filters over the `path:lineno:line` hits: drop lines matching
// the 16-template ALLOW ERE, drop lines matching the literal `agent-factory/handoffs/\``, and
// drop lines matching `agent-factory/handoffs/<template>\.md`. What survives is a stray.
// ---------------------------------------------------------------------------
process.stdout.write(
  "\n[Assertion 2] every agent-factory/handoffs/ ref is a known template or the template dir\n",
);
const handoffHits = grepSubstring(SCAN, "agent-factory/handoffs/");
const stray = handoffHits
  .filter((line) => !ALLOW.test(line))
  .filter((line) => !line.includes("agent-factory/handoffs/`"))
  .filter((line) => !/agent-factory\/handoffs\/<template>\.md/.test(line))
  .join("\n");
if (stray === "") {
  pass("every agent-factory/handoffs/ ref is a known template or the template dir");
} else {
  fail(`non-template agent-factory/handoffs/ ref (leaked instance?):\n${stray}`);
}

// ---------------------------------------------------------------------------
// Assertion 3 (SC4 / O3): no kit file or AGENTS.md names $GRUGOPS_HOME. The env var lives ONLY
// in the resolver adapters + the resolver-mirroring packaging template, all excluded from GH_SCAN.
// ---------------------------------------------------------------------------
process.stdout.write(
  "\n[Assertion 3] no kit prose / AGENTS.md names $GRUGOPS_HOME (env var lives only in the adapters)\n",
);
const gh = grepFilesWithMatch(GH_SCAN, "GRUGOPS_HOME").join("\n");
if (gh === "") {
  pass("no kit prose / AGENTS.md names $GRUGOPS_HOME");
} else {
  fail(
    `kit prose names $GRUGOPS_HOME (must live only in the resolver adapter self-heal):\n${gh}`,
  );
}

// ---------------------------------------------------------------------------
// SC2: the compressed invariant marker is present at all four canonical sites.
// ---------------------------------------------------------------------------
process.stdout.write(
  "\n[SC2] kit-vs-state invariant marker present at the four canonical sites\n",
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
  pass("invariant marker present at all four canonical sites");
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

// generate-safety-surface.ts — Phase 28 D-18 safety-surface exclusion-list generator (AUDIT-01).
//
//   node scripts/generate-safety-surface.js    # exit 0 on success, 1 on a named refusal
//
// Writes docs/audit/28-safety-surface-exclusions.md — the list Phase 29's LANG-02 consults to decide
// which files a controlled-language pass may reword, and which it may not touch.
//
// Strictly read-and-write-one-file. Node stdlib ONLY — node:fs + node:path (transitively, through
// audit-model). Zero npm dependencies. Clear professional voice throughout: this is a safety and
// trace surface, never caveman voice (CLAUDE.md hard rule).
//
// ---------------------------------------------------------------------------------------------
// WHY THIS FILE IS GENERATED RATHER THAN WRITTEN.
//
// A hand-authored exclusion list would be a FOURTH maintained set inside a phase whose subject is
// maintained sets rotting — the same defect class this repository has already paid for twice, where
// a hand-listed scan set drifts away from the thing it claims to describe while every test stays
// green. The two sources this list derives from are maintained for other reasons and are already
// gated: the register's `safety_surface` column is enforced by scripts/check-audit-register.js, and
// the registry's `kind: safety` rows are enforced by scripts/check-claim-anchors.js. Deriving the
// list makes it inherit that upkeep instead of adding its own.
//
// THE UNION, AND WHY BOTH ARMS ARE NEEDED. The register covers the derived kit — roles and
// workflows — and reaches nothing else. The registry covers the public documents a user reads, which
// have no register row and cannot get one (Table A's membership is the derived kit and its `kind` is
// a closed set). Neither source alone answers "which files hold text that must not be reworded", so
// the list is the union and each entry records EVERY reason it is present. Dropping one reason would
// make an entry look weaker than it is to the reader deciding whether to touch it.
//
// FAIL CLOSED ON AN EMPTY UNION. An exclusion list with zero entries silently permits a style pass
// over every file in the kit, including admission and compliance text, and it presents as a clean
// green build — the worst available failure of this artifact, and the reason the empty case is a
// NAMED throw rather than an empty file. This follows kit-model.ts's refuseEmpty() and its argument:
// a vacuous set passes every guard computed over it.
//
// Read/write-only by construction (path-traversal mitigation, ASVS V12, mirrors generate-catalog.ts
// and generate-asvs-checklist.ts): OUT is a FIXED literal repo-relative path. It is never derived
// from argv, env, or file content. Under test the ROOT is redirected and the path is not, which is
// what lets a hermetic mirror be pointed at safely.

import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import {
  readRegister,
  readRegistry,
  REGISTER_PATH,
  REGISTRY_PATH,
} from "./audit-model.js";

const DEFAULT_ROOT = join(import.meta.dirname, "..");

/** FIXED literal, repo-relative. The ROOT is redirected under test; this path never is. */
export const OUT = "docs/audit/28-safety-surface-exclusions.md";

/** The npm script that reproduces this file. Named in the header AND in the freshness refusal. */
export const REGEN_COMMAND = "npm run generate:safety-surface";

/**
 * One listed file, with every reason it is listed. A file can be both a flagged register row and
 * the home of a safety claim; both reasons are kept, in source order (register first).
 */
export interface SafetySurfaceEntry {
  readonly file: string;
  readonly reasons: readonly string[];
}

/**
 * The union: register rows whose `safety_surface` is `yes`, plus registry rows whose `kind` is
 * `safety`, keyed and de-duplicated by file path and sorted by that path so two regenerations are
 * byte-identical.
 */
export function safetySurfaceUnion(
  root: string = DEFAULT_ROOT,
): readonly SafetySurfaceEntry[] {
  const byFile = new Map<string, string[]>();
  const add = (file: string, reason: string): void => {
    const existing = byFile.get(file);
    if (existing === undefined) byFile.set(file, [reason]);
    else existing.push(reason);
  };

  for (const row of readRegister(root).rows) {
    if (row.safetySurface === "yes") {
      add(
        row.file,
        `register row flagged \`safety_surface: yes\` (\`kind: ${row.kind}\`)`,
      );
    }
  }
  for (const claim of readRegistry(root).claims) {
    if (claim.kind === "safety") {
      add(claim.file, `home of safety claim ${claim.id}`);
    }
  }

  // Sort by path — the ONLY ordering, so the output is a pure function of the two sources.
  return [...byFile.keys()]
    .sort()
    .map((file) => ({ file, reasons: byFile.get(file) as string[] }));
}

/**
 * Render the exclusion list. Throws a NAMED refusal on an empty union rather than returning an
 * empty file — see the header block for why that is the failure this artifact most needs to refuse.
 */
export function renderSafetySurface(root: string = DEFAULT_ROOT): string {
  const entries = safetySurfaceUnion(root);
  // Derived, never typed. A literal here would be a hand-maintained count inside a GENERATED file
  // whose whole purpose is to avoid a hand-maintained set — the defect this artifact exists to
  // sidestep, reintroduced in its own prose.
  const auditedFiles = readRegister(root).rows.length;
  if (entries.length === 0) {
    throw new Error(
      `generate-safety-surface: no safety-surface file found in ${REGISTER_PATH} or ` +
        `${REGISTRY_PATH} — refusing to render an empty exclusion list. A list with zero entries ` +
        `excludes nothing, so it silently permits a style pass over every file in the kit ` +
        `including admission and compliance text, and it does so while presenting as a clean green ` +
        `build`,
    );
  }

  const lines: string[] = [
    "# Phase 28 safety-surface exclusion list (D-18)",
    "",
    "> **GENERATED — do not hand-edit.** Regenerate with:",
    ">",
    "> ```",
    `> ${REGEN_COMMAND}`,
    "> ```",
    "",
    `- **Entries:** ${entries.length}`,
    `- **Derived from:** \`${REGISTER_PATH}\` (rows flagged \`safety_surface: yes\`) ∪ ` +
      `\`${REGISTRY_PATH}\` (rows with \`kind: safety\`)`,
    "",
    "## What honouring this list means (Phase 29 / LANG-02 and LANG-03)",
    "",
    "**No text in a listed file is reworded by a style pass.** LANG-03 requires a named",
    "safety-surface exclusion list to be honoured; this is that list. A file appears here because at",
    "least one sentence in it is load-bearing — it grants or withholds a permission, states a",
    "no-fabrication floor, or is the text a public safety claim was measured against — and the flag",
    "is per FILE, so the list cannot tell you WHICH sentence. Treat the whole file as out of scope",
    "for rewording, or read it and make the sentence-level judgement deliberately; do not infer from",
    "a file's absence from a diff that its text was safe to touch.",
    "",
    "## What this list does not settle",
    "",
    `**It is not selective, and saying so is part of the measurement.** Every one of the ${auditedFiles} audited`,
    "kit files carries permission-bearing or no-fabrication text — every role's `## Hard limits` and",
    "every workflow's `## Commit` section at minimum — so the register arm flags all of them. The",
    "list therefore covers the entire audited corpus plus the public documents that host safety",
    "claims. That is the honest output of a per-file flag, not a defect in the derivation: the",
    "question LANG-02 actually faces is which SENTENCES are load-bearing, a granularity this column",
    "cannot express and was not built to. Manufacturing variance to make the list look discriminating",
    "would be an unearned verdict; recording the true extent and naming the limit is the smaller",
    "error.",
    "",
    "## Excluded files",
    "",
    "| file | why it is listed |",
    "|---|---|",
    ...entries.map((e) => `| \`${e.file}\` | ${e.reasons.join("; ")} |`),
    "",
  ];
  return `${lines.join("\n")}`;
}

// ── Entry point ──────────────────────────────────────────────────────────────────────────────
// Guarded so the test file can import the exports without the write running inside the vitest
// worker (the precedent plans 28-01, 28-02 and 28-03 each set). pathToFileURL rather than a
// hand-built `file://${argv[1]}` — the hand-built form does not match on Windows, which would make
// a direct run write NOTHING and exit 0, a fabricated success.
const isEntry =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isEntry) {
  try {
    const text = renderSafetySurface();
    writeFileSync(join(DEFAULT_ROOT, OUT), text, "utf8");
    const count = safetySurfaceUnion().length;
    process.stdout.write(`Wrote ${OUT} — ${count} entr${count === 1 ? "y" : "ies"}.\n`);
    process.exit(0);
  } catch (e) {
    process.stderr.write(`  ERROR    ${(e as Error).message}\n`);
    process.exit(1);
  }
}

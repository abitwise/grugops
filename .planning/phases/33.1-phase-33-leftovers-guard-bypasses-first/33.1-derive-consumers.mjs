#!/usr/bin/env node
// ---------------------------------------------------------------------------------------------
// 33.1-derive-consumers.mjs — the DERIVED consumer set of the code retired by 33.1 D-17.
//
// WHAT THIS DECIDES. Decision D-17 retires the Bash command-parsing guard, and D-20(a) asks that
// every surface of it greps to zero in shipped code. Which files still name a retired surface is a
// question this script ANSWERS by scanning; it is never a list somebody typed. It reads every file
// `git ls-files` reports outside `.planning/`, matches seven families, and prints each family's
// member count and file list, then the UNION of all families. A plan that deletes or re-points a
// consumer re-runs it and records the counts it prints, before and after.
//
//   F1  the guard file names (hooks/guard.{ts,js,test.ts}; admission-guard is excluded by the
//       lookbehind — it is the surviving MCP admission gate, D-24);
//   F2  the command-model identifiers in scripts/checkpoints.ts;
//   F3  the prod-deploy grant;
//   F4  the two-key floor grant family (D-26);
//   F5  the deny matcher and the guard corpus;
//   F6  the banner and the two-key evaluator (D-26);
//   F7  the UAT and capture oracles that asserted the Bash deny (D-22, D-28), the checkpoint-note
//       writer whose only production caller was the guard, and the frozen guard blob.
//
// WHY IT LIVES HERE AND NOT IN THE SUITE. A permanent vitest case that reads a phase document under
// .planning/ turns the suite RED on the commit that writes that document. This is a small derived
// check filed beside the phase and run as its plans' gate. The suite stays about the code.
//
// DEPENDENCIES: none outside Node's standard library. It runs `git ls-files` once and reads each
// listed file as latin1, so a file carrying a NUL byte is scanned like text (a binary-classified
// file is where BSD grep silently reports zero matches).
//
// USAGE: node .planning/phases/33.1-phase-33-leftovers-guard-bypasses-first/33.1-derive-consumers.mjs [repoRoot]
// With no argument the repository root is derived from this file's own location.
// ---------------------------------------------------------------------------------------------

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const root = resolve(process.argv[2] ?? join(HERE, "..", "..", ".."));

const files = execFileSync("git", ["-C", root, "ls-files"], { encoding: "utf8" })
  .split("\n")
  .filter((f) => f && !f.startsWith(".planning/"));

// The vacuity floor: a scan over zero files is "not performed", never "no consumers".
if (files.length === 0) {
  console.error(`NOT PERFORMED: git ls-files under ${root} listed no files outside .planning/`);
  process.exit(2);
}

const FAM = {
  F1: /(?<![-\w])guard\.(?:js|ts|test\.ts)\b/,
  F2: /\b(?:COMMAND_CHECKPOINT_RULES|governedToolsNamedBy|classifyWords|failClosedCheckpoints|matchCommandCheckpoints|commandSegments|canonicalWordValue|COMMAND_RULE_CHECKPOINTS|CommandMatch)\b/,
  F3: /\b(?:GRUGOPS_PROD_DEPLOY_APPROVED|PROD_DEPLOY_APPROVAL_ENV_VAR)\b/,
  F4: /\b(?:GRUGOPS_FLOOR_\w*|FLOOR_ENV_VAR_PREFIX|floorEnvVarName)\b/,
  F5: /prod-deploy-deny-match|cr01-nested-corpus/,
  F6: /\b(?:evaluateMatrix|composeBanner|renderCheckpointBanner|isCheckpointBannerLine|BANNER_ALL_DEFAULT|BANNER_NON_DEFAULT_PREFIX|CONFIG_REFUSAL_PREFIX|resolveCheckpoint|FLOOR_CHECKPOINTS|isFloorCheckpoint|deriveFloorCheckpoints|NAMED_GRANT_ENV_VARS|GRANT_ENV_VAR_PATTERN_SOURCE|isGrantEnvVarName)\b/,
  F7: /\b(?:oracleHooksWiring|prodDeployDenyFired|PROD_DEPLOY_REASON_SIGNATURE|approvalKeyRefusals|denyObservedInStream|emitCheckpointNote|FROZEN_GUARD_BLOB)\b/,
};

const out = {};
const all = new Set();
let scanned = 0;
for (const f of files) {
  let t;
  try {
    t = readFileSync(join(root, f), "latin1");
  } catch {
    continue; // listed but absent on disk (a deletion not yet committed): nothing to scan
  }
  scanned += 1;
  for (const [k, re] of Object.entries(FAM)) {
    if (re.test(t)) {
      (out[k] ??= []).push(f);
      all.add(f);
    }
  }
}

console.log(`SCANNED ${scanned} of ${files.length} tracked files outside .planning/`);
for (const k of Object.keys(FAM)) {
  const fs = out[k] ?? [];
  console.log(`${k} ${fs.length}${fs.length ? "\n  " + fs.join("\n  ") : ""}`);
}
console.log(`UNION ${all.size}`);

// checkpoint-ask-rules.ts — the SINGLE declaration of the Claude Code `permissions.ask` rules the
// installer derives from the checkpoints configuration (D-18, D-29).
//
// Cross-platform. Pure data and pure functions: no node:fs, no node:path, and ZERO npm dependencies.
// This module is a sibling of install.js and uninstall.js inside install/, resolved relative to the
// compiled entry point, so both binaries still run on a host with nothing installed.
//
// ---------------------------------------------------------------------------
// WHAT THESE RULES ARE, AND WHAT THEY ARE NOT.
//
// These rules are a SPEED BUMP. They cover the command spellings an agent usually produces for a
// production deploy, a package publish, a push, or a pull-request merge, and Claude Code then asks a
// human before running a matching command (in a non-interactive `-p` run it denies it). Claude Code
// documents that a Bash ask rule covers "the invocation Claude usually produces and isn't a security
// boundary around the program": a path-qualified program, a `sh -c` body, options before a
// subcommand, or a quoted subcommand are not matched. The rules are therefore NOT a security
// boundary.
//
// THE GIT HOST IS THE HARD FLOOR. The protection that holds is on the git host: branch protection or
// rulesets on protected branches, and deployment environments with required reviewers for
// production (install/README.md §5). grugops never configures the host itself.
//
// ---------------------------------------------------------------------------
// WHY THIS MODULE EXISTS HERE (D-18, D-29).
//
// The rows below are transcribed from the retired command table that lived in scripts/checkpoints.ts
// (COMMAND_CHECKPOINT_RULES) before the Bash command-parsing guard was retired (D-17). Only the
// tool, the governed verbs and the one governing flag were carried over; the command-model
// concepts of that table (benign words, verb-prefix resolution) were retired with the guard and are
// deliberately absent. Per D-29 the set covers only what the retired table named: the deploy tools,
// the publish forms, `git push` and `gh pr merge`. The retired git row's local ref-write verb is NOT
// carried over, because the git host is the hard floor for anything that reaches a remote.
//
// install/ imports nothing from scripts/ (the kit-source.ts rationale: the installer stays decoupled
// from the scripts/ layout, so a host can run the committed installer without the CI-side tree). So
// the disposition canonicalizer below RESTATES scripts/checkpoints.ts canonicalizeDisposition rather
// than importing it, and install/install.test.ts proves the two equal over a derived input set.
//
// DERIVE THE SET, ASSERT THE COUNT. Nothing below lists a rule string. Every rule is derived from
// ASK_RULE_ROWS by askRulesFor(), and the test pins the derived count AND the literal number, so the
// table and its expectation cannot shrink together unnoticed.
// ---------------------------------------------------------------------------

/** The two checkpoints the installer translates into ask rules, in table order. */
export const ASK_RULE_CHECKPOINTS = ["protected_branch_merge", "production_requires_human_confirmation"] as const;

export type AskRuleCheckpoint = (typeof ASK_RULE_CHECKPOINTS)[number];

/** A checkpoint disposition as the factory configuration spells it. */
export type CheckpointDisposition = "block" | "notify" | "off";

export interface AskRuleRow {
  readonly checkpoint: AskRuleCheckpoint;
  readonly tool: string;
  /** Governed subcommands. Each yields three rule forms (see askRulesFor). */
  readonly verbs: readonly string[];
  /** Governing flags that apply wherever they appear after the tool. Each yields one rule. */
  readonly flags: readonly string[];
}

const PROD: AskRuleCheckpoint = "production_requires_human_confirmation";
const MERGE: AskRuleCheckpoint = "protected_branch_merge";

/**
 * The rule table. Production rows first, then the merge rows, in the order of the retired table.
 * `vercel` is governed by its `--prod` flag only: `vercel deploy` without it is a preview deploy.
 */
export const ASK_RULE_ROWS: readonly AskRuleRow[] = [
  { checkpoint: PROD, tool: "kubectl", verbs: ["apply", "rollout", "delete"], flags: [] },
  { checkpoint: PROD, tool: "helm", verbs: ["upgrade", "install"], flags: [] },
  { checkpoint: PROD, tool: "terraform", verbs: ["apply"], flags: [] },
  { checkpoint: PROD, tool: "gcloud", verbs: ["deploy"], flags: [] },
  { checkpoint: PROD, tool: "aws", verbs: ["deploy", "sync"], flags: [] },
  { checkpoint: PROD, tool: "serverless", verbs: ["deploy"], flags: [] },
  { checkpoint: PROD, tool: "sls", verbs: ["deploy"], flags: [] },
  { checkpoint: PROD, tool: "flyctl", verbs: ["deploy"], flags: [] },
  { checkpoint: PROD, tool: "fly", verbs: ["deploy"], flags: [] },
  { checkpoint: PROD, tool: "vercel", verbs: [], flags: ["--prod"] },
  { checkpoint: PROD, tool: "npm", verbs: ["publish"], flags: [] },
  { checkpoint: PROD, tool: "yarn", verbs: ["publish"], flags: [] },
  { checkpoint: PROD, tool: "pnpm", verbs: ["publish"], flags: [] },
  { checkpoint: MERGE, tool: "gh", verbs: ["pr merge"], flags: [] },
  { checkpoint: MERGE, tool: "git", verbs: ["push"], flags: [] },
];

/**
 * The ask rules for one checkpoint, in table order.
 *
 * Every verb yields three forms, each measured against Claude Code's matcher (33.1-RESEARCH § Q1):
 *   A  `Bash(<tool> <verb> *)`   — the verb directly after the tool; also matches the bare `<tool> <verb>`
 *   B  `Bash(<tool> * <verb> *)` — options or a group between the tool and the verb, arguments after
 *   C  `Bash(<tool> * <verb>)`   — options or a group between the tool and the verb, nothing after
 * Every flag yields `Bash(<tool> *<flag>*)`, which matches the flag anywhere after the tool.
 *
 * The B and C forms can over-ask when a later argument happens to equal a verb. For a prompt that is
 * the acceptable direction.
 */
export function askRulesFor(checkpoint: AskRuleCheckpoint): string[] {
  const out: string[] = [];
  for (const row of ASK_RULE_ROWS) {
    if (row.checkpoint !== checkpoint) continue;
    for (const verb of row.verbs) {
      out.push(`Bash(${row.tool} ${verb} *)`);
      out.push(`Bash(${row.tool} * ${verb} *)`);
      out.push(`Bash(${row.tool} * ${verb})`);
    }
    for (const flag of row.flags) {
      out.push(`Bash(${row.tool} *${flag}*)`);
    }
  }
  return out;
}

/** Both checkpoints' rules, in ASK_RULE_CHECKPOINTS order. */
export function allAskRules(): string[] {
  const out: string[] = [];
  for (const checkpoint of ASK_RULE_CHECKPOINTS) out.push(...askRulesFor(checkpoint));
  return out;
}

/**
 * Restates scripts/checkpoints.ts canonicalizeDisposition exactly, without importing it: the exact
 * strings `block`, `notify` and `off` map to themselves, and every other value maps to `block`
 * (fail closed). install/install.test.ts asserts the two agree over a derived input set.
 */
export function canonicalizeCheckpointDisposition(raw: unknown): CheckpointDisposition {
  if (raw === "block") return "block";
  if (raw === "notify") return "notify";
  if (raw === "off") return "off";
  return "block";
}

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  v !== null && typeof v === "object" && !Array.isArray(v);

/**
 * The checkpoints whose rules the installer writes, in ASK_RULE_CHECKPOINTS order: those whose
 * canonicalized `config.checkpoints.<id>` is `block`. A non-object config, a missing or non-object
 * `checkpoints`, or a missing key all read as `block` (fail closed: over-asking is the safe
 * direction). Only an explicit `notify` or `off` lowers a checkpoint.
 */
export function checkpointsToWrite(config: unknown): AskRuleCheckpoint[] {
  const checkpoints = isPlainObject(config) && isPlainObject(config.checkpoints) ? config.checkpoints : {};
  return ASK_RULE_CHECKPOINTS.filter(
    (id) => canonicalizeCheckpointDisposition(Object.prototype.hasOwnProperty.call(checkpoints, id) ? checkpoints[id] : undefined) === "block",
  );
}

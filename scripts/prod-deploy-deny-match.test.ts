// prod-deploy-deny-match.test.ts — the OFFLINE, token-free non-vacuity RED test for the SAFE-02 /
// T-26-A2 prod-deploy-deny matcher. Runs under the excluded regression suite
// (`npx vitest run --exclude '**/scripts/e2e/**'`) — no `claude` CLI, no token spend; every fixture is
// a synthesized string, so the matcher is proven STRUCTURALLY regardless of live envelope reachability.
//
// Repo law (MEMORY: "green suite insufficient"): a green suite is NEVER proof for a safety assertion.
// The A2 assertion is the observation point for CLAUDE.md's hard "no unapproved production deploy"
// invariant, so its matcher MUST be proven non-vacuous in BOTH directions. Modelled on the RED/GREEN
// comparator at scripts/check-uat-oracles.test.ts:227-249.
//
// The DECISIVE case is (d): docs/dogfood-human-runbook.md:129 block-quotes the FULL deny sentence
// verbatim. Because the A2 probe runs `claude -p` with cwd = ROOT (uat-live.test.ts), the CLI
// auto-loads CLAUDE.md + AGENTS.md and a live agent can reproduce that quote WITH NO HOOK FIRING. A
// prose anchor returns a false TRUE here; only a STRUCTURAL anchor on the guard's machine-readable deny
// marker makes it FALSE. If this case is TRUE, the anchor is wrong.

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  prodDeployDenyFired,
  PROD_DEPLOY_DENY_KEY,
  PROD_DEPLOY_DENY_VALUE,
} from "./prod-deploy-deny-match.js";

const ROOT = join(import.meta.dirname, "..");

// ── Fixtures ─────────────────────────────────────────────────────────────────────────────────────

// A no-fire transcript that merely mentions "deploy" (an ALLOW — the guard wrote nothing).
const DEPLOY_MENTION_NO_DENY =
  "I ran the deploy plan and everything looks fine; no production deploy was attempted.";

// The CLAUDE.md/AGENTS.md tagline (semicolon form) quoted in prose, NO hook firing.
const TAGLINE_QUOTE =
  "As the project says, `Humans decide; agents execute.` — so I will stop at a pull request.";

// The comma form quoted in unrelated prose, NO hook firing.
const COMMA_FORM_QUOTE =
  "Per the runbook, humans decide, agents execute, and I have prepared the change for review.";

// DECISIVE: docs/dogfood-human-runbook.md:129 verbatim deny BLOCK-QUOTE reproduced in a transcript,
// with NO structured marker (the agent quoted the doc; the PreToolUse hook did NOT fire).
const RUNBOOK_129_VERBATIM_QUOTE = [
  "The runbook explains the expected outcome as:",
  "",
  "> Production deploy blocked: humans decide, agents execute. This command matches a",
  "> production-deploy pattern and GRUGOPS_PROD_DEPLOY_APPROVED is not set. A human must export",
  "> GRUGOPS_PROD_DEPLOY_APPROVED in the shell that launches Claude … then re-run the deploy.",
  "",
  "So I will not attempt the deploy.",
].join("\n");

// GREEN (1): a REAL deny envelope carrying the structured marker — exactly what hooks/guard.ts:90-100
// JSON.stringify's onto stdout when the PreToolUse hook fires.
const REAL_DENY_ENVELOPE = JSON.stringify({
  hookSpecificOutput: {
    hookEventName: "PreToolUse",
    permissionDecision: "deny",
    permissionDecisionReason:
      "Production deploy blocked: humans decide, agents execute. This command matches a production-deploy pattern and GRUGOPS_PROD_DEPLOY_APPROVED is not set.",
  },
});

// GREEN (2): the SAME envelope with the reason markdown-narrated (bold) around the raw structured
// marker — the real-world `claude -p --output-format json` transcript shape that broke the old
// exact-substring assertion. The structured marker is still present, so the matcher must return TRUE.
const MARKDOWN_NARRATED_DENY = [
  "The command was blocked by the PreToolUse guard:",
  "",
  "**Production deploy blocked:** humans decide, agents execute.",
  "",
  "Raw hook decision:",
  REAL_DENY_ENVELOPE,
].join("\n");

// ── Non-vacuity: FALSE when no structured deny marker is present ────────────────────────────────────
describe("prod-deploy-deny matcher (SAFE-02 / T-26-A2) — offline non-vacuity RED test", () => {
  it("non-vacuity: prodDeployDenyFired is FALSE when no structured deny marker is present (empty output; deploy-mention-without-deny; the CLAUDE.md/AGENTS.md tagline-quote; the comma-form-quote)", () => {
    expect(prodDeployDenyFired("")).toBe(false); // empty = ALLOW
    expect(prodDeployDenyFired(DEPLOY_MENTION_NO_DENY)).toBe(false);
    expect(prodDeployDenyFired(TAGLINE_QUOTE)).toBe(false);
    expect(prodDeployDenyFired(COMMA_FORM_QUOTE)).toBe(false);
  });

  it("non-vacuity DECISIVE: prodDeployDenyFired is FALSE on the docs/dogfood-human-runbook.md:129 verbatim deny block-quote with no structured marker (proves the anchor is structural, not quotable prose)", () => {
    // If this is TRUE, the anchor is prose and defeatable by doc-quotation — the anchor is wrong.
    expect(prodDeployDenyFired(RUNBOOK_129_VERBATIM_QUOTE)).toBe(false);
  });

  // ── Non-vacuity: TRUE on a real structured deny envelope + its markdown-narrated form ─────────────
  it("non-vacuity: prodDeployDenyFired is TRUE on a real deny envelope carrying the structured marker AND on the same envelope with the reason markdown-narrated", () => {
    expect(prodDeployDenyFired(REAL_DENY_ENVELOPE)).toBe(true);
    expect(prodDeployDenyFired(MARKDOWN_NARRATED_DENY)).toBe(true);
  });

  // ── Anchor integrity: the matcher's frozen marker is genuinely what the guard emits ──────────────
  it("anchor integrity: the matcher's frozen structured marker const is present verbatim in hooks/guard.ts", () => {
    const guardSrc = readFileSync(join(ROOT, "hooks", "guard.ts"), "utf8");
    // The frozen key + value the matcher anchors on are present verbatim in the guard source, so the
    // matcher can never silently drift from the guard's contract.
    expect(guardSrc.includes(PROD_DEPLOY_DENY_KEY)).toBe(true);
    expect(guardSrc.includes(`"${PROD_DEPLOY_DENY_VALUE}"`)).toBe(true);
    // Strongest anti-drift check: the matcher's OWN predicate fires on the guard's source envelope. If
    // guard.ts's deny() marker ever changes, this goes red and forces the matcher to be updated in lock-step.
    expect(prodDeployDenyFired(guardSrc)).toBe(true);
  });
});

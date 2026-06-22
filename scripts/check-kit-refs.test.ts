// check-kit-refs.test.ts — behavioral oracle for the flipped Phase-24 grep-to-zero kit-ref gate.
//
// The gate (scripts/check-kit-refs.ts → committed scripts/check-kit-refs.js) had NO test before
// Phase 24 (Pitfall 2). This file stands up its FIRST harness and carries the D-15 both-direction
// adversarial proof: it drives the COMMITTED .js via spawnSync (never the .ts), builds a hermetic
// mirror via mkdtempSync, and points the gate at the mirror through the existing CHECK_ROOT override
// (check-kit-refs.ts:34). Nothing is ever written into the committed tree.
//
// The terminal project lesson (memory: grugops-safety-invariant-green-suite-insufficient) is that a
// green unit suite is NOT proof for a safety/trace guard — the only acceptable proof is an adversarial
// RED-vs-committed-.js reproduction. These cases ARE that reproduction, run in CI:
//
//   GREEN        : a mirror whose SCAN-set files carry zero `agent-factory/handoffs/` refs → exit 0.
//   RED          : plant an `agent-factory/handoffs/anything.md` ref into a SCAN-set file → exit 1,
//                  stdout NAMES the stray (the flipped Assertion 2 fails on ANY hit).
//   BACKPRESSURE : the flip is in effect but the rewire is incomplete (a surviving handoff ref) →
//                  RED vs the committed .js — the deletion change can never go green prematurely
//                  (the Phase-23 WR-05 atomic-flip discipline).
//
// NOT in the e2e lane (project memory: `npm test` triggers the live claude-CLI lane; this is a
// hermetic temp-dir test). Vitest globals:false → import explicitly.

import { describe, it, expect, afterAll } from "vitest";
import { spawnSync } from "node:child_process";
import {
  mkdtempSync,
  mkdirSync,
  cpSync,
  readFileSync,
  writeFileSync,
  appendFileSync,
  existsSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";

const ROOT = join(import.meta.dirname, "..");
const GATE_JS = join(ROOT, "scripts", "check-kit-refs.js");

// The SCAN set the gate walks (check-kit-refs.ts:45-55). The mirror copies these from the real,
// already-rewired tree so a baseline mirror is GREEN; a planted ref then drives it RED.
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

const tmpDirs: string[] = [];
function freshTmp(prefix: string): string {
  const d = mkdtempSync(join(tmpdir(), prefix));
  tmpDirs.push(d);
  return d;
}
afterAll(() => {
  for (const d of tmpDirs) rmSync(d, { recursive: true, force: true });
});

// Build a hermetic CHECK_ROOT mirror by copying the real SCAN-set paths into a fresh temp dir.
// Because the real tree is already rewired to zero handoff refs (Wave 1 complete), the baseline
// mirror is clean — the GREEN case. Tests then plant a stray to drive RED.
function makeMirror(prefix: string): string {
  const mirror = freshTmp(prefix);
  for (const rel of SCAN) {
    const src = join(ROOT, rel);
    if (!existsSync(src)) continue; // mirror the gate's silent-skip-on-absent shape
    const dst = join(mirror, rel);
    mkdirSync(dirname(dst), { recursive: true });
    cpSync(src, dst, { recursive: true });
  }
  return mirror;
}

function runGate(checkRoot: string): { status: number; stdout: string } {
  const r = spawnSync("node", [GATE_JS], {
    encoding: "utf8",
    env: { ...process.env, CHECK_ROOT: checkRoot },
  });
  return { status: r.status ?? -1, stdout: (r.stdout ?? "") + (r.stderr ?? "") };
}

// Pick a real SCAN-set file in the mirror to plant a ref into (a role file always exists).
function aRoleFile(mirror: string): string {
  return join(mirror, "agent-factory", "roles", "orchestrator.md");
}

describe("check-kit-refs flipped gate — D-15 both-direction adversarial proof vs the committed .js", () => {
  it("GREEN: a clean rewired mirror (zero agent-factory/handoffs/ refs) → exit 0", () => {
    const mirror = makeMirror("ckr-green-");
    const r = runGate(mirror);
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("ALL CHECKS PASSED");
  });

  it("RED: a planted agent-factory/handoffs/anything.md ref in a SCAN-set file → exit 1 naming the stray", () => {
    const mirror = makeMirror("ckr-red-");
    const target = aRoleFile(mirror);
    appendFileSync(
      target,
      "\nSee agent-factory/handoffs/anything.md for the old relay.\n",
    );
    const r = runGate(mirror);
    expect(r.status).toBe(1);
    // The flipped Assertion 2 fails on ANY hit and names the stray file:line.
    expect(r.stdout).toContain("agent-factory/handoffs/anything.md");
    expect(r.stdout).toMatch(/agent-factory\/roles\/orchestrator\.md/);
  });

  it("RED: even a KNOWN former-template name (architecture-handoff.md) now fails — the ALLOW ERE is gone", () => {
    const mirror = makeMirror("ckr-red-known-");
    const target = aRoleFile(mirror);
    // Pre-flip this would have PASSED (it was on the 16-template allowlist); post-flip ANY ref fails.
    appendFileSync(
      target,
      "\nProduce agent-factory/handoffs/architecture-handoff.md.\n",
    );
    const r = runGate(mirror);
    expect(r.status).toBe(1);
    expect(r.stdout).toContain("agent-factory/handoffs/architecture-handoff.md");
  });

  it("BACKPRESSURE: an incomplete rewire (a surviving handoff ref) → RED — the change cannot go green prematurely", () => {
    const mirror = makeMirror("ckr-backpressure-");
    // Simulate a workflow file that was NOT rewired to zero — a leftover relay ref survives.
    const wf = join(mirror, "agent-factory", "workflows", "04-ticket-to-pr.md");
    if (existsSync(wf)) {
      appendFileSync(wf, "\nReads agent-factory/handoffs/ticket-ready-packet.md.\n");
    } else {
      // Defensive: if the canonical workflow file moved, plant into a role file instead.
      appendFileSync(aRoleFile(mirror), "\nagent-factory/handoffs/ticket-ready-packet.md\n");
    }
    const r = runGate(mirror);
    expect(r.status).toBe(1);
    expect(r.stdout).toContain("agent-factory/handoffs/ticket-ready-packet.md");
  });

  it("GREEN→RED→GREEN round trip: planting then removing the stray flips exit 1 back to exit 0", () => {
    const mirror = makeMirror("ckr-roundtrip-");
    const target = aRoleFile(mirror);
    const original = readFileSync(target, "utf8");

    // GREEN baseline.
    expect(runGate(mirror).status).toBe(0);

    // Plant → RED.
    writeFileSync(target, original + "\nagent-factory/handoffs/qe-handoff.md\n", "utf8");
    expect(runGate(mirror).status).toBe(1);

    // Remove → GREEN again (the gate is a pure function of the SCAN-set contents).
    writeFileSync(target, original, "utf8");
    expect(runGate(mirror).status).toBe(0);
  });
});

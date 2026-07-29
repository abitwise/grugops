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

// The SCAN set the gate walks. The mirror copies these from the real, already-rewired tree so a
// baseline mirror is GREEN; a planted ref then drives it RED.
//
// (Phase 27 / KIT-02, D-16) `.claude/agents` is the DIRECTORY here, tracking the gate's own change
// from one hand-named adapter file. Copying the directory is what lets the plant-an-extra-adapter
// cases below exist at all: under the old file entry, a second adapter in the mirror was simply
// invisible to the gate.
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

// ---------------------------------------------------------------------------
// Phase 27 (KIT-02 / D-19) — the per-consumer derivation assertions for the three literals this
// gate used to carry. Each case proves the set follows the FILESYSTEM in a way no re-listed array
// could: it plants a file that did not exist when any literal could have been written, and requires
// the gate to see it. Revert a derivation to a literal and the matching case goes red.
//
// Every case asserts on the NAMED FILE in the output, never on the exit code alone — a gate that
// fails for the wrong reason is not a passing test.
// ---------------------------------------------------------------------------

// The invariant blockquote every adapter must carry (check-kit-refs.ts MARKER, byte-identical).
const MARKER = "If the kit dir is absent, STOP — do not hunt.";
// The resolver slot that makes an adapter a resolver, and therefore legally able to name the
// kit-root environment variable (check-kit-refs.ts RESOLVER_SLOT / install.ts MAT_SLOT).
const RESOLVER_SLOT =
  "# 1. (installed) the absolute kit path the installer wrote above this line.";
const KIT_ROOT_ENV_LINE = 'KIT="${GRUGOPS_HOME:-$HOME/.grugops}/agent-factory"';

// Write an extra adapter into the mirror's adapter directory and return its repo-relative path.
function plantAdapter(mirror: string, name: string, body: string): string {
  const rel = `.claude/agents/${name}.md`;
  mkdirSync(join(mirror, ".claude", "agents"), { recursive: true });
  writeFileSync(join(mirror, rel), body, "utf8");
  return rel;
}

// The number of marker sites the gate reports it compared. Reading the reported count (rather than
// a bare pass) is what makes a run over a shrunken or empty derived set visible.
function reportedMarkerSites(stdout: string): number {
  const m = stdout.match(/marker present at all (\d+) marker sites/);
  return m ? Number(m[1]) : -1;
}

describe("check-kit-refs derived sets — D-19 per-consumer assertions (KIT-02, Phase 27)", () => {
  // ── MARKER_SITES: derived from the adapter directories (D-27) ──────────────────────────────
  it("marker sites RED: a planted adapter without the invariant blockquote fails red naming it", () => {
    const mirror = makeMirror("ckr-marker-red-");
    const rel = plantAdapter(
      mirror,
      "grugops-marker-probe",
      "---\nname: grugops-marker-probe\n---\nNo invariant blockquote here on purpose.\n",
    );
    const r = runGate(mirror);
    expect(r.status).toBe(1);
    // Named, with the failure word that means "file present, blockquote gone" — distinct from the
    // "(absent)" word, which means the file itself is missing. The two must never be merged.
    expect(r.stdout).toContain(`${rel}(marker-missing)`);
  });

  it("marker sites GREEN: a planted adapter WITH the blockquote passes and the reported count rises by one", () => {
    const mirror = makeMirror("ckr-marker-green-");
    const before = runGate(mirror);
    expect(before.status).toBe(0);
    const baseline = reportedMarkerSites(before.stdout);
    expect(baseline).toBeGreaterThan(0); // the gate reports what it compared, never a bare verdict

    plantAdapter(
      mirror,
      "grugops-marker-ok",
      `---\nname: grugops-marker-ok\n---\n> **Kit vs state invariant:** ${MARKER}\n\nPointer text only.\n`,
    );
    const after = runGate(mirror);
    expect(after.status).toBe(0);
    // A hand-listed MARKER_SITES array could never count a file written after it.
    expect(reportedMarkerSites(after.stdout)).toBe(baseline + 1);
  });

  it("marker sites vacuity floor: an empty adapter directory fails red rather than passing over nothing", () => {
    const mirror = makeMirror("ckr-marker-vacuous-");
    rmSync(join(mirror, ".claude", "agents"), { recursive: true, force: true });
    rmSync(join(mirror, ".claude", "skills"), { recursive: true, force: true });
    const r = runGate(mirror);
    expect(r.status).toBe(1);
    expect(r.stdout).toContain("no adapter files found");
  });

  it("derivation failure: ONE unreadable adapter directory fails red naming it, even though the other still populates the set", () => {
    // (Phase 27 / plan 27-11) The vacuity floor above only catches the case where BOTH directories
    // are gone. With the agent directory removed and the skills directory intact, the derived set is
    // still 7 files, the floor passes, and every derived assertion below runs over a set that lost
    // seventeen members — silently, under the pre-27-11 derivation, which returned [] on an
    // unreadable directory. The shared authority THROWS instead, and that throw is now its own
    // finding rather than being swallowed.
    const mirror = makeMirror("ckr-derivation-partial-");
    rmSync(join(mirror, ".claude", "agents"), { recursive: true, force: true });
    const r = runGate(mirror);
    expect(r.status).toBe(1);
    expect(r.stdout).toContain("adapter derivation failed");
    expect(r.stdout).toContain(join(".claude", "agents"));
    // The surviving half still derives, proving this is not merely the vacuity floor re-firing.
    expect(r.stdout).not.toContain("no adapter files found");
  });

  // ── Assertion 3: the derived legal set keyed on the resolver slot (D-07) ────────────────────
  it("Assertion 3 RED: a hand-written adapter naming the kit-root env var without a resolver slot fails red", () => {
    const mirror = makeMirror("ckr-gh-red-");
    // This is the hole the restatement closes. Under the old exclusion-by-omission form this file
    // passed simply by not being on a list of three named paths.
    const rel = plantAdapter(
      mirror,
      "grugops-rogue-resolver",
      `---\nname: grugops-rogue-resolver\n---\n> ${MARKER}\n\n${KIT_ROOT_ENV_LINE}\n`,
    );
    const r = runGate(mirror);
    expect(r.status).toBe(1);
    expect(r.stdout).toContain("legal-set equality does not hold");
    expect(r.stdout).toContain(rel);
    expect(r.stdout).toContain("carries no resolver slot");
  });

  it("Assertion 3 GREEN: a resolver-slot adapter naming the env var passes — the legal set is derived, not fixed", () => {
    const mirror = makeMirror("ckr-gh-green-");
    plantAdapter(
      mirror,
      "grugops-second-resolver",
      `---\nname: grugops-second-resolver\n---\n> ${MARKER}\n\n\`\`\`sh\n${RESOLVER_SLOT}\n${KIT_ROOT_ENV_LINE}\n\`\`\`\n`,
    );
    const r = runGate(mirror);
    expect(r.status).toBe(0);
    // The legal set grew because a resolver appeared on disk — no edit to any array.
    expect(r.stdout).toMatch(/appears in exactly the \d+ derived legal site\(s\)/);
  });

  it("Assertion 3 two-sided: a resolver-slot adapter that LOST its self-heal line fails red too", () => {
    const mirror = makeMirror("ckr-gh-silent-");
    // A resolver that cannot name the kit-root variable cannot self-heal — it would hunt the repo.
    // The old negative-only predicate looked for the variable's PRESENCE and could never see this.
    const rel = plantAdapter(
      mirror,
      "grugops-mute-resolver",
      `---\nname: grugops-mute-resolver\n---\n> ${MARKER}\n\n\`\`\`sh\n${RESOLVER_SLOT}\n\`\`\`\n`,
    );
    const r = runGate(mirror);
    expect(r.status).toBe(1);
    expect(r.stdout).toContain(rel);
    expect(r.stdout).toContain("carries the resolver slot but never names");
  });

  // ── SCAN reach: the directory entry reaches every adapter, not just the one once named ──────
  it("SCAN reach: a deleted-templates ref in a NON-orchestrator adapter fails Assertion 2 naming it", () => {
    const mirror = makeMirror("ckr-scan-reach-");
    const rel = plantAdapter(
      mirror,
      "grugops-scan-reach-probe",
      `---\nname: grugops-scan-reach-probe\n---\n> ${MARKER}\n\nSee agent-factory/handoffs/scan-reach-probe.md for the old relay.\n`,
    );
    const r = runGate(mirror);
    expect(r.status).toBe(1);
    // Under the old single-file SCAN entry this adapter was not walked at all, so the stray ref was
    // invisible. Naming BOTH the file and the stray proves the directory entry genuinely reaches it.
    expect(r.stdout).toContain(rel);
    expect(r.stdout).toContain("agent-factory/handoffs/scan-reach-probe.md");
  });
});

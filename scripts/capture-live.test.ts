// capture-live.test.ts — the OFFLINE, token-free, both-directions predicate suite for the Phase 33
// live capture (CAP-03 / D-02, D-04, D-05, D-06, D-10). Runs under the excluded regression suite
// (`npx vitest run --exclude '**/scripts/e2e/**'`) — no `claude` session, no token spend; every
// input is the committed fixture transcript or a string synthesized from it, so each predicate the
// live run of plan 33-10 relies on is proven STRUCTURALLY before a single token is spent.
//
// Repo law (MEMORY: "green suite insufficient"): a green suite is NEVER proof for a safety
// assertion. So every case here is two-sided — the predicate is shown to answer one way on the
// committed fixture and the OTHER way on an in-memory mutation of it, so a predicate that could
// only ever return one answer (the fabricated-green shape) reds here.
//
// THE DECISIVE CASE is the decode pair: `hook_response.stdout` is a JSON STRING, and the matcher
// fails CLOSED over a raw JSONL line by its own contract (scripts/prod-deploy-deny-match.ts:38-40).
// The 2026-09-18 live run reproduced exactly that on the `json` channel. The first case below
// asserts false on the raw line BEFORE asserting true on the decoded field, in one body, so neither
// half can be deleted alone.
//
// THE GRANT IS DERIVED TWICE AND NEVER TYPED (Shared Pattern 3, "derive the set, assert the count"):
// the coordinator adapter's enumeration through the canonical admission reader on one side, the
// adapter-file census on the other, with the RELATIONSHIP between the two cardinalities asserted
// rather than a bare integer pinned on either side.

import { describe, it, expect } from "vitest";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { prodDeployDenyFired, PROD_DEPLOY_REASON_SIGNATURE } from "./prod-deploy-deny-match.js";
import { admit, admittedGrantedNames } from "./canonical-frontmatter.js";
import { listAgentAdapters } from "./kit-model.js";
import {
  approvalKeyRefusals,
  authorStamps,
  capThreePredicate,
  childEnvironment,
  denyObservedInStream,
  denyObservation,
  deriveGrant,
  DRY_RUN_COMPLETE,
  DRY_RUN_REPORT_NAME,
  DRY_RUN_TRANSCRIPT_NAME,
  evaluatePreconditions,
  FIXTURE_JSONL,
  frameKinds,
  homeSpellingSurvivors,
  OUTCOME_LINE_SCAN_RE,
  parseFrames,
  pluginLoadReport,
  readFrames,
  READINESS_PREFIX,
  redactText,
  REDACTION_PLACEHOLDER,
  REQUIRED_FLAGS,
  spawnObservations,
  TMP_PREFIX,
  verifyArtifacts,
  type PreconditionObservation,
  type StreamFrame,
} from "./capture-live.js";

const ROOT = join(import.meta.dirname, "..");
const FIXTURE_TEXT = readFileSync(FIXTURE_JSONL, "utf8");
const FIXTURE_LINES = FIXTURE_TEXT.split("\n").filter((l) => l.trim() !== "");
const FIXTURE = parseFrames(FIXTURE_TEXT);

// ── Helpers: every mutation is built IN MEMORY from the committed fixture, never by editing it. ──

function isHookResponse(f: StreamFrame): boolean {
  return f.type === "system" && f.subtype === "hook_response";
}

function stdoutOf(f: StreamFrame): string {
  return typeof f.stdout === "string" ? f.stdout : "";
}

function without(frames: readonly StreamFrame[], drop: (f: StreamFrame) => boolean): StreamFrame[] {
  return frames.filter((f) => !drop(f));
}

// The prod-deploy deny frame is located by the matcher's OWN discriminator on the decoded field —
// never by position — so a fixture reorder cannot silently point these cases at the wrong frame.
const PROD_DENY_LINE = FIXTURE_LINES.find((line) => {
  const f = JSON.parse(line) as StreamFrame;
  return isHookResponse(f) && stdoutOf(f).includes(PROD_DEPLOY_REASON_SIGNATURE);
});
const ADMISSION_LINE = FIXTURE_LINES.find((line) => {
  const f = JSON.parse(line) as StreamFrame;
  return isHookResponse(f) && !stdoutOf(f).includes(PROD_DEPLOY_REASON_SIGNATURE);
});

// The grant, derived two ways from the REPOSITORY tree (the installed target carries the same 17).
const ORCHESTRATOR_ADAPTER = join(ROOT, ".claude", "agents", "grugops-orchestrator.md");
function grantFromEnumeration(): string[] {
  const parsed = admit(readFileSync(ORCHESTRATOR_ADAPTER, "utf8"));
  if (!parsed.ok) throw new Error(`the coordinator adapter is not in canonical form: ${parsed.code} — ${parsed.reason}`);
  return admittedGrantedNames(parsed.value).sort();
}
function adapterCensus(): string[] {
  return listAgentAdapters(ROOT).map((rel) => rel.replace(/\.md$/, "")).sort();
}

// A context root with hand-written notes in the store's own on-disk shape (the board-snapshot
// fixture at scripts/fixtures/board-snapshot is the precedent), for the D-02 side-(b) cases.
function contextRootWithNotes(notes: readonly { by: string; kind: string; body: string }[]): string {
  const root = mkdtempSync(join(tmpdir(), `${TMP_PREFIX}test-ctx-`));
  const notesDir = join(root, "audit-current-architecture", "notes");
  mkdirSync(notesDir, { recursive: true });
  notes.forEach((n, i) => {
    const at = `2026-09-19T10:0${i}:00.000Z`;
    const id = `${at.replace(/[-:]/g, "").replace(".000Z", "Z")}-${n.kind}-note${i}`;
    writeFileSync(
      join(notesDir, `${id}.md`),
      ["---", `kind: ${n.kind}`, `by: ${n.by}`, `at: ${at}`, "verified_by: ", "confidence: medium", "refs:", "  - plans/tickets/AUDIT-1.md", "supersedes: null", "---", "", n.body, ""].join("\n"),
    );
  });
  return root;
}

// ── D-04: the decode pair, negative control, and the frame-index citation ───────────────────────

describe("D-04 deny attribution reads the DECODED hook_response.stdout (Pattern 2, Pitfall 1)", () => {
  it("RED then GREEN in one body: the raw JSONL line scores FALSE, JSON.parse(line).stdout scores TRUE", () => {
    expect(PROD_DENY_LINE, "the fixture must carry a hook_response whose stdout holds the prod-deploy deny").toBeDefined();
    const line = PROD_DENY_LINE as string;
    // RED first: the raw line is what a naive harness hands the matcher, and it fails closed.
    expect(prodDeployDenyFired(line), "the matcher must fail CLOSED over the raw frame line — the envelope sits inside a JSON string value").toBe(false);
    // GREEN second: the decoded stdout is the guard's own bytes, carried by the CLI.
    const decoded = (JSON.parse(line) as StreamFrame).stdout as string;
    expect(prodDeployDenyFired(decoded), "the decoded stdout is the point-of-effect channel and must match").toBe(true);
    // And the stream predicate is the decoded direction, cited by the frame it came from.
    const obs = denyObservation(FIXTURE.frames);
    expect(obs.fired).toBe(true);
    expect(obs.frameIndex).not.toBeNull();
    expect(FIXTURE.frames[obs.frameIndex as number].stdout).toBe(decoded);
    expect(obs.hookResponsesExamined, "at least one hook_response was examined before the match").toBeGreaterThan(0);
  });

  it("negative control: the admission guard's byte-similar deny envelope scores FALSE — the discriminator is the reason signature, not the word deny", () => {
    expect(ADMISSION_LINE, "the fixture must carry the admission guard's envelope as the negative control").toBeDefined();
    const admission = (JSON.parse(ADMISSION_LINE as string) as StreamFrame).stdout as string;
    expect(admission, "the control really is a deny envelope").toContain('"permissionDecision":"deny"');
    expect(prodDeployDenyFired(admission)).toBe(false);
    // Over a stream that carries ONLY the admission deny, the predicate is false with a non-zero
    // examined count — false because nothing matched, not because nothing was looked at.
    const onlyAdmission = without(FIXTURE.frames, (f) => isHookResponse(f) && stdoutOf(f).includes(PROD_DEPLOY_REASON_SIGNATURE));
    expect(denyObservedInStream(FIXTURE.frames), "the full fixture fires").toBe(true);
    expect(denyObservedInStream(onlyAdmission), "with the prod-deploy frame removed the predicate moves to false").toBe(false);
    expect(denyObservation(onlyAdmission).hookResponsesExamined).toBe(1);
  });
});

// ── D-02 side (a): both observables, and the mutations that move the verdict ───────────────────

describe("D-02 side (a): spawn observations accept either own-session observable (Pattern 3, Pitfall 2)", () => {
  it("the full fixture yields exactly two evidenced observations, one per observable, both granted roles", () => {
    const obs = spawnObservations(FIXTURE.frames);
    const evidenced = obs.filter((o) => o.evidence !== "none");
    expect(evidenced).toHaveLength(2);
    expect(evidenced.map((o) => o.evidence).sort()).toEqual(["nested-frames", "task-notification"]);
    for (const o of evidenced) {
      expect(o.frameCount, `${o.role} carries a non-zero evidence count`).toBeGreaterThan(0);
      expect(o.evidenceFrameIndex, `${o.role} cites the frame that evidenced it`).not.toBeNull();
    }
    const granted = grantFromEnumeration();
    expect(new Set(evidenced.map((o) => o.role)).size, "two DISTINCT roles").toBe(2);
    for (const o of evidenced) expect(granted, `${o.role} is a member of the derived grant`).toContain(o.role);
  });

  it("mutation 1: removing the task_notification frame drops the background spawn's evidence, and the predicate names that role", () => {
    const grant = deriveGrant(ROOT);
    const stamps = authorStamps(contextRootWithNotes([{ by: "security-nfr", kind: "observation", body: "NFR review." }]));
    const full = spawnObservations(FIXTURE.frames);
    expect(capThreePredicate({ observations: full, grant, stamps }), "control: the unmutated fixture satisfies both sides").toEqual([]);

    const mutated = without(FIXTURE.frames, (f) => f.type === "system" && f.subtype === "task_notification");
    const obs = spawnObservations(mutated);
    expect(obs.filter((o) => o.evidence !== "none"), "the second evidenced observation disappears").toHaveLength(1);
    const lost = obs.find((o) => o.evidence === "none");
    expect(lost?.role).toBe("grugops-security-nfr");
    const reasons = capThreePredicate({ observations: obs, grant, stamps });
    expect(reasons.length).toBeGreaterThan(0);
    expect(reasons.some((r) => r.includes("grugops-security-nfr") && r.includes("no own-session evidence")), `a reason names the role that lost its evidence: ${JSON.stringify(reasons)}`).toBe(true);
    expect(reasons.some((r) => r.includes("1 distinct granted role(s)")), "and the distinct-role floor reports one").toBe(true);
  });

  it("mutation 2: removing every nested frame drops the foreground spawn's evidence, and the predicate names that role", () => {
    const arch = spawnObservations(FIXTURE.frames).find((o) => o.evidence === "nested-frames");
    expect(arch?.role).toBe("grugops-architect-design");
    const mutated = without(FIXTURE.frames, (f) => f.parent_tool_use_id === arch?.toolUseId);
    const obs = spawnObservations(mutated);
    expect(obs.find((o) => o.role === "grugops-architect-design")?.evidence).toBe("none");
    const grant = deriveGrant(ROOT);
    const stamps = authorStamps(contextRootWithNotes([{ by: "architect-design", kind: "observation", body: "Design review." }]));
    const reasons = capThreePredicate({ observations: obs, grant, stamps });
    expect(reasons.some((r) => r.includes("grugops-architect-design") && r.includes("no own-session evidence")), JSON.stringify(reasons)).toBe(true);
  });

  it("a role outside the derived grant is named and does not count toward the two-role floor", () => {
    const text = FIXTURE_TEXT.split("grugops-security-nfr").join("grugops-not-a-role");
    const obs = spawnObservations(parseFrames(text).frames);
    const reasons = capThreePredicate({ observations: obs, grant: deriveGrant(ROOT), stamps: authorStamps(contextRootWithNotes([{ by: "architect-design", kind: "claim", body: "x" }])) });
    expect(reasons.some((r) => r.includes("grugops-not-a-role") && r.includes("not a member of the derived grant"))).toBe(true);
    expect(reasons.some((r) => r.includes("1 distinct granted role(s)"))).toBe(true);
  });
});

// ── D-02: the predicate is TWO-SIDED — one side alone is a red with a named reason ─────────────

describe("D-02 two-sidedness: a one-sided capture is a red with a named reason", () => {
  it("side (a) holds and every note is coordinator-stamped → side (b) fails by name", () => {
    const grant = deriveGrant(ROOT);
    const root = contextRootWithNotes([
      { by: "grugops-orchestrator", kind: "decision", body: "Decomposed the request." },
      { by: "orchestrator", kind: "claim", body: "Routed two subtasks." },
    ]);
    const reasons = capThreePredicate({ observations: spawnObservations(FIXTURE.frames), grant, stamps: authorStamps(root) });
    expect(reasons).toHaveLength(1);
    expect(reasons[0]).toMatch(/^side \(b\):/);
    expect(reasons[0]).toContain("grugops-orchestrator");
    expect(reasons[0]).toContain("orchestrator");
  });

  it("side (b) holds and the transcript carries no Agent spawn → side (a) fails by name", () => {
    const grant = deriveGrant(ROOT);
    const root = contextRootWithNotes([{ by: "software-engineer", kind: "finding", body: "Implemented." }]);
    const noSpawn = without(FIXTURE.frames, (f) => JSON.stringify(f).includes('"name":"Agent"'));
    const reasons = capThreePredicate({ observations: spawnObservations(noSpawn), grant, stamps: authorStamps(root) });
    expect(reasons).toHaveLength(1);
    expect(reasons[0]).toMatch(/^side \(a\): 0 distinct granted role\(s\)/);
  });

  it("an empty context root fails side (b) with the no-note reason; both sides holding yields the empty array", () => {
    const grant = deriveGrant(ROOT);
    const empty = mkdtempSync(join(tmpdir(), `${TMP_PREFIX}test-empty-`));
    const reasonsEmpty = capThreePredicate({ observations: spawnObservations(FIXTURE.frames), grant, stamps: authorStamps(join(empty, "nothing-here")) });
    expect(reasonsEmpty).toEqual(["side (b): no live note exists under the target's context root, so no author stamp can be read"]);
    const both = contextRootWithNotes([
      { by: "grugops-orchestrator", kind: "decision", body: "Decomposed." },
      { by: "security-nfr", kind: "observation", body: "Reviewed." },
    ]);
    expect(capThreePredicate({ observations: spawnObservations(FIXTURE.frames), grant, stamps: authorStamps(both) })).toEqual([]);
    rmSync(empty, { recursive: true, force: true });
  });
});

// ── The grant: derived twice, floored, and the RELATIONSHIP asserted ───────────────────────────

describe("the coordinator grant is derived from two independent sources and their cardinalities are compared", () => {
  it("enumeration vs adapter census: census = grant + the coordinator itself; neither side is a bare literal", () => {
    const granted = grantFromEnumeration();
    const census = adapterCensus();
    // Per-part vacuity floor BEFORE the relationship: an empty derivation must never produce a verdict.
    expect(granted.length, "the enumeration derived ZERO names — refusing a verdict over an empty grant").toBeGreaterThan(0);
    expect(census.length, "the adapter census derived ZERO files — refusing a verdict over an empty census").toBeGreaterThan(0);
    expect(
      census.length,
      `the adapter census derived ${census.length} file(s) and the coordinator enumeration derived ${granted.length} name(s); ` +
        "the relationship is census = grant + 1 (the coordinator carries the marker and is not granted to itself). " +
        "Walk BOTH derivations before touching either — re-pinning a number here is how you acknowledge that the set " +
        "changed, not how you make the failure go away",
    ).toBe(granted.length + 1);
    // Set relationship, not just counts: every granted name is a census member, and the one census
    // member that is not granted is the coordinator.
    const censusSet = new Set(census);
    expect(granted.filter((g) => !censusSet.has(g))).toEqual([]);
    expect(census.filter((c) => !granted.includes(c))).toEqual(["grugops-orchestrator"]);
    // And the runner's own derivation agrees with both hand-derived sides.
    const derived = deriveGrant(ROOT);
    expect(derived.reasons).toEqual([]);
    expect(derived.granted).toEqual(granted);
    expect(derived.adapterNames).toEqual(census);
    expect(derived.coordinator).toBe("grugops-orchestrator");
    expect(derived.prefix, "the namespace prefix is derived as the longest common prefix, cut at the last separator").toBe("grugops-");
  });

  it("the runner's derivation refuses a tree with no adapters rather than reporting an empty grant as a verdict", () => {
    const bare = mkdtempSync(join(tmpdir(), `${TMP_PREFIX}test-bare-`));
    const derived = deriveGrant(bare);
    expect(derived.granted).toEqual([]);
    expect(derived.reasons.length).toBeGreaterThan(0);
    const reasons = capThreePredicate({ observations: spawnObservations(FIXTURE.frames), grant: derived, stamps: [] });
    expect(reasons.some((r) => r.includes("vacuity floor"))).toBe(true);
    rmSync(bare, { recursive: true, force: true });
  });
});

// ── Pattern 1: the reader survives a killed run ───────────────────────────────────────────────

describe("readFrames survives a truncated final line (Pattern 1, Pitfall 6)", () => {
  it("reports partial >= 1 and still returns every complete frame with its line number", async () => {
    const dir = mkdtempSync(join(tmpdir(), `${TMP_PREFIX}test-trunc-`));
    const path = join(dir, "truncated.jsonl");
    const last = FIXTURE_LINES[FIXTURE_LINES.length - 1];
    writeFileSync(path, `${FIXTURE_LINES.slice(0, -1).join("\n")}\n${last.slice(0, Math.floor(last.length / 2))}`);
    const r = await readFrames(path);
    expect(r.partial).toBeGreaterThanOrEqual(1);
    expect(r.frames).toHaveLength(FIXTURE_LINES.length - 1);
    expect(r.lineNumbers).toEqual(FIXTURE_LINES.slice(0, -1).map((_, i) => i + 1));
    expect(r.lineCount).toBe(FIXTURE_LINES.length);
    // The committed fixture itself has no partial line — the control for the mutation above.
    const clean = await readFrames(FIXTURE_JSONL);
    expect(clean.partial).toBe(0);
    expect(clean.frames).toHaveLength(FIXTURE_LINES.length);
    rmSync(dir, { recursive: true, force: true });
  });
});

// ── D-05 and the schema-drift detector ─────────────────────────────────────────────────────────

describe("D-05 plugin load report and the frame-kind census", () => {
  it("pluginLoadReport reads system/init plugins[] and an omitted plugin_errors key as no errors", () => {
    const r = pluginLoadReport(FIXTURE.frames);
    expect(r.frameIndex).not.toBeNull();
    expect(r.loaded.map((p) => p.name)).toEqual(["grugops"]);
    expect(r.loaded[0].path).not.toBe("");
    expect(r.errors).toEqual([]);
    const noInit = without(FIXTURE.frames, (f) => f.type === "system" && f.subtype === "init");
    expect(pluginLoadReport(noInit), "without an init frame nothing is claimed").toEqual({ loaded: [], errors: [], frameIndex: null });
  });

  it("frameKinds enumerates every distinct (type, subtype) pair, counted against an independent pass", () => {
    const kinds = frameKinds(FIXTURE.frames);
    const independent = new Set(FIXTURE.frames.map((f) => `${f.type}/${typeof f.subtype === "string" ? f.subtype : ""}`));
    expect(kinds.length).toBe(independent.size);
    expect(kinds.reduce((n, k) => n + k.count, 0), "the counts sum to the frame count").toBe(FIXTURE.frames.length);
    for (const want of ["system/init", "system/hook_response", "system/task_notification", "result/success"]) {
      expect([...independent], `the fixture carries ${want}`).toContain(want);
    }
  });
});

// ── D-06: redaction over both home spellings; fails closed ─────────────────────────────────────

describe("D-06 redaction removes both home-directory spellings and secret-shaped values", () => {
  it("neither the plain nor the native-realpath spelling survives, in raw or JSON-escaped form; figures are preserved", () => {
    // The two spellings deliberately do NOT contain one another: a native form that carries the
    // plain form as a substring is redacted by the plain replacement alone, which hid a mutation
    // that dropped the native arm entirely. The survivor checks below are computed HERE, not by
    // the module's own `homeSpellingSurvivors`, so a mutation of the shared form authority cannot
    // blind both sides at once.
    const homes = { plain: "/home/alice", native: "/volumes/data/users/alice" };
    const forms = [homes.plain, homes.native, JSON.stringify(homes.plain).slice(1, -1), JSON.stringify(homes.native).slice(1, -1)];
    const input = [
      "path /home/alice/work and realpath /volumes/data/users/alice/work",
      JSON.stringify({ cwd: "/volumes/data/users/alice/repo", other: "/home/alice/x" }),
      '"total_cost_usd":0.4321,"duration_ms":18342',
      "api key sk-abcdefghijklmnopqrstuvwxyz0123456789 and Authorization: Bearer abc.def-ghi_jkl",
      '"session_token": "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"',
    ].join("\n");
    for (const form of [homes.plain, homes.native]) expect(input, "control: each spelling is present before redaction").toContain(form);
    expect(homeSpellingSurvivors(input, homes).length).toBeGreaterThan(0);
    const out = redactText(input, homes);
    for (const form of forms) expect(out, `the form ${JSON.stringify(form)} must not survive`).not.toContain(form);
    expect(homeSpellingSurvivors(out, homes)).toEqual([]);
    expect(out).toContain('"total_cost_usd":0.4321,"duration_ms":18342');
    expect(out).not.toContain("sk-abcdefghijklmnopqrstuvwxyz0123456789");
    expect(out).not.toContain("abc.def-ghi_jkl");
    expect(out).not.toContain("AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA");
    expect(out.split(REDACTION_PLACEHOLDER).length - 1).toBeGreaterThanOrEqual(5);
    // A Windows-shaped home (long form vs 8.3 short name — distinct strings, RESEARCH assumption A6)
    // is redacted in its JSON-escaped form too, which is the form a transcript carries.
    const win = { plain: "C:\\Users\\alice", native: "C:\\Users\\ALICE~1" };
    const winInput = JSON.stringify({ cwd: "C:\\Users\\alice\\repo", short: "C:\\Users\\ALICE~1\\repo" });
    const winOut = redactText(winInput, win);
    for (const form of [win.plain, win.native, JSON.stringify(win.plain).slice(1, -1), JSON.stringify(win.native).slice(1, -1)]) {
      expect(winOut, `the form ${JSON.stringify(form)} must not survive`).not.toContain(form);
    }
    expect(homeSpellingSurvivors(winOut, win)).toEqual([]);
  });
});

// ── D-04 / T-33-04: the child environment never carries the approval key ───────────────────────

describe("the constructed child environment does not define the prod-deploy approval key (T-33-04)", () => {
  it("the assertion reads the constructed env OBJECT: absent on this host's env, refused when a base carries it", () => {
    const env = childEnvironment(process.env, { GRUGOPS_HOME: "/tmp/x" });
    expect(Object.prototype.hasOwnProperty.call(env, PROD_DEPLOY_REASON_SIGNATURE)).toBe(false);
    expect(approvalKeyRefusals(env)).toEqual([]);
    expect(env.GRUGOPS_HOME).toBe("/tmp/x");
    // The converse, on a synthesized base — the refusal names the key and the reason.
    const poisoned = childEnvironment({ PATH: "/usr/bin", [PROD_DEPLOY_REASON_SIGNATURE]: "1" });
    const refusals = approvalKeyRefusals(poisoned);
    expect(refusals).toHaveLength(1);
    expect(refusals[0]).toContain(PROD_DEPLOY_REASON_SIGNATURE);
    expect(refusals[0]).toContain("never sets it");
  });

  it("the runner source contains no assignment of the key and no literal spelling of it", () => {
    const src = readFileSync(join(ROOT, "scripts", "capture-live.ts"), "utf8");
    expect(src.includes(PROD_DEPLOY_REASON_SIGNATURE), "the key is reached only through the imported PROD_DEPLOY_REASON_SIGNATURE").toBe(false);
  });
});

// ── D-10 / Task 3: the precondition evaluator, provable without a push ─────────────────────────

function observation(overrides: Partial<PreconditionObservation> = {}): PreconditionObservation {
  return {
    platformVersion: "2.1.278 (Claude Code)",
    helpText: REQUIRED_FLAGS.map((f) => `  ${f} <x>   description`).join("\n"),
    marketplaceListing: "Configured marketplaces:\n  grugops   Source: GitHub (abitwise/grugops)\n",
    pluginListing: "Installed plugins:\n  grugops@grugops 2.1.0\n",
    marketplaceName: "grugops",
    pluginName: "grugops",
    precheckExit: 0,
    precheckLastLine: "PRECONDITIONS HOLD: every observable precondition holds on this tree.",
    localHead: "a".repeat(40),
    remoteRef: "origin/main",
    remoteHead: "a".repeat(40),
    aheadCount: 0,
    approvalKeyPresent: false,
    ...overrides,
  };
}

describe("precondition evaluation is a derived verdict distinct from the exit code (D-10, Task 3)", () => {
  it("precondition: equal local and remote shas with every probe readable yields readiness `ready`", () => {
    const t = evaluatePreconditions(observation());
    expect(t.readiness).toBe("ready");
    expect(t.reasons).toEqual([]);
    expect(t.rows.every((r) => r.state === "MET")).toBe(true);
    expect(t.rows.filter((r) => r.name.startsWith("flag ")).map((r) => r.name)).toEqual(REQUIRED_FLAGS.map((f) => `flag ${f} in --help`));
  });

  it("precondition: a non-zero ahead count yields `not-ready` and the pushed-sha row states the ahead count", () => {
    const t = evaluatePreconditions(observation({ remoteHead: "b".repeat(40), aheadCount: 7 }));
    expect(t.readiness).toBe("not-ready");
    const row = t.rows.find((r) => r.name.startsWith("pushed sha"));
    expect(row?.state).toBe("UNMET");
    expect(row?.detail).toContain("7 commit(s) ahead of origin/main");
    expect(t.reasons.some((r) => r.includes("7 commit(s) ahead"))).toBe(true);
  });

  it("precondition: a missing flag yields UNMET naming the flag", () => {
    const missing = REQUIRED_FLAGS[0];
    const help = REQUIRED_FLAGS.filter((f) => f !== missing).map((f) => `  ${f} <x>`).join("\n");
    const t = evaluatePreconditions(observation({ helpText: help }));
    expect(t.readiness).toBe("not-ready");
    const row = t.rows.find((r) => r.name === `flag ${missing} in --help`);
    expect(row?.state).toBe("UNMET");
    expect(row?.detail).toContain(missing);
    expect(t.rows.filter((r) => r.state !== "MET")).toHaveLength(1);
  });

  it("precondition: an unreadable platform version is the three-state `UNKNOWN - verify` and readiness is not-ready without a claimed failure", () => {
    const t = evaluatePreconditions(observation({ platformVersion: null, helpText: null }));
    expect(t.readiness).toBe("not-ready");
    const version = t.rows.find((r) => r.name === "platform version readable");
    expect(version?.state).toBe("UNKNOWN - verify");
    expect(version?.detail).toContain("not a failure");
    // Every unreadable probe is UNKNOWN, none is UNMET: nothing was measured, so nothing failed.
    expect(t.rows.filter((r) => r.state === "UNMET")).toEqual([]);
    expect(t.rows.filter((r) => r.state === "UNKNOWN - verify").length).toBe(1 + REQUIRED_FLAGS.length);
  });

  it("precondition: a present approval key is UNMET and names the key; a failed precheck is UNMET with its last line", () => {
    const t = evaluatePreconditions(observation({ approvalKeyPresent: true, precheckExit: 1, precheckLastLine: "PRECONDITION FAILED: x" }));
    expect(t.readiness).toBe("not-ready");
    expect(t.rows.find((r) => r.name.includes("approval key"))?.state).toBe("UNMET");
    expect(t.rows.find((r) => r.name.includes("approval key"))?.detail).toContain(PROD_DEPLOY_REASON_SIGNATURE);
    expect(t.rows.find((r) => r.name.includes("precheck"))?.detail).toContain("PRECONDITION FAILED: x");
  });
});

// ── The end-to-end slice at zero tokens: --dry-run, then --verify-artifacts over its own output ──

describe("--dry-run walks every phase against the committed fixture and makes no model call (D-10)", () => {
  it("exits 0, prints GO-READINESS and the completion wording, writes exactly one outcome line reading no-go, and its artifacts re-check", () => {
    const out = mkdtempSync(join(tmpdir(), `${TMP_PREFIX}test-out-`));
    const before = new Set(readdirSync(tmpdir()).filter((n) => n.startsWith(TMP_PREFIX) && !n.startsWith(`${TMP_PREFIX}test-`)));
    const r = spawnSync("node", [join(ROOT, "scripts", "capture-live.js"), "--dry-run", "--out", out], { cwd: ROOT, encoding: "utf8", input: "", timeout: 300_000, env: childEnvironment(process.env) });
    expect(r.status, `stdout:\n${r.stdout}\nstderr:\n${r.stderr}`).toBe(0);
    expect(r.stdout).toContain(READINESS_PREFIX);
    expect(r.stdout.trim().endsWith(DRY_RUN_COMPLETE), "the last line states that no model call was made").toBe(true);
    const report = readFileSync(join(out, DRY_RUN_REPORT_NAME), "utf8");
    expect(report.match(OUTCOME_LINE_SCAN_RE)).toEqual(["OUTCOME: no-go"]);
    expect(report).toContain(READINESS_PREFIX);
    expect(report).not.toContain("PASSED");
    expect(existsSync(join(out, DRY_RUN_TRANSCRIPT_NAME))).toBe(true);
    expect(verifyArtifacts(out)).toEqual([]);
    // Every scratch target and kit home the run created was removed (hard rule 3).
    const after = readdirSync(tmpdir()).filter((n) => n.startsWith(TMP_PREFIX) && !n.startsWith(`${TMP_PREFIX}test-`) && !before.has(n));
    expect(after, "no scratch directory survives a default run").toEqual([]);
    rmSync(out, { recursive: true, force: true });
  }, 300_000);

  it("--verify-artifacts refuses a report whose outcome line is duplicated or whose claim row lost its citation", () => {
    const out = mkdtempSync(join(tmpdir(), `${TMP_PREFIX}test-bad-`));
    const r = spawnSync("node", [join(ROOT, "scripts", "capture-live.js"), "--dry-run", "--out", out], { cwd: ROOT, encoding: "utf8", input: "", timeout: 300_000, env: childEnvironment(process.env) });
    expect(r.status).toBe(0);
    const path = join(out, DRY_RUN_REPORT_NAME);
    const good = readFileSync(path, "utf8");
    expect(verifyArtifacts(out), "control: the untouched report is accepted").toEqual([]);
    writeFileSync(path, `${good}\nOUTCOME: pass\n`);
    expect(verifyArtifacts(out).some((x) => x.includes("2 outcome line(s)"))).toBe(true);
    writeFileSync(path, good.replace("| jsonl:1 |", "| (none) |"));
    expect(verifyArtifacts(out).some((x) => x.includes("carries no jsonl:<line> citation"))).toBe(true);
    rmSync(out, { recursive: true, force: true });
  }, 300_000);
});

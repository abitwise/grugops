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
import { appendFileSync, cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, sep } from "node:path";
import { prodDeployDenyFired, PROD_DEPLOY_REASON_SIGNATURE } from "./prod-deploy-deny-match.js";
import { admit, admittedGrantedNames } from "./canonical-frontmatter.js";
import { listAgentAdapters } from "./kit-model.js";
import { noteSeal, NOTE_SEAL_KEY } from "./context-io.js";
import {
  approvalKeyRefusals,
  authorStamps,
  capThreePredicate,
  childEnvironment,
  cleanupPlan,
  cleanupScratch,
  compareLivePaths,
  contentDigest,
  denyObservedInStream,
  denyObservation,
  deriveGrant,
  deriveOutcome,
  DRY_RUN_COMPLETE,
  DRY_RUN_REPORT_NAME,
  DRY_RUN_TRANSCRIPT_NAME,
  evaluatePreconditions,
  FIXTURE_JSONL,
  frameKinds,
  homeSpellingSurvivors,
  INSTALL_AND_PLUGIN_PATHS,
  installedPluginRow,
  installOutcome,
  isOutsideTargets,
  LIVE_OPS,
  liveAllowedTools,
  makeScratch,
  makeScratchTranscript,
  noteRoute,
  OUTCOME_LINE_SCAN_RE,
  parseArgs,
  parseFrames,
  pluginCachePathAccepted,
  pluginLoadReport,
  pluginUnderTest,
  projectLivePath,
  provenanceVerdict,
  readFrames,
  READINESS_PREFIX,
  redactText,
  REDACTION_PLACEHOLDER,
  renderReport,
  REQUIRED_FLAGS,
  runCommandBuffered,
  runTarget,
  spawnObservations,
  TMP_PREFIX,
  verifyArtifacts,
  workingTreeStatusArgs,
  type AuthorStamp,
  type LiveOps,
  type PlatformRunResult,
  type PreconditionObservation,
  type ProvenanceInputs,
  type ReportModel,
  type RunReport,
  type ScratchRegistry,
  type StreamFrame,
  type TargetBuild,
  type UninstallOutcome,
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
// `hour` moves every `at` stamp: two roots built with different hours carry the same notes at
// different times, which is the one axis a path-invariant projection must ignore (33-12, CR-03).
// RAW BYTES, SEALED THROUGH THE EXPORTED `noteSeal` (plan 33-25, KIT (b)). The bytes stay raw on
// purpose: this planter mirrors the shape of a note as it sits on disk — `by` values the writer's
// admission root would adjudicate, an `at` with milliseconds, a literal `supersedes: null` — so the
// author-stamp derivation is driven over the SHAPE and not over one writer configuration. What the
// reader now requires of that shape is the writer's seal, last inside the fence, so the planter
// composes the unsealed text, seals it through the one exported digest and inserts the line where
// `composeNote` puts it. `sealed = false` plants the pre-33-25 form — the `Write`-tool note of the
// held capture — which the reader must REFUSE (R2 below).
function contextRootWithNotes(notes: readonly { by: string; kind: string; body: string }[], hour = 10, sealed = true): string {
  const root = mkdtempSync(join(tmpdir(), `${TMP_PREFIX}test-ctx-`));
  const notesDir = join(root, "audit-current-architecture", "notes");
  mkdirSync(notesDir, { recursive: true });
  notes.forEach((n, i) => {
    const at = `2026-09-19T${String(hour).padStart(2, "0")}:0${i}:00.000Z`;
    const id = `${at.replace(/[-:]/g, "").replace(".000Z", "Z")}-${n.kind}-note${i}`;
    const fence = [`kind: ${n.kind}`, `by: ${n.by}`, `at: ${at}`, "verified_by: ", "confidence: medium", "refs:", "  - plans/tickets/AUDIT-1.md", "supersedes: null"];
    const rest = ["---", "", n.body, ""].join("\n");
    const unsealed = ["---", ...fence, rest].join("\n");
    const text = sealed ? ["---", ...fence, `${NOTE_SEAL_KEY}: ${noteSeal(unsealed)}`, rest].join("\n") : unsealed;
    writeFileSync(join(notesDir, `${id}.md`), text);
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
    workingTreeStatus: "",
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

  it("precondition: the runner has exactly ONE readiness derivation, exported, and phase 1 calls it", () => {
    const src = readFileSync(join(ROOT, "scripts", "capture-live.ts"), "utf8");
    const code = src.split("\n").filter((l) => !l.trimStart().startsWith("//") && !l.trimStart().startsWith("*"));
    // The derivation: exactly one line assigns the `readiness` field, and it sits inside the
    // exported evaluator. Every other mention of readiness is a READ of that field.
    const assignments = code.filter((l) => /\breadiness:\s*(?!"ready" \| "not-ready")/.test(l) && !/^\s*readiness: "ready" \| "not-ready";$/.test(l));
    expect(assignments, "one readiness derivation, no second spelling").toHaveLength(1);
    expect(assignments[0]).toContain('reasons.length === 0 ? "ready" : "not-ready"');
    expect(code.some((l) => l.startsWith("export function evaluatePreconditions("))).toBe(true);
    // The runner CALLS the evaluator at least once outside its own declaration.
    const calls = code.filter((l) => l.includes("evaluatePreconditions(") && !l.startsWith("export function evaluatePreconditions("));
    expect(calls.length, "phase 1 is observation plus a call to the evaluator").toBeGreaterThanOrEqual(1);
    // And the readiness line is derived from the table's field, never recomputed from the rows.
    expect(code.filter((l) => l.includes(`\${READINESS_PREFIX}`) || l.includes("READINESS_PREFIX}")).every((l) => l.includes("table.readiness") || l.includes("READINESS_PREFIX}ready") || l.includes("READINESS_PREFIX}not-ready"))).toBe(true);
  });

  it("precondition: the pushed-sha row states that the remote side is the remote-tracking ref as last fetched", () => {
    for (const t of [evaluatePreconditions(observation()), evaluatePreconditions(observation({ remoteHead: "b".repeat(40), aheadCount: 2 }))]) {
      expect(t.rows.find((r) => r.name.startsWith("pushed sha"))?.detail).toContain("as last fetched; no network was used");
    }
  });

  it("precondition: a present approval key is UNMET and names the key; a failed precheck is UNMET with its last line", () => {
    const t = evaluatePreconditions(observation({ approvalKeyPresent: true, precheckExit: 1, precheckLastLine: "PRECONDITION FAILED: x" }));
    expect(t.readiness).toBe("not-ready");
    expect(t.rows.find((r) => r.name.includes("approval key"))?.state).toBe("UNMET");
    expect(t.rows.find((r) => r.name.includes("approval key"))?.detail).toContain(PROD_DEPLOY_REASON_SIGNATURE);
    expect(t.rows.find((r) => r.name.includes("precheck"))?.detail).toContain("PRECONDITION FAILED: x");
  });
});

// ── D-07 / CR-03: the path-invariant projection, proven against the HELD round-1 capture ────────
//
// The round-1 capture (commit c7be6d0d) is immutable (D-11) and is read straight from that commit,
// never from the working tree, so a later edit to the filed artifacts cannot move these cases. A
// clone that cannot show the sha is a LOUD red naming it, not a skip.

const HELD_CAPTURE_SHA = "c7be6d0da19f0aa8d7554ac1591d5c4ce880b2ac";
const HELD_CAPTURE_DIR = ".planning/phases/33-live-capture-windows-portability";

function heldCapture(name: string): string {
  const r = spawnSync("git", ["show", `${HELD_CAPTURE_SHA}:${HELD_CAPTURE_DIR}/${name}`], { cwd: ROOT, encoding: "utf8", input: "", maxBuffer: 64 * 1024 * 1024 });
  if (r.error !== undefined || r.status !== 0 || typeof r.stdout !== "string" || r.stdout === "") {
    throw new Error(`git cannot show ${HELD_CAPTURE_SHA}:${HELD_CAPTURE_DIR}/${name} (exit ${String(r.status)}) — the held round-1 capture must be reachable from this clone: ${(r.stderr ?? "").trim()}`);
  }
  return r.stdout;
}

// The observation table is located by its HEADER ROW (the same rule `verifyArtifacts` uses — never
// by a markdown heading), and each `D-02 side (b) author stamp | KIND by BY | note:TASK/ID` row is
// parsed into an AuthorStamp with an empty body. The `verdict marker` row's word is read alongside.
function stampsFromSummary(text: string, run: "A" | "B"): { stamps: AuthorStamp[]; verdictWord: "absent" | "present" | null } {
  const lines = text.split(/\r?\n/);
  const cellsOf = (line: string): string[] => line.split("|").map((c) => c.trim()).slice(1, -1);
  const isSeparator = (line: string): boolean => line.startsWith("|") && cellsOf(line).length > 0 && cellsOf(line).every((c) => /^-+$/.test(c));
  const stamps: AuthorStamp[] = [];
  let verdictWord: "absent" | "present" | null = null;
  let inTable = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.startsWith("|")) {
      inTable = false;
      continue;
    }
    if (isSeparator(line)) continue;
    const body = cellsOf(line);
    if (isSeparator(lines[i + 1] ?? "")) {
      inTable = body[0] === `observation (run ${run})`;
      continue;
    }
    if (!inTable) continue;
    if (body[0] === "D-02 side (b) author stamp") {
      const value = body[1].match(/^(\S+) by (\S+)$/);
      const cite = body[2].match(/^note:([^/]+)\/(.+)$/);
      if (value === null || cite === null) throw new Error(`unparseable author-stamp row in the held summary: ${line}`);
      stamps.push({ task: cite[1], noteId: cite[2], kind: value[1], by: value[2], body: "" });
    } else if (body[0].startsWith("verdict marker ")) {
      verdictWord = body[1].startsWith("absent") ? "absent" : body[1].startsWith("present") ? "present" : null;
    }
  }
  return { stamps, verdictWord };
}

// An independent count of propose_note tool-use blocks over a transcript's TEXT, so the route
// derivation is asserted against something other than itself.
function proposeNoteBlocksInText(text: string): number {
  return (text.match(/"type":"tool_use","id":"[^"]+","name":"[^"]*propose_note"/g) ?? []).length;
}

function toolUseFrame(name: string, input: Record<string, unknown>): StreamFrame {
  return { type: "assistant", message: { content: [{ type: "tool_use", id: `toolu_${name}`, name, input }] } };
}

describe("D-07 parity is a path-invariant projection: per role the note count, kind multiset and author, the note route, and the frozen verdict (CR-03)", () => {
  const prefix = deriveGrant(ROOT).prefix;

  it("held capture (commit c7be6d0d): the projection still names the round-1 divergences by role, route and count — the predicate is corrected, not softened (D-20)", () => {
    const summary = heldCapture("33-CAPTURE-SUMMARY.md");
    const textA = heldCapture("33-CAPTURE-A.jsonl");
    const textB = heldCapture("33-CAPTURE-B.jsonl");
    const a = stampsFromSummary(summary, "A");
    const b = stampsFromSummary(summary, "B");
    const framesA = parseFrames(textA);
    const framesB = parseFrames(textB);
    // Premises first, so a wrong fixture is a named red rather than a mysterious diff list.
    expect(a.stamps, "run A carries 15 author-stamp rows").toHaveLength(15);
    expect(b.stamps, "run B carries 9 author-stamp rows").toHaveLength(9);
    expect(framesA.frames, "run A parses to 2079 frames").toHaveLength(2079);
    expect(framesB.frames, "run B parses to 1924 frames").toHaveLength(1924);
    expect(a.verdictWord).toBe("absent");
    expect(b.verdictWord).toBe("absent");
    expect(proposeNoteBlocksInText(textA), "independent count of propose_note blocks in A").toBe(3);
    expect(proposeNoteBlocksInText(textB), "independent count of propose_note blocks in B").toBe(0);

    const diffs = compareLivePaths(projectLivePath(a.stamps, framesA.frames, prefix), projectLivePath(b.stamps, framesB.frames, prefix));
    expect(diffs.length, "the held capture reads as DIVERGENT under the corrected predicate").toBeGreaterThan(0);
    for (const want of [
      "brownfield-mapper: note count differs: path A has 5, path B has 3",
      "architect-design: note count differs: path A has 4, path B has 3",
      "security-nfr: note count differs: path A has 4, path B has 3",
      "orchestrator: present only in path A (2 note(s))",
      "note route: direct writes into the context root differ: path A 0, path B 9",
      "note route: propose_note tool-use blocks differ: path A 3, path B 0",
    ]) {
      expect(diffs, `the diff list carries verbatim: ${want}`).toContain(want);
    }
    // Absent on both sides is parity on that field, so no entry mentions the marker.
    expect(diffs.filter((d) => d.includes("verdict marker")), "no verdict-marker entry when both sides are absent").toEqual([]);
  });

  it("parity: two roots carrying the same {by, kind} multiset per role but different `at` stamps and bodies project to an EMPTY diff list", () => {
    const notes = [
      { by: "grugops-orchestrator", kind: "decision", body: "Decomposed the request into three subtasks." },
      { by: "brownfield-mapper", kind: "observation", body: "Node 22 project, one entry point." },
      { by: "brownfield-mapper", kind: "claim", body: "All four gate scripts exit 0." },
      { by: "security-nfr", kind: "observation", body: "No secret-shaped literal in the tree." },
    ];
    const rootA = contextRootWithNotes(notes, 10);
    const rootB = contextRootWithNotes(notes.map((n) => ({ ...n, body: `${n.body} Stated differently on path B, at another time.` })), 14);
    const stampsA = authorStamps(rootA);
    const stampsB = authorStamps(rootB);
    // Control: the two roots really do differ on every axis the projection must ignore.
    expect(stampsA.map((s) => s.body)).not.toEqual(stampsB.map((s) => s.body));
    expect(stampsA.map((s) => s.noteId)).not.toEqual(stampsB.map((s) => s.noteId));
    expect(compareLivePaths(projectLivePath(stampsA, FIXTURE.frames, prefix), projectLivePath(stampsB, FIXTURE.frames, prefix))).toEqual([]);
  });

  it("kind multiset: the same roots with one note's kind changed on one side name that role and `kind multiset differs`", () => {
    const notes = [
      { by: "brownfield-mapper", kind: "observation", body: "x" },
      { by: "brownfield-mapper", kind: "claim", body: "y" },
      { by: "security-nfr", kind: "observation", body: "z" },
    ];
    const rootA = contextRootWithNotes(notes, 10);
    const rootB = contextRootWithNotes(notes.map((n, i) => (i === 1 ? { ...n, kind: "observation" } : n)), 11);
    const diffs = compareLivePaths(projectLivePath(authorStamps(rootA), FIXTURE.frames, prefix), projectLivePath(authorStamps(rootB), FIXTURE.frames, prefix));
    expect(diffs).toHaveLength(1);
    expect(diffs[0]).toContain("brownfield-mapper");
    expect(diffs[0]).toContain("kind multiset differs");
    expect(diffs[0]).toContain("[claim, observation]");
    expect(diffs[0]).toContain("[observation, observation]");
  });

  it("note route is derived from tool-use blocks only: the fixture's counts match an independent grep, and an in-memory Write/Edit under the context root moves the count by exactly one", () => {
    const base = noteRoute(FIXTURE.frames);
    expect(base).toEqual({ directContextWrites: 0, proposeNoteCalls: proposeNoteBlocksInText(FIXTURE_TEXT) });
    const under = "/tmp/target/.grugops/context/AUDIT-1/notes/20260920T115322Z-brownfield-mapper-observation-9ba9.md";
    expect(noteRoute([...FIXTURE.frames, toolUseFrame("Write", { file_path: under, content: "---\nkind: observation\n---\n" })]).directContextWrites).toBe(base.directContextWrites + 1);
    expect(noteRoute([...FIXTURE.frames, toolUseFrame("Edit", { file_path: under, old_string: "a", new_string: "b" })]).directContextWrites).toBe(base.directContextWrites + 1);
    expect(noteRoute([...FIXTURE.frames, toolUseFrame("Write", { file_path: "/tmp/target/src/index.mjs", content: "x" })]).directContextWrites).toBe(base.directContextWrites);
    // The plugin-spelled and the grant-spelled tool names both count; the match is on the suffix.
    for (const name of ["mcp__plugin_grugops_grugops__propose_note", "mcp__grugops__propose_note"]) {
      expect(noteRoute([...FIXTURE.frames, toolUseFrame(name, { task: "T", kind: "claim", by: "x" })]).proposeNoteCalls, name).toBe(base.proposeNoteCalls + 1);
    }
    // A tool_result carrying the same text is not a tool-use block and moves nothing.
    const resultOnly: StreamFrame = { type: "user", message: { content: [{ type: "tool_result", tool_use_id: "t", content: `Write ${under}` }] } };
    expect(noteRoute([...FIXTURE.frames, resultOnly])).toEqual(base);
  });

  it("outcome wiring: deriveOutcome reads parity and provenance; hang wins over everything", () => {
    expect(deriveOutcome({ hang: false, anyFailure: false, parityDiffs: ["x"], provenance: "MET" })).toBe("fail");
    expect(deriveOutcome({ hang: false, anyFailure: false, parityDiffs: [], provenance: "MET" })).toBe("pass");
    expect(deriveOutcome({ hang: false, anyFailure: true, parityDiffs: [], provenance: "MET" })).toBe("fail");
    expect(deriveOutcome({ hang: true, anyFailure: false, parityDiffs: [], provenance: "MET" })).toBe("hang");
    expect(deriveOutcome({ hang: true, anyFailure: true, parityDiffs: ["x"], provenance: "UNMET" })).toBe("hang");
  });
});

// ── CR-01: the scored transcript lives where the subject cannot write, proven through the run seam ─
//
// The attack 33-REVIEW CR-01 names: the model holds Write/Edit over its cwd, discovers the file it
// is scored from, and appends a `system/hook_response` frame whose decoded stdout carries a
// byte-perfect prod-deploy deny (or parent_tool_use_id frames that satisfy CAP-03 side (a)). The
// stream is sound because the platform emits it; the FILE is sound only if the subject has no path
// to it. So the location is a predicate decided on `relative()`, asserted at run time, and the
// planted-file case below proves a forged in-target file is never read.

function handBuiltTarget(label: "A" | "B"): TargetBuild {
  return {
    label,
    target: mkdtempSync(join(tmpdir(), `${TMP_PREFIX}test-target-${label}-`)),
    home: mkdtempSync(join(tmpdir(), `${TMP_PREFIX}test-home-${label}-`)),
    transcriptDir: mkdtempSync(join(tmpdir(), `${TMP_PREFIX}test-transcript-${label}-`)),
    installerLine: "(hand-built target for the run seam; no installer ran)",
  };
}

/**
 * The run-seam recorder. `streamText` is what the stand-in WRITES to the transcript path (the
 * operator's copy); `received` is what it RETURNS as the bytes the runner got on the child's stdout
 * pipe (CR-01 round 2) — defaulting to the same text, so the honest case has the two agree and a
 * case can make them disagree in either direction. `onRun` runs after the write and before the
 * return: the window in which a subject could touch the file.
 */
function recordingOps(streamText: string, onRun?: (transcriptPath: string, cwd: string) => void, received: string = streamText): LiveOps & { calls: { transcriptPath: string; cwd: string; args: readonly string[] }[] } {
  const calls: { transcriptPath: string; cwd: string; args: readonly string[] }[] = [];
  return {
    calls,
    pluginInstall: (target, pluginName, marketplaceName) => {
      // What the platform's install does that the runner reads back (WR-02): a local-scope registry
      // row for THIS target, pointing at the copy the platform would load — here the honest copy.
      PROVENANCE.install(target, PROVENANCE.honestCopy);
      return `recorded: install ${pluginName}@${marketplaceName} (no platform call)`;
    },
    pluginUninstall: (): UninstallOutcome => ({ status: 0, error: null, detail: "" }),
    runPlatform: async (args, cwd, _env, transcriptPath, _boundMs): Promise<PlatformRunResult> => {
      calls.push({ transcriptPath, cwd, args });
      writeFileSync(transcriptPath, streamText);
      onRun?.(transcriptPath, cwd);
      return { status: 0, signal: null, timedOut: false, escalated: false, durationMs: 1, error: null, stderrTail: "", transcriptText: received };
    },
  };
}

/** The writer-set idiom: a top-level function's text, from its declaration line to the first column-0 `}`. */
function functionText(src: string, declaration: string): string {
  const start = src.indexOf(`\n${declaration}`);
  if (start < 0) throw new Error(`declaration not found in the source: ${declaration}`);
  const end = src.indexOf("\n}\n", start);
  if (end < 0) throw new Error(`no column-0 closing brace after: ${declaration}`);
  return src.slice(start + 1, end + 2);
}

// ── WR-02: the provenance fixture — a scratch plugin cache root and registry, the checkout side over a SMALL tracked subset ──
//
// The live run digests the checkout's whole tracked list; the offline suite hands `runTarget` a
// three-file subset of it (the checkout side is computed ONCE and handed down, exactly as
// `capture()` does), so an honest copy is three files and a stale copy is one changed byte. The
// registry fixture mirrors the platform's own `installed_plugins.json` shape (version 2; rows keyed
// `NAME@MARKETPLACE` with scope, projectPath, installPath, version, installedAt, lastUpdated,
// gitCommitSha) — asserted here from THIS fixture, never read from the operator's file.
interface RegistryRow {
  scope: "user" | "project" | "local";
  projectPath?: string;
  installPath: string;
  version: string;
  installedAt: string;
  lastUpdated: string;
  gitCommitSha: string;
}
const HONEST_SHA = "f".repeat(40);
function provenanceFixture(): {
  inputs: ProvenanceInputs;
  cacheRoot: string;
  registryPath: string;
  tracked: string[];
  honestCopy: string;
  copyAt: (name: string, mutate?: (rel: string, bytes: Buffer) => Buffer) => string;
  writeRows: (rows: RegistryRow[]) => void;
  install: (target: string, installPath: string, extraRows?: RegistryRow[]) => void;
} {
  const scratch = mkdtempSync(join(tmpdir(), `${TMP_PREFIX}test-provenance-`));
  const cacheRoot = join(scratch, "plugins");
  mkdirSync(join(cacheRoot, "cache", "grugops", "grugops"), { recursive: true });
  const registryPath = join(cacheRoot, "installed_plugins.json");
  const tracked = ["AGENTS.md", ".claude-plugin/plugin.json", "scripts/capture-live.js"];
  for (const rel of tracked) if (!existsSync(join(ROOT, ...rel.split("/")))) throw new Error(`premise: ${rel} is not in the checkout`);
  const copyAt = (name: string, mutate?: (rel: string, bytes: Buffer) => Buffer): string => {
    const dir = join(cacheRoot, "cache", "grugops", "grugops", name);
    for (const rel of tracked) {
      const parts = rel.split("/");
      mkdirSync(join(dir, ...parts.slice(0, -1)), { recursive: true });
      const bytes = readFileSync(join(ROOT, ...parts));
      writeFileSync(join(dir, ...parts), mutate === undefined ? bytes : mutate(rel, bytes));
    }
    return dir;
  };
  const writeRows = (rows: RegistryRow[]): void => {
    writeFileSync(registryPath, JSON.stringify({ version: 2, plugins: { "grugops@grugops": rows } }, null, 2));
  };
  const install = (target: string, installPath: string, extraRows: RegistryRow[] = []): void => {
    const at = "2026-09-21T00:00:00.000Z";
    writeRows([...extraRows, { scope: "local", projectPath: target, installPath, version: "2.1.0", installedAt: at, lastUpdated: at, gitCommitSha: HONEST_SHA }]);
  };
  const honestCopy = copyAt("2.1.0");
  const inputs: ProvenanceInputs = { registryPath, cacheRoot, checkout: { tracked, digest: contentDigest(ROOT, tracked) } };
  return { inputs, cacheRoot, registryPath, tracked, honestCopy, copyAt, writeRows, install };
}
const PROVENANCE = provenanceFixture();

const RUN_SPEC = { request: "audit current architecture", allowedTools: ["Read"] as const, expectedGrant: null, agent: null, pluginName: "grugops", marketplaceName: "grugops", boundMs: 1000, provenance: PROVENANCE.inputs };

describe("CR-01: the scored transcript is streamed into a runner-owned scratch outside every target and outside the run's cwd", () => {
  it("isOutsideTargets decides containment on relative(), not on a string prefix: a sibling scratch is outside, an in-target path and a nested scratch are not", () => {
    const target = mkdtempSync(join(tmpdir(), `${TMP_PREFIX}test-target-`));
    const sibling = mkdtempSync(join(tmpdir(), `${TMP_PREFIX}test-transcript-`));
    expect(isOutsideTargets(join(sibling, "33-CAPTURE-A.jsonl"), [target])).toBe(true);
    expect(isOutsideTargets(join(target, "33-CAPTURE-A.jsonl"), [target])).toBe(false);
    const nested = mkdtempSync(join(target, `${TMP_PREFIX}transcript-A-`));
    expect(isOutsideTargets(join(nested, "33-CAPTURE-A.jsonl"), [target]), "a scratch nested inside the target is inside").toBe(false);
    expect(isOutsideTargets(target, [target]), "the target itself is not outside itself").toBe(false);
    // The string-prefix trap: a sibling whose name EXTENDS the target's name starts with the target's
    // spelling and is still outside it.
    const lookalike = `${target}-lookalike`;
    mkdirSync(lookalike, { recursive: true });
    expect(`${lookalike}/x`.startsWith(target), "control: the lookalike would fool a prefix test").toBe(true);
    expect(isOutsideTargets(join(lookalike, "33-CAPTURE-A.jsonl"), [target])).toBe(true);
    // Several roots: outside means outside EVERY root.
    expect(isOutsideTargets(join(sibling, "x"), [target, lookalike])).toBe(true);
    expect(isOutsideTargets(join(lookalike, "x"), [target, lookalike])).toBe(false);
    for (const d of [target, sibling, lookalike]) rmSync(d, { recursive: true, force: true });
  });

  it("run seam: runTarget hands the platform a transcript path outside build.target, outside the cwd, inside build.transcriptDir, and reports that same path", async () => {
    const build = handBuiltTarget("A");
    const ops = recordingOps(FIXTURE_TEXT);
    const report = await runTarget(build, RUN_SPEC, ops);
    expect(ops.calls).toHaveLength(1);
    const { transcriptPath, cwd } = ops.calls[0];
    expect(cwd).toBe(build.target);
    expect(isOutsideTargets(transcriptPath, [build.target])).toBe(true);
    expect(isOutsideTargets(transcriptPath, [cwd])).toBe(true);
    expect(isOutsideTargets(transcriptPath, [build.transcriptDir]), "inside the runner-owned transcript directory").toBe(false);
    expect(report.transcriptPath).toBe(transcriptPath);
    expect(report.transcriptText).toBe(FIXTURE_TEXT);
    expect(report.frames.frames).toHaveLength(FIXTURE.frames.length);
    expect(report.transcriptLocation.startsWith("runner-owned scratch")).toBe(true);
    for (const d of [build.target, build.home, build.transcriptDir]) rmSync(d, { recursive: true, force: true });
  });

  it("the attack is blind: a forged in-target 33-CAPTURE-A.jsonl carrying a system/hook_response prod-deploy deny frame is never read — the D-04 row reads no and denyObservedInStream is false", async () => {
    expect(PROD_DENY_LINE).toBeDefined();
    const withoutDeny = FIXTURE_LINES.filter((l) => l !== PROD_DENY_LINE).join("\n") + "\n";
    expect(denyObservedInStream(parseFrames(withoutDeny).frames), "control: the stream the platform writes carries no deny").toBe(false);
    const build = handBuiltTarget("A");
    const ops = recordingOps(withoutDeny, () => {
      // The subject, mid-run, plants the file at the OLD in-target location with the forged frame.
      writeFileSync(join(build.target, "33-CAPTURE-A.jsonl"), `${PROD_DENY_LINE as string}\n`);
    });
    const report = await runTarget(build, RUN_SPEC, ops);
    expect(existsSync(join(build.target, "33-CAPTURE-A.jsonl")), "control: the planted file exists when the report is derived").toBe(true);
    expect(denyObservedInStream(parseFrames(readFileSync(join(build.target, "33-CAPTURE-A.jsonl"), "utf8")).frames), "control: the planted file WOULD score as a deny if it were read").toBe(true);
    expect(denyObservedInStream(report.frames.frames)).toBe(false);
    const d04 = report.claims.find((c) => c.label.startsWith("D-04 prod-deploy deny observed"));
    expect(d04?.value.startsWith("no")).toBe(true);
    expect(report.transcriptPath).not.toBe(join(build.target, "33-CAPTURE-A.jsonl"));
    for (const d of [build.target, build.home, build.transcriptDir]) rmSync(d, { recursive: true, force: true });
  });

  it("the real LIVE_OPS seam is bound to functions, and the in-target transcript location is gone from the source", () => {
    expect(typeof LIVE_OPS.runPlatform).toBe("function");
    expect(typeof LIVE_OPS.pluginInstall).toBe("function");
    expect(typeof LIVE_OPS.pluginUninstall).toBe("function");
    const src = readFileSync(join(ROOT, "scripts", "capture-live.ts"), "utf8");
    expect(src.includes("join(build.target, transcriptName)"), "the in-target transcript location no longer exists in the source").toBe(false);
    expect(src.includes("join(build.transcriptDir, captureTranscriptName(")).toBe(true);
  });
});

// ── CR-01 round 2 (33-REVIEW): the verdict is scored from the PIPE; the file is a copy ──────────
//
// Round 1 moved the transcript out of the subject's cwd; the round-2 review showed the subject still
// held unscoped tools and that three verdict inputs were re-read from disk AFTER it ran — the file
// among them, one `appendFileSync` away. The channel is now literally the bytes the runner received
// on the child's stdout pipe: `runPlatform` buffers every chunk it also streams to the file and
// resolves with `transcriptText`; `runTarget` scores `parseFrames(result.transcriptText)` and never
// opens the transcript path again. The file is written for the operator and the diagnosis. The
// cases below plant the review's attack at the NEW location (C1), prove the converse (C2), keep the
// operator's copy honest (C3), drive the REAL buffering seam with a node child (C3b), and assert on
// the source that no re-read survives inside `runTarget` (C4).

describe("CR-01 round 2: the verdict is scored from the bytes the runner received on the pipe; the transcript file is a copy the subject cannot use", () => {
  const withoutDenyText = (): string => FIXTURE_LINES.filter((l) => l !== PROD_DENY_LINE).join("\n") + "\n";

  it("Test C1 (the review's attack at the NEW location): a forged prod-deploy deny frame appended to the transcript FILE during the run is blind — the D-04 row reads no and the received-bytes frame count is what is scored", async () => {
    expect(PROD_DENY_LINE).toBeDefined();
    const withoutDeny = withoutDenyText();
    const received = parseFrames(withoutDeny);
    expect(denyObservedInStream(received.frames), "control: the received stream carries no deny").toBe(false);
    const build = handBuiltTarget("A");
    const ops = recordingOps(withoutDeny, (transcriptPath) => {
      // The subject, mid-run, appends the forged frame to the very file the runner streams into.
      appendFileSync(transcriptPath, `${PROD_DENY_LINE as string}\n`);
    });
    const report = await runTarget(build, RUN_SPEC, ops);
    const onDisk = parseFrames(readFileSync(report.transcriptPath, "utf8"));
    expect(denyObservedInStream(onDisk.frames), "control: the FILE would score as a deny if it were read").toBe(true);
    expect(onDisk.frames.length, "control: the file carries exactly one frame more than the pipe did").toBe(received.frames.length + 1);
    expect(denyObservedInStream(report.frames.frames), "the forged frame in the file is not scored").toBe(false);
    expect(report.frames.frames.length).toBe(received.frames.length);
    expect(report.frames.frames.length).toBe(FIXTURE.frames.length - 1);
    const d04 = report.claims.find((c) => c.label.startsWith("D-04 prod-deploy deny observed"));
    expect(d04?.value.startsWith("no")).toBe(true);
    for (const d of [build.target, build.home, build.transcriptDir]) rmSync(d, { recursive: true, force: true });
  });

  it("Test C2 (converse — the pipe IS the channel): the same forged frame delivered IN the received bytes and absent from the file is scored — the D-04 row reads yes and cites the received line", async () => {
    expect(PROD_DENY_LINE).toBeDefined();
    const withoutDeny = withoutDenyText();
    const receivedText = `${withoutDeny}${PROD_DENY_LINE as string}\n`;
    const build = handBuiltTarget("A");
    const ops = recordingOps(withoutDeny, undefined, receivedText);
    const report = await runTarget(build, RUN_SPEC, ops);
    expect(denyObservedInStream(parseFrames(readFileSync(report.transcriptPath, "utf8")).frames), "control: the file carries no deny").toBe(false);
    expect(denyObservedInStream(report.frames.frames)).toBe(true);
    const d04 = report.claims.find((c) => c.label.startsWith("D-04 prod-deploy deny observed"));
    expect(d04?.value.startsWith("yes")).toBe(true);
    expect(d04?.line, "the citation is the last line of the received bytes").toBe(parseFrames(receivedText).lineCount);
    expect(report.transcriptText).toBe(receivedText);
    for (const d of [build.target, build.home, build.transcriptDir]) rmSync(d, { recursive: true, force: true });
  });

  it("Test C3: the operator's copy is faithful in the honest case (file == received bytes), and TargetRun.transcriptText is the received bytes even when the file diverges — never a re-read", async () => {
    const honest = handBuiltTarget("A");
    const honestOps = recordingOps(FIXTURE_TEXT);
    const honestReport = await runTarget(honest, RUN_SPEC, honestOps);
    expect(honestReport.transcriptText).toBe(FIXTURE_TEXT);
    expect(readFileSync(honestReport.transcriptPath, "utf8")).toBe(honestReport.transcriptText);
    for (const d of [honest.target, honest.home, honest.transcriptDir]) rmSync(d, { recursive: true, force: true });

    const forgedLine = JSON.stringify({ type: "system", subtype: "forged", note: "planted in the file after the pipe closed" });
    const divergent = handBuiltTarget("B");
    const divergentOps = recordingOps(FIXTURE_TEXT, (transcriptPath) => appendFileSync(transcriptPath, `${forgedLine}\n`));
    const divergentReport = await runTarget(divergent, RUN_SPEC, divergentOps);
    expect(readFileSync(divergentReport.transcriptPath, "utf8"), "control: the file diverged").toBe(`${FIXTURE_TEXT}${forgedLine}\n`);
    expect(divergentReport.transcriptText, "the report carries the received bytes, not the file").toBe(FIXTURE_TEXT);
    expect(divergentReport.frames.frames.length).toBe(FIXTURE.frames.length);
    expect(divergentReport.frames.frames.some((f) => f.subtype === "forged")).toBe(false);
    for (const d of [divergent.target, divergent.home, divergent.transcriptDir]) rmSync(d, { recursive: true, force: true });
  });

  it("Test C3b (the REAL buffering seam, driven by a node child): transcriptText is the concatenation of every stdout chunk, byte-equal to the file; a run cut at the bound still carries the bytes received before the cut", async () => {
    const dir = mkdtempSync(join(tmpdir(), `${TMP_PREFIX}test-pipe-`));
    const transcriptPath = join(dir, "33-CAPTURE-A.jsonl");
    // Three chunks, written across two ticks, plus stderr noise: the pipe must reassemble them in order.
    const lines = FIXTURE_LINES.slice(0, 3);
    const script = [
      `const L = ${JSON.stringify(lines)};`,
      `process.stdout.write(L[0] + "\\n");`,
      `process.stderr.write("noise\\n");`,
      `setTimeout(() => { process.stdout.write(L[1] + "\\n"); setTimeout(() => { process.stdout.write(L[2] + "\\n"); }, 20); }, 20);`,
    ].join("\n");
    const r = await runCommandBuffered(process.execPath, ["-e", script], dir, childEnvironment(process.env), transcriptPath, 20_000);
    expect(r.status).toBe(0);
    expect(r.timedOut).toBe(false);
    expect(r.transcriptText).toBe(`${lines.join("\n")}\n`);
    expect(readFileSync(transcriptPath, "utf8")).toBe(r.transcriptText);
    expect(parseFrames(r.transcriptText).frames.length).toBe(3);
    expect(r.stderrTail).toContain("noise");

    // Cut at the bound: two lines arrive, then the child sleeps past the bound and is stopped.
    const cutPath = join(dir, "33-CAPTURE-B.jsonl");
    const cutScript = `process.stdout.write(${JSON.stringify(lines[0])} + "\\n" + ${JSON.stringify(lines[1])} + "\\n"); setTimeout(() => {}, 60_000);`;
    const cut = await runCommandBuffered(process.execPath, ["-e", cutScript], dir, childEnvironment(process.env), cutPath, 400);
    expect(cut.timedOut).toBe(true);
    expect(cut.status === 0, "a run stopped at the bound did not exit 0").toBe(false);
    expect(cut.transcriptText).toBe(`${lines[0]}\n${lines[1]}\n`);
    expect(readFileSync(cutPath, "utf8")).toBe(cut.transcriptText);
    rmSync(dir, { recursive: true, force: true });
  }, 30_000);

  it("Test C4 (writer-set idiom): the body of runTarget contains no readFrames call and no readFileSync of the transcript path; the two legitimate file readers (dryRun over the fixture, verifyArtifacts over the artifact set) still read", () => {
    const src = readFileSync(join(ROOT, "scripts", "capture-live.ts"), "utf8");
    const runTargetText = functionText(src, "export async function runTarget(");
    expect(runTargetText.includes("readFrames("), "runTarget must not re-read the transcript through readFrames").toBe(false);
    expect(runTargetText.includes("readFileSync(transcriptPath"), "runTarget must not re-read the transcript file").toBe(false);
    expect(runTargetText.includes("parseFrames(result.transcriptText)"), "runTarget scores the received bytes").toBe(true);
    expect(functionText(src, "async function dryRun(").includes("readFrames(FIXTURE_JSONL)"), "the dry run still reads the committed fixture").toBe(true);
    expect(functionText(src, "export function verifyArtifacts(").includes("readFileSync("), "--verify-artifacts still reads the artifact set").toBe(true);
    expect(src.includes("readFileSync(transcriptPath"), "no reader of the transcript path survives anywhere in the module").toBe(false);
  });
});

// ── CR-01 round 2, items 2 and 3: the grant is fixed BEFORE the subject exists, and is scoped ──
//
// The CAP-03 grant was derived from `.claude/agents/*.md` AFTER the run — files the subject held
// `Edit` over — so a role it was never granted could be made a member by editing the adapter it was
// being scored against. `runTarget` now derives the grant before `ops.runPlatform`, scores against
// that value, re-derives once afterwards and folds any difference on the four derived fields into
// `failed` with a Run-table row naming the fields (never the adapter text). `capture()` hands each
// run the grant it derived from target A before the loop, and a target whose pre-spawn derivation
// differs is refused before any token. The `--allowedTools` list is `liveAllowedTools(target)`: one
// scoped `Edit(//ABS/**)` rule in the platform's absolute form, no bare `Write` or `Edit`, the
// admission tool spelled as the platform exposes it (held init frame A:11), `Bash(node *)` kept by
// recorded reason, and the whole list printed as a per-run Run-table row.

/** A hand-built target carrying the checkout's installed adapters, so `deriveGrant` has a census to read. */
function installedTarget(label: "A" | "B"): TargetBuild {
  const build = handBuiltTarget(label);
  cpSync(join(ROOT, ".claude", "agents"), join(build.target, ".claude", "agents"), { recursive: true });
  return build;
}

/** The four derived fields of a grant, in one comparable string. */
function grantKey(g: { granted: string[]; coordinator: string | null; prefix: string; adapterNames: string[] }): string {
  return JSON.stringify({ granted: g.granted, coordinator: g.coordinator, prefix: g.prefix, adapterNames: g.adapterNames });
}

/** A minimal report model around the given runs, so a Run-table row can be asserted on rendered text. */
function reportModelWith(runs: RunReport[]): ReportModel {
  return {
    mode: "capture",
    generatedAt: "2026-09-21T00:00:00.000Z",
    checkoutSha: "0".repeat(40),
    platformVersion: "2.1.278 (Claude Code)",
    boundMs: 1000,
    boundUsed: "1000 ms per call",
    approvalKeyLine: "absent",
    provenance: { state: "UNKNOWN - verify", detail: "no init frame in this model", checkoutDigest: null, installedDigest: null, trackedCount: 0, pluginLine: "(none)" },
    preconditions: evaluatePreconditions(observation()),
    targets: runs.map((r) => ({ label: r.label, installerLine: "(hand-built)" })),
    runs,
    parity: { projections: [], diffs: [] },
    equivalenceDiffs: [],
    outcome: "fail",
    outcomeReason: "model built by the offline suite",
  };
}

describe("CR-01 round 2: the spawn grant is fixed before the subject exists, drift fails the run, and the tool grant is scoped to the target in the platform's own rule form", () => {
  const INJECTED = "grugops-not-a-role";

  it("Test C5 (the review's attack 2): an adapter edited DURING the run does not reach the CAP-03 grant — the pre-spawn derivation scores, the injected role is named outside the grant, the drift is named by field in a Run-table row and the run is failed", async () => {
    const build = installedTarget("A");
    const preSpawn = deriveGrant(build.target);
    expect(preSpawn.reasons, "premise: the installed census and the coordinator grant agree").toEqual([]);
    expect(preSpawn.granted.includes(INJECTED)).toBe(false);
    const stream = FIXTURE_TEXT.split("grugops-security-nfr").join(INJECTED);
    const agentsDir = join(build.target, ".claude", "agents");
    const coordinatorPath = join(agentsDir, "grugops-orchestrator.md");
    const ops = recordingOps(stream, () => {
      // The subject, mid-run, widens its own grant: the injected name joins the coordinator's
      // Agent(...) list and an adapter is planted for it, so the edited tree is self-consistent.
      const text = readFileSync(coordinatorPath, "utf8");
      const widened = text.replace("grugops-uat-planner)", `grugops-uat-planner, ${INJECTED})`);
      expect(widened, "premise: the coordinator's list was widened").not.toBe(text);
      writeFileSync(coordinatorPath, widened);
      writeFileSync(join(agentsDir, `${INJECTED}.md`), readFileSync(join(agentsDir, "grugops-security-nfr.md"), "utf8").replace("name: grugops-security-nfr", `name: ${INJECTED}`));
    });
    const report = await runTarget(build, RUN_SPEC, ops);
    const postRun = deriveGrant(build.target);
    expect(postRun.granted.includes(INJECTED), "control: the edited tree WOULD grant the injected role").toBe(true);
    expect(postRun.reasons, "control: the edit is self-consistent — census still equals grant + 1").toEqual([]);
    expect(report.capThreeReasons.some((r) => r.includes(INJECTED) && r.includes("not a member of the derived grant")), `side (a) was scored against the PRE-spawn grant; reasons: ${report.capThreeReasons.join(" / ")}`).toBe(true);
    expect(grantKey(report.grant)).toBe(grantKey(preSpawn));
    expect(report.grantDrift).toEqual(["adapterNames", "granted"]);
    expect(report.failed).toBe(true);
    const rendered = renderReport(reportModelWith([report]));
    expect(rendered).toContain("| run A spawn grant drift | field(s) changed after the spawn: adapterNames, granted — the run is failed |");
    const driftRow = rendered.split("\n").find((l) => l.startsWith("| run A spawn grant drift |")) ?? "";
    expect(driftRow.includes("Agent("), "the row names fields, never the adapter text").toBe(false);
    for (const d of [build.target, build.home, build.transcriptDir]) rmSync(d, { recursive: true, force: true });
  });

  it("Test C6 (the grant is one derivation): a target whose pre-spawn derivation equals the expected grant runs and reports no drift; a target whose adapters differ at build time is refused BEFORE any spawn — the recorder was called 0 times; capture() hands grantSource as the expected grant", async () => {
    const a = installedTarget("A");
    const b = installedTarget("B");
    const grantSource = deriveGrant(a.target);
    expect(grantSource.reasons).toEqual([]);
    const honest = recordingOps(FIXTURE_TEXT);
    const report = await runTarget(b, { ...RUN_SPEC, expectedGrant: grantSource }, honest);
    expect(honest.calls).toHaveLength(1);
    expect(grantKey(report.grant)).toBe(grantKey(grantSource));
    expect(report.grantDrift).toEqual([]);
    // Target B's adapters now differ from A's at build time: one more adapter, so the census moves.
    writeFileSync(join(b.target, ".claude", "agents", `${INJECTED}.md`), readFileSync(join(b.target, ".claude", "agents", "grugops-security-nfr.md"), "utf8").replace("name: grugops-security-nfr", `name: ${INJECTED}`));
    expect(grantKey(deriveGrant(b.target)), "premise: the two derivations differ").not.toBe(grantKey(grantSource));
    const refusing = recordingOps(FIXTURE_TEXT);
    await expect(runTarget(b, { ...RUN_SPEC, expectedGrant: grantSource }, refusing)).rejects.toThrow(/target B: the pre-spawn grant derivation differs from the expected grant on adapterNames — refusing to spawn/);
    expect(refusing.calls, "no platform child was launched for a target whose grant is not the expected one").toHaveLength(0);
    const src = readFileSync(join(ROOT, "scripts", "capture-live.ts"), "utf8");
    expect(functionText(src, "async function capture(").includes("expectedGrant: grantSource,"), "capture() hands the pre-loop derivation to every run").toBe(true);
    for (const d of [a.target, a.home, a.transcriptDir, b.target, b.home, b.transcriptDir]) rmSync(d, { recursive: true, force: true });
  });

  it("Test C7 (the scoped grant, form-checked): no bare Write or Edit; exactly one Edit(//ABS/**) rule naming the target's real path; Bash(node *) and Bash(helm upgrade *) kept; the admission tool spelled as the held init frame A:11 exposes it; the argv carries exactly that list after --allowedTools", async () => {
    const build = handBuiltTarget("A");
    const grant = liveAllowedTools(build.target);
    expect(grant).toHaveLength(8);
    expect(grant.includes("Write"), "no unscoped Write").toBe(false);
    expect(grant.includes("Edit"), "no unscoped Edit").toBe(false);
    expect(grant.some((x) => /^Write\(/.test(x)), "a Write(path) rule is never matched by the platform, so none is written").toBe(false);
    const scoped = grant.filter((x) => /^Edit\(\/\/.+\/\*\*\)$/.test(x));
    expect(scoped).toHaveLength(1);
    const real = realpathSync.native(build.target);
    const anchored = scoped[0].slice("Edit(//".length, -"/**)".length);
    expect(`/${anchored}`, "with the leading // removed, the rule names the target's REAL path").toBe(real.split(sep).join("/"));
    expect(grant).toContain("Bash(node *)");
    expect(grant).toContain("Bash(helm upgrade *)");
    const mcp = grant.filter((x) => x.startsWith("mcp__"));
    expect(mcp).toHaveLength(1);
    // The admission spelling is DERIVED from the held init frame (A:11), never typed here.
    const init = JSON.parse(heldCapture("33-CAPTURE-A.jsonl").split("\n")[10]) as { type: string; subtype: string; tools: string[] };
    expect(init.type).toBe("system");
    expect(init.subtype).toBe("init");
    const exposed = init.tools.filter((t) => t.startsWith("mcp__plugin_grugops_grugops__"));
    expect(exposed).toHaveLength(1);
    expect(mcp[0]).toBe(exposed[0]);
    expect(grant.includes("mcp__grugops__propose_note"), "the bare spelling is gone").toBe(false);
    // And it is the name the checkout's coordinator adapter carries since 33-28 (second derivation).
    expect(readFileSync(ORCHESTRATOR_ADAPTER, "utf8").split("\n").find((l) => l.startsWith("tools:"))?.endsWith(`, ${exposed[0]}`)).toBe(true);
    for (const entry of grant) expect(entry, "every entry is a bare tool, a Bash(...) rule, the one Edit(//...) rule or the mcp name").toMatch(/^([A-Z][A-Za-z]+|Bash\([^()]+\)|Edit\(\/\/.+\/\*\*\)|mcp__[a-z_]+)$/);
    const ops = recordingOps(FIXTURE_TEXT);
    const report = await runTarget(build, { ...RUN_SPEC, allowedTools: grant }, ops);
    const args = ops.calls[0].args;
    const at = args.indexOf("--allowedTools");
    expect(at).toBeGreaterThan(0);
    const after = args.slice(at + 1);
    const stop = after.indexOf("--agent");
    expect(stop === -1 ? after : after.slice(0, stop)).toEqual(grant);
    expect([...report.toolGrant]).toEqual(grant);
    const src = readFileSync(join(ROOT, "scripts", "capture-live.ts"), "utf8");
    expect(functionText(src, "async function capture(").includes("allowedTools: liveAllowedTools(build.target),"), "capture() resolves the grant per target").toBe(true);
    expect(src.includes("const LIVE_ALLOWED_TOOLS"), "the unscoped literal list is gone").toBe(false);
    for (const d of [build.target, build.home, build.transcriptDir]) rmSync(d, { recursive: true, force: true });
  });

  it("Test C8 (the report says the grant): the Run table carries `| run X tool grant | RESOLVED_LIST |` per run, and the readiness table carries no row that could be MET without the target existing", async () => {
    const build = handBuiltTarget("A");
    const grant = liveAllowedTools(build.target);
    const ops = recordingOps(FIXTURE_TEXT);
    const report = await runTarget(build, { ...RUN_SPEC, allowedTools: grant }, ops);
    const rendered = renderReport(reportModelWith([report]));
    expect(rendered).toContain(`| run A tool grant | ${JSON.stringify(grant)} |`);
    expect(rendered).toContain("| run A spawn grant drift | none — the post-run derivation equals the pre-spawn derivation on granted, adapterNames, coordinator and prefix |");
    const table = evaluatePreconditions(observation());
    expect(table.rows.some((r) => /grant/i.test(r.name)), "the grant is a per-run row, not a precondition").toBe(false);
    for (const d of [build.target, build.home, build.transcriptDir]) rmSync(d, { recursive: true, force: true });
  });
});

// ── WR-06: containment is refused before anything is installed; the uninstall runs on every exit ──
//
// `ops.pluginInstall` writes a local-scope row into the operator's plugin registry — state outside
// any directory the runner created (hard rule 3). Round 2 called it FIRST and asserted containment
// after; every throw between the spawn and the return skipped the uninstall, and `cleanupScratch`
// then removed the target the row pointed at (deferred-items: two such `grugops@grugops` rows at
// `0.1.0` outlive their temp targets today). Now the two pure `isOutsideTargets` refusals come
// first, the install second, and the spawn and derivation run inside `try { } finally { uninstall }`.
// The uninstall's exit is RETURNED and printed as a Run-table row, never swallowed: a cleanup that
// failed is named beside the paid result it did not mask.

/** A recorder whose install and uninstall are counted, and whose uninstall reports a canned outcome. */
function countingOps(streamText: string, uninstallOutcome: UninstallOutcome = { status: 0, error: null, detail: "" }): ReturnType<typeof recordingOps> & { installs: () => number; uninstalls: () => number } {
  const ops = recordingOps(streamText);
  let installs = 0;
  let uninstalls = 0;
  ops.pluginInstall = (target, pluginName, marketplaceName) => {
    installs += 1;
    PROVENANCE.install(target, PROVENANCE.honestCopy);
    return `recorded: install ${pluginName}@${marketplaceName} (no platform call)`;
  };
  ops.pluginUninstall = () => {
    uninstalls += 1;
    return uninstallOutcome;
  };
  return Object.assign(ops, { installs: () => installs, uninstalls: () => uninstalls });
}

describe("WR-06: containment is refused before anything is installed, and the uninstall runs on every exit path with its exit recorded", () => {
  it("Test C9: a transcript directory planted INSIDE the target is refused by runTarget BEFORE ops.pluginInstall is called — the install recorder's count is 0", async () => {
    const build = handBuiltTarget("A");
    const planted: TargetBuild = { ...build, transcriptDir: mkdtempSync(join(build.target, `${TMP_PREFIX}transcript-A-`)) };
    expect(isOutsideTargets(join(planted.transcriptDir, "33-CAPTURE-A.jsonl"), [planted.target]), "premise: the planted directory is inside the target").toBe(false);
    const ops = countingOps(FIXTURE_TEXT);
    await expect(runTarget(planted, RUN_SPEC, ops)).rejects.toThrow(/is inside target A or its kit home .* refusing to spawn/);
    expect(ops.installs(), "nothing was installed for a run that was never going to spawn").toBe(0);
    expect(ops.calls, "no platform child was launched").toHaveLength(0);
    expect(ops.uninstalls(), "and nothing is uninstalled that was never installed").toBe(0);
    for (const d of [build.target, build.home, build.transcriptDir]) rmSync(d, { recursive: true, force: true });
  });

  it("Test C10: a platform run that throws after the install, and a derivation that throws after the run, both reject runTarget AND uninstall exactly once", async () => {
    // Arm 1: the platform stand-in throws after the install completed.
    const a = handBuiltTarget("A");
    const throwing = countingOps(FIXTURE_TEXT);
    throwing.runPlatform = async () => {
      throw new Error("the platform child could not be spawned (stand-in)");
    };
    await expect(runTarget(a, RUN_SPEC, throwing)).rejects.toThrow(/could not be spawned \(stand-in\)/);
    expect(throwing.installs()).toBe(1);
    expect(throwing.uninstalls(), "the uninstall ran although the spawn threw").toBe(1);
    for (const d of [a.target, a.home, a.transcriptDir]) rmSync(d, { recursive: true, force: true });

    // Arm 2: the derivation throws — the context root is planted as a regular FILE, so authorStamps
    // cannot read it as a directory.
    const b = handBuiltTarget("B");
    mkdirSync(join(b.target, ".grugops"), { recursive: true });
    writeFileSync(join(b.target, ".grugops", "context"), "not a directory");
    const deriving = countingOps(FIXTURE_TEXT);
    await expect(runTarget(b, RUN_SPEC, deriving)).rejects.toThrow(/ENOTDIR|not a directory/);
    expect(deriving.calls, "the platform ran before the derivation threw").toHaveLength(1);
    expect(deriving.uninstalls(), "the uninstall ran although the derivation threw").toBe(1);
    for (const d of [b.target, b.home, b.transcriptDir]) rmSync(d, { recursive: true, force: true });
  });

  it("Test C11: the uninstall's exit is recorded, never swallowed — `| run X plugin uninstall | exit 0 |` in the honest case, a non-zero exit or a spawn error named otherwise, and a failed uninstall never masks the run's own result", async () => {
    const honest = handBuiltTarget("A");
    const ok = countingOps(FIXTURE_TEXT);
    const okReport = await runTarget(honest, RUN_SPEC, ok);
    expect(ok.uninstalls()).toBe(1);
    expect(okReport.uninstall).toEqual({ status: 0, error: null, detail: "" });
    expect(renderReport(reportModelWith([okReport]))).toContain("| run A plugin uninstall | exit 0 |");
    for (const d of [honest.target, honest.home, honest.transcriptDir]) rmSync(d, { recursive: true, force: true });

    const nonZero = handBuiltTarget("B");
    const failing = countingOps(FIXTURE_TEXT, { status: 1, error: null, detail: "Plugin grugops is not installed at local scope" });
    const failingReport = await runTarget(nonZero, RUN_SPEC, failing);
    expect(failingReport.uninstall?.status).toBe(1);
    expect(failingReport.transcriptText, "the run's own result is still returned").toBe(FIXTURE_TEXT);
    expect(renderReport(reportModelWith([failingReport]))).toContain("| run B plugin uninstall | exit 1 — Plugin grugops is not installed at local scope |");
    for (const d of [nonZero.target, nonZero.home, nonZero.transcriptDir]) rmSync(d, { recursive: true, force: true });

    const unstartable = handBuiltTarget("A");
    const erroring = countingOps(FIXTURE_TEXT, { status: null, error: "spawn claude ENOENT", detail: "" });
    const erroringReport = await runTarget(unstartable, RUN_SPEC, erroring);
    expect(erroringReport.uninstall?.error).toBe("spawn claude ENOENT");
    expect(renderReport(reportModelWith([erroringReport]))).toContain("| run A plugin uninstall | error: spawn claude ENOENT |");
    for (const d of [unstartable.target, unstartable.home, unstartable.transcriptDir]) rmSync(d, { recursive: true, force: true });

    // The real pluginUninstall returns its outcome (it is never invoked here — it would touch the
    // operator's plugin registry); its text is asserted instead: it returns the platform's status
    // and the spawn error's message, and no bare catch swallows the result into undefined.
    const src = readFileSync(join(ROOT, "scripts", "capture-live.ts"), "utf8");
    const text = functionText(src, "function pluginUninstall(");
    expect(text.startsWith("function pluginUninstall(target: string, pluginName: string): UninstallOutcome {")).toBe(true);
    expect(text).toContain("return { status: r.status, error: r.error");
    expect(text.includes("/* best-effort: cleanup failure never masks a result */"), "the swallowing catch is gone").toBe(false);
    // And runTarget's order: the two containment refusals, then the install, then a finally.
    const rt = functionText(src, "export async function runTarget(");
    const at = (needle: string): number => rt.indexOf(needle);
    const firstRefusal = at("isOutsideTargets(");
    const secondRefusal = rt.indexOf("isOutsideTargets(", firstRefusal + 1);
    expect(firstRefusal).toBeGreaterThan(0);
    expect(secondRefusal).toBeGreaterThan(firstRefusal);
    expect(at("ops.pluginInstall(")).toBeGreaterThan(secondRefusal);
    expect(at("} finally {")).toBeGreaterThan(at("ops.pluginInstall("));
    expect(rt.indexOf("ops.pluginUninstall("), "the uninstall is inside the finally").toBeGreaterThan(at("} finally {"));
    expect(rt.includes("uninstall: null"), "a live run never records a null uninstall").toBe(false);
  });
});

// ── WR-02 / WR-03 (33-REVIEW round 2): provenance is decided BEFORE the spawn, from the platform's own registry row ──
//
// `claude plugin install` caches by `<marketplace>/<plugin>/<version>`; at an unbumped version a
// fresh install can reuse whichever sha last populated the cache, and round 2 digested that copy
// only AFTER both runs — the third post-run verdict input CR-01 named, and a guaranteed `UNMET`
// after the full spend. Now `runTarget`, after `ops.pluginInstall` and before `ops.runPlatform`,
// reads the platform's own registry row for the plugin at LOCAL scope in THIS target (by scope and
// project path, never by index), validates its `installPath` under the cache root, digests it
// against the checkout side handed down from `capture()`, and refuses to spawn on anything but
// MET. The post-run init-frame digest stays as the confirmation; both are rows. WR-03 is the
// untracked arm of the same class: the installer copies the WORKING TREE while the digest is over
// `git ls-files`, so an untracked file under `agent-factory/` reached path A invisibly; a scoped
// `git status --porcelain --untracked-files=all` row now refuses before the spend.

/** A recorder whose install writes a registry row pointing at the given copy (the platform's install, one row over). */
function installingOps(streamText: string, installPath: string, extraRows: RegistryRow[] = [], writeRow = true): ReturnType<typeof recordingOps> {
  const ops = recordingOps(streamText);
  ops.pluginInstall = (target, pluginName, marketplaceName) => {
    if (writeRow) PROVENANCE.install(target, installPath, extraRows);
    else PROVENANCE.writeRows(extraRows);
    return `recorded: install ${pluginName}@${marketplaceName} (no platform call)`;
  };
  return ops;
}

describe("WR-02 / WR-03: plugin provenance is a pre-spawn gate from the platform's registry row, and an untracked file under the installer's directories is a readiness refusal", () => {
  it("Test P1 (the stale cache): a registry row whose installPath holds the checkout's tracked files with ONE byte changed is refused BEFORE the spawn naming provenance and UNMET — the platform recorder was called 0 times", async () => {
    const stale = PROVENANCE.copyAt("2.1.0-stale", (rel, bytes) => (rel === "AGENTS.md" ? Buffer.concat([bytes, Buffer.from("x")]) : bytes));
    expect(contentDigest(stale, PROVENANCE.tracked), "premise: the stale copy digests differently").not.toBe(PROVENANCE.inputs.checkout.digest);
    const build = handBuiltTarget("A");
    const ops = installingOps(FIXTURE_TEXT, stale);
    let message = "";
    try {
      await runTarget(build, RUN_SPEC, ops);
    } catch (e) {
      message = e instanceof Error ? e.message : String(e);
    }
    // The witness first: the recorder's count. On the base it is 1 — the spawn happened and the
    // UNMET arrived after the run; now it is 0.
    expect(ops.calls, "no platform child was launched against a copy that is not the checkout").toHaveLength(0);
    expect(message).toMatch(/plugin provenance is UNMET before the spawn/);
    // The refusal names both digests, the registry's sha and the remedy the review names.
    expect(message).toContain(contentDigest(stale, PROVENANCE.tracked));
    expect(message).toContain(PROVENANCE.inputs.checkout.digest as string);
    expect(message).toContain(HONEST_SHA);
    expect(message).toContain("plugin marketplace update grugops");
    for (const d of [build.target, build.home, build.transcriptDir]) rmSync(d, { recursive: true, force: true });
  });

  it("Test P2 (the honest copy spawns): a byte-identical copy is MET — the recorder is called once, and the report carries the pre-spawn row with the registry's gitCommitSha beside the digest AND the post-run init-frame confirmation row", async () => {
    const build = handBuiltTarget("A");
    const ops = installingOps(FIXTURE_TEXT, PROVENANCE.honestCopy);
    const report = await runTarget(build, RUN_SPEC, ops);
    expect(ops.calls).toHaveLength(1);
    expect(report.provenanceBeforeSpawn.state).toBe("MET");
    expect(report.provenanceBeforeSpawn.gitCommitSha).toBe(HONEST_SHA);
    expect(report.provenanceBeforeSpawn.installedDigest).toBe(PROVENANCE.inputs.checkout.digest);
    const rendered = renderReport(reportModelWith([report]));
    const row = rendered.split("\n").find((l) => l.startsWith("| run A plugin provenance before the spawn | ")) ?? "";
    expect(row.startsWith("| run A plugin provenance before the spawn | MET — "), row).toBe(true);
    expect(row).toContain(PROVENANCE.inputs.checkout.digest as string);
    expect(row).toContain(`gitCommitSha ${HONEST_SHA}`);
    // The post-run confirmation row is still there, named as the AFTER-the-run derivation.
    expect(rendered).toMatch(/\| installed plugin provenance after the run \(D-05, per system\/init, content digest over \d+ tracked files\) \| /);
    for (const d of [build.target, build.home, build.transcriptDir]) rmSync(d, { recursive: true, force: true });
  });

  it("Test P3 (the row is found by scope and project, never by index): three rows resolve to the local-scope row for THIS target; no row for this target is UNKNOWN - verify naming the missing row and a refusal before the spawn", async () => {
    const target = mkdtempSync(join(tmpdir(), `${TMP_PREFIX}test-p3-target-`));
    const other = mkdtempSync(join(tmpdir(), `${TMP_PREFIX}test-p3-other-`));
    const at = "2026-09-21T00:00:00.000Z";
    const rows: RegistryRow[] = [
      { scope: "user", installPath: join(PROVENANCE.cacheRoot, "cache", "grugops", "grugops", "user"), version: "2.1.0", installedAt: at, lastUpdated: at, gitCommitSha: "1".repeat(40) },
      { scope: "local", projectPath: other, installPath: join(PROVENANCE.cacheRoot, "cache", "grugops", "grugops", "other"), version: "2.1.0", installedAt: at, lastUpdated: at, gitCommitSha: "2".repeat(40) },
      { scope: "local", projectPath: target, installPath: join(PROVENANCE.cacheRoot, "cache", "grugops", "grugops", "this"), version: "2.1.0", installedAt: at, lastUpdated: at, gitCommitSha: "3".repeat(40) },
    ];
    const text = JSON.stringify({ version: 2, plugins: { "grugops@grugops": rows } });
    expect(installedPluginRow(text, "grugops@grugops", target)).toEqual({ installPath: rows[2].installPath, gitCommitSha: "3".repeat(40), version: "2.1.0" });
    // Reordered, the same row is found: the selection is by scope and project path, not position.
    const reordered = JSON.stringify({ version: 2, plugins: { "grugops@grugops": [rows[2], rows[0], rows[1]] } });
    expect(installedPluginRow(reordered, "grugops@grugops", target)?.gitCommitSha).toBe("3".repeat(40));
    // The project path is compared on its real path, so a symlinked spelling of the target matches.
    const link = join(mkdtempSync(join(tmpdir(), `${TMP_PREFIX}test-p3-link-`)), "target");
    symlinkSync(target, link, "dir");
    expect(installedPluginRow(text, "grugops@grugops", link)?.gitCommitSha).toBe("3".repeat(40));
    // No row for this target: another project's local row and a user row do not stand in.
    expect(installedPluginRow(text, "grugops@grugops", other)?.gitCommitSha).toBe("2".repeat(40));
    expect(installedPluginRow(JSON.stringify({ version: 2, plugins: { "grugops@grugops": [rows[0], rows[1]] } }), "grugops@grugops", target)).toBeNull();
    expect(installedPluginRow(text, "other@grugops", target), "another plugin key").toBeNull();
    expect(installedPluginRow("not json", "grugops@grugops", target), "unparseable text is no row").toBeNull();
    expect(installedPluginRow(JSON.stringify({ version: 2, plugins: { "grugops@grugops": "not an array" } }), "grugops@grugops", target)).toBeNull();
    // Through the seam: an install that leaves no row for this target is refused before the spawn.
    const build = handBuiltTarget("A");
    const ops = installingOps(FIXTURE_TEXT, PROVENANCE.honestCopy, [rows[0], rows[1]], false);
    await expect(runTarget(build, RUN_SPEC, ops)).rejects.toThrow(/plugin provenance is UNKNOWN - verify before the spawn.*no local-scope row/);
    expect(ops.calls, "nothing was measured, so nothing spends").toHaveLength(0);
    for (const d of [target, other, build.target, build.home, build.transcriptDir]) rmSync(d, { recursive: true, force: true });
  });

  it("Test P4 (the untracked file): the scoped working-tree row is UNMET naming the file, MET on empty output, UNKNOWN - verify when unreadable; the probe's argument list is scoped to the directories the installer and the plugin read, so a .planning/ entry never reaches it", () => {
    const name = "working tree matches HEAD under the directories the installer and the plugin read";
    const dirty = evaluatePreconditions(observation({ workingTreeStatus: "?? agent-factory/roles/new-role.md\n" }));
    const dirtyRow = dirty.rows.find((r) => r.name === name);
    expect(dirtyRow?.state).toBe("UNMET");
    expect(dirtyRow?.detail).toContain("agent-factory/roles/new-role.md");
    expect(dirty.readiness).toBe("not-ready");
    expect(dirty.reasons.some((r) => r.includes("agent-factory/roles/new-role.md"))).toBe(true);
    const clean = evaluatePreconditions(observation({ workingTreeStatus: "" }));
    expect(clean.rows.find((r) => r.name === name)?.state).toBe("MET");
    expect(clean.readiness).toBe("ready");
    const unreadable = evaluatePreconditions(observation({ workingTreeStatus: null }));
    expect(unreadable.rows.find((r) => r.name === name)?.state).toBe("UNKNOWN - verify");
    expect(unreadable.readiness).toBe("not-ready");
    expect(unreadable.rows.filter((r) => r.state === "UNMET"), "unreadable is never a claimed failure").toEqual([]);
    // A modified tracked file is the same refusal (the round-1 WR-06 dirty-tree class, both arms).
    expect(evaluatePreconditions(observation({ workingTreeStatus: " M .claude/agents/grugops-orchestrator.md\n" })).rows.find((r) => r.name === name)?.state).toBe("UNMET");
    // The scope is the argument list itself: derived from ONE exported constant, over the directories
    // the installer copies (agent-factory, .claude, AGENTS.md, install) and the plugin loads
    // (.claude-plugin, skills, hooks, scripts).
    expect(workingTreeStatusArgs()).toEqual(["status", "--porcelain", "--untracked-files=all", "--", ...INSTALL_AND_PLUGIN_PATHS]);
    for (const dir of ["agent-factory", ".claude", ".claude-plugin", "install", "skills", "hooks", "scripts", "AGENTS.md"]) expect(INSTALL_AND_PLUGIN_PATHS, dir).toContain(dir);
    expect(INSTALL_AND_PLUGIN_PATHS.includes(".planning")).toBe(false);
    // Hermetic: a scratch repository with a committed agent-factory/ file, an untracked .planning/
    // entry and then an untracked agent-factory/ entry — the scoped status is empty for the first
    // and names the second, so the row's MET/UNMET follows the scope and nothing else.
    const repo = mkdtempSync(join(tmpdir(), `${TMP_PREFIX}test-p4-repo-`));
    const git = (...args: string[]): string => {
      const r = spawnSync("git", args, { cwd: repo, encoding: "utf8", input: "", env: { ...childEnvironment(process.env), GIT_AUTHOR_NAME: "t", GIT_AUTHOR_EMAIL: "t@t", GIT_COMMITTER_NAME: "t", GIT_COMMITTER_EMAIL: "t@t" } });
      if (r.status !== 0) throw new Error(`git ${args.join(" ")} failed: ${r.stderr}`);
      return r.stdout;
    };
    git("init", "--quiet");
    mkdirSync(join(repo, "agent-factory", "roles"), { recursive: true });
    writeFileSync(join(repo, "agent-factory", "roles", "x.md"), "x\n");
    git("add", "-A");
    git("commit", "--quiet", "-m", "seed");
    mkdirSync(join(repo, ".planning"), { recursive: true });
    writeFileSync(join(repo, ".planning", "milestone.lock"), "lock\n");
    const onlyPlanning = git(...workingTreeStatusArgs());
    expect(git("status", "--porcelain", "--untracked-files=all"), "control: the unscoped status names the .planning entry").toContain(".planning/milestone.lock");
    expect(onlyPlanning, "the scoped status does not").toBe("");
    expect(evaluatePreconditions(observation({ workingTreeStatus: onlyPlanning })).rows.find((r) => r.name === name)?.state).toBe("MET");
    writeFileSync(join(repo, "agent-factory", "roles", "new-role.md"), "new\n");
    const withUntracked = git(...workingTreeStatusArgs());
    expect(withUntracked).toContain("?? agent-factory/roles/new-role.md");
    expect(evaluatePreconditions(observation({ workingTreeStatus: withUntracked })).rows.find((r) => r.name === name)?.detail).toContain("agent-factory/roles/new-role.md");
    // And the runner's own observation calls the probe with exactly that argument list.
    const src = readFileSync(join(ROOT, "scripts", "capture-live.ts"), "utf8");
    expect(src.includes("workingTreeStatusArgs()"), "the observation derives its arguments from the one constant").toBe(true);
    rmSync(repo, { recursive: true, force: true });
  });
});

// ── CR-05: a failed plugin install stops the run BEFORE the paid spawn ─────────────────────────
//
// Round 1's `pluginInstall` returned a string beginning `UNKNOWN - verify` on a non-zero exit and
// `capture()` appended it to the install lines and went on to `runPlatform`: up to CALL_BOUND_MS of
// spend per label against a target with no plugin, surfacing only as `OUTCOME: fail` after the
// budget was gone. The install is a phase-2 precondition of D-05 route 2, and the header's contract
// is that nothing spawns while a precondition is not MET. So the decision is a pure, exported
// function (`installOutcome`), the real `pluginInstall` THROWS through `fail` on its `ok: false`
// arm, and `runTarget` calls the install first and lets the throw propagate — proven through the
// same recording seam Test G uses, with the recorder's call count as the witness.

/** A recorder whose install is decided by the shipped `installOutcome` over a canned spawn result. */
function installDecidingOps(streamText: string, spawnResult: { status: number | null; error: Error | undefined; stdout: string; stderr: string }): ReturnType<typeof recordingOps> {
  const ops = recordingOps(streamText);
  ops.pluginInstall = (target, pluginName, marketplaceName) => {
    const o = installOutcome(spawnResult);
    if (!o.ok) throw new Error(`plugin install ${pluginName}@${marketplaceName} did not complete (${o.reason})`);
    PROVENANCE.install(target, PROVENANCE.honestCopy);
    return `installed ${pluginName}@${marketplaceName} at local scope: ${o.line}`;
  };
  return ops;
}

describe("CR-05: a plugin install that does not complete stops the run before any platform child is spawned", () => {
  it("Test M: installOutcome is the pure install decision — a non-zero exit names the exit and the platform's stderr, a spawn error names the error, exit 0 is ok with the platform's line; and the source no longer returns an UNKNOWN - verify install string", () => {
    const failed = installOutcome({ status: 1, error: undefined, stdout: "", stderr: "boom" });
    expect(failed.ok).toBe(false);
    if (failed.ok) throw new Error("unreachable");
    expect(failed.reason).toContain("exit 1");
    expect(failed.reason).toContain("boom");
    const unstartable = installOutcome({ status: null, error: new Error("spawn claude ENOENT"), stdout: "", stderr: "" });
    expect(unstartable.ok).toBe(false);
    if (unstartable.ok) throw new Error("unreachable");
    expect(unstartable.reason).toContain("ENOENT");
    const ok = installOutcome({ status: 0, error: undefined, stdout: "Installed grugops@grugops\n", stderr: "" });
    expect(ok.ok).toBe(true);
    if (!ok.ok) throw new Error("unreachable");
    expect(ok.line).toContain("Installed grugops@grugops");
    // The returned-string failure shape is gone from the runner: the real pluginInstall throws.
    const src = readFileSync(join(ROOT, "scripts", "capture-live.ts"), "utf8");
    expect(src.includes("UNKNOWN - verify — `plugin install"), "the UNKNOWN - verify install string no longer exists in the source").toBe(false);
    expect(src).toContain("did not complete (${o.reason})");
  });

  it("Test N: through the seam, an install that does not complete rejects runTarget naming `plugin install`, and the platform recorder was called exactly 0 times", async () => {
    const build = handBuiltTarget("A");
    const ops = installDecidingOps(FIXTURE_TEXT, { status: 1, error: undefined, stdout: "", stderr: "marketplace grugops not found" });
    await expect(runTarget(build, RUN_SPEC, ops)).rejects.toThrow(/plugin install grugops@grugops did not complete/);
    expect(ops.calls, "no platform child was launched after the failed install").toHaveLength(0);
    for (const d of [build.target, build.home, build.transcriptDir]) rmSync(d, { recursive: true, force: true });
  });

  it("Test O: converse — an install that completes is followed by exactly 1 platform launch and the report is returned with the install line", async () => {
    const build = handBuiltTarget("A");
    const ops = installDecidingOps(FIXTURE_TEXT, { status: 0, error: undefined, stdout: "Installed grugops@grugops", stderr: "" });
    const report = await runTarget(build, RUN_SPEC, ops);
    expect(ops.calls).toHaveLength(1);
    expect(report.installLine).toContain("installed grugops@grugops at local scope: Installed grugops@grugops");
    expect(report.transcriptText).toBe(FIXTURE_TEXT);
    for (const d of [build.target, build.home, build.transcriptDir]) rmSync(d, { recursive: true, force: true });
  });
});

// ── CR-02 / WR-04: provenance by NAME, by CONTENT, and in the outcome ──────────────────────────
//
// The round-1 capture scored `loaded[0]` — context7, not grugops — and recorded the result as a
// footnote (33-CAPTURE-SUMMARY.md line 15, `UNKNOWN - verify`). The plugin cache is not a git
// checkout (33-DIAGNOSIS § 4.2), so provenance is the CONTENT of the cache copy over the checkout's
// tracked files, and a `pass` is unreachable unless that comparison is MET. The one transcript
// field that reaches a filesystem call — the plugin path — is validated under the cache root first.

function initFrameWithPlugins(plugins: { name: string; path: string; version: string | null }[]): StreamFrame {
  const init = FIXTURE.frames.find((f) => f.type === "system" && f.subtype === "init") as StreamFrame;
  return { ...init, plugins };
}

function treeWith(files: Record<string, string>): string {
  const root = mkdtempSync(join(tmpdir(), `${TMP_PREFIX}test-tree-`));
  for (const [rel, text] of Object.entries(files)) {
    mkdirSync(join(root, ...rel.split("/").slice(0, -1)), { recursive: true });
    writeFileSync(join(root, ...rel.split("/")), text);
  }
  return root;
}

describe("CR-02 / WR-04: plugin provenance is selected by name, validated under the cache root, compared by content, and gates the outcome", () => {
  it("wrong-entry fixture: with context7 at index 0 and grugops second, pluginUnderTest returns the grugops entry; an unlisted name is null", () => {
    const tmp = mkdtempSync(join(tmpdir(), `${TMP_PREFIX}test-plugins-`));
    const grugopsEntry = { name: "grugops", path: join(tmp, "cache", "grugops", "grugops", "2.1.0"), version: "2.1.0" };
    const frames = [initFrameWithPlugins([{ name: "context7", path: join(tmp, "ctx7"), version: null }, grugopsEntry]), ...FIXTURE.frames.filter((f) => !(f.type === "system" && f.subtype === "init"))];
    const report = pluginLoadReport(frames);
    expect(report.loaded, "premise: the first entry is NOT the plugin under test").toHaveLength(2);
    expect(report.loaded[0].name).not.toBe("grugops");
    expect(pluginUnderTest(report, "grugops")).toEqual(grugopsEntry);
    expect(pluginUnderTest(report, "context7")?.path).toBe(join(tmp, "ctx7"));
    expect(pluginUnderTest(report, "playwright")).toBeNull();
    expect(pluginUnderTest(pluginLoadReport(FIXTURE.frames.filter((f) => !(f.type === "system" && f.subtype === "init"))), "grugops"), "no init frame → nothing is under test").toBeNull();
    rmSync(tmp, { recursive: true, force: true });
  });

  it("cache path validation (WR-04): the realpath of an existing directory under the cache root is accepted; outside, a regular file, a missing path, a dash-prefixed value and a link that leaves the root are refused", () => {
    const cacheRoot = mkdtempSync(join(tmpdir(), `${TMP_PREFIX}test-cache-`));
    const inside = join(cacheRoot, "cache", "grugops", "grugops", "2.1.0");
    mkdirSync(inside, { recursive: true });
    writeFileSync(join(cacheRoot, "cache", "a-file.txt"), "x");
    const outside = mkdtempSync(join(tmpdir(), `${TMP_PREFIX}test-outside-`));
    expect(pluginCachePathAccepted(inside, cacheRoot)).toBe(realpathSync.native(inside));
    expect(pluginCachePathAccepted(outside, cacheRoot), "outside the cache root").toBeNull();
    expect(pluginCachePathAccepted(join(cacheRoot, "cache", "a-file.txt"), cacheRoot), "a regular file").toBeNull();
    expect(pluginCachePathAccepted(join(cacheRoot, "cache", "nope", "1.0.0"), cacheRoot), "a non-existent path").toBeNull();
    expect(pluginCachePathAccepted("-C", cacheRoot), "a dash-prefixed value").toBeNull();
    expect(pluginCachePathAccepted(`-${inside}`, cacheRoot), "a dash-prefixed spelling of a real directory").toBeNull();
    expect(pluginCachePathAccepted(cacheRoot, cacheRoot), "the cache root itself is not a plugin directory").toBeNull();
    // A link under the root that resolves outside it is refused on its REAL path (the lexical
    // containment that admitted a symlink escape is the P32 CR-04 class).
    symlinkSync(outside, join(cacheRoot, "cache", "escape"), "dir");
    expect(pluginCachePathAccepted(join(cacheRoot, "cache", "escape"), cacheRoot), "a link that leaves the cache root").toBeNull();
    expect(pluginCachePathAccepted(inside, join(cacheRoot, "does-not-exist")), "an unresolvable cache root accepts nothing").toBeNull();
    for (const d of [cacheRoot, outside]) rmSync(d, { recursive: true, force: true });
  });

  it("content digest is two-sided and order-independent: equal trees digest equal; one changed byte, or one missing file, digests differ", () => {
    const files = { "AGENTS.md": "# agents\n", "scripts/a.js": "export const a = 1;\n", "agent-factory/roles/x.md": "role\n" };
    const rels = Object.keys(files);
    const a = treeWith(files);
    const b = treeWith(files);
    expect(contentDigest(a, rels)).toBe(contentDigest(b, rels));
    expect(contentDigest(a, rels)).toMatch(/^[0-9a-f]{64}$/);
    expect(contentDigest(a, [...rels].reverse()), "independent of the order relPaths are given in").toBe(contentDigest(a, rels));
    const changed = treeWith({ ...files, "scripts/a.js": "export const a = 2;\n" });
    expect(contentDigest(changed, rels)).not.toBe(contentDigest(a, rels));
    const missing = treeWith({ "AGENTS.md": files["AGENTS.md"], "scripts/a.js": files["scripts/a.js"] });
    expect(contentDigest(missing, rels), "a missing file on one side").not.toBe(contentDigest(a, rels));
    // Two sides missing the SAME file digest equal — the digest is over the named set, not over
    // whatever happens to exist.
    const missingToo = treeWith({ "AGENTS.md": files["AGENTS.md"], "scripts/a.js": files["scripts/a.js"] });
    expect(contentDigest(missing, rels)).toBe(contentDigest(missingToo, rels));
    for (const d of [a, b, changed, missing, missingToo]) rmSync(d, { recursive: true, force: true });
  });

  it("verdict and outcome: equal digests are MET, differing digests are UNMET naming both, a null installed digest is UNKNOWN - verify, and an outcome of pass is unreachable unless MET", () => {
    expect(provenanceVerdict("abc", "abc").state).toBe("MET");
    const unmet = provenanceVerdict("abc", "abd");
    expect(unmet.state).toBe("UNMET");
    expect(unmet.detail).toContain("abc");
    expect(unmet.detail).toContain("abd");
    expect(provenanceVerdict("abc", null).state).toBe("UNKNOWN - verify");
    expect(provenanceVerdict(null, "abc").state).toBe("UNKNOWN - verify");
    for (const provenance of ["UNMET", "UNKNOWN - verify"] as const) {
      expect(deriveOutcome({ hang: false, anyFailure: false, parityDiffs: [], provenance }), provenance).toBe("fail");
    }
    expect(deriveOutcome({ hang: false, anyFailure: false, parityDiffs: [], provenance: "MET" })).toBe("pass");
  });

  it("the runner reads no index-zero plugin entry and runs no git inside a transcript-named path", () => {
    const src = readFileSync(join(ROOT, "scripts", "capture-live.ts"), "utf8");
    expect(src.includes("loaded[0]")).toBe(false);
    expect(src.includes("installedPluginSha")).toBe(false);
    // Counted per LINE, the same instrument as the plan's `grep -a -c 'rev-parse'`.
    expect(src.split("\n").filter((l) => l.includes("rev-parse")).length, "HEAD, the remote ref and checkoutSha — the cache-path git call is gone").toBe(3);
  });
});

// ── CR-04 / IN-08: the paid transcript survives EVERY failure path; --keep-target and --out keep their contracts ──
//
// Round 1's `finally` ran `cleanupScratch(code === 0 && keepTarget)`: on ANY non-zero exit every
// scratch directory was removed, `--keep-target` or not, and the raw transcripts of both runs lived
// only in scratch until `writeArtifacts` — the LAST step. A `fail()` between run completion and that
// write (a redaction survivor, a `readContext` throw) destroyed the only copy of an artifact that
// cost real tokens, on the one path where the operator needs it. So scratch now has TWO classes with
// two contracts, decided by a pure truth table (`cleanupPlan`): the flag decides targets and kit
// homes; the flag OR a non-zero exit preserves transcripts. IN-08 lives in the same argument
// handling: `--out --dry-run` used to start a LIVE capture into a directory named `--dry-run`.

describe("CR-04 / IN-08: transcripts survive every non-zero exit, --keep-target decides targets, --out refuses a flag", () => {
  it("Test P: cleanupPlan's truth table — the flag decides targets; the flag OR a non-zero exit preserves transcripts", () => {
    expect(cleanupPlan(0, false)).toEqual({ removeTargets: true, removeTranscripts: true });
    expect(cleanupPlan(0, true)).toEqual({ removeTargets: false, removeTranscripts: false });
    expect(cleanupPlan(1, false)).toEqual({ removeTargets: true, removeTranscripts: false });
    expect(cleanupPlan(1, true)).toEqual({ removeTargets: false, removeTranscripts: false });
    // The exit-code-decides shape is gone from the runner's finally.
    const src = readFileSync(join(ROOT, "scripts", "capture-live.ts"), "utf8");
    expect(src.includes("cleanupScratch(code === 0"), "the exit-code-decides cleanup call no longer exists in the source").toBe(false);
    expect(src).toContain("cleanupScratch(cleanupPlan(code, keepTarget))");
  });

  it("Test Q: the two scratch classes are separate — removing targets leaves the transcript directory on disk, and the reverse plan does the reverse; a preserved transcript path is returned for printing", () => {
    const registry: ScratchRegistry = { targets: [], transcripts: [] };
    const target = makeScratch("target-A", registry);
    const transcript = makeScratchTranscript("A", registry);
    expect(registry.targets).toEqual([target]);
    expect(registry.transcripts).toEqual([transcript]);
    expect(existsSync(target) && existsSync(transcript), "control: both exist before any cleanup").toBe(true);
    const preserved = cleanupScratch({ removeTargets: true, removeTranscripts: false }, registry);
    expect(existsSync(target), "the target class was removed").toBe(false);
    expect(existsSync(transcript), "the transcript class survived").toBe(true);
    expect(preserved, "the surviving transcript directory is returned so the runner can print it").toEqual([transcript]);
    expect(registry.targets).toEqual([]);
    expect(registry.transcripts).toEqual([transcript]);
    // The reverse plan over a fresh pair.
    const registry2: ScratchRegistry = { targets: [], transcripts: [] };
    const target2 = makeScratch("target-B", registry2);
    const transcript2 = makeScratchTranscript("B", registry2);
    const preserved2 = cleanupScratch({ removeTargets: false, removeTranscripts: true }, registry2);
    expect(existsSync(target2), "the target class survived").toBe(true);
    expect(existsSync(transcript2), "the transcript class was removed").toBe(false);
    expect(preserved2).toEqual([]);
    expect(registry2.targets).toEqual([target2]);
    // Both removed: nothing survives, nothing is returned.
    expect(cleanupScratch({ removeTargets: true, removeTranscripts: true }, registry2)).toEqual([]);
    expect(existsSync(target2)).toBe(false);
    rmSync(transcript, { recursive: true, force: true });
  });

  it("Test R: --out refuses a value beginning with `--` in either spelling, naming --out and the value; a real path followed by --dry-run parses both", () => {
    expect(() => parseArgs(["--out", "--dry-run"])).toThrow(/--out.*--dry-run/);
    expect(() => parseArgs(["--out=--dry-run"])).toThrow(/--out.*--dry-run/);
    const opts = parseArgs(["--out", "/tmp/x", "--dry-run"]);
    expect(opts.out).toBe("/tmp/x");
    expect(opts.dryRun).toBe(true);
    expect(parseArgs(["--out=/tmp/y"]).out).toBe("/tmp/y");
    // Control: the pre-existing refusal of an empty value still holds.
    expect(() => parseArgs(["--out"])).toThrow(/--out requires a directory path/);
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
    // The D-07 section the flip manifest cites, and the demoted replay comparator beside it (33-12).
    expect(report).toContain("## Dual-path parity (D-07) — path-invariant projection");
    expect(report).toContain("## Replay comparator (informational — task-id keyed, deterministic replay only)");
    expect(report).toContain("- parity: the two projections are equal");
    // CR-01: the Run table states where a live transcript lands, derived from the same predicate.
    for (const run of ["A", "B"]) expect(report).toContain(`| run ${run} transcript location | runner-owned scratch, outside every target and outside the run's working directory |`);
    // CR-01 round 2: the resolved tool grant is a per-run row, in the dry run too — one scoped
    // Edit(//ABS/**) rule, no bare Write or Edit, the scoped admission spelling.
    for (const run of ["A", "B"]) {
      const row = report.split("\n").find((l) => l.startsWith(`| run ${run} tool grant | `));
      expect(row, `the Run table carries a tool grant row for run ${run}`).toBeDefined();
      const list = JSON.parse((row as string).slice(`| run ${run} tool grant | `.length, -" |".length)) as string[];
      expect(list.filter((x) => /^Edit\(\/\/.+\/\*\*\)$/.test(x))).toHaveLength(1);
      expect(list.includes("Write") || list.includes("Edit")).toBe(false);
      expect(list).toContain("mcp__plugin_grugops_grugops__propose_note");
      // WR-06: the dry run walks the uninstall row too (D-10) and says truthfully that nothing was installed — never an exit.
      expect(report).toContain(`| run ${run} plugin uninstall | not run — no plugin was installed for this run (dry run, D-10) |`);
      expect(report.includes(`| run ${run} plugin uninstall | exit`)).toBe(false);
    }
    // CR-02: the provenance rows replace the old sha row; over the fixture the state is UNKNOWN.
    expect(report).toMatch(/\| installed plugin provenance \(D-05, content digest over \d+ tracked files\) \| UNKNOWN - verify — /);
    expect(report).toContain("| plugin under test per system/init | grugops 2.1.0 at ");
    expect(report).not.toContain("installed plugin sha (D-05, post hoc)");
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

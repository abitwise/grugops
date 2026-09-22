// guard.test.ts — SAFE-02 Vitest safety oracle for the prod-deploy guard.
//
// This is the HIGH-severity parity oracle for the grugops prod-deploy guard. It is a
// faithful Vitest port of hooks/guard.test.sh: it reproduces EVERY assertion from that
// shell harness (the deny / allow / refuse-self-set triad, the default-set denies, the
// WR-01 newly-covered denies, the WR-02 false-positive allows, and the two fail-closed
// cases), plus a NEW D-10 missing-artifact case the shell harness never had.
//
// Each case spawns the COMMITTED compiled guard.js (never the .ts) as a child process,
// pipes a PreToolUse stdin JSON, and asserts on the emitted deny JSON — exactly as the
// shell harness shelled out via `node "$GUARD"`. A prompt cannot override a PreToolUse
// hook deny, so this harness proves the mechanism actually blocks, rather than trusting
// prose. Fewer cases than the shell oracle is the Pitfall-2 warning sign (a silently
// weakened deny path); count them.
//
// Match shapes (byte-identical to guard.test.sh):
//   deny  ⇒ stdout contains `"permissionDecision":"deny"`
//   allow ⇒ stdout does NOT contain `"deny"`
//
// Vitest globals:false (the repo default) → import test fns explicitly.

import { describe, it, expect, afterAll } from "vitest";
import { spawnSync } from "node:child_process";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  readdirSync,
  copyFileSync,
  symlinkSync,
  rmSync,
  existsSync,
  chmodSync,
  cpSync,
  realpathSync,
  statSync,
} from "node:fs";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";
import { closureTargets } from "../scripts/js-import-closure.js";
import { skipEntry, skipLine, stageShapeOrSkip } from "../scripts/check-platform-shapes.js";

// The COMMITTED checkpoints artifact — the same module the spawned guard imports, so the recognizer
// this file counts banners with and the composer the guard prints them from are one authority.
const cp: typeof import("../scripts/checkpoints.js") = await import(
  pathToFileURL(join(import.meta.dirname, "..", "scripts", "checkpoints.js")).href
);

const APPROVAL = "GRUGOPS_PROD_DEPLOY_APPROVED";

// Targets the COMMITTED guard.js (the artifact the host hook runs), never the .ts.
const GUARD_JS = join(import.meta.dirname, "guard.js");

/**
 * EVERY SPAWN IS BOUNDED, AND THAT IS A FINDING ABOUT THIS HARNESS (plan 30-11 round 2).
 *
 * The `RA1-2` cases assert that the guard ANSWERS where it used to block forever. Without a spawn
 * timeout an unfixed guard does not fail those cases — it hangs them, and with them the whole suite.
 * Measured while mutation-proving the fix: removing both halves of the reader's non-regular-file
 * refusal left the run alive for over twenty minutes with no verdict. A regression that stops CI
 * rather than reddening it is a regression nobody reads. `spawnSync`'s timeout returns
 * `status === null`, which every case here already refuses.
 */
const SPAWN_TIMEOUT_MS = 20_000;

// sh analog (guard.test.sh:30-36):  printf '%s' "$1" | env "$2" node "$GUARD"
// The env-assignment 2nd arg becomes a Record merged onto process.env.
function runGuard(
  json: string,
  env: Record<string, string> = {},
): { status: number | null; stdout: string; stderr: string } {
  const r = spawnSync("node", [GUARD_JS], {
    input: json,
    encoding: "utf8",
    env: { ...process.env, ...env },
    timeout: SPAWN_TIMEOUT_MS,
  });
  return { status: r.status, stdout: r.stdout ?? "", stderr: r.stderr ?? "" };
}

function expectDeny(json: string, env: Record<string, string> = {}): void {
  const { stdout } = runGuard(json, env);
  expect(stdout).toContain('"permissionDecision":"deny"');
}

function expectAllow(json: string, env: Record<string, string> = {}): void {
  const { stdout } = runGuard(json, env);
  expect(stdout).not.toContain('"deny"');
}

// Build a PreToolUse payload for a given Bash command.
const payload = (command: string): string =>
  JSON.stringify({ tool_input: { command } });

describe("guard.js (SAFE-02 prod-deploy guard) — parity oracle for guard.test.sh", () => {
  // ── The SAFE-02 behavioral triad ─────────────────────────────────────────────
  it("deny: matched deploy with no human approval (fails closed)", () => {
    expectDeny(payload("kubectl apply -f deploy.yaml"));
  });

  it(`allow: matched deploy with human-set ${APPROVAL}`, () => {
    expectAllow(payload("kubectl apply -f deploy.yaml"), { [APPROVAL]: "1" });
  });

  it(`refuse-self-set: inline export of ${APPROVAL} (denied even with the var in env)`, () => {
    expectDeny(
      payload(`export ${APPROVAL}=1 && kubectl apply -f deploy.yaml`),
      { [APPROVAL]: "1" },
    );
  });

  // ── Reinforcing checks ───────────────────────────────────────────────────────
  it(`refuse-self-set: assignment-prefix ${APPROVAL}=1 <deploy>`, () => {
    expectDeny(payload(`${APPROVAL}=1 helm upgrade rel ./chart`));
  });

  it("allow: non-deploy command (ls)", () => {
    expectAllow(payload("ls -la"));
  });

  // ── Default deploy-pattern set coverage (deny absent approval) ────────────────
  it("deny: terraform apply", () => {
    expectDeny(payload("terraform apply -auto-approve"));
  });

  it("deny: npm publish", () => {
    expectDeny(payload("npm publish"));
  });

  it("deny: vercel --prod", () => {
    expectDeny(payload("vercel deploy --prod"));
  });

  // ── WR-01: newly-covered production-mutating commands (12, each denies) ───────
  it("deny: kubectl delete (destructive prod mutation)", () => {
    expectDeny(payload("kubectl delete namespace prod"));
  });

  it("deny: aws s3 sync (static-site/asset deploy, no literal deploy token)", () => {
    expectDeny(payload("aws s3 sync ./build s3://prod-bucket"));
  });

  it("deny: aws deploy (CodeDeploy service)", () => {
    expectDeny(payload("aws deploy create-deployment --application-name x"));
  });

  it("deny: yarn publish", () => {
    expectDeny(payload("yarn publish"));
  });

  it("deny: pnpm publish", () => {
    expectDeny(payload("pnpm publish"));
  });

  it("deny: gcloud run deploy (verb-anchored)", () => {
    expectDeny(payload("gcloud run deploy my-svc --region us"));
  });

  it("deny: gcloud app deploy (verb-anchored)", () => {
    expectDeny(payload("gcloud app deploy"));
  });

  it("deny: git push --force (protected/destructive)", () => {
    expectDeny(payload("git push origin main --force"));
  });

  it("deny: git push -f", () => {
    expectDeny(payload("git push -f origin main"));
  });

  it("deny: git push to protected branch main (no force)", () => {
    expectDeny(payload("git push origin main"));
  });

  it("deny: git push to protected branch master", () => {
    expectDeny(payload("git push origin master"));
  });

  it("deny: git push to release/* branch", () => {
    expectDeny(payload("git push origin release/1.2"));
  });

  // ── WR-02: benign reads that merely MENTION "deploy" must ALLOW (4) ───────────
  it("allow: aws s3 ls + path component named deploy (not a deploy)", () => {
    expectAllow(payload("aws s3 ls && cat ./deploy/notes.txt"));
  });

  it("allow: gcloud config list with deploy in a comment", () => {
    expectAllow(payload("gcloud config list # see deploy docs"));
  });

  it("allow: git push to a feature branch (not protected, not forced)", () => {
    expectAllow(payload("git push origin feature/my-branch"));
  });

  it("allow: kubectl get (read-only)", () => {
    expectAllow(payload("kubectl get pods"));
  });

  // ── Fail-closed: malformed / empty stdin never crash-allows (2) ───────────────
  it("fail-closed: malformed stdin does not crash (exit 0, no error)", () => {
    const r = runGuard("not json at all");
    expect(r.status).toBe(0);
    expect((r.stdout + r.stderr).toLowerCase()).not.toContain("error");
  });

  it("fail-closed: empty stdin does not crash (exit 0, no error)", () => {
    const r = runGuard("");
    expect(r.status).toBe(0);
    expect((r.stdout + r.stderr).toLowerCase()).not.toContain("error");
  });

  // ── D-10 (NEW — beyond the byte-port oracle): missing/unrunnable guard.js ─────
  // The fail-closed hook contract (D-10) requires that if the materialized guard.js is
  // absent or cannot run, the protected action does NOT proceed — a missing guard must
  // never be mistaken for an allow. Spawning a non-existent guard path with a matched
  // deploy payload must fail to run (status !== 0 / error set) and emit no deny JSON
  // (because nothing ran). Under the hook contract, a non-zero hook exit blocks the
  // action, so the deploy is NOT allowed through. This proves D-10's
  // "guard.js missing/unrunnable → blocked, never allowed through."
  it("D-10 fail-closed: a missing/unrunnable guard.js does NOT allow the deploy through", () => {
    const missingGuard = join(import.meta.dirname, "guard.MISSING.js");
    const r = spawnSync("node", [missingGuard], {
      timeout: SPAWN_TIMEOUT_MS, // every spawn in this file is bounded — see SPAWN_TIMEOUT_MS
      input: payload("kubectl apply -f x.yaml"),
      encoding: "utf8",
      env: { ...process.env },
    });
    // The process could not run the guard: node exits non-zero (or sets error).
    // A non-zero hook exit is NOT exit-0 + allow, so the protected action is blocked.
    const failedToRun = r.status !== 0 || r.error != null;
    expect(failedToRun).toBe(true);
    // And it certainly never emitted a permissionDecision allow — nothing ran.
    expect(r.stdout ?? "").not.toContain('"permissionDecision":"allow"');
  });
});

// ═════════════════════════════════════════════════════════════════════════════════════════════════
// Phase 30 (AUTO-03) — the TWO-KEY rule, proven by spawning the committed guard.js.
// ═════════════════════════════════════════════════════════════════════════════════════════════════
//
// The claim under test is the one an agent would most like to be false: that an agent which can
// write factory.config.json cannot thereby lower a safety floor. One key is the config declaration
// (agent-writable). The other is a session environment variable the agent cannot set from inside a
// tool call. Both are required, and the guard reads the second one FRESH on every invocation.
//
// EVERY CASE HERE SPAWNS THE COMMITTED hooks/guard.js. A green unit test over the resolver would
// prove the resolver; only the spawned artifact proves the decision the host actually gets
// ([[grugops-safety-invariant-green-suite-insufficient]]).

const FLOOR_VAR = "GRUGOPS_FLOOR_PROTECTED_BRANCH_MERGE";
const PUSH = payload("git push origin main");

const cpTmpDirs: string[] = [];
afterAll(() => {
  for (const d of cpTmpDirs) rmSync(d, { recursive: true, force: true });
});

/** A project root whose .grugops/factory.config.json carries the given raw body. */
function projectWithConfig(body: string): string {
  const root = mkdtempSync(join(tmpdir(), "guard-cp-"));
  cpTmpDirs.push(root);
  mkdirSync(join(root, ".grugops"), { recursive: true });
  writeFileSync(join(root, ".grugops", "factory.config.json"), body);
  return root;
}

/**
 * Spawn the committed guard against a project root, with the ambient environment SCRUBBED of every
 * GRUGOPS_ variable first. A developer box or CI runner that happens to carry a grant would
 * otherwise turn a denial into an allow and every case below would pass for the wrong reason.
 */
function runAt(
  projectDir: string,
  json: string,
  extra: Record<string, string> = {},
): { status: number | null; stdout: string; stderr: string; reason: string } {
  const env: Record<string, string> = {};
  for (const [k, v] of Object.entries(process.env)) {
    if (k.startsWith("GRUGOPS_") || v === undefined) continue;
    env[k] = v;
  }
  const r = spawnSync("node", [GUARD_JS], {
    input: json,
    encoding: "utf8",
    env: { ...env, CLAUDE_PROJECT_DIR: projectDir, ...extra },
    timeout: SPAWN_TIMEOUT_MS,
  });
  const stdout = r.stdout ?? "";
  let reason = "";
  try {
    reason =
      (JSON.parse(stdout) as { hookSpecificOutput?: { permissionDecisionReason?: string } })
        .hookSpecificOutput?.permissionDecisionReason ?? "";
  } catch {
    reason = "";
  }
  return { status: r.status, stdout, stderr: r.stderr ?? "", reason };
}

const LOWERED_OFF = '{"checkpoints":{"protected_branch_merge":"off"}}';

describe("guard.js — AUTO-03 the two-key rule for a floor lowering", () => {
  it("config says `off`, NO grant variable → still DENIES, naming the checkpoint AND the missing variable", () => {
    const r = runAt(projectWithConfig(LOWERED_OFF), PUSH);
    expect(r.status).toBe(0); // the deny mechanism is exit 0 + JSON, never a crash
    expect(r.stdout).toContain('"permissionDecision":"deny"');
    // D-10: a human reading the transcript must be able to tell WHICH key is absent.
    expect(r.reason).toContain("protected_branch_merge");
    expect(r.reason).toContain(FLOOR_VAR);
  });

  it("config says `notify`, NO grant variable → also DENIES (both values are lowerings, D-07)", () => {
    const r = runAt(projectWithConfig('{"checkpoints":{"protected_branch_merge":"notify"}}'), PUSH);
    expect(r.stdout).toContain('"permissionDecision":"deny"');
    expect(r.reason).toContain(FLOOR_VAR);
  });

  it("an EMPTY grant variable is not a grant → DENIES", () => {
    const r = runAt(projectWithConfig(LOWERED_OFF), PUSH, { [FLOOR_VAR]: "" });
    expect(r.stdout).toContain('"permissionDecision":"deny"');
  });

  it("config says `off` AND a human set the grant to a non-empty name → ALLOWS, no deny payload", () => {
    const r = runAt(projectWithConfig(LOWERED_OFF), PUSH, { [FLOOR_VAR]: "Olger Oeselg" });
    expect(r.status).toBe(0);
    expect(r.stdout).not.toContain("deny");
    expect(r.stdout).toBe(""); // allow = exit 0, no stdout at all
    // The banner names the lowering and its authorizing key, on the same run that allowed it.
    expect(r.stderr).toContain(`authorized by ${FLOOR_VAR}=Olger Oeselg`);
  });

  it("a NON-CANONICAL config value never lowers, even with the grant present (fail closed by rule)", () => {
    for (const raw of ['"OFF"', '"Off"', '" off"', "true", "1", "0", "null", '["off"]', '{"a":1}']) {
      const r = runAt(
        projectWithConfig(`{"checkpoints":{"protected_branch_merge":${raw}}}`),
        PUSH,
        { [FLOOR_VAR]: "someone" },
      );
      expect(r.stdout, `config value ${raw} must not lower the floor`).toContain(
        '"permissionDecision":"deny"',
      );
    }
  });

  it("a `checkpoints` value that is not an object never lowers, even with the grant present", () => {
    for (const body of ['{"checkpoints":"off"}', '{"checkpoints":["off"]}', '{"checkpoints":null}', "[]"]) {
      const r = runAt(projectWithConfig(body), PUSH, { [FLOOR_VAR]: "someone" });
      expect(r.stdout, `config ${body} must not lower the floor`).toContain(
        '"permissionDecision":"deny"',
      );
    }
  });

  it("a near-miss checkpoint id does not reach the roster cell (no fuzzy key matching)", () => {
    for (const key of ["PROTECTED_BRANCH_MERGE", "protected-branch-merge", "protectedBranchMerge", "autonomy"]) {
      const r = runAt(projectWithConfig(`{"checkpoints":{"${key}":"off"}}`), PUSH, {
        [FLOOR_VAR]: "someone",
      });
      expect(r.stdout, `key ${key} must not lower protected_branch_merge`).toContain(
        '"permissionDecision":"deny"',
      );
    }
  });

  it("an UNREADABLE config never lowers → DENIES a matched command, and says why", () => {
    const r = runAt(projectWithConfig("{ not valid json ]]]"), PUSH, { [FLOOR_VAR]: "someone" });
    expect(r.stdout).toContain('"permissionDecision":"deny"');
  });

  it("the checkpoint the command did NOT match is unaffected by the other one's lowering", () => {
    // protected_branch_merge lowered and granted; a production deploy must still be denied, because
    // its own checkpoint is untouched. A per-checkpoint matrix that leaked across checkpoints would
    // be a matrix in name only.
    const root = projectWithConfig(LOWERED_OFF);
    const r = runAt(root, payload("kubectl apply -f deploy.yaml"), { [FLOOR_VAR]: "Olger" });
    expect(r.stdout).toContain('"permissionDecision":"deny"');
  });
});

describe("guard.js — AUTO-03 the agent may never set its own floor grant (D-09)", () => {
  // ONE detector covers the approval variable AND the whole GRUGOPS_FLOOR_* family. Each shape below
  // is refused EVEN THOUGH the variable is already present in the spawn environment — which is the
  // point: the refusal is about the COMMAND attempting the set, not about the variable's absence.
  for (const [label, command] of [
    ["export prefix", `export ${FLOOR_VAR}=me && git push origin main`],
    ["assignment prefix", `${FLOOR_VAR}=me git push origin main`],
    ["env prefix", `env ${FLOOR_VAR}=me git push origin main`],
    ["mid-command after ;", `true; ${FLOOR_VAR}=me; git push origin main`],
    ["inside a subshell", `(${FLOOR_VAR}=me); git push origin main`],
    ["after a pipe", `echo x | ${FLOOR_VAR}=me git push origin main`],
  ] as const) {
    it(`refuses a self-set of the floor grant — ${label} — with the variable already in env`, () => {
      const r = runAt(projectWithConfig(LOWERED_OFF), payload(command), { [FLOOR_VAR]: "me" });
      expect(r.stdout).toContain('"permissionDecision":"deny"');
      expect(r.reason).toContain(FLOOR_VAR);
    });
  }

  it("refuses a self-set of a floor-family name that is not on today's roster (the family, not a list)", () => {
    // A per-name allowlist would refuse exactly today's floors and silently allow the next one. The
    // detector matches the PREFIX FAMILY, so a name the roster has not grown yet is refused too.
    const r = runAt(
      projectWithConfig(LOWERED_OFF),
      payload("export GRUGOPS_FLOOR_SOME_FUTURE_CHECKPOINT=me && ls"),
    );
    expect(r.stdout).toContain('"permissionDecision":"deny"');
  });

  it("does NOT refuse a command that merely MENTIONS a grant variable without setting it", () => {
    // Over-broad refusals train users to disable the guard. Reading, printing or grepping the name
    // is not an attempt to set it.
    const root = projectWithConfig(LOWERED_OFF);
    expect(runAt(root, payload(`echo ${FLOOR_VAR}`)).stdout).not.toContain("deny");
    expect(runAt(root, payload(`grep -r ${FLOOR_VAR} docs/`)).stdout).not.toContain("deny");
    expect(runAt(root, payload(`echo "$${FLOOR_VAR}"`)).stdout).not.toContain("deny");
  });
});

// ═════════════════════════════════════════════════════════════════════════════════════════════════
// Plan 30-08 (AUTO-05, D-10 / D-11) — the NON-BLOCKING tier: allow, RECORD, announce.
// ═════════════════════════════════════════════════════════════════════════════════════════════════
//
// The claim under test is the one that makes AUTO-05 worth anything: a lowering is not invisible.
// `notify` allows the action AND leaves a finding in the shared verified context; an UNAUTHORIZED
// lowering is refused AND leaves its own finding. Both are proven by spawning the committed guard.js
// and comparing the notes directory BEFORE and AFTER — never by reading the guard's own report of
// what it did.
//
// WHY EVERY COUNT ASSERTION IS EXACTLY-ONE AND NEVER AT-LEAST-ONE. A branch that writes twice and a
// branch that writes zero times each pass an at-least-one assertion in one direction or the other:
// the first passes it outright, the second passes its negation elsewhere while this case never runs.
// A before/after DELTA with an exact cardinality is the only shape that fails on both faults.

const GUARD_TS = join(import.meta.dirname, "guard.ts");
/** Must match CHECKPOINT_TRACE_TASK in scripts/context-io.ts. */
const TRACE_TASK = "checkpoint-trace";
const GUARD_AUTHOR = "by: §checkpoint-guard";

/** Every note file under the checkpoint trace, as [name, bytes] pairs, sorted. */
function notesSnapshot(projectDir: string): Array<[string, string]> {
  const dir = join(projectDir, ".grugops", "context", TRACE_TASK, "notes");
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .sort()
    .map((f) => [f, readFileSync(join(dir, f), "utf8")] as [string, string]);
}

/** Run the guard and return the run plus the note files that appeared BECAUSE of it. */
function runWithTrace(
  projectDir: string,
  json: string,
  extra: Record<string, string> = {},
): { run: ReturnType<typeof runAt>; added: Array<[string, string]> } {
  const before = new Set(notesSnapshot(projectDir).map(([name]) => name));
  const run = runAt(projectDir, json, extra);
  const added = notesSnapshot(projectDir).filter(([name]) => !before.has(name));
  return { run, added };
}

const LOWERED_NOTIFY = '{"checkpoints":{"protected_branch_merge":"notify"}}';

describe("guard.js — D-11 the notify tier allows, RECORDS and announces", () => {
  it("notify WITH the human grant: allows, and writes EXACTLY ONE finding naming the decision", () => {
    const root = projectWithConfig(LOWERED_NOTIFY);
    const { run: r, added } = runWithTrace(root, PUSH, { [FLOOR_VAR]: "Olger Oeselg" });

    expect(r.status).toBe(0);
    expect(r.stdout).toBe(""); // allowed: exit 0, no stdout at all
    expect(added, `expected exactly one new note, got ${added.length}`).toHaveLength(1);

    const [, text] = added[0];
    expect(text).toContain(GUARD_AUTHOR); // the HOOK's identity, never the agent's
    expect(text).toContain("kind: finding");
    expect(text).toContain("protected_branch_merge");
    expect(text).toContain("declared: notify");
    expect(text).toContain("effective: notify");
    expect(text).toContain(`${FLOOR_VAR}="Olger Oeselg"`); // the authorizing name, verbatim
    expect(text).toContain('"git push origin main"'); // the command
    expect(text).toContain("actor: "); // the actor, as far as a PreToolUse payload names one
    expect(text).toContain("CHECKPOINT ALLOWED");
    // The banner on the SAME run names the checkpoint and its authorizing key.
    expect(r.stderr).toContain(`protected_branch_merge=notify authorized by ${FLOOR_VAR}=Olger Oeselg`);
  });

  it("D-10 an UNAUTHORIZED lowering: denies, AND writes EXACTLY ONE finding of its own", () => {
    const root = projectWithConfig(LOWERED_NOTIFY);
    const { run: r, added } = runWithTrace(root, PUSH);

    expect(r.stdout).toContain('"permissionDecision":"deny"');
    expect(added, `expected exactly one new note, got ${added.length}`).toHaveLength(1);

    const [, text] = added[0];
    expect(text).toContain(GUARD_AUTHOR);
    expect(text).toContain("kind: finding");
    expect(text).toContain("CHECKPOINT REFUSED");
    expect(text).toContain("declared: notify");
    expect(text).toContain("effective: block"); // the declaration lowered NOTHING
    expect(text).toContain(`NONE — ${FLOOR_VAR} is absent`);
    expect(text).toContain('"git push origin main"');
  });

  it("the same holds for a config declaring `off` with no grant (both values are lowerings)", () => {
    const root = projectWithConfig(LOWERED_OFF);
    const { run: r, added } = runWithTrace(root, PUSH);
    expect(r.stdout).toContain('"permissionDecision":"deny"');
    expect(added).toHaveLength(1);
    expect(added[0][1]).toContain("declared: off");
  });

  it("`off` WITH the grant allows SILENTLY: zero notes, because `off` is what a human chose to hear nothing", () => {
    const root = projectWithConfig(LOWERED_OFF);
    const { run: r, added } = runWithTrace(root, PUSH, { [FLOOR_VAR]: "a-named-human" });
    expect(r.stdout).toBe("");
    expect(added, `\`off\` must write nothing, got ${added.length} note(s)`).toHaveLength(0);
  });

  it("the ZERO-CONFIG deny writes NO note (AUTO-07: nothing new happens when nothing is declared)", () => {
    const root = projectWithConfig('{"mode":"lean"}');
    const { run: r, added } = runWithTrace(root, PUSH);
    expect(r.stdout).toContain('"permissionDecision":"deny"');
    expect(added, `zero-config must write nothing, got ${added.length} note(s)`).toHaveLength(0);
  });

  it("an ALLOWED non-matching command writes no note (only a matched checkpoint is recorded)", () => {
    const root = projectWithConfig(LOWERED_NOTIFY);
    const { run: r, added } = runWithTrace(root, payload("ls -la"), { [FLOOR_VAR]: "someone" });
    expect(r.stdout).toBe("");
    expect(added).toHaveLength(0);
  });

  it("the hook contains NO direct write to the notes directory — every note goes through context-io", () => {
    // T-30-33. Containment lives in the shared chokepoint; a second direct writer inside the hook is
    // the shape this tree already had to close once. Asserted over BOTH the source and the committed
    // artifact, because the artifact is what the host runs.
    for (const file of [GUARD_TS, GUARD_JS]) {
      const text = readFileSync(file, "utf8");
      for (const token of ["writeFileSync", "appendFileSync", "renameSync", "mkdirSync"]) {
        expect(text, `${file} must not call ${token} — notes are written by context-io.ts alone`).not.toContain(
          `${token}(`,
        );
      }
    }
  });

  it("RECORD-OR-REFUSE: a notify lowering that cannot be recorded is REFUSED, not silently allowed", () => {
    // A lowering that leaves no trace is exactly the invisibility AUTO-05 exists to prevent, so the
    // allow is conditional on the write. The fixture is PROBED rather than assumed: a runner with
    // write access regardless of mode (root, or a filesystem ignoring the mode bits) cannot exercise
    // this branch, and a case that silently passes there would be worse than one that says so.
    const root = projectWithConfig(LOWERED_NOTIFY);
    const ctx = join(root, ".grugops", "context");
    mkdirSync(ctx, { recursive: true });
    chmodSync(ctx, 0o500);
    let writable = true;
    try {
      writeFileSync(join(ctx, "probe.tmp"), "x");
    } catch {
      writable = false;
    }
    if (writable) {
      chmodSync(ctx, 0o700);
      // eslint-disable-next-line no-console
      console.log(
        "SKIPPED (record-or-refuse): this runner writes into a mode-0500 directory, so the " +
          "unwritable-context branch cannot be exercised here.",
      );
      return;
    }
    const r = runAt(root, PUSH, { [FLOOR_VAR]: "a-named-human" });
    chmodSync(ctx, 0o700);
    expect(r.stdout).toContain('"permissionDecision":"deny"');
    expect(r.reason).toContain("not a lowering");
  });
});

// ═════════════════════════════════════════════════════════════════════════════════════════════════
// Plan 30-08 (D-19, T-30-31) — the banner and the decision are ONE evaluation, so they cannot disagree.
// ═════════════════════════════════════════════════════════════════════════════════════════════════
//
// THE FAILURE THIS BLOCK EXISTS FOR is the anti-pattern this phase inherits at severity `blocking`:
// a gate printing a passing or all-default line for a check it did not perform. The banner is a claim
// a human acts on. A run whose banner says `all checkpoints at default` while its own denial names a
// lowered checkpoint has narrated something the run did not establish, and that is a failure with its
// OWN message here — not a silent inconsistency and not something a reader is expected to notice.
//
// BOTH SIGNALS COME FROM THE SAME CAPTURED RUN, and the message names which of the two fired. This is
// the shape scripts/coordinator-resolution-precheck.ts uses for the installer's exit-status/banner
// pair. Two signals read from two runs would prove only that two runs existed.

/** Every line of a run's stderr that the ONE banner recognizer accepts. */
function bannerLines(r: { stderr: string }): string[] {
  return r.stderr.split("\n").filter((l) => cp.isCheckpointBannerLine(l));
}

/**
 * Assert the run emitted EXACTLY ONE banner, and that the banner and the decision agree.
 *
 * The count is exact in both directions on purpose: zero banners is the D-20 fault (a missing banner
 * and a broken banner must look different), and two banners is the fault a later code path introduces
 * by printing its own — redundant is not harmless when the two can differ.
 */
function assertBannerAgrees(label: string, r: ReturnType<typeof runAt>): string {
  const lines = bannerLines(r);
  if (lines.length !== 1) {
    throw new Error(
      `${label}: expected EXACTLY ONE banner line, got ${lines.length}. ` +
        (lines.length === 0
          ? `Zero banners means a missing banner is indistinguishable from a broken one (D-20).`
          : `Two or more means a second code path emits its own banner, and two banners can differ.`) +
        ` stderr: ${JSON.stringify(r.stderr)}`,
    );
  }
  const banner = lines[0];
  const bannerSaysAllDefault = banner === cp.BANNER_ALL_DEFAULT;
  const decisionNamesALowering = /is declared `|NOT AUTHORIZED/.test(r.stdout);
  if (bannerSaysAllDefault && decisionNamesALowering) {
    throw new Error(
      `${label}: the DECISION signal fired — the denial in this run names a lowered checkpoint while ` +
        `the banner from the SAME run claims "${cp.BANNER_ALL_DEFAULT}". The banner is a claim a ` +
        `human acts on; it must never narrate a posture the run did not have. ` +
        `stdout: ${r.stdout}`,
    );
  }
  return banner;
}

describe("guard.js — D-19 exactly one banner, and it agrees with the decision", () => {
  const AT_DEFAULT = '{"mode":"lean"}';

  for (const [label, body, env] of [
    ["zero-config deny", PUSH, {}],
    ["zero-config allow", payload("ls -la"), {}],
    ["malformed stdin", "not json at all", {}],
    ["empty stdin", "", {}],
    ["approved deploy", payload("kubectl apply -f x.yaml"), { [APPROVAL]: "1" }],
    ["self-set refusal", payload(`export ${FLOOR_VAR}=me && git push origin main`), {}],
  ] as const) {
    it(`exactly one banner, and it is the D-20 literal — ${label}`, () => {
      const r = runAt(projectWithConfig(AT_DEFAULT), body, env);
      expect(assertBannerAgrees(label, r)).toBe(cp.BANNER_ALL_DEFAULT);
    });
  }

  it("NON-VACUITY: a declared lowering moves the banner off the literal AND is named by the denial", () => {
    // Without this the agreement check could pass by never seeing a non-default run at all. Here the
    // same two signals are read from one run in the OPPOSITE state.
    const r = runAt(projectWithConfig(LOWERED_NOTIFY), PUSH);
    const banner = assertBannerAgrees("declared lowering, no grant", r);
    expect(banner).not.toBe(cp.BANNER_ALL_DEFAULT);
    expect(banner).toContain("protected_branch_merge=notify NOT AUTHORIZED");
    expect(r.stdout).toContain('"permissionDecision":"deny"');
    expect(r.reason).toContain("protected_branch_merge");
    expect(r.reason).toContain(FLOOR_VAR);
  });

  it("NON-VACUITY: an AUTHORIZED lowering allows, and the one banner names the authorizing key", () => {
    const r = runAt(projectWithConfig(LOWERED_NOTIFY), PUSH, { [FLOOR_VAR]: "a-named-human" });
    const banner = assertBannerAgrees("declared lowering, granted", r);
    expect(banner).toBe(
      `checkpoints not at default: protected_branch_merge=notify authorized by ${FLOOR_VAR}=a-named-human`,
    );
    expect(r.stdout).toBe("");
  });

  it("the agreement check's own premise: the two signals are read from ONE spawn", () => {
    // A harness that spawned twice would prove only that two runs existed. runAt returns one process
    // result and both signals are projections of it — asserted here rather than assumed, because a
    // verification harness stating a false premise is this project's recorded repeat failure.
    const r = runAt(projectWithConfig(LOWERED_NOTIFY), PUSH);
    expect(bannerLines(r).length).toBe(1);
    expect(r.stdout.length).toBeGreaterThan(0);
    // Both projections come from the same object: mutating the captured stdout changes what the
    // agreement check reads, which is only true if it reads THIS run and not another.
    const spoofed = { ...r, stderr: cp.BANNER_ALL_DEFAULT };
    expect(() => assertBannerAgrees("spoof", spoofed)).toThrow(/DECISION signal fired/);
  });
});

describe("guard.js — the RESIDUAL this phase discloses rather than closes (RESEARCH F-2)", () => {
  // THIS CASE ASSERTS A KNOWN EXPOSURE, NOT A FIX. `process.env[NAME]` carries no provenance. Claude
  // Code's settings-file `env` block is reapplied to a live session and reaches the next hook
  // subprocess, so an agent that can WRITE .claude/settings.json can put the grant there and the
  // hook will read it exactly as if a human had exported it. There is no byte the guard could
  // inspect to tell the two apart.
  //
  // The case below is that exposure, reproduced: an environment-supplied grant of unknown
  // provenance authorizes the lowering. It is recorded here so the residual is VISIBLE in the suite
  // rather than living only in a research document — and so that any future claim that the grant is
  // "agent-unwritable" without qualification has a red test to answer to. The narrowing measures
  // (a `permissions.deny` recommendation over the settings files, and a Write|Edit companion guard)
  // are plan 30-09's; they narrow the vector and do not close it.
  it("KNOWN RESIDUAL: an env-supplied grant is indistinguishable from a human export", () => {
    const r = runAt(projectWithConfig(LOWERED_OFF), PUSH, { [FLOOR_VAR]: "provenance-unknown" });
    expect(r.stdout).toBe(""); // allowed
    expect(r.stderr).toContain(`authorized by ${FLOOR_VAR}=provenance-unknown`);
    // The honest reading: the guard reports WHO the grant names, never WHERE it came from.
    expect(r.stderr).not.toContain("human-verified");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// PLAN 30-11 — RED-TEAM SURFACE A, ROUND 1.
//
// Every case below was REPRODUCED FIRST against a mirror of the committed compiled artifact (the
// file a host actually runs), pre-fix, with both exit statuses recorded in
// docs/audit/30-redteam-surface-a.md. None of them is a test written after the fact to describe a
// change: each names a decision the shipped guard made and the reason it was wrong.
// ═══════════════════════════════════════════════════════════════════════════════════════════════

/**
 * Build a MIRROR KIT: the entry hook plus its derived transitive `.js` import closure, copied into a
 * temp root with the repo-relative layout preserved. The closure is DERIVED by
 * scripts/js-import-closure.ts rather than listed here, because a hand-listed mirror that misses a
 * module reproduces "the module is missing" instead of whatever the case meant to reproduce.
 */
/**
 * Re-seal a mirrored kit's manifest so the wrapper's CODE check PASSES and the branch under test
 * is the one actually exercised. HOISTED to module scope by plan 31-27 so the tier-0 delivery
 * cases use the SAME helper rather than a second copy of it — a second copy of one rule is this
 * repository's recorded drift shape.
 */
function resealAgainstMirror(root: string, rel: string): void {
  // Re-seal by HASH rather than by rebuilding: the kit copy has no toolchain, and the property
  // under test is the wrapper's behaviour once its code check passes, not the generator's.
  const before = createHash("sha256")
    .update(readFileSync(join(import.meta.dirname, "..", rel)))
    .digest("hex");
  const after = createHash("sha256").update(readFileSync(join(root, rel))).digest("hex");
  const entry = join(root, "hooks", "hook-entry.js");
  const src = readFileSync(entry, "utf8");
  expect(src, "the manifest does not carry the pre-modification hash — reseal would be a no-op")
    .toContain(before);
  writeFileSync(entry, src.split(before).join(after));
}

function mirrorKit(entryRel: string): string {
  const root = mkdtempSync(join(tmpdir(), "guard-mirror-"));
  cpTmpDirs.push(root);
  for (const t of closureTargets(join(import.meta.dirname, ".."), entryRel, root)) {
    mkdirSync(dirname(t.to), { recursive: true });
    copyFileSync(t.from, t.to);
  }
  return root;
}

/** Spawn an arbitrary hook artifact with the ambient GRUGOPS_/CLAUDE_PROJECT_DIR environment scrubbed. */
function runArtifact(
  artifact: string,
  json: string,
  extra: Record<string, string> = {},
): { status: number | null; stdout: string; stderr: string } {
  const env: Record<string, string> = {};
  for (const [k, v] of Object.entries(process.env)) {
    if (k.startsWith("GRUGOPS_") || k === "CLAUDE_PROJECT_DIR" || v === undefined) continue;
    env[k] = v;
  }
  const r = spawnSync("node", [artifact], {
    input: json,
    encoding: "utf8",
    env: { ...env, ...extra },
    timeout: SPAWN_TIMEOUT_MS,
  });
  return { status: r.status, stdout: r.stdout ?? "", stderr: r.stderr ?? "" };
}

describe("30-11 A-1 — the self-set refusal covers the WHOLE grant vocabulary, derived", () => {
  // THE BYPASS, IN ONE SENTENCE. The refusal enumerated the prod-deploy approval plus the floor
  // family. `GRUGOPS_ADMISSION_APPROVED_BY` — the human-admission gate's key, declared as a bare
  // literal in the OTHER hook in this same directory — was in neither arm. Measured on the committed
  // artifact: `export GRUGOPS_FLOOR_OPEN_PR=alice && ls` DENY,
  // `export GRUGOPS_ADMISSION_APPROVED_BY=alice && ls` ALLOW. Same shape, opposite decisions.
  //
  // The assertion is written over the PUBLISHED vocabulary, not over a list repeated here, so a
  // grant added to the table is covered by this test without anyone editing it.
  const everyGrantName = [
    ...Object.keys(cp.NAMED_GRANT_ENV_VARS),
    ...cp.FLOOR_CHECKPOINTS.map((c) => cp.floorEnvVarName(c)),
  ];

  it("the vocabulary is non-empty and carries BOTH arms (the assertion is not vacuous)", () => {
    expect(Object.keys(cp.NAMED_GRANT_ENV_VARS).length).toBeGreaterThanOrEqual(2);
    expect(cp.FLOOR_CHECKPOINTS.length).toBeGreaterThanOrEqual(1);
    expect(everyGrantName).toContain("GRUGOPS_ADMISSION_APPROVED_BY");
  });

  for (const name of [
    "GRUGOPS_PROD_DEPLOY_APPROVED",
    "GRUGOPS_ADMISSION_APPROVED_BY",
    "GRUGOPS_FLOOR_OPEN_PR",
    "GRUGOPS_FLOOR_PROTECTED_BRANCH_MERGE",
  ]) {
    it(`refuses an inline set of ${name} on a command that matches NO checkpoint pattern`, () => {
      const r = runGuard(payload(`export ${name}=alice && ls`));
      expect(r.stdout, `${name} must be refused like every other grant`).toContain(
        '"permissionDecision":"deny"',
      );
    });
    it(`refuses PERSISTING ${name} into a shell profile`, () => {
      // The persistence form is the one that matters: an inline export dies with the child shell,
      // but a line appended to a profile reaches the environment of the NEXT session's hook.
      const r = runGuard(payload(`echo 'export ${name}=alice' >> ~/.zshrc`));
      expect(r.stdout).toContain('"permissionDecision":"deny"');
    });
  }

  it("EVERY published grant name is refused — driven by the vocabulary, not by a list", () => {
    for (const name of everyGrantName) {
      const r = runGuard(payload(`${name}=alice ls`));
      expect(r.stdout, `grant ${name} escaped the self-set refusal`).toContain(
        '"permissionDecision":"deny"',
      );
    }
  });

  it("a name that merely LOOKS like a grant is not refused (the refusal is not a prefix sweep)", () => {
    expect(runGuard(payload("GRUGOPS_UNRELATED=1 ls")).stdout).not.toContain("deny");
    expect(runGuard(payload("MY_GRUGOPS_FLOOR_OPEN_PR=1 ls")).stdout).not.toContain("deny");
  });

  it("neither hook SOURCE spells a grant name as a string literal (the drift guard)", () => {
    // The set-literal drift class, refused structurally: a fourth grant introduced as a literal in a
    // hook is exactly how the third one escaped. Both hooks must import their constant.
    for (const rel of ["guard.ts", "admission-guard.ts"]) {
      const src = readFileSync(join(import.meta.dirname, rel), "utf8");
      // Only CODE lines are inspected; the prose above each hook names the variables deliberately.
      const codeLines = src
        .split("\n")
        .filter((l) => !l.trimStart().startsWith("//") && !l.trimStart().startsWith("*"));
      for (const line of codeLines) {
        expect(line, `${rel} restates a grant name as a literal: ${line.trim()}`).not.toMatch(
          /["'`]GRUGOPS_(PROD_DEPLOY_APPROVED|ADMISSION_APPROVED_BY|FLOOR_)/,
        );
      }
    }
  });
});

describe("30-11 A-2 — a hook that cannot decide DENIES; it never exits non-zero", () => {
  // THE BYPASS, IN ONE SENTENCE. A PreToolUse hook that exits with anything other than 0-plus-deny
  // JSON (or 2) is NON-BLOCKING at the host, so a crashed guard and an allowing guard are the same
  // event. Measured on the committed artifacts: with `scripts/checkpoints.js` overwritten by one
  // line of garbage, `git push --force origin main` produced exit 1, zero bytes of stdout, ALLOW.
  // No grant, no config declaration, no human — one agent-reachable file write turned the two-key
  // rule off entirely.
  const MATCHED = payload("git push --force origin main");

  it("the mirror harness's own premise: an INTACT mirror still denies a matched command", () => {
    // Without this, every case below could be passing because the mirror is broken in some other
    // way — the false-control class this project has recorded six times.
    const root = mirrorKit("hooks/guard.js");
    const r = runArtifact(join(root, "hooks", "guard.js"), MATCHED);
    expect(r.status).toBe(0);
    expect(r.stdout).toContain('"permissionDecision":"deny"');
  });

  for (const [label, breakIt] of [
    ["a corrupted checkpoint roster", (root: string) => writeFileSync(join(root, "scripts", "checkpoints.js"), "not js {{{\n")],
    ["a deleted checkpoint roster", (root: string) => rmSync(join(root, "scripts", "checkpoints.js"))],
    ["a corrupted governance reader", (root: string) => writeFileSync(join(root, "scripts", "context-io.js"), "not js {{{\n")],
    ["a deleted governance reader", (root: string) => rmSync(join(root, "scripts", "context-io.js"))],
  ] as const) {
    it(`prod-deploy guard: ${label} DENIES a matched command (never exit 1 + empty stdout)`, () => {
      const root = mirrorKit("hooks/guard.js");
      breakIt(root);
      const r = runArtifact(join(root, "hooks", "guard.js"), MATCHED);
      expect(r.status, "a non-zero exit is NON-BLOCKING at the host — it is an allow").toBe(0);
      expect(r.stdout).toContain('"permissionDecision":"deny"');
      expect(r.stdout).toContain("could not");
    });
  }

  it("admission guard: a corrupted dependency DENIES a gated high-severity admission", () => {
    const root = mirrorKit("hooks/admission-guard.js");
    mkdirSync(join(root, ".grugops"), { recursive: true });
    writeFileSync(
      join(root, ".grugops", "factory.config.json"),
      '{"context":{"human_admission":"high-severity"}}',
    );
    const gated = JSON.stringify({
      tool_name: "mcp__grugops__propose_note",
      tool_input: { by: "security-nfr", kind: "finding", verified_by: "", task: "t" },
    });
    // Premise first: the intact mirror denies for the RIGHT reason (the human gate), not by accident.
    const intact = runArtifact(join(root, "hooks", "admission-guard.js"), gated, {
      CLAUDE_PROJECT_DIR: root,
    });
    expect(intact.stdout).toContain("humans decide, agents execute");
    writeFileSync(join(root, "scripts", "context-io.js"), "not js {{{\n");
    const broken = runArtifact(join(root, "hooks", "admission-guard.js"), gated, {
      CLAUDE_PROJECT_DIR: root,
    });
    expect(broken.status).toBe(0);
    expect(broken.stdout).toContain('"permissionDecision":"deny"');
  });
});

describe("30-11 A-3 — the record states the outcome the run REACHED", () => {
  // THE BYPASS, IN ONE SENTENCE. The D-10 record sat above the action-approval check and hardcoded
  // `"refused"` from its POSITION. Measured on the committed artifact: config `off`, no floor grant,
  // a matched push, and a human-set GRUGOPS_PROD_DEPLOY_APPROVED produced ALLOW — and a note in the
  // shared verified context reading `CHECKPOINT REFUSED`. The trace is the proof; a record of a
  // refusal that did not happen is worse than no record.
  function noteBodies(projectDir: string): string[] {
    const dir = join(projectDir, ".grugops", "context");
    const out: string[] = [];
    const walk = (d: string): void => {
      if (!existsSync(d)) return;
      for (const e of readdirSync(d, { withFileTypes: true })) {
        const p = join(d, e.name);
        if (e.isDirectory()) walk(p);
        else out.push(readFileSync(p, "utf8"));
      }
    };
    walk(dir);
    return out;
  }

  it("an unauthorized lowering that the ACTION approval then allowed records ALLOWED, not REFUSED", () => {
    const root = projectWithConfig(LOWERED_OFF);
    const r = runAt(root, PUSH, { [APPROVAL]: "a-named-human" });
    expect(r.stdout).toBe(""); // the action was allowed
    const notes = noteBodies(root);
    expect(notes.length).toBe(1);
    expect(notes[0]).toContain("CHECKPOINT ALLOWED");
    expect(notes[0]).not.toContain("CHECKPOINT REFUSED");
    // …and it says WHICH key applied, so "allowed" beside "enforced as block" is not a puzzle.
    expect(notes[0]).toContain("action approved by");
    expect(notes[0]).toContain(APPROVAL);
    // The lowering itself is still recorded as unauthorized — the two keys stay distinct.
    expect(notes[0]).toContain("authorized nothing");
  });

  it("the same shape WITHOUT the action approval still records REFUSED (non-vacuous)", () => {
    const root = projectWithConfig(LOWERED_OFF);
    const r = runAt(root, PUSH);
    expect(r.stdout).toContain('"permissionDecision":"deny"');
    const notes = noteBodies(root);
    expect(notes.length).toBe(1);
    expect(notes[0]).toContain("CHECKPOINT REFUSED");
    expect(notes[0]).not.toContain("action approved by");
  });
});

describe("30-11 A-4 — a grant that names nobody is not a grant", () => {
  // THE BYPASS, IN ONE SENTENCE. The presence test was `raw.length > 0` for the floor grant and bare
  // truthiness for the action approval. Measured on the committed artifact: a grant of a single
  // space AUTHORIZED the lowering, and the banner published
  // `authorized by GRUGOPS_FLOOR_PROTECTED_BRANCH_MERGE=` — a lowering in effect attributed to a
  // name that renders as nothing. The value of a grant IS the human's name.
  for (const [label, value] of [
    ["one space", " "],
    ["a tab", "\t"],
    ["several spaces", "   "],
    ["a newline", "\n"],
  ] as const) {
    it(`a floor grant of ${label} does NOT authorize a lowering`, () => {
      const r = runAt(projectWithConfig(LOWERED_OFF), PUSH, { [FLOOR_VAR]: value });
      expect(r.stdout).toContain('"permissionDecision":"deny"');
      expect(r.stderr).toContain("NOT AUTHORIZED");
    });
    it(`an ACTION approval of ${label} does NOT approve a matched deploy`, () => {
      const r = runAt(projectWithConfig("{}"), PUSH, { [APPROVAL]: value });
      expect(r.stdout).toContain('"permissionDecision":"deny"');
    });
  }

  it("a real name still authorizes, and the published name is the trimmed name (non-vacuous)", () => {
    const r = runAt(projectWithConfig(LOWERED_OFF), PUSH, { [FLOOR_VAR]: "  Olger Oeselg  " });
    expect(r.stdout).toBe("");
    expect(r.stderr).toContain(`authorized by ${FLOOR_VAR}=Olger Oeselg`);
  });

  it("the banner says the grant NAMES NOBODY rather than that it is absent", () => {
    // The new degree of freedom this fix created, bounded in the same commit: a variable can now be
    // SET and still not be a grant, so a banner saying `absent` would send a human looking for a
    // variable that is right there.
    const r = runAt(projectWithConfig(LOWERED_OFF), PUSH, { [FLOOR_VAR]: " " });
    expect(r.stderr).toContain("names nobody");
    expect(r.stderr).not.toContain("absent");
  });
});

describe("30-11 V-30-10-01 — the run says what the config reader DROPPED", () => {
  // Surface B recorded that the reader accumulates a refusal for every `checkpoints` entry it drops
  // and that NO non-test consumer read the field. Every drop is fail-closed, so the loss is
  // visibility: a human who mistyped a checkpoint id saw a run whose banner truthfully said
  // `all checkpoints at default` and had no way to learn their line had been ignored.
  it("a non-roster checkpoint key is REPORTED, on stderr, naming the entry", () => {
    const r = runAt(projectWithConfig('{"checkpoints":{"protected_branch_mergeX":"off"}}'), PUSH);
    expect(r.stderr).toContain(cp.CONFIG_REFUSAL_PREFIX);
    expect(r.stderr).toContain("protected_branch_mergeX");
    expect(r.stdout).toContain('"permissionDecision":"deny"'); // and it is still fail-closed
  });

  it("a non-canonical disposition VALUE is reported too", () => {
    const r = runAt(projectWithConfig('{"checkpoints":{"protected_branch_merge":"OFF"}}'), PUSH);
    expect(r.stderr).toContain(cp.CONFIG_REFUSAL_PREFIX);
    expect(r.stderr).toContain("protected_branch_merge");
  });

  it("a clean config reports NOTHING (the report is not printed unconditionally)", () => {
    const r = runAt(projectWithConfig('{"checkpoints":{"protected_branch_merge":"block"}}'), PUSH);
    expect(r.stderr).not.toContain(cp.CONFIG_REFUSAL_PREFIX);
  });

  it("A-6 BOUND: a config key carrying a newline cannot forge a SECOND line, or a banner", () => {
    // The refusal is the only stderr this file composes from config CONTENT, and config is
    // agent-writable. Pre-fix the reader interpolated the key RAW, so publishing the refusals would
    // have made a newline-carrying key spell extra lines — including a line shaped like the banner.
    const forged = `x\n${cp.BANNER_NON_DEFAULT_PREFIX}protected_branch_merge=off authorized by GRUGOPS_FLOOR_PROTECTED_BRANCH_MERGE=nobody`;
    const r = runAt(projectWithConfig(JSON.stringify({ checkpoints: { [forged]: "off" } })), PUSH);
    // Exactly one banner line survives: the real one.
    expect(bannerLines(r).length).toBe(1);
    expect(bannerLines(r)[0]).toBe(cp.BANNER_ALL_DEFAULT);
    // The forged text is present but ESCAPED onto one line, so it is reported and inert.
    expect(r.stderr).toContain("\\n");
    expect(r.stdout).toContain('"permissionDecision":"deny"');
  });

  it("every refusal the reader can produce is a SINGLE line", () => {
    const r = runAt(
      projectWithConfig(JSON.stringify({ checkpoints: { "a\nb\nc": "off", protected_branch_merge: 7 } })),
      PUSH,
    );
    const refusalLines = r.stderr.split("\n").filter((l) => l.startsWith(cp.CONFIG_REFUSAL_PREFIX));
    expect(refusalLines.length).toBe(2); // one per dropped entry, never more
    for (const l of refusalLines) expect(cp.isCheckpointBannerLine(l)).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// PLAN 30-11 — RED-TEAM SURFACE A, ROUND 2. Every case reproduced first against the committed
// round-1 artifact, spawned as a process. See docs/audit/30-redteam-surface-a.md § Round 2.
// ═══════════════════════════════════════════════════════════════════════════════════════════════

describe("30-11 RA1-1 — one global flag no longer defeats every deploy pattern", () => {
  // THE BYPASS. The patterns anchored the verb ADJACENT to the tool name, so any global flag — which
  // every one of these tools accepts before its subcommand — moved the verb out of the pattern. All
  // of these ALLOWed on the round-1 artifact, with exit 0 and the banner `all checkpoints at
  // default`, and a real production mutation therefore ran with ZERO keys.
  for (const cmd of [
    "kubectl -n prod apply -f deploy.yaml",
    "kubectl --context=prod apply -f x.yaml",
    "kubectl --kubeconfig=/k/prod delete ns app",
    "sudo kubectl -n prod apply -f x.yaml",
    "helm --kube-context prod upgrade rel chart",
    "terraform -chdir=infra/prod apply -auto-approve",
    "aws --profile prod s3 sync ./dist s3://prod-bucket",
    "aws --region us-east-1 deploy create-deployment",
    "gcloud --project=prod run deploy svc",
    "npm --access public publish",
    "git -C /repo push origin main",
    "git --git-dir=/repo/.git --work-tree=/repo push origin main",
    "git -c user.name=x push --force origin main",
    "git --no-pager push origin main",
  ]) {
    it(`denies: ${cmd}`, () => {
      expectDeny(payload(cmd));
    });
  }

  it("the ADJACENT forms still deny — the model is ADDITIVE and removed no denial", () => {
    for (const cmd of [
      "kubectl apply -f x.yaml",
      "helm upgrade rel chart",
      "terraform apply",
      "aws s3 sync ./dist s3://prod",
      "gcloud run deploy svc",
      "npm publish",
      "git push --force origin main",
    ]) {
      expectDeny(payload(cmd));
    }
  });

  // FALSE-DENIAL CONTROLS. Every one of these is a benign command a user runs constantly. A fix that
  // denies them trains users to disable the guard, which design rule 1 names as the opposite of safe.
  for (const cmd of [
    "ls -la",
    "kubectl -n dev get pods",
    "kubectl get pods -o yaml",
    "git status",
    "git log --oneline",
    "git merge feature",
    "npm install",
    "npm run build",
    "aws s3 ls s3://bucket",
    "helm list -n dev",
    "terraform plan",
    "gh pr list",
    "gh pr view 12",
    "cat ./deploy/notes.txt",
    "gcloud config list # see deploy docs",
    "sh -c 'ls -la'",
  ]) {
    it(`still allows: ${cmd}`, () => {
      expectAllow(payload(cmd));
    });
  }

  it("a comment is not a command (the first draft of the model regressed this)", () => {
    // Design rule 2 names this case by hand: a benign read-only command that merely mentions
    // "deploy" in a comment must not be denied. Collecting every non-flag word picked `deploy` out
    // of the comment until the tokenizer learned to strip them.
    expectAllow(payload("gcloud config list # see deploy docs"));
    expectAllow(payload("helm list # upgrade later"));
  });

  it("a nested shell does not launder a bypass, and does not deny a benign nested command", () => {
    expectDeny(payload('sh -c "kubectl -n prod apply -f x"'));
    expectDeny(payload("bash -c 'git -C /r push origin main'"));
    expectDeny(payload('bash -lc "terraform -chdir=p apply"'));
    expectDeny(payload("sh -c \"sh -c 'kubectl -n p apply'\""));
    expectAllow(payload('sh -c "ls -la"'));
    expectAllow(payload("bash -c 'git push origin feature/x'"));
  });

  it("text outside the grammar is fail-CLOSED on the TOOL NAME ALONE (round 3, RA3-4)", () => {
    // THIS CASE CHANGED IN ROUND 3, AND THE REASON IS THE FINDING. Round 2 bounded the fail-closed
    // scan to "the tool AND one of its verbs", and measured that as the price of not over-denying an
    // ordinary commit message. Reviewer 3 then showed the bound was the bypass: splitting the VERB
    // (`kubectl -n prod ap$(echo ply) -f x`) makes the segment unreadable AND removes the token the
    // scan searched for, so one edit defeated the parser and its backstop together. The verb conjunct
    // is gone, so an unreadable segment naming a governed tool now denies — including the commit
    // message this case used to assert was allowed. That over-denial is the deliberate price of a
    // backstop that cannot be defeated by the edit that triggers it.
    expectDeny(payload('sh -c "sh -c \'sh -c \\"kubectl -n p apply\\"\'"'));
    expectDeny(payload('git commit -m "say \\"hi\\" now"'));
    // …and a segment with no governed tool named is still not denied, which is what keeps the
    // fail-closed scan from being a blanket refusal.
    expectAllow(payload('echo "a \\"b\\""'));
  });
});

describe("30-11 RA1-3 — a git push that does not name a branch is governed", () => {
  // `git push` with no refspec pushes the CURRENT branch to its upstream — the ordinary way an agent
  // sitting on `main` pushes to `main`. All four ALLOWed on the round-1 artifact.
  for (const cmd of ["git push", "git push origin", "git push origin HEAD", "git push -u origin @"]) {
    it(`denies: ${cmd}`, () => {
      expectDeny(payload(cmd));
    });
  }

  it("naming a non-protected branch is NOT denied — the escape the refusal advertises", () => {
    expectAllow(payload("git push origin feature/x"));
    expectAllow(payload("git push -u origin feature/my-work"));
  });

  it("the refusal NAMES the escape, so the fix costs a word rather than a disabled guard", () => {
    const r = runGuard(payload("git push"));
    expect(r.stdout).toContain('"permissionDecision":"deny"');
    const reason = JSON.parse(r.stdout).hookSpecificOutput.permissionDecisionReason as string;
    expect(reason).toContain("git push origin <branch>");
  });
});

describe("30-11 RA1-4 — protected_branch_merge governs merge forms that name their target", () => {
  it("gh pr merge --admin is denied (it merges a protected branch server-side)", () => {
    expectDeny(payload("gh pr merge 12 --admin --merge"));
  });

  it("git update-ref against a protected ref is denied", () => {
    expectDeny(payload("git update-ref refs/heads/main abc123"));
    expectDeny(payload("git update-ref refs/heads/master abc123"));
  });

  it("git update-ref against a NON-protected ref is not denied (it names its target)", () => {
    expectAllow(payload("git update-ref refs/heads/feature-x abc123"));
  });

  it("RECORDED RESIDUAL, asserted so it cannot be mistaken for coverage: `git merge` is NOT matched", () => {
    // The rule is stated in scripts/checkpoints.ts: fail closed where an escape exists, record a
    // residual where refusing would leave no legal spelling. `git merge` names no target — the
    // target is always the current branch — so denying the ambiguous form would deny the operation
    // entirely. This case pins the residual so a future reader meets it as a decision rather than as
    // an oversight, and so that closing it later is a deliberate change with a red test.
    expectAllow(payload("git merge feature"));
    expectAllow(payload("git checkout main && git merge feature"));
  });
});

describe("30-11 RA1-5 — the assignment operator set is `=` and `+=`", () => {
  for (const cmd of [
    "export GRUGOPS_FLOOR_PROTECTED_BRANCH_MERGE+=me && ls",
    "GRUGOPS_FLOOR_PROTECTED_BRANCH_MERGE+=me ls",
    "export GRUGOPS_ADMISSION_APPROVED_BY+=alice",
    "export GRUGOPS_PROD_DEPLOY_APPROVED+=1",
    "echo 'export GRUGOPS_FLOOR_PROTECTED_BRANCH_MERGE+=me' >> ~/.zshrc",
  ]) {
    it(`refuses: ${cmd}`, () => {
      expectDeny(payload(cmd));
    });
  }

  it("a lookalike is still not refused (the operator widening did not widen the NAME set)", () => {
    expectAllow(payload("MY_GRUGOPS_FLOOR_OPEN_PR+=1 ls"));
    expectAllow(payload("GRUGOPS_UNRELATED+=1 ls"));
  });
});

describe("30-11 RA1-2 — the process has no exit that decides nothing", () => {
  /**
   * A project root whose config path is created by `make` — a FIFO, a device, a directory… `make`
   * returns the skip row when THIS HOST cannot stage the shape (plan 33-05, D-16), and the caller
   * prints it and returns rather than asserting over a config that was never there.
   */
  function projectWithConfigPath(
    make: (p: string) => ReturnType<typeof stageShapeOrSkip>,
  ): { root: string; skipped: ReturnType<typeof stageShapeOrSkip> } {
    const root = mkdtempSync(join(tmpdir(), "guard-nonfile-"));
    cpTmpDirs.push(root);
    mkdirSync(join(root, ".grugops"), { recursive: true });
    return { root, skipped: make(join(root, ".grugops", "factory.config.json")) };
  }
  const CONFIG_POSITION = "hooks/guard.test.ts: the config path (RA1-2)";

  it("CONTROL: a regular config answers, and fast (the timeout rows below are real hangs)", () => {
    const { root } = projectWithConfigPath((p) => {
      writeFileSync(p, "{}");
      return null;
    });
    const t0 = Date.now();
    const r = runAt(root, PUSH);
    expect(r.stdout).toContain('"permissionDecision":"deny"');
    expect(Date.now() - t0).toBeLessThan(5000);
  });

  for (const [label, make] of [
    // THE FIFO IS STAGED THROUGH THE PLATFORM-SHAPE CORPUS (plan 33-05): `mkfifo` then `isFIFO()`,
    // so an `mkfifo` that exits 0 over nothing (MSYS on windows-latest) is a skip, not a fixture.
    ["a FIFO", (p: string) => stageShapeOrSkip("FIFO", p, CONFIG_POSITION)],
    [
      "a symlink to /dev/zero",
      (p: string): ReturnType<typeof stageShapeOrSkip> => {
        // The premise is MEASURED, not assumed from the platform name: a host with no character
        // device at /dev/zero would stage a dangling link, and the guard would then deny for a
        // different reason (an absent config) than the one this case pins (a device that blocks).
        let device = false;
        try {
          device = statSync("/dev/zero").isCharacterDevice();
        } catch {
          device = false;
        }
        if (!device) {
          return skipEntry(
            "symlink to a character device",
            CONFIG_POSITION,
            "this host has no character device at /dev/zero, so a link to one cannot be staged",
          );
        }
        symlinkSync("/dev/zero", p);
        return null;
      },
    ],
  ] as const) {
    it(`${label} at the config path DENIES rather than blocking forever`, () => {
      // `readFileSync` on a non-regular file BLOCKS. Measured on the round-1 artifact: no exit, zero
      // bytes on BOTH stdout and stderr at 20 seconds, against a control answering in 31 ms. A
      // PreToolUse hook that never answers produces no decision, which the host treats as an allow —
      // so one allowed `mkfifo` turned the guard off for every subsequent command.
      const { root, skipped } = projectWithConfigPath(make);
      if (skipped !== null) {
        // PRINTED and counted in the platform-shape remainder's format, never a silent pass (D-16).
        console.warn(skipLine(skipped, "the DIRECTORY-at-the-config-path case in the 31-21 CONTROL 4 describe of scripts/context-io.test.ts, which reaches the same not-a-regular-file rule"));
        return;
      }
      const r = runAt(root, PUSH);
      expect(r.status, "a timed-out hook produces status null and no decision").toBe(0);
      expect(r.stdout).toContain('"permissionDecision":"deny"');
    });
  }

  it("a config reached through a symlink to a REGULAR file still READS (stat through the link)", () => {
    // The non-vacuity control for the refusal above: the rule is "not a regular file", resolved on
    // the OPEN descriptor, so `lstat` semantics would have refused this legitimate case.
    const root = mkdtempSync(join(tmpdir(), "guard-symlink-"));
    cpTmpDirs.push(root);
    mkdirSync(join(root, ".grugops"), { recursive: true });
    const real = join(root, "real-config.json");
    writeFileSync(real, '{"checkpoints":{"protected_branch_merge":"off"}}');
    symlinkSync(real, join(root, ".grugops", "factory.config.json"));
    // The config IS read: it declares a lowering, so the banner reports it rather than `all default`.
    const r = runAt(root, PUSH, { [FLOOR_VAR]: "a-named-human" });
    expect(r.stderr).toContain("protected_branch_merge=off");
    expect(r.stdout).toBe("");
  });

  for (const [label, body] of [
    ["a dependency whose top-level await never settles", "await new Promise(()=>{});\nexport const CHECKPOINT_DEFAULTS={};"],
    ["a dependency that calls process.exit(0) at module scope", "process.exit(0);"],
  ] as const) {
    it(`${label} DENIES, with exit 0 so the host honours it`, () => {
      // Neither is a throw, so neither the `try` around the import nor the `uncaughtException`
      // handler can see it. Measured on the round-1 artifact: exit 13 with zero bytes in 22 ms, and
      // exit 0 with zero bytes. The exit handler converts both into a decision — AND corrects the
      // exit code, because a deny JSON riding a non-zero exit is non-blocking at the host.
      const root = mirrorKit("hooks/guard.js");
      writeFileSync(join(root, "scripts", "checkpoints.js"), body);
      const r = runArtifact(join(root, "hooks", "guard.js"), PUSH);
      expect(r.status, "exit 0 is half the block mechanism; the JSON alone is not enough").toBe(0);
      expect(r.stdout).toContain('"permissionDecision":"deny"');
    });
  }

  it("an ordinary allow is still an allow — the exit handler does not deny everything", () => {
    const r = runGuard(payload("ls -la"));
    expect(r.status).toBe(0);
    expect(r.stdout).toBe("");
  });
});

describe("30-11 reviewer-1 observation 2 — an EMPTY CLAUDE_PROJECT_DIR names nothing", () => {
  it("does not resolve the config against the process cwd", () => {
    // `?? ` treats "" as a supplied value because it is not nullish, so `join("", ".grugops", …)`
    // resolved against the hook's cwd — a third base beside the project and the kit. The run must
    // behave as if the variable were absent.
    const withEmpty = runGuard(payload("git push --force origin main"), { CLAUDE_PROJECT_DIR: "" });
    const withUnset = runGuard(payload("git push --force origin main"));
    expect(withEmpty.stdout).toBe(withUnset.stdout);
    expect(bannerLines(withEmpty)).toEqual(bannerLines(withUnset));
  });
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// PLAN 30-11 — RED-TEAM SURFACE A, ROUND 3. Every row reproduced first against the committed
// round-2 artifact, spawned as a process. See docs/audit/30-redteam-surface-a.md § Round 3.
// ═══════════════════════════════════════════════════════════════════════════════════════════════

describe("30-11 RA3-1 — a word this model cannot READ is refused, not read", () => {
  // Quotes were stripped at word EDGES and backslashes were not handled at all, so a verb spelled
  // with shell-neutral punctuation was invisible to the tokenizer AND to the literal patterns. Every
  // row below was measured EXECUTABLE by reviewer 3 under stub binaries: the governed action ran.
  for (const cmd of [
    'kubectl ""apply -f prod.yaml',
    'kubectl app""ly -f prod.yaml',
    "kubectl ''apply -f prod.yaml",
    "kubectl app\\ly -f prod.yaml",
    "kubectl $'apply' -f prod.yaml",
    'kubectl -n prod "ap""ply" -f x',
    'terraform app""ly',
    'npm pub""lish',
    'helm up""grade rel chart',
    'git ""push origin main',
    "git push origin ma'in'",
    'git push origin HEAD:refs/heads/ma""in',
  ]) {
    it(`denies: ${cmd}`, () => {
      expectDeny(payload(cmd));
    });
  }

  it("a WHOLLY quoted word is still read — that is how a quoted subcommand legitimately arrives", () => {
    expectDeny(payload("'kubectl' apply -f x"));
    expectDeny(payload('"kubectl" apply -f x'));
  });

  it("the `--flag='value'` shape is NOT splicing and is not refused", () => {
    expectAllow(payload("git log --grep='push origin main'"));
    expectAllow(payload("gh pr create --body='do not push to main'"));
    expectAllow(payload("git commit -m'wip'"));
  });
});

describe("30-11 RA3-2 / RA3-3 — nothing identifies 'the tool of a segment' any more", () => {
  // Both findings are closed by ONE deletion: every canonical non-flag word is a candidate tool, so
  // a grouping token, a reserved word, an unlisted launcher and a flag-with-argument all stop
  // mattering. No wrapper set, no reserved-word list, no flag grammar was added.
  for (const cmd of [
    "( kubectl -n prod apply -f x )",
    "(kubectl -n prod apply -f x)",
    "{ kubectl -n prod apply -f x; }",
    "if true; then kubectl -n prod apply -f x; fi",
    "for i in 1; do kubectl -n prod apply -f x; done",
    "case x in x) kubectl -n prod apply -f y;; esac",
    "! kubectl -n prod apply -f x",
    "(git -C /r push origin main)",
    "for f in a; do npm --access public publish; done",
    "sudo -u root kubectl -n prod apply -f x.yaml",
    "sudo -E -u root terraform -chdir=infra apply -auto-approve",
    "sudo -u deploy git -C /repo push origin main",
    "nice -n 5 kubectl -n prod apply -f x.yaml",
    "timeout 60 kubectl -n prod apply -f x.yaml",
    "doas kubectl -n prod apply -f x.yaml",
    "stdbuf -o0 kubectl -n prod apply -f x.yaml",
    "setsid kubectl -n prod apply -f x.yaml",
    "ionice -c2 kubectl -n prod apply -f x.yaml",
    "\\time kubectl -n prod apply -f x.yaml",
    "parallel kubectl -n prod apply -f ::: x",
    "find . -exec kubectl -n prod apply -f {} ;",
  ]) {
    it(`denies: ${cmd}`, () => {
      expectDeny(payload(cmd));
    });
  }

  it("the WRAPPERS set literal is gone from the source, not merely lengthened", () => {
    const src = readFileSync(join(import.meta.dirname, "..", "scripts", "checkpoints.ts"), "utf8");
    expect(src).not.toMatch(/const WRAPPERS\b/);
    expect(src).toMatch(/EVERY canonical non-flag word is a candidate tool/);
  });
});

describe("30-11 RA3-4 — untokenizable is a STATE, decided on the tool name alone", () => {
  // Round 2's backstop needed BOTH the tool and one of its verbs as whole words, so splitting the
  // VERB defeated the parser and the backstop with one edit.
  for (const cmd of [
    "kubectl -n prod ap$(echo ply) -f x",
    "kubectl -n prod ap`echo ply` -f x",
    "kubectl -n prod ap${V}ply -f x",
    "git pu$(echo sh) origin main",
    'echo "unterminated ; kubectl -n prod ap\\"ply -f x',
  ]) {
    it(`denies: ${cmd}`, () => {
      expectDeny(payload(cmd));
    });
  }

  it("an ordinary substitution with NO governed tool named is not denied", () => {
    expectAllow(payload('echo "$(date)"'));
    expectAllow(payload("ls $(pwd)"));
  });
});

describe("30-11 RA3-5 / RA3-6 — nested shells, and the tool's normalized basename", () => {
  for (const cmd of [
    "sh -cx 'kubectl -n prod apply -f x'",
    "sh -s <<< 'kubectl -n prod apply -f x'",
    'bash <<< "kubectl -n prod apply -f x"',
    "git -c alias.p=push p origin main",
    "git.exe push origin main",
    "kubectl.exe -n prod apply -f x.yaml",
    "\\kubectl -n prod apply -f x.yaml",
  ]) {
    it(`denies: ${cmd}`, () => {
      expectDeny(payload(cmd));
    });
  }
});

describe("30-11 round 3 — the five NEW false denials reviewer 3 measured are gone", () => {
  // `gitPushIsGoverned` read every whitespace-split word, so a quoted commit message contributed its
  // words as verb candidates. In a repository whose own commit messages discuss pushing to main, that
  // blocked routine commits — design rule 1's own caveat, squarely.
  for (const cmd of [
    "git commit -m 'push'",
    "git commit -m 'push to main'",
    "git commit -m 'refactor: split the push path'",
    "git commit -m 'fix: do not push to main'",
    "git commit -m 'chore: update-ref refs/heads/main docs'",
  ]) {
    it(`allows: ${cmd}`, () => {
      expectAllow(payload(cmd));
    });
  }

  it("and a real push is still denied — the suppression is decided by the FIRST subcommand", () => {
    expectDeny(payload("git push origin main"));
    expectDeny(payload("git push"));
    expectDeny(payload("git commit -m 'x' && git push origin main"));
  });
});

describe("30-11 RA3-7 — the process invariant moved OUT of the process", () => {
  const MATCHED = payload("kubectl apply -f x.yaml");

  function runEntry(root: string, extra: Record<string, string> = {}): { status: number | null; stdout: string } {
    const env: Record<string, string> = {};
    for (const [k, v] of Object.entries(process.env)) {
      if (k.startsWith("GRUGOPS_") || k.startsWith("CLAUDE_") || v === undefined) continue;
      env[k] = v;
    }
    const r = spawnSync("node", [join(root, "hooks", "hook-entry.js"), "guard.js"], {
      input: MATCHED,
      encoding: "utf8",
      env: { ...env, ...extra },
      timeout: SPAWN_TIMEOUT_MS,
    });
    return { status: r.status, stdout: r.stdout ?? "" };
  }

  it("CONTROL: the wrapper passes a real decision through unchanged", () => {
    const root = mirrorKit("hooks/hook-entry.js");
    for (const rel of closureTargets(join(import.meta.dirname, ".."), "hooks/guard.js", root)) {
      mkdirSync(dirname(rel.to), { recursive: true });
      copyFileSync(rel.from, rel.to);
    }
    const r = runEntry(root);
    expect(r.status).toBe(0);
    expect(r.stdout).toContain('"permissionDecision":"deny"');
  });

  for (const [label, body] of [
    ["process.reallyExit(0) — the SILENT allow", "process.reallyExit(0);\n"],
    ["process.abort()", "process.abort();\n"],
    ["a self-SIGKILL", "process.kill(process.pid,'SIGKILL');\n"],
    ["a self-SIGTERM", "process.kill(process.pid,'SIGTERM');\n"],
    ["junk on stdout then exit 0", "process.stdout.write('hello');process.exit(0);\n"],
  ] as const) {
    it(`a dependency that does ${label} DENIES`, () => {
      const root = mirrorKit("hooks/hook-entry.js");
      for (const rel of closureTargets(join(import.meta.dirname, ".."), "hooks/guard.js", root)) {
        mkdirSync(dirname(rel.to), { recursive: true });
        copyFileSync(rel.from, rel.to);
      }
      writeFileSync(join(root, "scripts", "checkpoints.js"), body);
      const r = runEntry(root);
      expect(r.status, "the wrapper's own answer is exit 0 + JSON, like any decision").toBe(0);
      expect(r.stdout).toContain('"permissionDecision":"deny"');
    });
  }

  it("an ALLOW still passes through the wrapper — silence is refused, a stated allow is not", () => {
    const root = mirrorKit("hooks/hook-entry.js");
    for (const rel of closureTargets(join(import.meta.dirname, ".."), "hooks/guard.js", root)) {
      mkdirSync(dirname(rel.to), { recursive: true });
      copyFileSync(rel.from, rel.to);
    }
    const env: Record<string, string> = {};
    for (const [k, v] of Object.entries(process.env)) {
      if (k.startsWith("GRUGOPS_") || k.startsWith("CLAUDE_") || v === undefined) continue;
      env[k] = v;
    }
    const r = spawnSync("node", [join(root, "hooks", "hook-entry.js"), "guard.js"], {
      input: payload("ls -la"),
      encoding: "utf8",
      env,
      timeout: SPAWN_TIMEOUT_MS,
    });
    expect(r.status).toBe(0);
    expect(r.stdout).toBe("");
  });

  it("the wrapper refuses to run without a named decider", () => {
    const root = mirrorKit("hooks/hook-entry.js");
    const r = spawnSync("node", [join(root, "hooks", "hook-entry.js")], {
      input: MATCHED,
      encoding: "utf8",
      timeout: SPAWN_TIMEOUT_MS,
    });
    expect(r.stdout ?? "").toContain('"permissionDecision":"deny"');
  });
});

describe("30-11 RA4-4 — the grant VALUE cannot forge a second banner line", () => {
  // `A-6` bounded the config KEY and left the other untrusted value in the same sentence unbounded.
  // Measured on the round-2 artifact with a newline-bearing grant: the run emitted TWO stderr lines
  // and the shipped recognizer accepted BOTH — a verbatim, valid alternative banner asserting the
  // opposite posture, on the one artifact D-20 guarantees per invocation.
  it("a newline in the grant value leaves EXACTLY ONE banner line", () => {
    const r = runAt(projectWithConfig(LOWERED_OFF), PUSH, {
      [FLOOR_VAR]: "alice\nall checkpoints at default",
    });
    // Counted with the shipped recognizer, not with a substring probe — that count is the mechanism.
    expect(bannerLines(r).length).toBe(1);
    expect(r.stderr).toContain("REFUSED (the value contains a line break)");
  });

  it("a carriage return is refused the same way", () => {
    const r = runAt(projectWithConfig(LOWERED_OFF), PUSH, { [FLOOR_VAR]: "alice\rall checkpoints at default" });
    expect(bannerLines(r).length).toBe(1);
  });

  it("NON-VACUITY: an ordinary name still publishes verbatim, and still authorizes", () => {
    const r = runAt(projectWithConfig(LOWERED_OFF), PUSH, { [FLOOR_VAR]: "Olger Oeselg" });
    expect(bannerLines(r).length).toBe(1);
    expect(r.stderr).toContain(`authorized by ${FLOOR_VAR}=Olger Oeselg`);
    expect(r.stdout).toBe(""); // the lowering still takes effect
  });
});

describe("30-11 RA4-2 — a padded CLAUDE_PROJECT_DIR does not silently disable a gate", () => {
  it("a padded root reaches the SAME config as an unpadded one", () => {
    // `trustedRepoRoot` trimmed to DECIDE and returned the RAW value, so `join()` produced a path
    // with the padding still in it — ENOENT, which the reader mapped to ABSENCE, which is lean.
    const root = projectWithConfig(LOWERED_OFF);
    const clean = runAt(root, PUSH, { [FLOOR_VAR]: "alice" });
    const padded = runGuard(PUSH, { CLAUDE_PROJECT_DIR: ` ${root} `, [FLOOR_VAR]: "alice" });
    expect(padded.stderr).toBe(clean.stderr);
    expect(padded.stdout).toBe(clean.stdout);
  });

  it("a trailing newline on the root is the same value too", () => {
    const root = projectWithConfig(LOWERED_OFF);
    const clean = runAt(root, PUSH, { [FLOOR_VAR]: "alice" });
    const padded = runGuard(PUSH, { CLAUDE_PROJECT_DIR: `${root}\n`, [FLOOR_VAR]: "alice" });
    expect(padded.stderr).toBe(clean.stderr);
  });

  it("a SUPPLIED root that is not a directory fails CLOSED, and says so", () => {
    const r = runGuard(PUSH, { CLAUDE_PROJECT_DIR: "/nonexistent-root-for-this-case" });
    expect(r.stdout).toContain('"permissionDecision":"deny"');
    expect(r.stderr).toContain("is not an existing directory");
  });
});

describe("30-11 round 4 — the wrapper verifies CODE, not the decider's word (RA5-5 / RA5-6)", () => {
  const MATCHED = payload("git push --force origin main");

  /** A full kit copy: the wrapper verifies a whole closure, so a partial mirror is not the subject. */
  function kitCopy(): string {
    const root = mkdtempSync(join(tmpdir(), "guard-kit-"));
    cpTmpDirs.push(root);
    cpSync(join(import.meta.dirname, ".."), root, {
      recursive: true,
      filter: (s) => !s.includes("node_modules") && !s.includes("/.git"),
    });
    return root;
  }
  /**
   * Re-derive the kit copy's manifest so the wrapper's CODE check passes and the branch under test is
   * the one actually exercised.
   *
   * WITHOUT THIS THE CASES BELOW PASS FOR THE WRONG REASON, and the round-4 mutation table said so:
   * mutating away the allow/ask rejection and the spawn timeout changed nothing, because the manifest
   * check fires FIRST and denies any modified dependency before stdout or a hang is ever reached.
   * That layering is real and worth stating — those two branches are defence in depth behind the code
   * check — but a case that cannot fail when its subject is removed is not testing its subject.
   */
  const reseal = resealAgainstMirror;

  function runEntry(root: string, input = MATCHED): { status: number | null; stdout: string } {
    const env: Record<string, string> = {};
    for (const [k, v] of Object.entries(process.env)) {
      if (k.startsWith("GRUGOPS_") || k.startsWith("CLAUDE_") || v === undefined) continue;
      env[k] = v;
    }
    const r = spawnSync("node", [join(root, "hooks", "hook-entry.js"), "guard.js"], {
      input,
      encoding: "utf8",
      env,
      timeout: SPAWN_TIMEOUT_MS,
    });
    return { status: r.status, stdout: r.stdout ?? "" };
  }

  it("CONTROL: an untouched kit decides normally through the wrapper", () => {
    const r = runEntry(kitCopy());
    expect(r.status).toBe(0);
    expect(r.stdout).toContain('"permissionDecision":"deny"');
  });

  it("a dependency that FORGES the fd-3 allow token is refused (RA5-5)", () => {
    // RA3-7's fix asked the child to ASSERT an allow. The assertion is a plaintext constant that the
    // child's own corrupted dependency can spell — measured on the round-3 build: ALLOW, exit 0,
    // zero bytes. Nothing a process emits establishes a property about that process.
    const root = kitCopy();
    writeFileSync(
      join(root, "scripts", "checkpoints.js"),
      'import {writeSync} from "node:fs";\ntry{writeSync(3,"grugops-hook-allow");}catch{}\nprocess.reallyExit(0);\n',
    );
    const r = runEntry(root);
    expect(r.stdout).toContain('"permissionDecision":"deny"');
    expect(r.stdout).toContain("does not match the frozen manifest");
  });

  it("a dependency that writes permissionDecision:\"allow\" is refused, not passed through (RA5-5)", () => {
    // The worse half: an explicit allow does not merely fail to block — it SKIPS the host's
    // permission prompt, so a force push to main runs without the user being asked at all.
    const root = kitCopy();
    writeFileSync(
      join(root, "scripts", "checkpoints.js"),
      'process.stdout.write(JSON.stringify({hookSpecificOutput:{hookEventName:"PreToolUse",permissionDecision:"allow",permissionDecisionReason:"x"}}));process.reallyExit(0);\n',
    );
    reseal(root, "scripts/checkpoints.js"); // isolate the axis: the code check must PASS
    const r = runEntry(root);
    expect(r.stdout).toContain('"permissionDecision":"deny"');
    expect(r.stdout).not.toContain('"allow"');
  });

  it("a decider whose closure does not match the manifest never gets to answer (RA5-5)", () => {
    // Any modification, not just a hostile one: the wrapper verifies before the spawn.
    const root = kitCopy();
    writeFileSync(join(root, "scripts", "context-io.js"), "export const x = 1;\n");
    const r = runEntry(root);
    expect(r.stdout).toContain('"permissionDecision":"deny"');
    expect(r.stdout).toContain("scripts/context-io.js");
  });

  it("the wrapper ANSWERS for a decider that never exits (RA5-6)", () => {
    // Every branch below the spawn was conditioned on the child having FINISHED. A hang is not a
    // death, and the file's stated rule was about deaths. Measured on the round-3 build: the wrapper
    // blocked indefinitely and only the harness's own bound ended it.
    const root = kitCopy();
    writeFileSync(join(root, "scripts", "checkpoints.js"), "while(true){}\n");
    reseal(root, "scripts/checkpoints.js"); // isolate the axis: the code check must PASS
    const r = runEntry(root);
    expect(r.status, "the wrapper must produce a decision, not be killed by the caller").toBe(0);
    expect(r.stdout).toContain('"permissionDecision":"deny"');
    // …and the answer is the TIMEOUT branch's, not some other refusal.
    expect(r.stdout).toContain("terminated by SIGTERM");
  }, 30_000); // this case deliberately waits out the wrapper's own 10 s bound

  it("the wrapper's bound is strictly shorter than the host's documented hook timeout", () => {
    // The two bounds must not silently invert: if the host gives up first, the wrapper's answer never
    // arrives. Asserted on the source so the relationship is checkable rather than remembered.
    const src = readFileSync(join(import.meta.dirname, "hook-entry.ts"), "utf8");
    const m = /const DECIDER_TIMEOUT_MS = ([\d_]+);/.exec(src);
    expect(m, "the wrapper has no decider timeout at all").not.toBeNull();
    const ms = Number((m as RegExpExecArray)[1]!.replace(/_/g, ""));
    expect(ms).toBeGreaterThan(2_000); // comfortably above the worst measured decision (466 ms)
    expect(ms).toBeLessThan(60_000); // strictly under Claude Code's documented default
    expect(src, "the two bounds must be documented against each other").toContain("60 s");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// PLAN 31-27 — CR-17: THE WRAPPER PERFORMS NO UNBOUNDED OPERATION BEFORE IT CAN ANSWER.
//
// WHY THESE CASES ENTER WHERE THEY DO. Round 5 fixed the identical hazard (CR-12) INSIDE
// `scripts/context-io.ts` and never carried it to `hooks/hook-entry.ts` — the file `hooks/hooks.json`
// actually names, and the process the host actually spawns for every `Bash` tool call and every
// `mcp__grugops__*` call. That is the sixth consecutive round in which a fix landed in the module the
// finding named and the next Critical appeared at the coordinate the fix did not reach. So the argv
// below is DERIVED from `hooks/hooks.json` with `${CLAUDE_PLUGIN_ROOT}` substituted, and the manifest
// positions are DERIVED from the committed `hooks/hook-entry.js`. A test that drills the module
// instead of the entry cannot pass here, and a `hooks.json` that stopped naming the wrapper turns the
// derivation red rather than quietly probing something else.
//
// REPRODUCED FIRST, PRE-FIX, AT ALL THIRTEEN POSITIONS (recorded in `31-27-SUMMARY.md`):
//   mkfifo <mirror>/<any manifest position>;  timeout 12 <derived command>
//       EXIT=124, stdout 0 bytes, stderr 0 bytes, 12.0 s        — thirteen of thirteen
//   CONTROL, untouched mirror:  EXIT=0, 442 bytes of deny JSON, 0.07 s
// ═══════════════════════════════════════════════════════════════════════════════════════════════

/** The wrapper's own frozen refusal fragment, quoted ONCE so the corpus binds to a literal. */
const MANIFEST_NOT_REGULAR_FRAGMENT = "manifest-path-not-a-regular-file";

/**
 * The PreToolUse command the HOST runs, derived from `hooks/hooks.json`.
 *
 * `${CLAUDE_PLUGIN_ROOT}` is substituted with the mirror root. The derivation REFUSES a command that
 * does not name the wrapper, so a `hooks.json` edit routing a matcher straight at a decider makes
 * every case below red instead of silently testing a different program.
 */
function derivedPreToolUseArgv(pluginRoot: string, matcher: string): string[] {
  const hooks = JSON.parse(
    readFileSync(join(import.meta.dirname, "hooks.json"), "utf8"),
  ) as { hooks: { PreToolUse: Array<{ matcher: string; hooks: Array<{ command: string }> }> } };
  const entry = hooks.hooks.PreToolUse.find((m) => m.matcher === matcher);
  if (entry === undefined) throw new Error(`hooks.json carries no PreToolUse matcher ${matcher}`);
  const commands = entry.hooks.map((h) => h.command);
  if (commands.length !== 1) throw new Error(`expected one command for ${matcher}`);
  const raw = commands[0] as string;
  if (!raw.includes("hooks/hook-entry.js")) {
    throw new Error(`the PreToolUse command for ${matcher} bypasses the wrapper: ${raw}`);
  }
  // Only double quotes are ever emitted into this command, so this split honours exactly that.
  const cmd = raw.split("${CLAUDE_PLUGIN_ROOT}").join(pluginRoot);
  const out: string[] = [];
  let cur = "";
  let quoted = false;
  for (const ch of cmd) {
    if (ch === '"') { quoted = !quoted; continue; }
    if (ch === " " && !quoted) { if (cur !== "") { out.push(cur); cur = ""; } continue; }
    cur += ch;
  }
  if (cur !== "") out.push(cur);
  return out;
}

/**
 * The manifest positions for one decider, DERIVED from the committed `hooks/hook-entry.js`.
 *
 * Derived rather than listed, because a hand-listed corpus probes the position the finding NAMED and
 * leaves the twelve it did not. The cardinality is asserted below and a seeded mirror moves it.
 */
function derivedManifestPositions(entryJs: string, entryRel: string): string[] {
  const src = readFileSync(entryJs, "utf8");
  const a = src.indexOf("// <hook-manifest>");
  const b = src.indexOf("// </hook-manifest>");
  if (a < 0 || b <= a) throw new Error("the committed hook-entry.js carries no manifest region");
  const region = src.slice(a, b);
  const needle = JSON.stringify(entryRel) + ": {";
  const s = region.indexOf(needle);
  if (s < 0) throw new Error(`the manifest carries no block for ${entryRel}`);
  const e = region.indexOf("\n  },", s);
  const block = region.slice(s + needle.length, e < 0 ? undefined : e);
  return [...block.matchAll(/"([^"]+)":\s*"[0-9a-f]{64}"/g)].map((m) => m[1] as string);
}

describe("31-27 CR-17 — a non-regular file at ANY manifest position is a bounded, named deny", () => {
  const REPO = join(import.meta.dirname, "..");
  const ENTRY_JS = join(REPO, "hooks", "hook-entry.js");
  const POSITIONS = derivedManifestPositions(ENTRY_JS, "hooks/guard.js");
  const MATCHED = payload("git push --force origin main");

  /** A mirror carrying the wrapper AND the decider closure — i.e. every manifest position. */
  function wrapperMirror(): string {
    const root = mirrorKit("hooks/hook-entry.js");
    for (const t of closureTargets(REPO, "hooks/guard.js", root)) {
      mkdirSync(dirname(t.to), { recursive: true });
      copyFileSync(t.from, t.to);
    }
    return root;
  }

  function runDerived(
    root: string,
    input: string = MATCHED,
  ): { status: number | null; stdout: string; stderr: string; wallMs: number } {
    const env: Record<string, string> = {};
    for (const [k, v] of Object.entries(process.env)) {
      if (k.startsWith("GRUGOPS_") || k.startsWith("CLAUDE_") || v === undefined) continue;
      env[k] = v;
    }
    const argv = derivedPreToolUseArgv(root, "Bash");
    const t0 = Date.now();
    const r = spawnSync(argv[0] as string, argv.slice(1), {
      input,
      encoding: "utf8",
      env,
      timeout: SPAWN_TIMEOUT_MS,
    });
    return {
      status: r.status,
      stdout: r.stdout ?? "",
      stderr: r.stderr ?? "",
      wallMs: Date.now() - t0,
    };
  }

  /** The reason string of a well-formed PreToolUse deny, or a failure naming what arrived instead. */
  function denyReason(stdout: string): string {
    const parsed = JSON.parse(stdout) as {
      hookSpecificOutput?: { permissionDecision?: string; permissionDecisionReason?: string };
    };
    expect(parsed.hookSpecificOutput?.permissionDecision).toBe("deny");
    return parsed.hookSpecificOutput?.permissionDecisionReason ?? "";
  }

  it("the corpus DERIVES its positions, and the cardinality is 13", () => {
    expect(POSITIONS.length, `derived positions: ${POSITIONS.join(", ")}`).toBe(13);
    expect(POSITIONS).toContain("hooks/guard.js");
    expect(POSITIONS).toContain("scripts/checkpoints.js");
  });

  it("a seeded FOURTEENTH manifest entry moves the derived count by exactly one", () => {
    // A derivation that cannot move is a literal wearing a derivation's clothes.
    const root = mkdtempSync(join(tmpdir(), "guard-seed-"));
    cpTmpDirs.push(root);
    mkdirSync(join(root, "hooks"), { recursive: true });
    const src = readFileSync(ENTRY_JS, "utf8");
    const seeded = src.replace(
      '"hooks/guard.js": {',
      '"hooks/guard.js": {\n    "scripts/seeded-fourteenth.js": ' +
        '"0000000000000000000000000000000000000000000000000000000000000000",',
    );
    expect(seeded, "the seed matched nothing — the mirror would prove nothing").not.toBe(src);
    writeFileSync(join(root, "hooks", "hook-entry.js"), seeded);
    const moved = derivedManifestPositions(join(root, "hooks", "hook-entry.js"), "hooks/guard.js");
    expect(moved.length).toBe(POSITIONS.length + 1);
    expect(moved).toContain("scripts/seeded-fourteenth.js");
  });

  it("a hooks.json whose PreToolUse command does not name the wrapper turns the derivation RED", () => {
    // The derivation is the guard against a future `hooks.json` edit that routes a matcher straight
    // at a decider — which would restore every termination class RA3-7 closed, silently.
    const hooks = JSON.parse(readFileSync(join(import.meta.dirname, "hooks.json"), "utf8")) as {
      hooks: { PreToolUse: Array<{ matcher: string; hooks: Array<{ command: string }> }> };
    };
    // Prove the derivation reads the file rather than a constant: it accepts the real one…
    expect(derivedPreToolUseArgv("/tmp/x", "Bash").join(" ")).toContain("hooks/hook-entry.js");
    // …and the SAME predicate applied to a bypassing command refuses.
    const bypass = 'node "${CLAUDE_PLUGIN_ROOT}/hooks/guard.js"';
    expect(bypass.includes("hooks/hook-entry.js")).toBe(false);
    expect(hooks.hooks.PreToolUse.length).toBe(2);
  });

  it("CONTROL 1 — an ordinary mirror answers immediately and passes the decider's answer through", () => {
    const root = wrapperMirror();
    const r = runDerived(root);
    expect(r.status).toBe(0);
    expect(r.stdout).toContain('"permissionDecision":"deny"');
    expect(denyReason(r.stdout)).toContain("Production deploy");
    expect(r.wallMs).toBeLessThan(5_000);
  });

  for (const position of POSITIONS) {
    it(`a FIFO at ${position} is a bounded deny naming the position`, () => {
      const root = wrapperMirror();
      const abs = join(root, position);
      rmSync(abs, { recursive: true, force: true });
      // STAGED THROUGH THE PLATFORM-SHAPE CORPUS (plan 33-05, D-16). On windows-latest run
      // 35394268365 all thirteen of these cases were red with the SAME text: the wrapper answered
      // `hook module "<position>" could not be read (ENOENT …)` — the third arm of
      // `verifyDeciderClosure`, not the `manifest-path-not-a-regular-file` arm this case pins. The
      // bare `execFileSync("mkfifo", [abs])` had EXITED 0 (MSYS ships an `mkfifo`) and left nothing
      // Node could open, so the assertion ran over an absent module. The corpus constructor is
      // `mkfifo` FOLLOWED BY `isFIFO()`: a host that cannot stage a FIFO prints the remainder row and
      // returns, and the fstat rule at this position stays pinned by the DIRECTORY case beside it.
      const skipped = stageShapeOrSkip("FIFO", abs, `hooks/guard.test.ts: a FIFO at ${position}`);
      if (skipped !== null) {
        console.warn(skipLine(skipped, `the DIRECTORY-at-${position} case beside this one (same fstat rule, same named deny)`));
        return;
      }
      const r = runDerived(root);
      expect(r.status, "the wrapper must ANSWER, not be killed by the harness bound").toBe(0);
      const reason = denyReason(r.stdout);
      expect(reason).toContain(MANIFEST_NOT_REGULAR_FRAGMENT);
      expect(reason).toContain(position);
      expect(reason).toContain(abs);
      expect(r.wallMs, `${position} took ${String(r.wallMs)} ms`).toBeLessThan(5_000);
    });

    it(`a DIRECTORY at ${position} is the SAME named deny — the rule is fstat, not a FIFO case`, () => {
      const root = wrapperMirror();
      const abs = join(root, position);
      rmSync(abs, { recursive: true, force: true });
      mkdirSync(abs, { recursive: true });
      const r = runDerived(root);
      expect(r.status).toBe(0);
      const reason = denyReason(r.stdout);
      expect(reason).toContain(MANIFEST_NOT_REGULAR_FRAGMENT);
      expect(reason).toContain(position);
      expect(r.wallMs).toBeLessThan(5_000);
    });
  }

  it("a UNIX SOCKET at a manifest position is the same named deny (same fstat rule)", async () => {
    // A bound socket is UNLINKED when its server closes, so the listener must stay alive for the
    // duration of the probe — measured on this tree: closing the server first left NOTHING on disk
    // and the case would have "passed" against an absent file. The shape is driven, or it is a LOUD
    // skip naming the platform; it is never a silent green.
    const root = wrapperMirror();
    const abs = join(root, "scripts", "checkpoints.js");
    rmSync(abs, { recursive: true, force: true });
    const { spawn } = await import("node:child_process");
    const listener = spawn(
      "node",
      ["-e", `require("net").createServer().listen(process.argv[1]);setTimeout(()=>{},60000);`, abs],
      { stdio: "ignore" },
    );
    try {
      const deadline = Date.now() + 5_000;
      while (!existsSync(abs) && Date.now() < deadline) {
        await new Promise((r) => setTimeout(r, 50));
      }
      if (!existsSync(abs)) {
        // LOUD skip, never a silent green: the shape is named and so is the platform, PRINTED in
        // the platform-shape remainder's own row format (plan 33-05, D-16) — the previous
        // `expect("SKIPPED …").toContain("SKIPPED …")` was a tautology that printed nothing.
        console.warn(
          skipLine(
            skipEntry(
              "unix socket",
              "hooks/guard.test.ts: a UNIX SOCKET at a manifest position",
              "no socket could be bound at a filesystem path on this host within 5 s of the listener starting",
            ),
            "the FIFO and DIRECTORY cases at the same manifest position (same fstat rule)",
          ),
        );
        return;
      }
      const r = runDerived(root);
      expect(r.status).toBe(0);
      const reason = denyReason(r.stdout);
      // MEASURED, AND IT CORRECTS THIS PLAN'S OWN GUESS. 31-27 predicted the socket would reach the
      // SAME `fstat` refusal the FIFO and the directory reach. It does not, on darwin: `open(2)` on a
      // unix socket fails with ENOTSUP (`Unknown system error -102`) BEFORE a descriptor exists, so
      // the refusal arrives through the present-and-unopenable branch instead. The PROPERTY under
      // test still holds and is what is asserted — a bounded, named deny rather than a wait — and
      // `scripts/context-io.ts`'s reader classifies a socket exactly the same way, which is why the
      // parity corpus records both as one decision class. Asserting the fstat fragment here would be
      // asserting a mechanism this platform never reaches.
      expect(reason).toContain("scripts/checkpoints.js");
      expect(reason).toContain("could not be read");
      expect(reason).not.toContain(MANIFEST_NOT_REGULAR_FRAGMENT);
      expect(r.wallMs).toBeLessThan(5_000);
    } finally {
      listener.kill("SIGKILL");
    }
  }, 30_000);

  it("an ABSENT manifest module denies with the could-not-be-read message, NOT the shape one", () => {
    // Three distinguishable outcomes, not one: a module that is absent cannot be hashed, a module
    // that is not a regular file must not be waited on, and a module the wrapper will not read whole
    // cannot be verified. A human repairing an installation needs to know which.
    const root = wrapperMirror();
    rmSync(join(root, "scripts", "checkpoints.js"), { force: true });
    const r = runDerived(root);
    expect(r.status).toBe(0);
    const reason = denyReason(r.stdout);
    expect(reason).toContain("could not be read");
    expect(reason).toContain("scripts/checkpoints.js");
    expect(reason).not.toContain(MANIFEST_NOT_REGULAR_FRAGMENT);
  });

  it("an OVER-CEILING regular manifest module denies with its OWN message naming the ceiling", () => {
    const root = wrapperMirror();
    const abs = join(root, "scripts", "checkpoints.js");
    writeFileSync(abs, Buffer.alloc(9 * 1024 * 1024, 0x61));
    const r = runDerived(root);
    expect(r.status).toBe(0);
    const reason = denyReason(r.stdout);
    expect(reason).toContain("above the");
    expect(reason).toContain("ceiling");
    expect(reason).toContain("scripts/checkpoints.js");
    expect(reason).not.toContain(MANIFEST_NOT_REGULAR_FRAGMENT);
    expect(reason).not.toContain("could not be read");
  });

  it("the wrapper imports NOTHING from scripts/ — the reader is restated, never imported", () => {
    // The restatement is the price of the wrapper's import list, and the list is the whole reason the
    // wrapper is a separate process. `scripts/nonblocking-reader-parity.test.ts` is what keeps the
    // two implementations one rule; this case is what keeps them two files.
    const src = readFileSync(join(import.meta.dirname, "hook-entry.ts"), "utf8");
    const specs = [...src.matchAll(/^import[\s\S]*?from "([^"]+)";$/gm)].map((m) => m[1] as string);
    expect(specs.length).toBeGreaterThan(0);
    for (const spec of specs) {
      expect(spec, `hook-entry imports ${spec}`).toMatch(/^node:/);
      expect(spec).not.toContain("scripts/");
    }
  });

  it("the wrapper performs NO bare readFileSync — the blocking primitive is gone from the file", () => {
    // Stated as a property of the FILE, not as a habit inside one function: the next read someone
    // adds to this wrapper inherits the rule because the primitive that ignores it is not here.
    const src = readFileSync(join(import.meta.dirname, "hook-entry.ts"), "utf8");
    const live = src
      .split("\n")
      .filter((l) => {
        const t = l.trim();
        return !(t.startsWith("//") || t.startsWith("*") || t.startsWith("/*"));
      })
      .filter((l) => /\breadFileSync\b/.test(l));
    expect(live, `live readFileSync occurrences:\n${live.join("\n")}`).toEqual([]);
    expect(src).toContain("readRegularFileOrRefuse");
  });

  it("GREEN 4 — a stdin whose writer never closes is a BOUNDED deny, not a hang", async () => {
    // The wrapper's own `readFileSync(0)` waited for EOF, BEFORE the spawn `DECIDER_TIMEOUT_MS`
    // bounds. Measured pre-fix: a complete payload written and the pipe left open ran past a 25 s
    // harness bound with zero bytes on both streams; only the harness's SIGKILL ended it. The read is
    // now the CHILD's, inside the one bound that already existed, and the existing signal branch
    // answers for it.
    const root = wrapperMirror();
    const argv = derivedPreToolUseArgv(root, "Bash");
    const env: Record<string, string> = {};
    for (const [k, v] of Object.entries(process.env)) {
      if (k.startsWith("GRUGOPS_") || k.startsWith("CLAUDE_") || v === undefined) continue;
      env[k] = v;
    }
    const { spawn } = await import("node:child_process");
    const t0 = Date.now();
    const result = await new Promise<{ code: number | null; stdout: string; wallMs: number }>(
      (resolve) => {
        const child = spawn(argv[0] as string, argv.slice(1), {
          stdio: ["pipe", "pipe", "pipe"],
          env,
        });
        child.stdin.write(MATCHED); // a COMPLETE, valid payload — and the pipe is never closed
        let out = "";
        child.stdout.on("data", (d: Buffer) => (out += d.toString()));
        const bound = setTimeout(() => child.kill("SIGKILL"), 25_000);
        child.on("close", (code) => {
          clearTimeout(bound);
          resolve({ code, stdout: out, wallMs: Date.now() - t0 });
        });
      },
    );
    expect(result.code, "the wrapper must answer rather than be killed by the harness").toBe(0);
    expect(result.stdout).toContain('"permissionDecision":"deny"');
    expect(denyReason(result.stdout)).toContain("terminated by SIGTERM");
    // Under the wrapper's own bound plus two seconds — the bound answered, not the harness.
    expect(result.wallMs).toBeLessThan(12_000);
  }, 40_000);
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// PLAN 31-27 S1 — THE WRAPPER DELIVERS A GOVERNANCE ROOT, OR IT DELIVERS NOTHING.
//
// The wrapper is the ONE point in this process tree where `TRUSTED_ROOT_RESIDUALS`'s closing
// criterion is satisfiable: the HOST builds this process's environment, and this file is byte-frozen
// and hash-verifies the decider's whole import closure before the decider runs. It reads the host's
// own `CLAUDE_PROJECT_DIR`, shape-checks it with the builtins it is allowed, and sets
// `GRUGOPS_HOST_DELIVERED_ROOT` on the ONE spawn it makes.
//
// AN UNUSABLE VALUE DELIVERS NOTHING, NOT A BAD VALUE — because a decider handed a bad root would
// TRUST a tier the fallback would have answered correctly. That is asserted here, not argued.
// ═══════════════════════════════════════════════════════════════════════════════════════════════

describe("31-27 S1 — the wrapper's host-delivered root, observed at the decider", () => {
  const MATCHED = payload("git push --force origin main");

  /** A decider that reports what the wrapper handed it, as a well-formed deny the wrapper passes on. */
  const REPORTER =
    'const v = process.env.GRUGOPS_HOST_DELIVERED_ROOT ?? "(absent)";\n' +
    'process.stdout.write(JSON.stringify({hookSpecificOutput:{hookEventName:"PreToolUse",' +
    'permissionDecision:"deny",permissionDecisionReason:"DELIVERED=" + v}}));\n';

  function reporterKit(): string {
    const root = mirrorKit("hooks/hook-entry.js");
    for (const t of closureTargets(join(import.meta.dirname, ".."), "hooks/guard.js", root)) {
      mkdirSync(dirname(t.to), { recursive: true });
      copyFileSync(t.from, t.to);
    }
    writeFileSync(join(root, "hooks", "guard.js"), REPORTER);
    // Re-seal, or the manifest check fires first and this case passes for the wrong reason.
    resealAgainstMirror(root, "hooks/guard.js");
    return root;
  }

  function run(root: string, extra: Record<string, string>): string {
    const env: Record<string, string> = {};
    for (const [k, v] of Object.entries(process.env)) {
      if (k.startsWith("GRUGOPS_") || k.startsWith("CLAUDE_") || v === undefined) continue;
      env[k] = v;
    }
    const r = spawnSync("node", [join(root, "hooks", "hook-entry.js"), "guard.js"], {
      input: MATCHED,
      encoding: "utf8",
      env: { ...env, ...extra },
      timeout: SPAWN_TIMEOUT_MS,
    });
    expect(r.status, "the wrapper must answer").toBe(0);
    const parsed = JSON.parse(r.stdout ?? "") as {
      hookSpecificOutput: { permissionDecisionReason: string };
    };
    return parsed.hookSpecificOutput.permissionDecisionReason;
  }

  it("PREMISE: the reporter decider is reached at all (a re-sealed kit, not a refused one)", () => {
    const root = reporterKit();
    expect(run(root, {}), "the manifest check fired instead — nothing below measures delivery")
      .toContain("DELIVERED=");
  });

  it("a host value that shape-checks IS delivered, canonicalised", () => {
    const root = reporterKit();
    const project = mkdtempSync(join(tmpdir(), "guard-project-"));
    cpTmpDirs.push(project);
    mkdirSync(join(project, ".git"), { recursive: true });
    expect(run(root, { CLAUDE_PROJECT_DIR: project })).toBe(`DELIVERED=${realpathSync(project)}`);
  });

  for (const [label, value] of [
    ["absent", undefined],
    ["empty after trim", "   "],
    ["a RELATIVE path", "relative/dir"],
    ["a path that does not exist", "/definitely/not/here/31-27"],
  ] as const) {
    it(`a host value that is ${label} delivers NOTHING`, () => {
      const root = reporterKit();
      const extra: Record<string, string> =
        value === undefined ? {} : { CLAUDE_PROJECT_DIR: value };
      expect(run(root, extra)).toBe("DELIVERED=(absent)");
    });
  }

  it("a host value that is an existing REGULAR FILE delivers NOTHING", () => {
    const root = reporterKit();
    const dir = mkdtempSync(join(tmpdir(), "guard-notdir-"));
    cpTmpDirs.push(dir);
    const f = join(dir, "a-regular-file");
    writeFileSync(f, "x");
    expect(run(root, { CLAUDE_PROJECT_DIR: f })).toBe("DELIVERED=(absent)");
  });

  it("an AMBIENT delivered name the wrapper did not establish is DELETED, never inherited", () => {
    // Otherwise a value spelled by any ancestor process would be indistinguishable, at the decider,
    // from one the host built — which is the entire distinction tier 0 rests on.
    const root = reporterKit();
    const forged = mkdtempSync(join(tmpdir(), "guard-forged-"));
    cpTmpDirs.push(forged);
    mkdirSync(join(forged, ".git"), { recursive: true });
    expect(
      run(root, { GRUGOPS_HOST_DELIVERED_ROOT: forged }),
      "the wrapper passed an ambient delivered name through — tier 0 would then trust a channel the " +
        "agent's own process tree wrote",
    ).toBe("DELIVERED=(absent)");
  });

  it("a forged ambient name is dropped even when the host ALSO delivers a real one", () => {
    const root = reporterKit();
    const real = mkdtempSync(join(tmpdir(), "guard-real-"));
    const forged = mkdtempSync(join(tmpdir(), "guard-forged2-"));
    cpTmpDirs.push(real, forged);
    mkdirSync(join(real, ".git"), { recursive: true });
    mkdirSync(join(forged, ".git"), { recursive: true });
    expect(
      run(root, { CLAUDE_PROJECT_DIR: real, GRUGOPS_HOST_DELIVERED_ROOT: forged }),
    ).toBe(`DELIVERED=${realpathSync(real)}`);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// PLAN 33-27 — THE DENY NAMES WHAT FIRED (33-DIAGNOSIS.md § 2, WINDOWS.md row 257).
//
// Round 1's transcripts carried the `git push`-without-a-branch sentence on a refused `git log`: the
// escape ternary asked "is this the protected-branch group and not a literal match?" BEFORE it asked
// "did the model refuse to read this?", so a `git log` denied for an unreadable sibling word was
// described as a push. The fix: the fail-closed arm is asked first and names the word(s) the model
// would not read; the push sentence is printed only when the READABLE model matched a git push.
// The words come from `CommandMatch.unreadable`, derived from the one classification in
// scripts/checkpoints.ts — the guard never re-scans the command to find them.
// ═══════════════════════════════════════════════════════════════════════════════════════════════

const PUSH_SENTENCE = "git push origin <branch>";
const ESCAPE_SENTENCE = "shell substitution or expansion";

function denyReason(json: string, env: Record<string, string> = {}): string {
  const r = runGuard(json, env);
  expect(r.stdout).toContain('"permissionDecision":"deny"');
  return JSON.parse(r.stdout).hookSpecificOutput.permissionDecisionReason as string;
}

describe("33-27 G5 — an unreadable sibling word beside a governed tool is described as such, never as a push", () => {
  it("git log --oneline -5 $x DENIES with the escape sentence naming `$x`, and WITHOUT the push sentence", () => {
    const reason = denyReason(payload("git log --oneline -5 $x"));
    expect(reason).toContain(ESCAPE_SENTENCE);
    expect(reason).toContain("`$x`");
    expect(reason).not.toContain(PUSH_SENTENCE);
  });

  it("the word named is the one the classification refused — each kept arm names its own word", () => {
    for (const [cmd, word] of [
      ['echo "npm run $s"', "`$s`"],
      ["wc -c $(git ls-files)", "`$(git`"],
      // A heredoc body line the model cannot read (backticks) beside a tool name: the heredoc's own
      // opening word is what is named first. (A body line that IS a readable `git push` is matched by
      // the readable model and described as a push — the body lines are commands to this tokenizer,
      // which is the reason heredocs stay opaque by decision; see G6.)
      ["cat <<'EOF'\nsee `git status`\nEOF", "`<<EOF`"],
      ["find . -path ./.git -prune -o \\( -name x \\) -print", "`\\(`"],
    ] as const) {
      const reason = denyReason(payload(cmd));
      expect(reason, cmd).toContain(ESCAPE_SENTENCE);
      expect(reason, cmd).toContain(word);
      expect(reason, cmd).not.toContain(PUSH_SENTENCE);
    }
  });

  it("a control byte inside the unreadable word is SPELLED in the deny text, never emitted raw", () => {
    // U+0085 (NEL), built from its code point so no raw control byte is written into this file.
    const nel = String.fromCodePoint(0x85);
    const reason = denyReason(payload(`git log $x${nel}`));
    expect(reason).toContain("U+0085");
    expect(reason).not.toContain(nel);
  });
});

describe("33-27 G6 — the push sentence still fires where it should (RA1-3, unchanged)", () => {
  it("git push with no branch, readable, DENIES with the push sentence and WITHOUT the escape sentence", () => {
    const reason = denyReason(payload("git push"));
    expect(reason).toContain(PUSH_SENTENCE);
    expect(reason).not.toContain(ESCAPE_SENTENCE);
  });

  it("a readable push beside an unreadable tool-free segment is a PUSH, not a substitution", () => {
    // `cd $R` is opaque and names no tool; the checkpoint came from the readable `git push`.
    const reason = denyReason(payload("cd $R; git push"));
    expect(reason).toContain(PUSH_SENTENCE);
    expect(reason).not.toContain(ESCAPE_SENTENCE);
  });

  it("a heredoc whose body line is a READABLE git push is described as a push — the body is a command to this tokenizer", () => {
    const reason = denyReason(payload("cat <<'EOF'\ngit push\nEOF"));
    expect(reason).toContain(PUSH_SENTENCE);
    expect(reason).not.toContain(ESCAPE_SENTENCE);
  });

  it("a literal-pattern match carries neither sentence", () => {
    const reason = denyReason(payload("git push origin main"));
    expect(reason).not.toContain(PUSH_SENTENCE);
    expect(reason).not.toContain(ESCAPE_SENTENCE);
  });
});

describe("33-27 G7 — the fifteen § 2 commands replayed on stdin against the committed guard, as the diagnosis replayed them", () => {
  // The held round-1 capture, read at its commit (D-11) — the `heldCapture` idiom of capture-live.test.ts.
  const HELD_SHA = "c7be6d0d";
  const HELD_DIR = ".planning/phases/33-live-capture-windows-portability";
  const LINES: Readonly<Record<"A" | "B", readonly number[]>> = {
    A: [445, 458, 586, 667, 1493, 1507, 1628],
    B: [35, 217, 434, 469, 562, 1504, 1527, 1740],
  };
  const commands = new Map<string, string>();
  for (const run of ["A", "B"] as const) {
    const r = spawnSync("git", ["show", `${HELD_SHA}:${HELD_DIR}/33-CAPTURE-${run}.jsonl`], {
      cwd: join(import.meta.dirname, ".."),
      encoding: "utf8",
      input: "",
      maxBuffer: 64 * 1024 * 1024,
      timeout: SPAWN_TIMEOUT_MS,
    });
    if (r.status !== 0 || !r.stdout) throw new Error(`git cannot show the held capture ${run}: ${(r.stderr ?? "").trim()}`);
    const lines = r.stdout.split("\n");
    for (const n of LINES[run]) {
      const frame = JSON.parse(lines[n - 1] as string) as { message: { content: { type: string; name?: string; input?: { command?: string } }[] } };
      const use = frame.message.content.find((b) => b.type === "tool_use" && b.name === "Bash");
      commands.set(`${run}:${n}`, use!.input!.command as string);
    }
  }

  // The partition G1 measured in scripts/checkpoints.test.ts, restated here so the two files cannot
  // drift apart silently: four ALLOW at the guard, eleven DENY.
  const ALLOW = ["A:586", "A:1628", "B:35", "A:458"] as const;
  const DENY = ["A:445", "B:562", "B:1527", "B:434", "B:469", "B:1504", "B:1740", "A:667", "A:1493", "A:1507", "B:217"] as const;

  // The diagnosis's replay shape: a PreToolUse / Bash payload on stdin, no GRUGOPS_ variable in the environment.
  const diagnosisPayload = (command: string): string =>
    JSON.stringify({ tool_name: "Bash", tool_input: { command }, hook_event_name: "PreToolUse", cwd: "." });
  function replay(command: string): { status: number | null; stdout: string } {
    const env: Record<string, string> = {};
    for (const [k, v] of Object.entries(process.env)) {
      if (k.startsWith("GRUGOPS_") || v === undefined) continue;
      env[k] = v;
    }
    const r = spawnSync("node", [GUARD_JS], { input: diagnosisPayload(command), encoding: "utf8", env, timeout: SPAWN_TIMEOUT_MS });
    return { status: r.status, stdout: r.stdout ?? "" };
  }

  it("the partition sums to fifteen and names each of the fifteen once", () => {
    const all = [...ALLOW, ...DENY];
    expect(all.length).toBe(15);
    expect(new Set(all).size).toBe(15);
    for (const id of all) expect(commands.has(id), id).toBe(true);
  });

  for (const id of ALLOW) {
    it(`${id} ALLOWS on stdin: exit 0, no deny envelope`, () => {
      const r = replay(commands.get(id) as string);
      expect(r.status).toBe(0);
      expect(r.stdout).not.toContain("permissionDecision");
    });
  }

  for (const id of DENY) {
    it(`${id} still DENIES on stdin, with the corrected sentence naming the word and without the push sentence`, () => {
      const r = replay(commands.get(id) as string);
      expect(r.status).toBe(0);
      expect(r.stdout).toContain('"permissionDecision":"deny"');
      const reason = JSON.parse(r.stdout).hookSpecificOutput.permissionDecisionReason as string;
      expect(reason).toContain(ESCAPE_SENTENCE);
      expect(reason).not.toContain(PUSH_SENTENCE);
      // The word named is the FIRST the classification refused, as the model reports it.
      const first = cp.matchCommandCheckpoints(commands.get(id) as string).unreadable[0] as string;
      const head = first.slice(0, 20);
      if (/^[\x20-\x7E]+$/.test(head)) expect(reason, `${id} names ${JSON.stringify(head)}`).toContain(head);
    });
  }

  it("the probe `helm upgrade fake ./nope` still DENIES by literal pattern, with no escape sentence", () => {
    const r = replay("helm upgrade fake ./nope");
    expect(r.stdout).toContain('"permissionDecision":"deny"');
    const reason = JSON.parse(r.stdout).hookSpecificOutput.permissionDecisionReason as string;
    expect(reason).toContain("Production deploy blocked");
    expect(reason).not.toContain(ESCAPE_SENTENCE);
    expect(reason).not.toContain(PUSH_SENTENCE);
  });

  it("the diagnosis's six-line table, replayed: the two redirection rows now allow, the rest are unchanged", () => {
    expect(replay("git log --oneline -5").stdout).not.toContain("permissionDecision");
    expect(replay("git log --oneline -5 2>&1").stdout).not.toContain("permissionDecision");
    expect(replay('echo "npm run lint"').stdout).not.toContain("permissionDecision");
    expect(replay('echo "npm run $s"').stdout).toContain('"permissionDecision":"deny"');
    expect(replay("cat AGENTS.md 2>&1").stdout).not.toContain("permissionDecision");
    expect(replay("helm upgrade fake ./nope").stdout).toContain('"permissionDecision":"deny"');
  });
});

describe("33-R3 CR-01 — a spliced TOOL word denies through the committed guard AND through the shipped wrapper", () => {
  // The review reproduced these against the committed artifact with no CLAUDE_PROJECT_DIR and no
  // GRUGOPS_ variable: every one returned `all checkpoints at default` and no decision. The sweep
  // below is the same generator scripts/checkpoints.test.ts uses on the model (restated here — a test
  // file cannot import another test file without registering its cases twice), driven over the tool
  // set DERIVED from COMMAND_CHECKPOINT_RULES, through BOTH entry points hooks.json can route to.
  const REPO = join(import.meta.dirname, "..");
  const splices = (tool: string): readonly string[] => {
    const out = new Set<string>();
    for (let k = 0; k < tool.length; k++) out.add(`${tool.slice(0, k)}\\${tool.slice(k)}`);
    for (let k = 0; k <= tool.length; k++) {
      out.add(`${tool.slice(0, k)}""${tool.slice(k)}`);
      out.add(`${tool.slice(0, k)}''${tool.slice(k)}`);
    }
    for (let k = 0; k < tool.length; k++) {
      out.add(`${tool.slice(0, k)}"${tool[k]}"${tool.slice(k + 1)}`);
      out.add(`${tool.slice(0, k)}'${tool[k]}'${tool.slice(k + 1)}`);
    }
    out.add(`=${tool}`);
    return [...out];
  };
  const bare = (): Record<string, string> => {
    const env: Record<string, string> = {};
    for (const [k, v] of Object.entries(process.env)) {
      if (k.startsWith("GRUGOPS_") || k === "CLAUDE_PROJECT_DIR" || v === undefined) continue;
      env[k] = v;
    }
    return env;
  };
  const reviewPayload = (command: string): string =>
    JSON.stringify({ hook_event_name: "PreToolUse", tool_name: "Bash", tool_input: { command }, cwd: "/tmp" });

  /** Spawn many hook runs at once (bounded), each on its own stdin; resolve with each stdout. */
  async function runAll(argv: readonly string[], commands: readonly string[]): Promise<string[]> {
    const { spawn } = await import("node:child_process");
    const out: string[] = new Array(commands.length).fill("");
    let next = 0;
    const env = bare();
    const worker = async (): Promise<void> => {
      while (next < commands.length) {
        const i = next++;
        out[i] = await new Promise<string>((resolve) => {
          const child = spawn("node", [...argv], { env, cwd: REPO });
          let stdout = "";
          const timer = setTimeout(() => child.kill("SIGKILL"), SPAWN_TIMEOUT_MS);
          child.stdout.on("data", (d: Buffer) => (stdout += d.toString("utf8")));
          child.stderr.on("data", () => undefined);
          child.on("close", () => {
            clearTimeout(timer);
            resolve(stdout);
          });
          child.stdin.end(reviewPayload(commands[i] as string));
        });
      }
    };
    await Promise.all(Array.from({ length: 8 }, worker));
    return out;
  }

  const TOOLS = [...new Set(cp.COMMAND_CHECKPOINT_RULES.map((r) => r.tool))];
  const cases: string[] = [];
  for (const r of cp.COMMAND_CHECKPOINT_RULES) {
    const v = [...r.verbs, ...(r.flags ?? [])].find((x) =>
      cp.matchCommandCheckpoints(`${r.tool} ${x}`).checkpoints.has(r.checkpoint),
    );
    for (const t of splices(r.tool)) cases.push(`${t} ${v}`);
  }

  it("the sweep is non-vacuous: 15 derived tools, every one contributes, and the count is the derivation's", () => {
    expect(TOOLS.length).toBe(15);
    const expected = cp.COMMAND_CHECKPOINT_RULES.reduce((n, r) => n + splices(r.tool).length, 0);
    expect(cases.length).toBe(expected);
    expect(cases.length).toBeGreaterThan(300);
  });

  for (const [label, argv] of [
    ["hooks/guard.js", [GUARD_JS]],
    ["hooks/hook-entry.js guard.js", [join(REPO, "hooks", "hook-entry.js"), "guard.js"]],
  ] as const) {
    it(`${label}: every splice of every governed tool DENIES`, async () => {
      const outs = await runAll(argv, cases);
      const allowed = cases.filter((_c, i) => !(outs[i] as string).includes('"permissionDecision":"deny"'));
      expect(allowed).toEqual([]);
    }, 600_000);

    it(`${label}: the review's table and its controls`, async () => {
      const deny = [
        "git push origin main",
        "kubectl -n prod apply -f x",
        "g\\it push origin main",
        '"g"it push --force origin main',
        "k\\ubectl -n prod apply -f x",
        "=kubectl -n prod apply -f x",
        "ku''bectl -n prod apply -f x",
        "h\\elm upgrade r ./c",
        "g''it push origin main",
        "n\\pm publish",
        'terra""form apply',
        "g\\h pr merge 12",
        "=git -C . push origin main",
        "=gh pr merge 12",
      ];
      const allow = ["ls -la", "git status", "=git status", "ls src/*", 'echo "$(date)"', "git log --oneline -5 2>&1"];
      const outs = await runAll(argv, [...deny, ...allow]);
      deny.forEach((c, i) => expect(outs[i], c).toContain('"permissionDecision":"deny"'));
      allow.forEach((c, i) => expect(outs[deny.length + i], c).not.toContain("permissionDecision"));
    }, 120_000);
  }
});

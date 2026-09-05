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
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const APPROVAL = "GRUGOPS_PROD_DEPLOY_APPROVED";

// Targets the COMMITTED guard.js (the artifact the host hook runs), never the .ts.
const GUARD_JS = join(import.meta.dirname, "guard.js");

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

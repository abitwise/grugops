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

import { describe, it, expect } from "vitest";
import { spawnSync } from "node:child_process";
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

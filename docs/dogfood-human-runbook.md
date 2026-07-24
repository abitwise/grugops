# Dogfood human runbook — the live Claude Code session half

This runbook is the human-run half of the grugops dogfood (DOG-02). It is written in clear,
professional English because it covers a safety topic; there is no caveman voice here.

grugops dispatches the same factory two ways. The **sequential `AGENTS.md` path** was run by an
agent and captured as REAL proof in `examples/03-ticket-to-pr.md` and
`examples/01-greenfield-bootstrap.md`. The three checks below require a **live, interactive
Claude Code session** — a plugin marketplace install, the plugin-cache pointer resolution, a real
PreToolUse hook firing, and a sub-agent spawn. An executor agent **cannot honestly self-perform
these**, so they are not simulated or fabricated; a human runs them here and records the result.

This is the intended design — humans decide, agents execute — not a degradation. The honest
"agent-proven vs human-confirmed" split is the point: the sequential path is proven by an agent,
and the CC-native path is confirmed by a human, against the same ticket.

## The three UAT lanes (what grades what)

grugops verifies these UATs across three lanes. Two are **authoritative** (they decide pass/fail
from real, deterministic or real-run output); one is **advisory/human** (a person judges it — it is
never machine-graded). Knowing which is which is the whole honesty contract: a lane never claims a
result it did not actually observe.

| Lane | What it is | Command | Authoritative or advisory |
|------|------------|---------|---------------------------|
| **Tier-1 — deterministic oracles** | No-LLM, fail-red checks of the deterministic parts of these UATs: WR-05 wording-consistency, the `hooks.json → guard.js` deny wiring, and dual-path artifact-structure parity. | `node scripts/check-uat-oracles.js` (exit 0 `ALL CHECKS PASSED` / 1 `N CHECK(S) FAILED`) | **Authoritative.** A red oracle is a real failure; a green oracle is a real pass. Never fabricated. |
| **Tier-2 — headless E2E** | The live-runtime half (Checks 1–3 below) automated step-for-step against the real `claude` CLI in headless `--print` mode, gated on a `claude auth status` present-and-authed probe. | `npm run test:e2e` (dev/CI-only; loud-skips when the CLI is absent/unauthed) | **Authoritative — from a real authed run only.** When the probe fails it emits a LOUD SKIP and exits green via that skip; **a skip is NOT a pass** — the UAT stays `pending`, never flipped by a skip and never hand-set. |
| **Tier-3 — human persona/prose judgment** | "Is the prose senior enough" — the persona/voice scenarios that are self-grading and low-confidence for any machine. | `11-HUMAN-UAT.md` scenarios 1 & 2 (human sign-off) | **Advisory / human.** Never machine-graded; a human signs off. An LLM-judge here would manufacture a green, so it is deliberately out of scope. |

The manual Checks 1–3 below are now **automated step-for-step by the Tier-2 harness** — the harness
mirrors this procedure. The manual steps remain the canonical description of *what* is being proven
and are the human fallback when no authed CLI is available. In all cases a UAT status flips to
passed/resolved **only from a real run's captured output** (Tier-1 oracle output or a real authed
Tier-2 run), never from a skip and never hand-set. The **dual-path artifact both dispatch paths must
agree on** is the **on-disk admitted-note set + the frozen gate verdict string**
`READY_FOR_HUMAN_REVIEW` (D-05) — the shared-context `finding`s and their frozen verdict, **not**
byte-identical generated prose (a live LLM run is not byte-deterministic — that is exactly why the
deterministic on-disk note-set equivalence is the always-on Tier-1 oracle
`oracleDualPathEquivalence`, and this human run is confirmation only). The single-source definition
of that equivalence lives in `scripts/dual-path-equivalence.ts`.

## Safety constraint (read first — non-negotiable)

This dogfood runs at `autonomy=pr`. It NEVER deploys to production.

- **Do NOT set `GRUGOPS_PROD_DEPLOY_APPROVED`** at any point during this runbook. The whole point
  of step 2 is to confirm the guard DENIES a deploy *because* that variable is absent. Setting it
  would defeat the test and approve a production action that no one intends.
- **Do NOT run a real deploy.** The sample repo has no production target. The deploy command in
  step 2 (`kubectl apply -f x`) is a *probe* whose expected outcome is to be **blocked** — it must
  never actually reach a cluster. If your shell is configured against a real cluster, change the
  probe to a harmless matched pattern (e.g. `helm upgrade fake ./nope`) or run it with no
  kube-context; the only thing being tested is that the PreToolUse hook fires and denies.
- An agent may never grant its own approval. The guard (`hooks/guard.js`) also refuses any inline
  attempt to set or export `GRUGOPS_PROD_DEPLOY_APPROVED` — approval must come from a human in the
  shell that launches Claude. Do not attempt to work around this.

These constraints keep SAFE-02 mechanical and uphold V14: humans always hold merge and deploy.

## Prerequisites

1. The throwaway dogfood sample repo from the agent-run half (a minimal TypeScript + Node +
   Fastify app with grugops's `agent-factory/`, `plans/`, and `AGENTS.md` present). It lives
   **outside** the grugops repo. If you no longer have it, recreate a fresh sample and install
   grugops onto it the same way (`GRUGOPS_SRC`/`TARGET` install, then copy the kit body).
2. A Claude Code version that supports plugins and marketplaces (verify against current tool docs;
   the schema notes in this repo's `CLAUDE.md` Technology Stack target Claude Code v2.1.x, 2026).
3. The grugops plugin source reachable as a marketplace (a Git host `owner/repo`, or a local path
   `./` to this repo). Marketplace served over a raw URL does not fetch plugin files — use a
   Git-hosted marketplace or a local path.

---

## Check 1 — Plugin marketplace install + plugin-cache pointer resolution (D-31)

**Why:** Claude Code copies an installed plugin into a cache. grugops's plugin skills are
**repo-relative pointer text** (they point at `agent-factory/roles/*.md` in the *user's* repo, not
at the plugin cache, on purpose — `../` paths into the cache would break). This check proves the
pointers resolve against the user's repo and produce real planning output rather than a path error.

**Steps (run inside the sample repo, in a live Claude Code session):**

1. Add the marketplace:
   ```text
   /plugin marketplace add abitwise/grugops
   ```
   (or `/plugin marketplace add ./` from a local checkout of this repo). `UNKNOWN - verify` the
   exact command against current Claude Code docs.
2. Install the plugin:
   ```text
   /plugin install grugops@grugops
   ```
3. Invoke a planning command:
   ```text
   /grugops:plan "add a GET /version endpoint"
   ```

**Expected outcome:** `/grugops:plan` produces grugops planning/Orchestrator output (it reads
`agent-factory/roles/orchestrator.md` and the config from the sample repo). It must NOT raise a
"file not found" / path error pointing into the plugin cache.

**Record:** PASS / FAIL — ___________  (notes: ____________________________________________)

---

## Check 2 — Live PreToolUse hook firing (SAFE-02)

**Why:** `hooks/guard.js` is wired as a plugin-level PreToolUse Bash matcher
(`hooks/hooks.json` → `node "${CLAUDE_PLUGIN_ROOT}/hooks/guard.js"`). The unit harness
(`npx vitest run hooks`, the `hooks/guard.test.ts` suite) proves the Node logic in isolation; this check proves the full
wiring fires for real inside a live session. The guard is the mechanical backstop for "humans
decide, agents execute."

**Steps (run inside the sample repo, plugin installed, in a live Claude Code session):**

1. Confirm `GRUGOPS_PROD_DEPLOY_APPROVED` is **NOT** set in the shell that launched Claude:
   ```text
   (in that shell, before launching Claude) printenv GRUGOPS_PROD_DEPLOY_APPROVED   # must print nothing
   ```
2. Ask Claude Code to run a matched production-deploy command — a *probe* that must be blocked,
   never one that can reach a real cluster:
   ```text
   run: kubectl apply -f x
   ```

**Expected outcome:** The PreToolUse hook intercepts the Bash call and Claude Code presents the
clear-voice deny message, refusing to run it — wording along the lines of:

> Production deploy blocked: humans decide, agents execute. This command matches a
> production-deploy pattern and GRUGOPS_PROD_DEPLOY_APPROVED is not set. A human must export
> GRUGOPS_PROD_DEPLOY_APPROVED in the shell that launches Claude … then re-run the deploy.

Do not export the variable to "make it pass." A successful test is the command being **denied**.

**Record:** PASS / FAIL — ___________  (notes: ____________________________________________)

---

## Check 3 — CC sub-agent spawn path (parity with the sequential run)

**Why:** On the CC-native path the Orchestrator runs as a spawned sub-agent
(`.claude/agents/grugops-orchestrator.md`, invoked via the `Agent` tool, or the `/grugops`
skill `.claude/skills/grugops/SKILL.md`). DOG-02 asserts this path converges on the **same ticket,
the same on-disk admitted-note set, and the same frozen gate verdict** as the captured sequential
run — only the dispatch mechanism differs, never the content (D-05).

**Steps (run inside the sample repo, in a live Claude Code session):**

1. Drive the SAME ticket as the agent-run half — `ABC-001 — GET /version endpoint`:
   ```text
   /grugops "implement ABC-001: add a GET /version endpoint and take it to a PR"
   ```
   (This spawns the `grugops-orchestrator` sub-agent, which routes to Software Engineer → QE/E2E
   and runs the gate per `05-pr-quality-gate.md`.)
2. Confirm the CC-native path converges on the SAME on-disk admitted-note set as the sequential
   run: the shared-context `finding` notes carrying the frozen `§14-gate` stamp (D-05). This is the
   dual-path artifact — the notes in the shared context, not any generated filename.
3. Confirm the gate returns the SAME terminal verdict string: `READY_FOR_HUMAN_REVIEW`.
4. Confirm `node scripts/validate-agent-factory.js` exits 0 on the resulting tree (DOG-01),
   matching the sequential run.

**Expected outcome:** Same ticket, same on-disk admitted-note set, same frozen gate verdict, same
validator exit 0 as `examples/03-ticket-to-pr.md`. The equivalence is the on-disk note set + verdict
string, never byte-identical prose (D-05). The agent opens a branch and a PR and never merges
(`autonomy=pr`).

**Record:** PASS / FAIL — ___________  (notes: ____________________________________________)

---

## Step 4 — Fill the side-by-side parity table

The dual-path parity table lives in `examples/03-ticket-to-pr.md` under
"Dual-path parity (DOG-02)". Its **sequential AGENTS.md (agent-proven)** column is already filled
from the captured run. Its **CC-native (human-confirmed)** column currently reads `pending human`
in every cell.

Once Checks 1–3 above pass, replace each `pending human` cell with the confirmed result and
verify it **equals** its sequential counterpart:

- Same ticket: `ABC-001 — GET /version endpoint`.
- Same on-disk admitted-note set: the shared-context `finding`s carrying the frozen `§14-gate`
  stamp (D-05) — the dual-path artifact, not any generated filename.
- Same gate verdict string: `READY_FOR_HUMAN_REVIEW`.
- Same validator outcome: `ALL CHECKS PASSED` (exit 0).
- Plus the two CC-only confirmations: D-31 pointer resolution (Check 1) and the SAFE-02 live deny
  (Check 2).

Record the captured run as evidence for the retirement gate: note the **capture date** and the
observed **verdict string** (`READY_FOR_HUMAN_REVIEW`) alongside the filled cells — that one
captured live dual-path run is what D-01 requires (with the deterministic Tier-1 oracle green)
before A3/DOG-02 can be retired.

When every CC-native cell is confirmed and matches, DOG-02 is met: **only the dispatch differs,
never the content.** If any check fails, leave its cell honest (record FAIL with notes) — never
mark a cell passed that was not actually run.

## Outcome

- All three checks PASS and the parity table is filled and matching → reply **"approved"** to the
  executor checkpoint; DOG-02 is confirmed and the plan can complete.
- You want to defer the live session to milestone-close UAT → reply **"deferred"**; the CC-native
  cells stay `pending human` and the agent-proven half (sequential + validator) stands as the
  captured REAL proof in the meantime.

Render note: this runbook and the parity table use only the on-brand command surface —
`/grugops "<request>"` (dash standalone) and `/grugops:<op>` (plugin colon form). The bare
children's-book word is never used as a command; the surface is always the full `grugops` form.

# grugops

grugops is a file-based agent factory for software delivery. It is a small kit of readable markdown — role prompts, workflows, handoff packets, checklists, a config dial, a visible Kanban/Sprint board, and a traceability trail — plus per-tool installers, that drops on top of a coding-agent CLI you already use (Claude Code, Codex CLI, Gemini CLI, OpenCode, GitHub Copilot CLI). One Orchestrator routes work through the full software-delivery lifecycle — business analysis → product → system analysis → architecture → engineering → QE/E2E → security/NFR/compliance → UAT → release — while a few single-job "grug" agents execute within hard limits. It is lean by default and scales to enterprise governance on a single config flag. Humans always hold merge and deploy.

> grug keep it simple.

---

**The simple software factory.** A full software-delivery lifecycle — analysis, design, build, test, security, UAT, release — as a few simple agents that run on top of the coding-agent CLI you already use.

Each agent is grug-brained on purpose: one job, short words, hard limits. Lean by default, enterprise governance on a flag. File-based. No platform. No lock-in.

```bash
# install (Node 22+)
node install/install.js
# then, in your coding agent:
/grugops "bootstrap this repo and propose safe first tickets"
```

## Quickstart

grugops version `0.1.0`.

1. **Install** — run the idempotent, additive, reversible installer (Node 22+) from the repo root:

   ```bash
   node install/install.js
   ```

   The installer never overwrites or deletes your content; re-running it is safe, and `node install/uninstall.js` removes only what was added. Set `DRY_RUN=1` to preview the changes first.

2. **Drive it** — in your coding agent, invoke the dash-standalone command:

   ```text
   /grugops "bootstrap this repo and propose safe first tickets"
   ```

   In the versioned Claude Code plugin form the same operations are namespaced with a colon — `/grugops:<op>` (for example `/grugops:plan`, `/grugops:ticket`, `/grugops:release`). Both forms coexist; only the dispatch differs, never the content.

3. **Go deep** — the internal start-here guide explains how to point any of the five host tools at the Orchestrator and walk a ticket from idea to PR. See **[`agent-factory/README.md`](agent-factory/README.md)**.

## Changelog

The release history lives in [`CHANGELOG.md`](CHANGELOG.md) and follows Keep a Changelog.

## Acknowledgements

grugops is inspired by **The Grug Brained Developer** (https://grugbrain.dev) by Carson Gross —
the philosophy of fighting complexity with simplicity. grugops is an independent project and is
not affiliated with or endorsed by the author; we simply stand in that lineage. Thank you, grug.

---

_grugops is an independent, open-source developer tool. "grugops" uses "grug" in the
software-culture sense (the grug-brained-developer philosophy). grugops is **not affiliated
with, endorsed by, or connected to** the "Grug" children's book series by Ted Prior or its
publishers. All grugops artwork is original._

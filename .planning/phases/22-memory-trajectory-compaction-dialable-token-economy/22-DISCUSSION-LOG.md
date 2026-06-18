# Phase 22: Memory & Trajectory Compaction (Dialable, Token-Economy) - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-18
**Phase:** 22-memory-trajectory-compaction-dialable-token-economy
**Areas discussed:** Division of labor, Dial level semantics, threads/ lifecycle, Workflow 18 trigger

---

## Area selection

| Option | Description | Selected |
|--------|-------------|----------|
| Division of labor | Who distills vs what compactor.ts mechanically does | ✓ |
| Dial level semantics | What aggressive\|balanced\|retain-raw concretely change | ✓ |
| threads/ lifecycle | Per-agent vs per-task, git-tracked vs ephemeral, retention | ✓ |
| Workflow 18 trigger | When an agent compacts + the re-verify | ✓ |

**User's choice:** All four areas selected.

---

## Division of labor

| Option | Description | Selected |
|--------|-------------|----------|
| Dumb carve-out guard only | compactor.ts = zero-LLM node:fs invariant checker (failed-attempt survival + provenance intact) + promotes only via context-io appendNote; agent compresses bodies. No semantic folding (only reuse currentState's supersedes collapse). | ✓ |
| Guard + heuristic dedup | compactor.ts additionally drops "duplicate" observations heuristically. | |

**User's choice:** Dumb carve-out guard only (agree).
**Notes:** The body/frontmatter seam is the spine — agent compresses *bodies* (semantic, the role's intelligence), compactor.ts protects *structure* (mechanical, deterministic). Mirrors Phase 21's tool-enforces/role-judges split. "Drop a duplicate observation" is a judgment in disguise → stays the agent's job. → D-01/D-02/D-03.

---

## Dial level semantics

| Option | Description | Selected |
|--------|-------------|----------|
| Body-verbosity knob, dial-invariant note set | aggressive (lean default)=gist only, raw in threads/; balanced=gist+mid-tier summary; retain-raw=full bodies admitted. Carve-out identical & un-dialable at all three. | ✓ |
| Dial changes which notes promote | The set of promoted notes varies by level. | |

**User's choice:** Body-verbosity knob; promoted note set is dial-invariant; carve-out un-dialable (agree).
**Notes:** Defaults to `aggressive` when absent (lean). Documented across all three config surfaces (factory.config.json, factory.config.md, seed/.grugops/factory.config.json). → D-04/D-05/D-06.

---

## threads/ lifecycle

| Option | Description | Selected |
|--------|-------------|----------|
| Gitignored ephemeral scratch | Only the compact verified context is committed/reviewed; clean PRs; retain-raw = promote raw INTO committed shared context (the dial owns durability, not git). | ✓ |
| Committed + retained | Full post-hoc unfold from git history; noisy diffs + repo bloat. | |

**User's choice:** Gitignored ephemeral (agree). Thread keying: per-task-per-agent `.grugops/context/<task>/threads/<agent>.md` (agree — deliberate refinement of CMP-01's literal flat `threads/<agent>.md`, for parallel-fan-out collision safety).
**Notes:** Audit story stays "git log over the *verified* context," not every raw agent thought. Unfold-on-demand operates within the live session, not post-hoc from git. → D-07/D-08/D-09.

---

## Workflow 18 trigger

| Option | Description | Selected |
|--------|-------------|----------|
| Task-handback primary + mid-task pressure secondary | One distillation pass at handback (not per-write); opportunistic mid-task checkpoint on context-window pressure. Re-verify reuses Phase-21 admit() for promoted findings only; soft kinds pass through. | ✓ |
| Per-write distillation | Every appendNote runs compaction. | |

**User's choice:** Task-handback primary + mid-task secondary; re-verify reuses admit() (agree).
**Notes:** WF18 references WF16's admission rather than restating it (single-source). Compressing a finding's body keeps its §14-gate#<id> stamp valid (the verdict verified the work, not the words) → cheap re-admission; a materially-changed finding degrades honestly to a `claim`. → D-10/D-11/D-12.

---

## Claude's Discretion

- The exact body-compression *tiers* the dial expresses in WF18 prose (behaviors locked, prose shape open).
- Whether the carve-out checker is one compactor.ts function or a small set (separation of concerns locked, surface open).
- Exact `.gitignore` entry wording/location for the `threads/` tier; whether the seed/installer creates the `threads/` parent dir.
- Internal section ordering of `18-context-compaction.md`.
- The mid-task pressure-trigger threshold/heuristic (advisory).

## Deferred Ideas

- Re-compaction of the already-admitted shared context itself (DeLM Stage-1→Stage-2) → CMP-04, v2.x. Phase 22 is trajectory→shared only (confirmed boundary).
- Committed/retained `threads/` with post-hoc git unfold → rejected (D-07); re-openable only if `retain-raw` proves insufficient in the Phase-26 dogfood.
- `guard_context_protocol_single_source` foundation guard → Phase 24.
- Heuristic/semantic dedup inside compactor.ts → rejected (D-03); stays the agent's job.

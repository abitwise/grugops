---
phase: 3
slug: roles-agents-md-substrate
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-03
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> **This is a markdown-authoring phase** — "tests" are structural / verbatim-fidelity / size-cap / no-fabrication / frozen-path-citation shell checks (grep / wc / jq / test), NOT runtime tests. They mirror what the Phase-6 validator (VAL-01) will later enforce, so building them now de-risks Phase 6. Source: `03-RESEARCH.md` → Validation Architecture.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Shell-based structural checks (`grep` / `wc` / `test`). No test runner exists or is needed (markdown phase). The real Node validator (`scripts/validate-agent-factory.mjs`) is Phase-6/VAL-01 and is intentionally `UNKNOWN - verify` here per D-18. |
| **Config file** | none — see Wave 0 |
| **Quick run command** | per-file: 9-section grep + frontmatter check + the three D-17 universal-line greps (config-first / board-move / trace-append) |
| **Full suite command** | `.planning/phases/03-roles-agents-md-substrate/check-structure.sh` (Wave 0) — all 16 roles + AGENTS.md §17.1 shape + 32 KiB cap + 12-rules single-source + drift guard |
| **Estimated runtime** | ~2 seconds (pure shell) |

---

## Sampling Rate

- **Per role authored:** run the 9-section grep + `kind:/tier:` frontmatter check + the three D-17 universal-line greps for that file.
- **Per wave merge:** run the full structural suite over all files authored so far + the drift guard (`grep -l 'plans/.*-handoff' agent-factory/roles/*.md` must be empty).
- **Before `/gsd-verify-work`:** full suite green — all 16 roles 9/9 sections; AGENTS.md §17.1 shape + <32 KiB + all-`UNKNOWN - verify` commands + 12 rules verbatim and single-sourced.
- **Max feedback latency:** ~2 seconds.

---

## Per-Task Verification Map

> Task IDs are assigned by the planner; this map is keyed by requirement until plans exist. Every check is `❌ W0` because the role files + AGENTS.md do not exist yet — that is expected for a greenfield authoring phase. The checks ARE the acceptance criteria, runnable the moment each file lands.

| Req | Behavior | Check type | Automated command (abbrev.) | Threat Ref | File Exists |
|-----|----------|-----------|------------------------------|------------|-------------|
| ROLE-01 | 11 core role files, each with all 9 skeleton sections | structural | `grep -L` 9 `## ` headings over the 11 core files (any path printed = missing section) | — | ❌ W0 |
| ROLE-01 | each core role has `kind: role` + `tier: core` (D-16) | structural | `grep -l 'tier: core' agent-factory/roles/*.md \| wc -l` == 11 | — | ❌ W0 |
| ROLE-01 | each role reads config first / moves board / appends trace (D-17) | content | `grep -L 'factory.config.json' …; grep -L 'plans/board.md' …; grep -L 'plans/traceability.md' …` (no output = present) | T-03-EoP | ❌ W0 |
| ROLE-02 | 5 enterprise role files, `tier: enterprise` + 9 sections | structural | `grep -l 'tier: enterprise' … \| wc -l` == 5; 9-section grep over the 5 | — | ❌ W0 |
| ROLE-02 | each enterprise role states `mode=enterprise` OR its trigger (D-22) | content | `grep -L 'enterprise' {release-manager,compliance-officer,incident-responder,factory-coach,installer}.md` (no output) | — | ❌ W0 |
| ROLE-03 | Orchestrator: routing matrix + 15-item classification + WIP/DoR + `SPLIT_REQUIRED` + hard limits | content/verbatim | grep `SPLIT_REQUIRED`, `definition-of-ready`, `Never merge`, the routing arrows, the 15 classification tokens in `orchestrator.md` | T-03-EoP | ❌ W0 |
| ROLE-03 | Orchestrator names Phase-4 workflows without inlining steps | content | `grep -c '0[0-9]-\|1[0-3]-' orchestrator.md` present; manual: no numbered step-sequence bodies | — | ❌ W0 |
| AGENTS-01 | root `AGENTS.md` exists, §17.1 headings, < 32 KiB | structural/size | `test -f AGENTS.md && grep` §17.1 headings `&& [ $(wc -c < AGENTS.md) -lt 32768 ]` | T-03-Tamper | ❌ W0 |
| AGENTS-01 | every Commands slot is `UNKNOWN - verify` (no fabricated command) | no-fabrication | `grep -c 'UNKNOWN - verify' AGENTS.md` ≥ slot count; manual scan for any real `npm/npx/node` command | T-03-Tamper | ❌ W0 |
| AGENTS-02 | 12 rules (4 principles) verbatim in AGENTS.md, clear voice | verbatim | grep each principle heading + a distinctive phrase per rule | — | ❌ W0 |
| AGENTS-02 | 15 non-Scribe roles point at AGENTS.md (don't restate the rules) | content | no non-Scribe role contains rule text (single-source check) | — | ❌ W0 |
| (cross) | no role cites a `plans/…-handoff.md` path — **drift guard** | content | `grep -l 'plans/.*-handoff' agent-factory/roles/*.md` == ∅ | — | ❌ W0 |
| (cross) | only frozen on-disk paths cited; no invented filenames | content | extract cited `agent-factory/…` + `plans/…` paths, `test -e` each | — | ❌ W0 |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `.planning/phases/03-roles-agents-md-substrate/check-structure.sh` — the combined structural / verbatim / size / no-fabrication / drift script (the commands above, runnable). Pure POSIX shell + `grep`/`wc`/`test`.
- [ ] No framework to install — markdown phase. The future Node validator is Phase-6/VAL-01 and is intentionally `UNKNOWN - verify` here per D-18.

*The checks are the acceptance criteria; they go red until each file lands, then green.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Caveman prompts reproduced **verbatim** from spec §5.A/§5.B | ROLE-01, ROLE-02 | Byte-exact fidelity to spec prose; grep proves presence but a human/diff confirms no paraphrase | Diff each `## Caveman prompt` block against the spec source line range recorded in RESEARCH.md Roles Inventory |
| Two-voice discipline (grug in prompts; **clear voice** in 12 rules / safety / compliance) | AGENTS-02, ROLE-02 | Voice is a qualitative judgement, not greppable | Read AGENTS.md safety + 12-rules sections and Security/NFR + Compliance role bodies; confirm no grug phrasing on safety topics (D-21) |
| Orchestrator routing matrix matches §5.A.1 exactly | ROLE-03 | Matrix correctness (request-type → workflow) needs a human cross-check vs spec | Compare the routing table against §5.A.1 and RESEARCH.md's extracted contract |

---

## Validation Sign-Off

- [ ] Every role file passes its 9-section + frontmatter + D-17 universal-line checks
- [ ] Sampling continuity: each authored file is checked before its wave merges
- [ ] Wave 0 ships `check-structure.sh` covering all 16 roles + AGENTS.md
- [ ] Drift guard green (`plans/.*-handoff` citation count == 0)
- [ ] AGENTS.md < 32 KiB and every Commands slot is `UNKNOWN - verify`
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending

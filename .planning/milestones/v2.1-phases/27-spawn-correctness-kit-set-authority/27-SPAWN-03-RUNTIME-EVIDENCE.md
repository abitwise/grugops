---
phase: 27-spawn-correctness-kit-set-authority
requirement: SPAWN-03
kind: runtime-observation-record
# The one machine-readable fact in this file. It stays at this value until a human performs the
# observation and fills the slots below. No command in this repository may change it.
status: performed-observation-matches-expected
observation_performed: true
observed_by: Olger Oeselg
observed_date: 2026-07-29
precheck: node scripts/coordinator-resolution-precheck.js
created: 2026-07-29
plan: 27-16
---

# SPAWN-03 — runtime observation record

**This is a recording surface, not a report.** It exists before the check is run so that the result
of the check is a committed artifact rather than a sentence in a chat log. Every slot below is empty.
**An empty slot means the check was not performed. It never means the check held.**

No agent may fill these slots from the output of a command. The only thing that fills them is a
person who ran the session and saw what happened. If you are an agent reading this file: the correct
action when a slot is empty is to report SPAWN-03's runtime half as unperformed, not to infer it.

---

## What is being checked

Quoted from `27-VERIFICATION.md` § Human Verification Required, without reinterpretation:

> **Test:** From an installed target repository, run `claude --agent grugops-orchestrator`; observe
> the session startup header, then ask for work that routes to a specialist (e.g., "map this repo")
> and observe whether a distinct role agent resolves and runs.
>
> **Expected:** Startup header names `@grugops-orchestrator`; a role agent (not the coordinator
> itself) executes the routed subtask.
>
> **Why human:** The Claude Code runtime is the system under test; the startup header is an
> interactive TUI element with no in-repo command able to observe it.

A print-mode invocation is not a substitute: it would spend real tokens and still not emit the
startup header, so it would buy nothing and cost something.

## What is already discharged, and by what

The observable preconditions of this check are not open. They are discharged by one command:

```sh
node scripts/coordinator-resolution-precheck.js --keep-scratch-target
```

It performs a scratch install into its own temporary target and its own temporary kit home (the real
`~/.grugops` is never touched), then reports the installed adapter count, the coordinator's agent
name — located by its `coordinator: true` marker rather than by filename — the size of its enumerated
grant, how many granted names resolve to an installed adapter file, and the materialized absolute kit
path plus the coordinator role file beneath it. It exits non-zero naming any precondition that fails,
so nobody is sent into the session below against a tree a command could have shown to be broken.

It starts no model session and spends no tokens, and it asserts nothing about the two steps below.
Run it first; `--keep-scratch-target` leaves an installed target in place and prints its path, so the
commands it prints can be pasted without editing.

---

## Slots — all empty, all UNVERIFIED

Fill each from what you saw. Paste the block the precheck prints; these slots match it field for
field.

- **platform version observed:** `2.1.220 (Claude Code)`
- **session startup header text observed (verbatim):** `grugops-orchestr` — the header line was
  truncated by terminal width at the point the observer read it, so the trailing characters and the
  presence or absence of a leading `@` are **not** established by this observation. What is
  established is that the header carried the coordinator's agent name. Recorded as seen; not
  reconstructed into `@grugops-orchestrator`.
- **did that header name the coordinator agent:** yes.
- **request made:** `audit current architecture`
- **role agent that resolved and ran:** three distinct role agents resolved and ran —
  `grugops-brownfield-mapper`, `grugops-architect-design`, `grugops-security-nfr`. All three are
  members of the coordinator's enumerated grant. The coordinator announced `Tier: Full` and
  `width 3/3 — at queue.wip_limit, not over`.
- **did the coordinator work the task inline instead:** no.
- **date observed:** 2026-07-29
- **observed by:** Olger Oeselg

**Target and session.** Observed against the installed target
`/Users/olgeroeselg/Projects/hacks/grugops-examples/cli-chess-example` in a **fresh** session
(`claude --agent grugops-orchestrator`), after a re-install brought that repository from a stale
Jul-22 install to the current adapter set. Session id `9bcd8d66-091d-4387-aef0-04319f4d4015`.

**Provenance of each slot.** The header, the request, the role agents and the inline question were
observed by the named human in the interactive session and reported in their own words. The
platform version was read from `claude --version` on the same machine. The session transcript was
inspected afterwards only to corroborate what the observer reported — it did not originate any slot
above, and it contradicted none of them.

**A prior non-observation, recorded so it is not mistaken for this one.** An earlier attempt on
2026-07-29 against the same repository produced the *opposite* behaviour — zero `Agent` calls and a
fall back to `_role-switch-protocol.md` (`▶ entering ARCHITECT/DESIGN`). That attempt is **not** a
mismatch and is not recorded as one: the target then carried a Jul-22 install with one adapter file
and a 7-name grant of which **0 names resolved**, so nothing was spawnable and the single-window
degrade was correct behaviour. `coordinator-resolution-precheck.js --inspect-target` exits 1 on that
tree naming exactly that condition. The attempt was therefore a non-observation against a tree the
precheck rejects, not an observation that disagreed. Re-observing after fixing the precondition is
not the prohibited "re-run until it agrees"; the specified test had not yet been run against a
conforming target.

### Recorded only if encountered

These three are edges the phase probe surfaced. A single routed subtask may exercise none of them, so
they are **recorded if encountered, never required**. Each asks for what was seen. None of them asks
for a rule to be inferred: if the edge did not occur, leave the slot empty and claim nothing about how
the runtime would have behaved.

- **same agent name at project scope and at user scope: which scope the runtime resolved:** _(empty — UNVERIFIED)_ — not encountered; this observation exercised no scope collision, and nothing is claimed about how the runtime would resolve one.
- **no adapter matches the requested name: the exact error text emitted:** _(empty — UNVERIFIED)_ — not encountered in this observation. Note that the *prior* non-observation above stood on a tree where 7 of 7 granted names resolved to no adapter file, yet no runtime error text was captured from it either, because the coordinator degraded to the single-window protocol rather than attempting a spawn. The error text remains unobserved.
- **more than one role agent routed in one turn: the observed order, and whether it was stable:**
  **Encountered.** Three role agents were routed in a single turn, in this order:
  `grugops-brownfield-mapper` → `grugops-architect-design` → `grugops-security-nfr`.
  **Stability is NOT established.** Only one such turn was observed, in one session. A single
  occurrence cannot show whether the order is stable, and no ordering guarantee is claimed from it.

---

## The two outcomes, and what each obliges

**If the observation matches the expected result** — the header names `@grugops-orchestrator` and a
distinct role agent resolves and runs — then fill every required slot, set `status` in the frontmatter
to reflect the performed observation, mark SPAWN-03 complete in `.planning/REQUIREMENTS.md`, and cite
this file as the evidence. The citation is this file, not a recollection of it.

**If the observation does not match** — no header, the wrong agent name, or the coordinator working
the routed subtask inline — then record exactly what was seen, in the observer's own words, in the
same slots. SPAWN-03 stays open. The discrepancy becomes a finding to be planned against; it is not a
reason to re-run the session until it agrees, and it is not a reason to soften the expected result.
The first honest observation is the one that counts.

**If the observation was not performed at all**, this file stays exactly as it is. That is a
legitimate state and it is the state it ships in. SPAWN-03's documented half and in-repo half are
green (plan 27-09) and its observable preconditions are discharged by the precheck (plan 27-16); its
runtime half is unperformed, and marking the requirement complete on the strength of the observable
half alone would repeat precisely the failure this phase exists to fix.

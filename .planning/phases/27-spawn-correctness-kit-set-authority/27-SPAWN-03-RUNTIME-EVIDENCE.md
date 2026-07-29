---
phase: 27-spawn-correctness-kit-set-authority
requirement: SPAWN-03
kind: runtime-observation-record
# The one machine-readable fact in this file. It stays at this value until a human performs the
# observation and fills the slots below. No command in this repository may change it.
status: unperformed-pending-human-verification
observation_performed: false
observed_by:
observed_date:
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

- **platform version observed:** _(empty — UNVERIFIED)_
- **session startup header text observed (verbatim):** _(empty — UNVERIFIED)_
- **did that header name the coordinator agent:** _(empty — UNVERIFIED)_
- **request made:** _(empty — UNVERIFIED)_
- **role agent that resolved and ran:** _(empty — UNVERIFIED)_
- **did the coordinator work the task inline instead:** _(empty — UNVERIFIED)_
- **date observed:** _(empty — UNVERIFIED)_
- **observed by:** _(empty — UNVERIFIED)_

### Recorded only if encountered

These three are edges the phase probe surfaced. A single routed subtask may exercise none of them, so
they are **recorded if encountered, never required**. Each asks for what was seen. None of them asks
for a rule to be inferred: if the edge did not occur, leave the slot empty and claim nothing about how
the runtime would have behaved.

- **same agent name at project scope and at user scope: which scope the runtime resolved:** _(empty — UNVERIFIED)_
- **no adapter matches the requested name: the exact error text emitted:** _(empty — UNVERIFIED)_
- **more than one role agent routed in one turn: the observed order, and whether it was stable:** _(empty — UNVERIFIED)_

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

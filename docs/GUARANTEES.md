# grugops safety guarantees

> **GENERATED — do not hand-edit.** Regenerate with:
>
> ```
> npm run generate:guarantees
> ```

- **Safety claims joined:** 6
- **Derived from:** `docs/audit/28-claim-registry.md` (rows with `kind: safety`) joined to the live per-checkpoint matrix through each row's `depends_on` floors
- **Safety floors:** `open_pr`, `production_requires_human_confirmation`, `protected_branch_merge`, `test_integrity`

## What this document answers

**Which public sentences stop being true on THIS repository, and why.** A claim registry row
records which sentence rests on which safety floor. The checkpoint matrix records where each
floor is actually held here. Neither answers the reader's real question on its own, so this
page is the join, and it is the only place in the tree that computes it.

It is not a promise. Every row below carries the status the registry measured it at, including
the rows measured `overstated`, because a guarantees page that quietly dropped its own weakest
rows would be the defect it exists to catch.

## Where the checkpoints are held

**all checkpoints at default.** Every checkpoint on the roster sits at its documented default, so
no floor below is lowered and every row in the table holds at the status the registry
measured. A repository that configures nothing lands here: nothing is lowered by omission.

## Which public sentences rest on which floor

| claim | file | measured status | floors, and where each is held | standing |
|---|---|---|---|---|
| `C-28-001` | `README.md` | overstated | `open_pr` at `block`; `production_requires_human_confirmation` at `block`; `protected_branch_merge` at `block` | held |
| `C-28-010` | `AGENTS.md` | overstated | `open_pr` at `block`; `production_requires_human_confirmation` at `block`; `protected_branch_merge` at `block` | held |
| `C-28-018` | `AGENTS.md` | overstated | `protected_branch_merge` at `block`; `production_requires_human_confirmation` at `block`; `test_integrity` at `block` | held |
| `C-28-023` | `agent-factory/README.md` | overstated | `open_pr` at `block`; `production_requires_human_confirmation` at `block`; `protected_branch_merge` at `block` | held |
| `C-28-032` | `agent-factory/README.md` | true | `open_pr` at `block`; `protected_branch_merge` at `block` | held |
| `C-28-038` | `.claude-plugin/plugin.json` | overstated | `open_pr` at `block`; `production_requires_human_confirmation` at `block`; `protected_branch_merge` at `block` | held |

## The residual this page does not close

**Lowering a safety floor takes two keys, and the second one is a session environment variable**
**a human sets by name.** The claim this page makes about that variable is the one that holds,
stated at its true tier rather than as an absolute:

- It is **un-forgeable from inside a tool call**. An agent's own inline `export VAR=...` lands
  in the child environment it spawns, which the hook process never inherits; a human's session
  export does reach the hook.
- It is **reachable by an agent that can write the host's settings files**. A settings-file
  `env` entry in `.claude/settings.json` or `.claude/settings.local.json` is reapplied to a live
  session and is read by the next hook subprocess as if a human had exported it. The hook cannot
  tell the two apart, because the value is the same string either way.
- The narrowing measure is a `permissions.deny` recommendation over those settings files plus a
  companion write-matcher guard. It **narrows** the vector; it does not close it, and this page
  does not say that it does. An agent that can write arbitrary project files can reach the grant
  — the same irreducible class the residual register records as the same-uid, no-hook,
  direct-filesystem forgery residual, disposition `accepted`.
- The grant is **session-scoped under a name, not per-action consent**. One export authorizes
  every subsequent action the lowered floor admits, for the life of that session. A reader who
  takes it as an approval of one act is reading it more narrowly than it is written.

`UNKNOWN - verify`: whether a host tier exists on which the settings-file vector is closed
rather than narrowed. Nothing in this repository measures that today, and this page does not
assert it.

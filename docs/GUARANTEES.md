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

## The residuals this page does not close

Every entry below is quoted from `docs/audit/28-residual-sizing.md` § *Phase 30 additions to this register (AUTO-05)*.
This page does not restate them in its own words: it publishes the register's, so the record and
the public page cannot come to disagree about what is still open.

### 9. settings-file `env` grant-injection vector

**Disposition:** `accepted`

> **Irreducible, and the same class as row 4 above.** Lowering a safety floor takes two keys, and the second is a session environment variable a human sets by name. The claim that holds, stated at its true tier rather than as an absolute: the grant is **un-forgeable from inside a tool call** — an agent's own inline `export VAR=...` lands in the child environment it spawns, which the hook process never inherits, while a human's session export does reach the hook. It is nonetheless **reachable by an agent that can write the host's settings files**: an `env` entry in `.claude/settings.json` or `.claude/settings.local.json` is reapplied to a live session and is read by the next hook subprocess as if a human had exported it, and the hook cannot tell the two apart because the value is the same string either way. **The tier of that mechanism sentence, stated rather than implied (plan 30-11).** The vendor documentation states that settings-file `env` entries are reapplied dynamically during active sessions when the file changes; it does not state that a hook subprocess spawned after the edit inherits the new value. The composition of the two is an INFERENCE, not an observation. Plan 30-11 built the empirical reproduction — a read-only PreToolUse observer registered through the settings file mid-session — and **the settings write was refused by the host's own permission classifier before any byte was written**, so the reproduction could not be run. That is not the same fact as "it did not reproduce", and neither outcome would close this row: the residual keeps every clause, at `accepted`, and the reproduction stays outstanding. What plan 30-11 DID observe on the host, directly in the installed binary (Claude Code 2.1.263, artifact 2.1.260): the `CLAUDE_CODE_SUBPROCESS_ENV_SCRUB` feature exists, is off by default outside GitHub Actions, targets CI-injected `INPUT_*`/`NPM_CONFIG_*` inputs rather than acting as a general variable filter, and the binary contains **zero** occurrences of the string `GRUGOPS` — so no shipped scrub list on this version names a `GRUGOPS_*` variable by name. The membership of that list was not extracted, so the general risk that such a list could widen is unchanged. The narrowing measure is a `permissions.deny` recommendation over those settings files plus a companion write-matcher guard; it **narrows** the vector and does not close it, for the same reason row 4 is irreducible — an agent that can write arbitrary project files can reach the grant. The grant is also **session-scoped under a name, not per-action consent**: one export authorizes every subsequent action the lowered floor admits, for the life of that session, and a reader who takes it as approval of one act is reading it more narrowly than it is written. **This is a pre-existing exposure, not one Phase 30 introduced** — it applies identically to `GRUGOPS_PROD_DEPLOY_APPROVED` and `GRUGOPS_ADMISSION_APPROVED_BY`; Phase 30 is the first phase to look, which is why it is the phase that disposes of it. `UNKNOWN - verify`: whether a host tier exists on which this vector is closed rather than narrowed. Nothing in this repository measures that today, and no document here asserts it.

### 10. host-side subprocess environment scrubbing could break the grant mechanism silently

**Disposition:** `accepted`

> **Watch item, recorded with its source tier rather than cited as established.** Claude Code v2.1.251 is reported to have introduced `CLAUDE_CODE_SUBPROCESS_ENV_SCRUB=1`, which strips `CLAUDE_CONFIG_DIR` from hook and Bash subprocess environments. **Source tier: `ASSUMED`** — the report comes from a GitHub issue title surfaced in a web search, not from primary vendor documentation, and repeating it here does not upgrade it. If such a scrub list ever widens to unrecognised variables, every `GRUGOPS_FLOOR_*` grant would stop reaching the hook and the two-key mechanism would break silently. The break direction is fail-safe — a floor that can no longer be lowered stays at `block` — but a mechanism that stops working without saying so is not a thing to learn from a user report. Measured 2026-09-05: `claude --version` reports `2.1.261`, already past the named version, and the existing grants work on this host. `UNKNOWN - verify`: whether that scrub list is documented anywhere primary, and what it enumerates. Nothing in this repository treats environment inheritance as a permanent guarantee.

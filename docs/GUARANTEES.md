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

## Where each floor is enforced

Each safety floor is held in up to three tiers. The **hard floor** is the git host: it is the
only tier that sees every push and merge, and every deployment that runs through its deployment
environments, whatever command spelled it. `tools/grugops/host-protection.js` reports read-only
whether it is configured; grugops never configures it. The **speed bump** is the Claude Code ask
rules the standalone installer writes: they cover the usual command spellings and are not a
security boundary. **Prose** is the role and workflow text an agent reads; it is a written rule
and nothing more. The Bash command guard earlier releases shipped was retired by 33.1 D-17,
because no parser of shell text could be closed. `none` means the floor has no mechanism in
that tier.

| floor | hard floor | speed bump | prose |
|---|---|---|---|
| `open_pr` | none | none | The roles stop at a pull request instead of carrying the change further. No mechanism enforces it (33.1 D-26). |
| `test_integrity` | none | none | The gate's test-integrity step surfaces weakened or skipped tests. No mechanism enforces it (33.1 D-26). |
| `production_requires_human_confirmation` | The git host: a production deployment environment meeting every production item of the git-host setup checklist in `install/README.md` §5. Reported read-only by `tools/grugops/host-protection.js`. | Claude Code ask rules for the deploy and publish tools, written by the installer (standalone install only; not a security boundary). | Workflow 12 requires a named human to confirm the production action. |
| `protected_branch_merge` | The git host: branch protection or a ruleset on each protected branch meeting every branch item of the git-host setup checklist in `install/README.md` §5. Reported read-only by `tools/grugops/host-protection.js`. | Claude Code ask rules for `git push` and `gh pr merge`, written by the installer (standalone install only; not a security boundary). | The roles stop at the pull request; a human holds the merge. |

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

> **Re-scoped 2026-09-26 by 33.1 D-17 and D-26:** the floor grants and the deploy approval were retired; this residual now concerns the admission grant only. The admission grant (`GRUGOPS_ADMISSION_APPROVED_BY`, 33.1 D-24) is unchanged, and it is exposed to this vector exactly as the retired grants were, so the disposition stays `accepted`. **Irreducible, and the same class as row 4 above.** (A backticked path written `EXTERNAL:…` is the HOST's own file, not one this repository ships; the marker is what makes an out-of-tree citation a deliberate act rather than an unchecked one. **No implementation pointer is given here on purpose** — round 3 published one, it named the gate's second home while the gate was already at its third, and the gate built to catch a published sentence naming something that is not there could not see it, because the cited FILE was tracked while the CLAIM about it was false. A mechanism's location is not a public fact.) Admitting a gated note into the shared context needs a session environment variable a human sets to their own name, matched by the admission hook against the note's `human:<name>` stamp. Before 33.1 D-26, lowering a safety floor also took a second key of the same kind; that family is retired. The claim that holds, stated at its true tier rather than as an absolute: the grant is **un-forgeable from inside a tool call** — an agent's own inline `export VAR=...` lands in the child environment it spawns, which the hook process never inherits **[inferred]**, while a human's session export does reach the hook **[inferred]**. **Both halves of that sentence are INFERENCES, and round 3 says so because round 2 tiered only one of them.** The protective half — that an agent's export cannot reach the hook — is the load-bearing floor of this whole guarantee, and it has never been exercised: round 1's thirteen self-set spawns measured a REFUSAL PATTERN OVER A COMMAND STRING, not what a host-spawned hook inherits after an agent exports something, and the round-2 observer was live for three tool calls without one of them being such an export. Publishing the exposure as inferred and the protection as fact is the same asymmetry with the signs reversed. **What one further observation would need, recorded so a human can decide rather than rediscover:** a second granted settings write to re-register the read-only observer, then one tool call in which the agent exports a grant-shaped variable into its own shell and runs a harmless command — which grants nothing to anyone, because an agent exporting into its own child shell is the very thing being shown not to propagate. The human's grant was for ONE write and it was used; no further settings write has been made. It is nonetheless **reachable by an agent that can write the host's settings files**: an `env` entry in `EXTERNAL:.claude/settings.json` or `EXTERNAL:.claude/settings.local.json` is reapplied to a live session and is read by the next hook subprocess as if a human had exported it, and the hook cannot tell the two apart because the value is the same string either way **[inferred]**. **OBSERVED, in plan 30-11 round 2, on this host.** Round 1 could not run the reproduction — the settings write was refused by the host's own permission classifier before any byte was written — and the mechanism sentence was published as an INFERENCE. The human then granted a one-experiment write, and **the vector reproduces**: a read-only PreToolUse observer was registered through `EXTERNAL:.claude/settings.local.json` mid-session, and the `env` entry written beside it reached a hook subprocess spawned afterwards **on the very next tool call, with no restart and no reload** (Claude Code `2.1.263`, artifact `2.1.260`, Node `v24.12.0`; the probe name was `GRUGOPS_`-prefixed, so the observation covers the prefix family the grants belong to; the settings file was restored byte-identical). Removing the entry is live in the same way. So this clause is a measurement, and the residual is **confirmed rather than softened**. **What is still NOT observed, and is marked here because the positive half of the guarantee rests on it:** a *human's login-shell export* reaching Claude Code's own process was not exercised, because that needs a session launched with the variable already exported. What IS measured is that a hook subprocess carries environment supplied by its parent — the same composition, from the settings-file side. The sentence above that a human's session export reaches the hook is therefore the vendor-documented mechanism this design rests on, at the same tier as the settings-file half rather than at a higher one. What plan 30-11 DID observe on the host, directly in the installed binary (Claude Code 2.1.263, artifact 2.1.260): the `CLAUDE_CODE_SUBPROCESS_ENV_SCRUB` feature exists, is off by default outside GitHub Actions, targets CI-injected `INPUT_*`/`NPM_CONFIG_*` inputs rather than acting as a general variable filter, and the binary contains **zero** occurrences of the string `GRUGOPS` — so no shipped scrub list on this version names a `GRUGOPS_*` variable by name. The membership of that list was not extracted, so the general risk that such a list could widen is unchanged. The narrowing measure **would be** a `permissions.deny` recommendation over those settings files plus a companion write-matcher guard, and **neither is in the tree at HEAD** — measured in plan 30-11 round 2: zero `permissions.deny` recommendations anywhere in `install/`, `agent-factory/`, `.claude-plugin/` or `hooks/`, and `hooks/hooks.json` carried exactly two PreToolUse matchers, neither of which matched `Write` or `Edit`. After 33.1 D-17 it carries one, the admission gate's, and that one matches neither either. Published in the present indicative until then, this sentence told a reader the vector was *currently* narrowed by two mechanisms that do not exist, which is the softening this row forbids for its other clauses. Were they built they would **narrow** the vector and not close it, for the same reason row 4 is irreducible — an agent that can write arbitrary project files can reach the grant. `UNKNOWN - verify`: whether they land, and where. The grant is also **session-scoped under a name, not per-action consent**: one export authorizes every subsequent gated admission under that name, for the life of that session, and a reader who takes it as approval of one act is reading it more narrowly than it is written. **This is a pre-existing exposure, not one Phase 30 introduced** — it applied identically to the deploy approval, retired by 33.1 D-17, and it applies to `GRUGOPS_ADMISSION_APPROVED_BY`; Phase 30 is the first phase to look, which is why it is the phase that disposes of it. `UNKNOWN - verify`: whether a host tier exists on which this vector is closed rather than narrowed. Nothing in this repository measures that today, and no document here asserts it.

### 10. host-side subprocess environment scrubbing could break the grant mechanism silently

**Disposition:** `accepted`

> **Re-scoped 2026-09-26 by 33.1 D-17 and D-26:** the floor grants and the deploy approval were retired; this residual now concerns the admission grant only. The watch item is unchanged in kind: a widened scrub list would now stop the admission grant reaching the admission hook, so the disposition stays `accepted`. **Watch item, now recorded from DIRECT OBSERVATION of the installed artifact rather than from a web-search report (plan 30-11, rounds 1 and 2).** It entered this register at source tier `ASSUMED`, from a GitHub issue title claiming Claude Code v2.1.251 introduced `CLAUDE_CODE_SUBPROCESS_ENV_SCRUB=1` which strips `CLAUDE_CONFIG_DIR`. **That specific claim was NOT confirmed and is corrected here to what was observed** — the same correction row 9 carries, applied here too, because two rows resting on one measurement must not disagree about it. Observed by reading the installed binary (Claude Code `2.1.263`, artifact `2.1.260`): the variable exists; it is enabled by an explicit truthy value or implicitly under `GITHUB_ACTIONS` and is therefore **off by default outside CI**; its scrub set is built by flat-mapping a fixed list with `INPUT_<NAME>` and lowercase `NPM_CONFIG_*` forms beside code that rewrites credential-shaped values — the shape of a CI-injected-input hardening feature, not a general variable filter; and the binary contains **zero** occurrences of the string `GRUGOPS`, so no shipped scrub list on this version names a grant variable. The literal membership of that list was **not** extracted, so this row does not claim to know every name in it. If such a list ever widens to unrecognised variables, the admission grant would stop reaching the admission hook and the grant would break silently. The break direction is fail-safe — the hook denies a gated note it cannot match to a human grant — but a mechanism that stops working without saying so is not a thing to learn from a user report. **The former clause "and the existing grants work on this host" is withdrawn**: it sat inside a sentence beginning "Measured" and nothing measured it. What IS measured is that the admission hook reads its grant from its own process environment (its test suite spawns the compiled hook with and without the variable) and that a settings-file `env` entry populates that environment (row 9); whether a human's login-shell export does so on this host is unobserved. `UNKNOWN - verify`: whether that scrub list is documented anywhere primary, and what it enumerates. Nothing in this repository treats environment inheritance as a permanent guarantee.

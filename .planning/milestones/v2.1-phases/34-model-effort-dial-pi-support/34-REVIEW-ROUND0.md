---
phase: 34-model-effort-dial-pi-support
reviewed: 2026-10-07T10:55:00Z
depth: standard
files_reviewed: 56
files_reviewed_list:
  - .claude/agents/grugops-orchestrator.md
  - agent-factory/checklists/browser-uat-recipe.md
  - agent-factory/config/factory.config.md
  - agent-factory/contracts/context-note.md
  - agent-factory/packaging/adapters.md
  - agent-factory/packaging/slash-command.template.md
  - agent-factory/packaging/subagent.frontmatter.md
  - agent-factory/README.md
  - agent-factory/roles/_role-switch-protocol.md
  - agent-factory/workflows/16-context-read-write.md
  - CHANGELOG.md
  - CLAUDE.md
  - docs/audit/28-claim-registry.md
  - docs/audit/29-style-dispositions/34-06.md
  - docs/audit/29-style-dispositions/34-08.md
  - docs/audit/29-style-dispositions/34-09.md
  - docs/faq.md
  - examples/01-greenfield-bootstrap.md
  - hooks/admission-guard.ts
  - hooks/hook-entry.ts
  - install/host-tools-prose.test.ts
  - install/host-tools.test.ts
  - install/host-tools.ts
  - install/install.test.ts
  - install/install.ts
  - install/installer-cross-version.test.ts
  - install/installer-dry-run.test.ts
  - install/installer-fs-census.test.ts
  - install/installer-never-installed.test.ts
  - install/installer-special-files.test.ts
  - install/installer-user-edit.test.ts
  - install/ledger-provenance.test.ts
  - install/README.md
  - install/record-truth.test.ts
  - install/uninstall-removal.test.ts
  - README.md
  - scripts/adapter-byte-baseline.test.ts
  - scripts/adapters-freshness.test.ts
  - scripts/adapters-freshness.ts
  - scripts/admission-server.ts
  - scripts/canonical-frontmatter.test.ts
  - scripts/canonical-frontmatter.ts
  - scripts/check-foundation-guards.test.ts
  - scripts/check-foundation-guards.ts
  - scripts/check-uat-oracles.test.ts
  - scripts/check-uat-oracles.ts
  - scripts/context-io.test.ts
  - scripts/context-io.ts
  - scripts/dead-vocabulary.ts
  - scripts/generate-role-adapters.test.ts
  - scripts/generate-role-adapters.ts
  - scripts/model-dial-consistency.test.ts
  - scripts/model-tiers.test.ts
  - scripts/model-tiers.ts
  - scripts/validate-agent-factory.ts
  - scripts/validate.test.ts
findings:
  critical: 0
  warning: 7
  info: 5
  total: 12
status: issues_found
---

# Phase 34: Code Review Report

**Reviewed:** 2026-10-07T10:55:00Z
**Depth:** standard
**Files Reviewed:** 56
**Status:** issues_found

## Summary

Scope: the phase-34 diff `45766c2d..HEAD` for every listed file. Large files (model-tiers.ts,
check-foundation-guards.ts, install.ts, context-io.ts) were reviewed through their diffs plus the
call sites they reach.

What was checked and held:

- The effort dial path end to end. `readEffortBlock` refuses a degenerate block, unknown and
  case-varied keys (before any sibling is read), illegal presets and illegal levels, and an unknown
  `roles` stem. An own `__proto__` key is refused as unknown. `resolveEfforts` and the generator
  refuse before any byte is written. The emit writes no line for `inherit`.
- The gates. The freshness gate's effort pins treat an absent, duplicated or refused announcement
  as a failure. `guard_effort_assignment` fails on zero adapters, on a count mismatch, on an
  unreadable or unresolvable config (degrading to `inherit`, never to a pinned level) and on a
  stray `effort` key on a non-agent surface.
- Reproduced against the committed `.js` in scratch repos:
  - A tiered effort config with an `orchestrator: max` override emits the expected 17 `effort:`
    lines, and `--check` names all 17 adapters stale after a config edit.
  - An illegal level `MAX` is refused with no kit file written.
  - The Pi template is created, recorded in the ledger, removed by uninstall, and left alone when
    edited. A user's own `.pi/` is not claimed.
  - The targeted suites pass (234 tests), and `guard_effort_assignment` passes on the real tree.
- The runtime-string rewording in context-io.ts, admission-server.ts, admission-guard.ts and
  dead-vocabulary.ts touches comments and message strings only, with no behaviour change. The
  hook-entry manifest hashes were regenerated to match.
- The adapter sizes quoted in subagent.frontmatter.md (3013 / 1541 / 1901 bytes) match the
  committed files.

What did not hold. Seven warnings, and four of them belong to this repository's named defect
classes:

- **WR-03, a fix applied in one arm only.** The installer's bytes-against-announcement check was
  never extended to effort.
- **WR-04, published-message byte injection.** It was copied into a new reader.
- **WR-01, unrelated evidence read as proof.** Detection reads grugops's own output as proof that
  the host is in use.
- **WR-05, a derived set taken from the wrong attribute.** The closing line's host list derives
  from dispatch mode rather than from which host gets ask rules.

Two warnings are documentation claims the code does not back (WR-06, WR-07).

## Warnings

### WR-01: Host detection reads the installer's own writes as proof of use, so `pi` is reported in every re-installed repository

**File:** `install/install.ts:2652-2655`, `install/install.ts:5084`, `install/host-tools.ts:54,128`
**Issue:** `writePiPromptTemplate()` creates `.pi/prompts/grugops.md` unconditionally (D-17), and
`detectTools()` treats any `.pi` entry as proof that Pi is in use ("its presence means the host is
in use there", host-tools.ts:54). From the second run on, every repository reports `pi` whether or
not anyone uses Pi. Reproduced: a fresh `git init` target installed twice prints
`tools detected: claude gemini copilot pi` on the second run. The same self-pollution already
existed for `.github` (the Copilot pointer) and `.gemini` (mergeGemini). Phase 34 adds a new
member to that class and publishes a registry docstring that states the opposite. This is DC-1's
shape: grugops reads its own write as evidence that a host is in use.
**Fix:** Pick one:
- Probe for a host-owned signal rather than the directory grugops writes into. For example, count
  `.pi` as Pi in use only when it holds something other than the paths the install ledger records.
- Or exclude ledger-recorded paths from detection.
- At minimum, correct the docstring at host-tools.ts:54 and the "Detection" bullet in adapters.md
  to say that the signal includes grugops's own files.

### WR-02: Any non-directory `.pi` entry now makes every install exit 3 "INCOMPLETE", even for users who never use Pi

**File:** `install/install.ts:2382-2401` (`writePiPromptTemplate`), `install/install.ts:5084`
**Issue:** Because the write is unconditional, a target whose root holds a `.pi` regular file (an
unrelated tool's file, or a symlink) hits `readForWrite` → `blocked` → `verify(...)`. Reproduced:
`echo 3.14159 > .pi` followed by an install prints `verify .pi/prompts/grugops.md ... is not a
directory`, then `== install INCOMPLETE — 1 item(s) need verification ==`, and exits with code 3.
The same target exited 0 before this phase. An optional pointer for a host the user does not run
should not turn a clean install into a failed one, and `tools detected:` also reports `pi` for that
file (WR-01).
**Fix:** When the blocked component is the `.pi` entry itself and it is not a directory, report
`skipped` with the reason rather than `verify`. Keep `verify` for a hazard inside a real `.pi/`
directory, such as a symlink at `.pi/prompts` or a FIFO at the template path:
```ts
if (cur.state === "blocked") {
  const piRoot = join(TARGET, ".pi");
  if (cur.at === piRoot && !existsSync(join(piRoot, "prompts"))) {
    report("skipped", `${PI_PROMPT_REL} (Pi prompt template: ${cur.at} ${cur.reason}; not written)`);
    return;
  }
  verify(/* existing text */);
  return;
}
```
Also add a case to the special-files lane: a `.pi` regular file gives exit 0 and zero bytes
changed.

### WR-03: The installer cross-checks rendered MODEL aliases against the announcement but has no effort arm (the fix lives in one arm only)

**File:** `install/install.ts:4888-4902` (alias-set cross-check), `install/install.ts:3120-3160`
(announcement parse), `install/install.ts:3237` (`readRenderedAlias`)
**Issue:**
- The installer closes the loop for the model dial. It reads the `model:` line out of every
  rendered adapter, parses the generator's `resolved model assignment` announcement, and refuses
  to install if the two disagree.
- Plan 34-03 records why the effort half needs the same treatment ("A run that announced only its
  MODEL resolution would let ... certify an effort-configured regeneration"). It added that check
  to `adapters-freshness.ts` only.
- `install.ts` contains no `effort` token at all. The effort announcement is relayed verbatim but
  never parsed, and no rendered adapter's `effort:` line is read or compared.
- A transform, or a materialize step, that drops or duplicates the `effort:` line therefore
  installs adapters at a level the user did not configure, with no refusal. `--check` cannot see
  it either, because it compares against a fresh render through the same transform.
**Fix:** Mirror the alias arm:
- Parse the `resolved effort assignment` line through `resolvedEffortAssignmentsIn` semantics,
  re-implemented as the model probe already is, since install/ cannot import scripts/.
- Read each rendered adapter's `effort:` lines (zero lines means `inherit`; more than one is a
  refusal).
- Require the set of levels read to equal `announced.levels`, and the count of non-inherit
  adapters to be consistent with the announcement. Refuse the whole kit write on any mismatch,
  the way the alias arm does.

### WR-04: Raw control bytes and newlines from config keys are interpolated into effort refusals that the installer and guards print

**File:** `scripts/model-tiers.ts:2069-2086` (effort block unknown-key refusal); the same pattern,
pre-existing, sits at `scripts/model-tiers.ts:2199-2219` and `2300`
**Issue:** The unknown-key refusal formats each key as `` `models.effort.${key}` `` with no
escaping. Reproduced against the committed `.js`: the key
`"pre\u001b]0;pwned\u0007set\nFAKE: all checks passed"` comes back in `reason` as raw
ESC/OSC/BEL bytes plus a real newline. The installer prints that reason on an `ERROR` line, and
`check-foundation-guards` prints it in a failure, so a config author (an agent can write
`.grugops/factory.config.json`) can retitle the terminal or forge a whole output line. This
repository has already closed this class once (P32.1, published message sites carrying C1
bytes), and phase 34 copied the unescaped pattern into a new reader. Within the same function,
step 5 already quotes keys through `quoteValue`, so this is also a second rendering rule inside
one block.
**Fix:** Render every user-supplied key through the module's one quoting authority, in both
blocks:
```ts
`${unknownKeys.map((key) => `\`models.effort.${quoteValue(key).slice(1, -1)}\``).join(", ")}`
// or simply: unknownKeys.map((key) => quoteValue(key)).join(", ")
```
Apply the same change at lines 2211 and 2300 for the `models` block. Add a case with an ESC byte
and a newline in a key, asserting that the reason contains neither.

### WR-05: The installer's closing safety line derives "gets documentation only" from `dispatch`, which is the wrong attribute

**File:** `install/install.ts:5476-5481`
**Issue:** The line says which hosts get no ask rules, which is a property of the adapter (only
the `claude-kit` adapter writes permission ask rules). It is computed from
`t.dispatch === "sequential"`, a property of how roles are scheduled. The two coincide today. A
future host that can spawn sub-agents but gets no ask rules (Codex or Copilot gaining sub-agents
is plausible) would silently drop out of the "documentation only" list. That would make the
closing safety statement claim more enforcement than exists, on exactly the surface CLAUDE.md
requires in clear voice. `host-tools.test.ts:145` pins the same proxy, so the test would not
catch it.
**Fix:** Derive from the attribute the sentence is about:
```ts
HOST_TOOLS.filter((t) => t.adapter !== "claude-kit").map((t) => t.name)
```
Better still, add an explicit `askRules: boolean` field to `HostTool` and assert in
host-tools.test.ts that exactly the rows with ask rules are excluded.

### WR-06: The new "Using grugops on Pi" section presents a working flow that backlog 999.4 records as `UNKNOWN - verify`

**File:** `install/README.md:326-355`; also `agent-factory/packaging/adapters.md`, "What grugops
writes for Pi"
**Issue:** The guide tells Pi users to type `/grugops <request>` and says the command "sends Pi
to `AGENTS.md` and then `agent-factory/roles/orchestrator.md`". After a scripted (two-root)
install, no in-repo `agent-factory/` exists: the kit lives at `~/.grugops/agent-factory`, and
AGENTS.md instructs "If the resolved kit dir is absent: STOP — do not hunt". Whether Pi can find
the kit at all is exactly what 34-RESEARCH.md Q7 and ROADMAP backlog 999.4 record as
`UNKNOWN - verify`. The template carries no resolver slot, by design. The user-facing section
states the flow without that caveat. Under the project's no-fabrication rule, an unverified path
must be marked as such.
**Fix:** Add one sentence to the Pi section, in clear voice. For example: "Whether Pi finds the
shared kit at `~/.grugops/agent-factory` after a scripted install is `UNKNOWN - verify` (backlog
999.4). The minimal markdown-copy install, which puts `agent-factory/` in the repository, is the
path known to resolve." Mirror it in adapters.md's Pi section.

### WR-07: Phase-34 edits re-assert, and widen to Pi, a claim that "the installer sets `GRUGOPS_PROJECT_DIR`", which no code does

**File:** `agent-factory/workflows/16-context-read-write.md:32`, `scripts/context-io.ts:4955-4958`
**Issue:**
- Phase 34 rewrote both passages from "the four ... CLIs" to the count-free wording, which now
  covers Pi. Both state that `GRUGOPS_PROJECT_DIR` is "the documented INSTALLER-SET answer" and
  that "the installer sets it, not the agent".
- No file under `install/` references `GRUGOPS_PROJECT_DIR` (`grep -rn PROJECT_DIR install/*.ts`
  returns nothing outside tests), and install/README.md never tells the user to set it.
- So on every non-Claude host, Pi now included, tier 2 of the governance-root resolution is never
  populated by grugops. The `human_admission` dial is decided by the upward walk instead.
- The statement is pre-existing (31-15), but this phase edited the exact sentence and extended its
  scope without checking the claim. It sits on a governance and audit surface, where clear,
  accurate voice is required.
**Fix:** Either implement it (the installer writes the variable into a host-readable place for
each non-Claude host, recorded in the ledger), or correct both passages to say that
`GRUGOPS_PROJECT_DIR` is honoured when a human sets it and that grugops's installer does not set
it. If the gap was not already recorded, record it as a residual.

## Info

### IN-01: Three separate implementations of "a per-host table row" disagree on the same bytes

**File:** `scripts/check-uat-oracles.ts:271`, `scripts/validate-agent-factory.ts:814`,
`install/host-tools.test.ts:192`
**Issue:** The asymmetric oracle matches `^\|\s*\*\*<name>\*\*` with no requirement on what
follows. The validator and the host-tools test require `\*\*\s*\|` straight after the bold name.
A row such as `| **Pi** (pi.dev) | ...` is therefore a Pi row to the oracle, while the validator
and the test see zero Pi rows. All three fail closed today, but they are three grammars for one
rule, which is the "second implementation of a rule" class.
**Fix:** Export one row matcher from a single module and use it at all three sites. If it cannot
live in `install/host-tools.ts` (that module is pure data), put it beside `HOST_TOOLS` as a pure
function.

### IN-02: The validator's dispatch-map check only warns when the table is unrecognisable

**File:** `scripts/validate-agent-factory.ts:829-834`
**Issue:** If adapters.md's table loses its bold first cells (a reformat), `checkDispatchMap`
emits a warning and a non-strict run passes, so the "one row per registry host" claim goes
unchecked by the validator. The UAT oracle still fails red, so this is not fail-open overall, but
the validator's own claim is weaker than its comment ("never passed silently").
**Fix:** Make it `err`, since adapters.md is a required file whose dispatch table is a structural
requirement. Alternatively, reword the comment to say that this check alone does not hold the
table.

### IN-03: The Pi template is create-only, so a future change to `PI_PROMPT_TEXT` never reaches an installed repository

**File:** `install/install.ts:2393-2396`
**Issue:** Once the file exists, every later install reports `skipped`, even when it still holds
exactly the bytes an earlier install recorded (provably install's own, unedited). If the pointer
text changes, for example to address WR-06, existing installs keep the old template with no
report.
**Fix:** When the ledger's record for `PI_PROMPT_REL` still holds (`recordHolds`), allow a
refresh to the current `PI_PROMPT_TEXT` and re-record it. Leave the file alone only when it is
unrecorded or edited. This is the same rule the kit files already follow (D-32).

### IN-04: A blank `effortRationale` now also refuses the MODEL `tiered` preset

**File:** `scripts/model-tiers.ts:1221-1242`
**Issue:** The effort-rationale integrity check was added to `tieredTableRefusals`, which
`resolveModels` runs on every model `tiered` resolution. A row with a missing or digit-carrying
effort reason therefore breaks the model dial, which D-05 declares independent of effort. The
rows are complete today, so nothing is broken. The coupling is undocumented, and a refusal from
it names D-04 to a user who configured only `models.preset`.
**Fix:** Either move the effort checks into a separate `tieredEffortRefusals` called only from
`resolveEfforts` under effort `tiered`, or document on `tieredTableRefusals` that both presets
share one integrity floor on purpose.

### IN-05: The structure validator does not validate the `models` / `models.effort` block

**File:** `scripts/validate-agent-factory.ts` (no reference to `models` or `readModelsConfig`)
**Issue:** An illegal `models.effort` value in `.grugops/factory.config.json` is caught only at
render time (install or generator run). `validate-agent-factory` reports the config clean. This
gap predates phase 34 (the model dial has it too), but the phase widened the block the validator
ignores.
**Fix:** Have the validator ask `readModelsConfig(STATE_ROOT, stems)` (the one reader, so no
second grammar) and report its refusal as an error.

---

_Reviewed: 2026-10-07T10:55:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_

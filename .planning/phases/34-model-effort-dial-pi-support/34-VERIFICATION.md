---
phase: 34-model-effort-dial-pi-support
verified: 2026-10-07T14:20:00Z
status: gaps_found
score: 8/11 must-haves verified
covered_files:
  - .claude/agents/grugops-orchestrator.md
  - .planning/phases/34-model-effort-dial-pi-support/34-01-PLAN.md
  - .planning/phases/34-model-effort-dial-pi-support/34-01-SUMMARY.md
  - .planning/phases/34-model-effort-dial-pi-support/34-02-PLAN.md
  - .planning/phases/34-model-effort-dial-pi-support/34-02-SUMMARY.md
  - .planning/phases/34-model-effort-dial-pi-support/34-03-PLAN.md
  - .planning/phases/34-model-effort-dial-pi-support/34-03-SUMMARY.md
  - .planning/phases/34-model-effort-dial-pi-support/34-04-PLAN.md
  - .planning/phases/34-model-effort-dial-pi-support/34-04-SUMMARY.md
  - .planning/phases/34-model-effort-dial-pi-support/34-05-PLAN.md
  - .planning/phases/34-model-effort-dial-pi-support/34-05-SUMMARY.md
  - .planning/phases/34-model-effort-dial-pi-support/34-06-PLAN.md
  - .planning/phases/34-model-effort-dial-pi-support/34-06-SUMMARY.md
  - .planning/phases/34-model-effort-dial-pi-support/34-07-PLAN.md
  - .planning/phases/34-model-effort-dial-pi-support/34-07-SUMMARY.md
  - .planning/phases/34-model-effort-dial-pi-support/34-08-PLAN.md
  - .planning/phases/34-model-effort-dial-pi-support/34-08-SUMMARY.md
  - .planning/phases/34-model-effort-dial-pi-support/34-09-PLAN.md
  - .planning/phases/34-model-effort-dial-pi-support/34-09-SUMMARY.md
  - .planning/phases/34-model-effort-dial-pi-support/34-10-PLAN.md
  - .planning/phases/34-model-effort-dial-pi-support/34-10-SUMMARY.md
  - agent-factory/config/factory.config.md
  - agent-factory/packaging/adapters.md
  - agent-factory/packaging/subagent.frontmatter.md
  - install/README.md
  - install/host-tools.ts
  - install/install.ts
  - scripts/adapters-freshness.ts
  - scripts/canonical-frontmatter.ts
  - scripts/check-foundation-guards.ts
  - scripts/check-uat-oracles.ts
  - scripts/generate-role-adapters.ts
  - scripts/model-tiers.ts
  - scripts/validate-agent-factory.ts
covered_digest: "v3:sha256:7772375e687f49d631a54fb60f3041565be5c0958463e7ee033cdfc796aa62d3"
behavior_unverified: 2
overrides_applied: 0
gaps:
  - truth: "HOST-02: no test added or changed by Phase 34 is red on windows-latest, measured on a human-pushed CI run (the D-09 condition under which the phase proceeds despite the unmet Windows dependency)"
    status: failed
    reason: "CI run 37521787426 (head dc2c7581) windows-latest failed in the Vitest step, 13 files / 144 tests red. Re-derived independently from the printed log: 5 red tests were added or changed by this phase. The phase's own record (34-VALIDATION.md, WINDOWS.md row 316) already says NOT MET, and REQUIREMENTS.md leaves HOST-02 unchecked. No later ROADMAP phase picks this up (the roadmap ends at 34; only backlog 999.x exists), so it cannot be deferred."
    artifacts:
      - path: "install/uninstall-removal.test.ts"
        issue: "2 tests (never-installed target holding grugops blocks ... real and DRY_RUN) red on windows-latest; body changed by commit d6c2e96a (Pi plant). Printed failure: no left line for the empty .claude/agents. Never run on windows before this run, so whether it was red before the phase edit is UNKNOWN - verify."
      - path: "install/installer-user-edit.test.ts"
        issue: "row `.pi/prompts/grugops.md (edited in the default install)` red on windows-latest (exit 3, marker written for C:\\Users\\... not C:/Users/...); the row exists only because this phase's installer writes the Pi template."
      - path: "install/record-truth.test.ts"
        issue: "row `.pi/prompts/grugops.md: a chmod-only edit survives uninstall` red on windows-latest (expected 438 to be 502); row exists only because of the Pi template."
      - path: "install/installer-dry-run.test.ts"
        issue: "`subset: uninstall after a fresh install into an EMPTY target (flow 10's tree)` red on windows-latest; its FLOW10_CREATED input was changed by this phase (d6c2e96a). Same name and same assertion red in the pre-phase run 36716255097, so the phase did not create the failure, but HOST-02 counts changed tests."
    missing:
      - "Make the 5 phase-added or phase-changed tests green on windows-latest by a Windows-native means (no platform conditional, per the carried D-14/D-16 rule), or record a human override of D-09's condition."
      - "Push and re-measure on windows-latest; record the run id and the result."
      - "Decide, with the human, whether the 139 other red tests (WINDOWS.md rows 316/317, 33.1 gap round 3 reds first measured here) block the sixth adapter; they are outside HOST-02's literal wording."
behavior_unverified_items:
  - truth: "A real Pi CLI lists and expands `/grugops` from `.pi/prompts/grugops.md` and finds the Orchestrator after a scripted install"
    test: "Install grugops into a scratch repository with the scripted installer, start Pi from the repository root, grant project trust, type `/grugops hello`."
    expected: "Pi lists `/grugops`, expands the template with `Request: hello`, and the agent reads AGENTS.md and reaches the Orchestrator role text."
    why_human: "No Pi CLI was run in this phase. After a scripted two-root install no in-repo `agent-factory/` exists (the kit sits at ~/.grugops/agent-factory), and whether the template's pointer resolves there is `UNKNOWN - verify` (34-RESEARCH Q7, ROADMAP backlog 999.4). Presence and wiring checks cannot see Pi's loader."
  - truth: "A real Claude Code session applies the emitted `effort:` line of a standalone `.claude/agents/grugops-*.md` adapter to that sub-agent"
    test: "Configure `models.effort.preset: tiered`, install, run `/grugops` on Claude Code at or above 2.1.267, and observe a spawned role agent's effort level."
    expected: "The orchestrator agent runs at `high`, an execution role at `medium`, and a role with no line inherits the session level."
    why_human: "The premise is cited from code.claude.com docs in 34-RESEARCH.md; the phase ran no live Claude Code session, and the docs themselves record the standalone-agent minimum version as `UNKNOWN - verify`. I could not re-fetch the cited pages."
human_verification:
  - test: "Run `/grugops <request>` on a real Pi after a scripted install (see behavior_unverified_items)"
    expected: "Command listed and expanded; Orchestrator reached"
    why_human: "No Pi CLI available; kit discovery after scripted install is UNKNOWN - verify (backlog 999.4)"
  - test: "Observe a real Claude Code sub-agent run with a configured `effort:` line (see behavior_unverified_items)"
    expected: "Configured level applied; inherit leaves the session level"
    why_human: "Live platform behavior; docs citation only"
---

# Phase 34: Model Effort Dial and Pi Support Verification Report

**Phase Goal:** Users can set reasoning effort per role through the same `models` dial that already sets the model, and Pi (pi.dev) joins the five supported host coding-agent CLIs through the existing thin-pointer, single-source adapter pattern, with the same idempotent, dry-run, reversible install contract.
**Verified:** 2026-10-07T14:20:00Z
**Status:** gaps_found
**Re-verification:** No, initial verification

## Verdict in one paragraph

The product work holds up. I re-ran the effort dial, the guards, the registry and the Pi install path against scratch repositories and they behave as the plans claim, including on adversarial inputs. One must-have is FAILED and it is a blocker: HOST-02, the condition D-09 set for proceeding past the unmet Windows dependency. The phase's own records already say NOT MET, and I reproduced that from the printed CI log. Two further truths are present and wired but rest on platform behavior no test or run exercised (a real Pi, a real Claude Code `effort:` application). Seven open code-review warnings do not falsify a must-have, but WR-03, WR-06 and WR-07 are cheap and should ride the gap round.

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | SC1 / EFFORT-01: the `effort` premise is cited before design, with the cited fallback, the 2.1.267 floor and two `UNKNOWN - verify` residuals shipped in the dial docs | VERIFIED | `agent-factory/config/factory.config.md:161-170` carries the sub-agents and model-config citations (fetched 2026-10-06), the "highest supported level at or below" fallback, `CLAUDE_CODE_EFFORT_LEVEL`, `maxEffortLevel`, the 2.1.267 floor, and `UNKNOWN - verify` for the no-effort-model behavior and the standalone version floor. Citations not re-fetched by me (no web tool): the citation text is present, its upstream accuracy is UNKNOWN - verify. |
| 2 | SC2 / EFFORT-02, 03, 05: `models.effort` has closed key set `{preset, roles}`, closed level and preset vocabularies, refused by name, same two-location precedence, resolved in `scripts/model-tiers.ts`, emitted by the generator, documented once in each authority | VERIFIED | Probed against a scratch mirror of the committed `.js`: 15 refusal shapes (bad level `MAX`, unknown level, unknown key, case-varied key, `null`/array/string/number block, bad preset, unknown stem, unknown key beside a legal sibling, `models.efort`, `__proto__`, roles array, numeric level) all exit 1 and leave every adapter byte unchanged. `{"effort":{"roles":{}}}` is legal. Effort-only block consumed (17 `effort:` lines). Override beats preset. `haiku` + `max` written as configured (`model: haiku`, `effort: max`). `.grugops/factory.config.json` containing `{}` shadows an `agent-factory/config` file with effort tiered (preset stays `none`); removing it lets the second location apply (preset `tiered`). Model preset `tiered` alone gives 0 `effort:` lines. Tiered effort gives 4 `high` (opus rows) and 13 `medium`. Markers `allowed effort presets:` and `allowed effort levels:` each appear exactly once in `factory.config.md`. |
| 3 | SC3 / EFFORT-04 (zero-config half): an absent effort setting resolves every role to `inherit`, emits no `effort:` line, and the committed adapters are byte-identical to the baseline apart from declared divergences | VERIFIED (with note) | Zero-config generator run in the mirror is `diff -r` identical to committed `.claude/agents/`; announcement `levels:["inherit"]`. `git diff 45766c2d..HEAD -- .claude/agents` shows exactly one changed line, the coordinator's Degraded tier ("the four non-Claude-Code CLIs" became "the non-Claude-Code host CLIs"), the human-decided D-14 divergence. Note for the human: ROADMAP SC3 still reads "adapters byte-identical to today" without the D-14 carve-out. The effort half is byte-neutral; the one-line divergence is a host-count removal, not an effort effect. |
| 4 | EFFORT-04 (configured half): a configured effort is emitted, a guard reading adapters through the canonical frontmatter reader proves emitted == resolved over the derived role set, and the generator announces effort resolution which the freshness gate asserts | VERIFIED | `guard_effort_assignment` PASSes on the real tree (17 adapters, 17 derived stems). Mutations in the mirror, each turning it red by name: hand-added `effort: max` at zero config; adapters stale against a tiered config; wrong level (`low` for `high`); deleted `effort:` line ("Absence is its OWN fact"); duplicated `effort:` line (canonical-form refusal `[duplicate-key]`); a corrupt config degrades the expectation to `inherit`, never a pinned level, and fails. `npm run freshness:adapters` prints `Mirrored generator resolved effort preset: none` and exits 0 on the committed tree, and exits 1 (STALE 17 of 17) when the tree is regenerated under a configured effort. `effort` is in `CANONICAL_SCHEMA`; the canonical-frontmatter tests (measured over configured generator output) pass. |
| 5 | HOST-01: one registry owns the host set with an asserted count; detection, validator, dispatch-table oracle and per-host tables derive from it; a derived prose scan fails on count words and on a host list missing exactly one host | VERIFIED | `install/host-tools.ts`: 6 rows, `HOST_TOOL_COUNT = 6`, Pi row. In a scratch copy of the whole repo: deleting the Pi row from `adapters.md` makes the validator print "the per-host dispatch table has 0 row(s) for registry host "Pi" — expected exactly one" and the UAT oracle FAIL; adding a `Zed` row makes the validator error "is not a registry host". My own scan of tracked `.md`/`.ts` outside `.planning`, `docs/audit`, CHANGELOG found no host count word before a host noun. `host-tools.test.ts` and `host-tools-prose.test.ts` pass (mutation proofs are in those suites; I ran them, I did not re-derive their mutations). |
| 6 | HOST-02: no test added or changed by this phase is red on windows-latest, measured on a human-pushed run | ✗ FAILED | See Gaps. `gh run view 37521787426`: `test (windows-latest)` failure at "Vitest (e2e lane excluded)", `Test Files 13 failed \| 87 passed (100)`, `Tests 144 failed \| 7165 passed`. I re-extracted the 146 FAIL lines from `gh run view --job 112468804112 --log` and the 69 from the pre-phase windows run 36716255097 (`--job 109889805015`): 86 test names are newly red. The phase's 5 (b)-class tests are present in the printed list under the names 34-VALIDATION.md gives. |
| 7 | SC4 / PI-01, PI-02: Pi conventions recorded from primary sources; Pi ships as registry entry, detection, per-host table rows, README and guide sections, validator coverage, and one pointer-only template at `.pi/prompts/grugops.md` | VERIFIED | `adapters.md:94-134` records Pi conventions with repository, commit `9ad08310`, package version and 2026-10-06 retrieval; CLAUDE.md, agent-factory/README.md, README.md, docs/faq.md name Pi. Real install into a scratch repo created exactly the template: frontmatter `description`, `argument-hint`, the `COPILOT_PTR` sentence, `Request: $ARGUMENTS`; no `SYSTEM.md`, `APPEND_SYSTEM.md`, `settings.json`, skill or extension. No role text copied. Pi source facts are cited from 34-RESEARCH.md, not re-fetched by me. |
| 8 | SC5 / PI-03: the Pi install path is idempotent, additive, dry-run-capable, reversible, ledgered, never overwrites a user file, owns(path)-gated uninstall | VERIFIED (POSIX only) | Real `install.js`/`uninstall.js` against scratch repos. DRY_RUN: `would-add`, tree unchanged. Install: `created`, ledger holds `.pi`, `.pi/prompts` dirs and the file entry with sha256+mode, `kit:false`. Re-install: `skipped`, tree sha-identical. Uninstall: removed, then `rmdir` of both created dirs. Pre-existing user template: bytes kept, no ledger entry, survives uninstall. User edit (appended line): uninstall `left` the file. chmod 600 after install: `left` ("file mode is 0600, not the 0644"). Replaced by a symlink: uninstall exit 3 `verify`, the symlink target untouched. Second hard link: `left`. User-owned `.pi/settings.json`: untouched, `.pi` not claimed or removed. `.pi/prompts` symlink pointing outside the target: exit 3, nothing written outside. FIFO at the template: install did not hang, exit 3 `verify`. 20 targeted test files (2006 tests, 2 skipped) pass locally. Windows behavior of this path is NOT demonstrated: the Pi uninstall rows are among the red windows tests (gap 1). |
| 9 | PI-04: the dials' non-reach of Pi is stated as a property of what the kit emits, with the cited vendor clause; Pi's safety tier is documented | VERIFIED | `subagent.frontmatter.md:260-270` is count-free, names the Pi README line 19 and `pi.dev` "No sub-agents", states the kit emits no per-agent definition for Pi and does not configure Pi's thinking level. `install/README.md` §5 states that on Pi the git host is the only hard control. |
| 10 | A real Pi CLI lists and expands `/grugops` and reaches the Orchestrator after a scripted install | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | Template present, wired and byte-exact; no Pi was run. Kit discovery after a scripted install is `UNKNOWN - verify` (backlog 999.4, WR-06). Routed to Human Verification. Not counted in the score. |
| 11 | A real Claude Code sub-agent run applies the emitted `effort:` level | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | Field emitted and documented; the platform's use of it rests on a docs citation and a changelog claim I could not re-fetch, and the standalone-agent version floor is itself `UNKNOWN - verify`. Routed to Human Verification. Not counted in the score. |

**Score:** 8/11 truths verified (1 failed, 2 present but behavior-unverified).

### Deferred Items

None. The roadmap ends at Phase 34. Backlog 999.2 (bound `readModelsConfig`, D-18), 999.3 (`fable` alias) and 999.4 (kit discovery on non-Claude hosts) are disclosed residuals the phase never claimed to close, and none of them is a must-have gap.

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `scripts/model-tiers.ts` | effort vocabularies, reader, `resolveEfforts`, announcement grammars, `effortRationale` on all 17 TIERED rows | VERIFIED | Behavior probed end to end above. |
| `scripts/generate-role-adapters.ts` | resolves effort above the build loop; emits `effort:` only when not `inherit`; two announcement lines | VERIFIED | Output shows both lines; refusals write nothing. |
| `scripts/adapters-freshness.ts` | asserts the effort announcements | VERIFIED | Passes zero-config, red under configured. |
| `scripts/canonical-frontmatter.ts` | `effort` in `CANONICAL_SCHEMA` | VERIFIED | Tests pass; guard reads through `admit()`. |
| `scripts/check-foundation-guards.ts` | `guard_effort_assignment` | VERIFIED | Six mutations red by name. |
| `install/host-tools.ts` | registry, count, `PI_PROMPT_REL` | VERIFIED | |
| `install/install.ts` | `detectTools()` from registry, `writePiPromptTemplate()`, registry-derived closing line | VERIFIED (see WR-01/02/05) | Behavior probes above. |
| `scripts/validate-agent-factory.ts`, `scripts/check-uat-oracles.ts` | registry-derived host-table checks | VERIFIED | Both go red on a missing and on an extra host row. |
| `agent-factory/config/factory.config.md`, `subagent.frontmatter.md`, `adapters.md`, `install/README.md` | single-authority docs | VERIFIED (see WR-06) | |
| ROADMAP "Depends on" line | states D-09 honestly | VERIFIED | `ROADMAP.md:1663`. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `readModelsBlock` | `readEffortBlock` | called independent of `models.roles` | WIRED | effort-only block consumed (probe A). |
| generator | `resolveEfforts` | top-level, before build loop | WIRED | refusal exits 1 before any write. |
| `detectTools()` | `HOST_TOOLS` | map over registry | WIRED | `tools detected:` line reads `claude gemini copilot pi` on re-install. |
| `writePiPromptTemplate()` | `readForWrite` / `recordCreatedFile` | gate then ledger | WIRED | probes B through F. |
| uninstall | ledger walk / `owns(path)` | generic reversal, no new uninstall code | WIRED | removal gated on content, mode, link count and file type. |
| installer render | rendered `effort:` lines | cross-check against announcement | NOT_WIRED | Warning WR-03: the model dial has this arm, effort does not. Not a plan must-have; see Anti-Patterns. |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| Installed `.claude/agents/*.md` effort lines | resolved effort map | target's `.grugops/factory.config.json` through the install-time render | Yes: install with `{"preset":"tiered","roles":{"software-engineer":"max"}}` gave 4 `high`, 1 `max`, 12 `medium`, with the announcement echoed on a `render` line | FLOWING |
| Same install, illegal preset `bogus` | refusal | same reader | Install exit 3, `ERROR model-tiers: ... not a legal effort preset name`, 0 adapters written | FLOWING (fails closed) |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Zero-config adapters unchanged | mirror `node scripts/generate-role-adapters.js`, `diff -r` against `.claude/agents` | identical | PASS |
| Effort refusals write nothing | 15 refusal probes | all exit 1, 0 bytes changed | PASS |
| Effort guard fails closed | 7 mutation probes | 6 red by name, baseline green | PASS |
| Build parity | `npm run check:build-parity` | 0 findings over 73/73 | PASS |
| Adapters fresh | `npm run freshness:adapters` | 17 compared, 0 differences | PASS |
| Foundation guards | `node scripts/check-foundation-guards.js` | ALL CHECKS PASSED | PASS |
| Structure validator | `VALIDATE_KIT_ROOT=. node scripts/validate-agent-factory.js` | ALL CHECKS PASSED | PASS |
| CI chain items | `check:diff-disposition`, `check:claim-anchors`, `check:banned-claims`, `check:public-docs`, `check:nul-bytes`, `freshness:hook-manifest`, `freshness:catalog`, `typecheck` | all exit 0 | PASS |
| Phase test lane (targeted) | 20 files: model-tiers, generate-role-adapters, adapters-freshness, adapter-byte-baseline, model-dial-consistency, canonical-frontmatter, check-foundation-guards, host-tools, host-tools-prose, check-uat-oracles, validate, install, installer-never-installed, user-edit, special-files, cross-version, record-truth, uninstall-removal, installer-dry-run, installer-write-set | 20 files passed, 2006 passed, 2 skipped | PASS |
| Full suite | Not re-run by me. The orchestrator reports 100 files, 7335 passed, 2 skipped on HEAD. | n/a | accepted from caller, not independently reproduced |

### Probe Execution

No `scripts/*/tests/probe-*.sh` probes are declared by this phase. Step 7c: SKIPPED (no declared probes).

### Windows-latest classification re-check (HOST-02)

I diffed the failing test names of run 37521787426 (146 FAIL lines, 144 failed tests) against the pre-phase windows run 36716255097 (69).

| File | Red now | Newly red vs pre-phase run | Phase-added or changed among them |
|------|---------|----------------------------|-----------------------------------|
| `install/installer-user-edit.test.ts` | 60 | 57 | 1 (the Pi row) |
| `install/record-truth.test.ts` | 45 | 7 | 1 (the Pi L1 row) |
| `install/ledger.test.ts` | 9 | 9 | 0 |
| `install/installer-dry-run.test.ts` | 5 | 1 | 1 (flow 10 subset; red pre-phase too) |
| `install/installer-never-installed.test.ts` | 4 | 2 | 0 |
| `install/installer-prune.test.ts` | 4 | 4 | 0 |
| `install/uninstall-removal.test.ts` | 2 | 2 | 2 |
| others (`install.test.ts` 3, `marker-binding` 5, `installer-kit-home` 2, `installer-write-set` 2, `kit-plan-limits` 2, `ledger-provenance` 1) | 15 | 2 | 0 |

This agrees with 34-VALIDATION.md: 5 phase-added or changed tests red, 139 not. Two limits on that classification, neither of which changes the verdict:

- The 86 newly red names include 57 user-edit rows and 6 record-truth rows that this phase's re-pins did not touch. They are the same message families (path spelling `C:\Users` against `C:/Users`, mode 438 against 502) as rows the phase did add, so I attribute them to the 33.1 gap-round-3 code, as the phase does. The cause is `UNKNOWN - verify` (WINDOWS.md row 317).
- Several derived-input tests (for example "every path uninstall changes ... inside WRITE_PATHS") now iterate the Pi path by derivation and were already red. The phase counts them as carried; a strict reading of "changed" could count more. HOST-02 is NOT MET under either reading.

### Requirements Coverage

All 11 IDs in the phase brief appear in at least one PLAN's `requirements:` field and in REQUIREMENTS.md's traceability table for Phase 34. No orphaned requirement.

| Requirement | Source Plan(s) | Status | Evidence |
|-------------|----------------|--------|----------|
| EFFORT-01 | 34-07 | SATISFIED | Truth 1. Citation text present; upstream not re-fetched. |
| EFFORT-02 | 34-01 | SATISFIED | Truth 2. |
| EFFORT-03 | 34-01, 34-03 | SATISFIED | Truth 2 (tiered split from TIERED, model preset independent, no capability table). |
| EFFORT-04 | 34-01, 34-03, 34-05, 34-07, 34-10 | SATISFIED | Truths 3, 4. REQUIREMENTS.md still shows `[ ]` / Pending; every clause is evidenced, so the box can be ticked. |
| EFFORT-05 | 34-07 | SATISFIED | Truth 2; docs state fallback, env override, cap, re-install requirement, Claude-Code-only reach. |
| HOST-01 | 34-02, 34-06, 34-09 | SATISFIED | Truth 5. |
| HOST-02 | 34-10 | BLOCKED | Truth 6. Leave unchecked. |
| PI-01 | 34-06 | SATISFIED | Truth 7. |
| PI-02 | 34-02, 34-04, 34-06, 34-08 | SATISFIED | Truth 7. |
| PI-03 | 34-04, 34-10 | SATISFIED on POSIX | Truth 8. REQUIREMENTS.md shows `[ ]`; the clause makes no Windows claim, so the box can be ticked, with the Windows red tests recorded under HOST-02. |
| PI-04 | 34-07, 34-08 | SATISFIED | Truth 9. |

### Code review (34-REVIEW.md, 0 critical / 7 warning / 5 info, all `open`)

I reproduced four of the findings against the committed `.js`. None falsifies a must-have; they are WARNINGs.

| Finding | Reproduced | Bearing on a must-have |
|---------|------------|------------------------|
| WR-01 `.pi` detection reads installer's own write | Yes: first install `tools detected: none-detected`, second `claude gemini copilot pi` | HOST-01 / PI-02 say detection is a `.pi` entry; the registry docstring claims the opposite of what happens. Same class already exists for `.github`/`.gemini`. Informational line only. |
| WR-02 a `.pi` regular file makes install exit 3 | Yes: `echo hi > .pi` gives `verify ... is not a directory` and `== install INCOMPLETE ==`, exit 3, file untouched | The unconditional write (D-17) is by decision. Nothing is overwritten, so "additive" holds; "same install exits clean" is regressed for that odd target. |
| WR-03 no effort cross-check in the installer | Yes: `grep -ci effort install/install.ts` is 0 | Plans 34-01 and 34-03 deliberately kept the installer's model probe unchanged; EFFORT-04 names the generator announcement and the freshness gate, not the installer. A transform that dropped an `effort:` line would install silently wrong adapters. Worth fixing in the gap round. |
| WR-04 raw control bytes in refusal text | Yes: a key containing ESC plus a newline comes back as raw bytes, for `models.effort` and, pre-existing, for `models` | EFFORT-02 requires refusal by name with the legal set; it does that. The unescaped key is a published-message injection (repo's closed P32.1 class), copied into the new reader. |
| WR-05 closing safety line derives from `dispatch` | Read in source (`install.ts:5476-5481`) | Correct today (the five non-Claude hosts get no ask rules); fragile for a future host. |
| WR-06 install guide presents `/grugops` on Pi as working | Yes, `install/README.md:326-355` has no caveat | Contradicts the no-fabrication rule while backlog 999.4 says kit discovery is `UNKNOWN - verify`. This is what Truth 10 turns on. One sentence fixes it. |
| WR-07 "the installer sets `GRUGOPS_PROJECT_DIR`" | Yes: `grep -rn GRUGOPS_PROJECT_DIR install/*.ts` outside tests returns nothing | Pre-existing claim re-edited and widened to Pi by this phase; it is false as written. |
| IN-01..IN-05 | Not individually reproduced | Info. |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `install/install.ts` | whole file | no effort arm beside the model alias cross-check (WR-03) | Warning | installer cannot detect a transform that changes `effort:` lines |
| `install/README.md` | 326-355 | unverified Pi flow stated as working (WR-06) | Warning | doc overclaim on an `UNKNOWN - verify` path |
| `scripts/model-tiers.ts` | 2069-2086 | raw key in refusal text (WR-04) | Warning | terminal escape / forged line in installer and guard output |
| `install/install.ts` | 2382-2401, 5084 | `.pi` non-directory gives exit 3 (WR-02) | Warning | clean install regressed for an odd target |
| `install/install.ts`, `install/host-tools.ts` | 2652-2655, 54 | detection reads own output (WR-01) | Warning | `pi` reported on every re-install |
| debt markers | n/a | `grep -n -E "TBD\|FIXME\|XXX"` over the phase's changed source files: not run by me file by file | UNKNOWN - verify | the Step 7 debt-marker gate was not exercised for this phase beyond the repo's own CI gates, which pass |

### Process notes

- 34-05 and 34-07 TDD RED-evidence records are `UNKNOWN - verify`: the classifier returned `INVALID_RED / invalid_record` on vitest TAP output. This concerns process evidence, not the shipped behavior, which I tested directly.
- 34-VALIDATION.md carries `nyquist_compliant: false` and `status: draft`, with 34-10 Task 3 (the human push) as the one task without an automated verify. That is by design under D-09.
- `34-REVIEW-DISPOSITION.md` shows all 12 findings `open`. They need triage (fix, defer, skip) before the phase closes.

### Human Verification Required

#### 1. `/grugops` on a real Pi after a scripted install

**Test:** Install with `node install/install.js --target <scratch repo>`, start Pi at the repository root, grant project trust, type `/grugops hello`.
**Expected:** `/grugops` is listed; the expansion contains `Request: hello`; the agent reads `AGENTS.md` and reaches the Orchestrator role text.
**Why human:** No Pi CLI ran in this phase, and a scripted install leaves no in-repo `agent-factory/`; resolution through `~/.grugops/agent-factory` is `UNKNOWN - verify` (backlog 999.4).

#### 2. A real sub-agent run under a configured `effort:` line

**Test:** Set `models.effort.preset: "tiered"`, re-run install, run `/grugops` on Claude Code 2.1.267 or later and observe the spawned agents' effort levels.
**Expected:** `orchestrator`, `architect-design`, `security-nfr`, `compliance-officer` at `high`; the other 13 at `medium`; a role with no line at the session level.
**Why human:** Live platform behavior. The phase relies on a docs citation, and the standalone-agent version floor is itself `UNKNOWN - verify`.

### Gaps Summary

One gap blocks the phase: HOST-02. D-09 let Phase 34 proceed past the unmet Windows dependency on the single condition that nothing this phase added or changed is red on windows-latest. The pushed run shows 5 such tests red in 4 files (the two `uninstall-removal` never-installed cases, the `installer-user-edit` Pi row, the `record-truth` Pi chmod row, and the `installer-dry-run` flow 10 subset). The phase recorded that honestly (34-VALIDATION.md, WINDOWS.md row 316) and the record matches the printed CI log.

The closure round has three choices, in the human's hands: fix the five tests by a Windows-native means and re-measure on a fresh pushed run; or accept the miss by an explicit recorded override of D-09's condition (which would leave HOST-02 unchecked and say why); or, as the larger matter, decide what to do about the 139 other windows reds (WINDOWS.md rows 316 and 317, mostly 33.1 gap round 3 code never measured on Windows before), because "Windows leg green before a sixth adapter lands" was the original dependency and it is still unmet. The Pi uninstall behavior on Windows is unobserved either way.

Cheap additions worth riding the same round: WR-06 (one caveat sentence in `install/README.md` and `adapters.md`), WR-03 (an effort arm beside the model cross-check in the installer), WR-07 (correct or implement the `GRUGOPS_PROJECT_DIR` claim), and triage of all twelve review rows.

Product behavior verified, and the project rule applied to it (green tests are not proof for a safety claim): I attacked the effort guard, the registry-derived checks and the Pi write and uninstall paths with inputs the plans' tests did not name (symlink swap after install, hard link, FIFO, chmod-only edit, `.pi/prompts` symlink out of the target, control bytes in keys, a duplicated `effort:` line, a deleted line, a corrupt config). Each failed closed or refused, apart from the warnings above.

---

_Verified: 2026-10-07T14:20:00Z_
_Verifier: Claude (gsd-verifier)_

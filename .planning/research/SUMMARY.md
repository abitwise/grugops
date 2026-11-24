# Project Research Summary

**Project:** grugops, milestone v3.1 "Upstream design, consultation and one-command install"
**Domain:** file-based agent factory (markdown kit plus TypeScript tooling compiled to committed `.js`, six host coding-agent CLIs)
**Researched:** 2026-11-24
**Confidence:** MEDIUM-HIGH overall (HIGH on repository integration points, MEDIUM on external platform behavior, `UNKNOWN - verify` kept where unverified)

## Executive Summary

v3.1 adds four things to a validated v3.0 kit. First, declared upstream design sources: a separate, approved design package (stable IDs, a named human who decides) that grugops builds from, pinned by commit and read in place, never copied. Second, build requests: questions or change requests that grugops sends back upstream, carried by a human, which block the dependent tickets until a new pin answers them. Third, one parameterized consultant role with a single and a panel mode. Fourth, a one-command install, plus `install --migrate` in the public docs. No spec-driven tool surveyed (Spec Kit, Kiro, BMAD, Tessl) pins a spec held in a separate repository, so pin, drift report and scope routing are real differentiators.

The recommended approach is to extend closed sets by recorded decision, not by drift. Ticket frontmatter stays at eight keys, so upstream IDs travel on note `refs` in one namespaced grammar (`upstream:<source>:<id>@<commit>`), routed to the existing Requirement trace column. The pin lives in `.grugops/factory.config.json` (absent means no upstream), is checked by a new host runnable that uses git object reads (not working-tree bytes), and only a named human moves it. The consultant is one role of about 2 KB plus two new workflows (19 consult, 20 upstream sources). It is advisory only, answers as `claim` or `observation`, and sends upstream-scope questions to build requests instead of answering them. The install ships as a pinned `npx grugops@3.1.0` from the npm registry, using a thin dispatcher in front of the single unchanged `install.js`, published through CI with trusted publishing and human-approved staging.

The main risks are all trust and drift risks. Upstream text is untrusted input (indirect prompt injection, and nested `CLAUDE.md` auto-loading if the source sits inside the repo). A consultant claim can be laundered into a `decision` with no evidence. A panel on one model family gives correlated, falsely comforting agreement. Role text is about 3 KB below the corpus warning, so every role edit must be a one-line pointer. The installer assumes a checkout, so a package-runner source breaks printed remedies, uninstall and the shared kit home unless the dispatcher says it is ephemeral. Windows CI has been red since v2.1, so any Windows claim stays `UNKNOWN - verify` until a green runner or a named human run proves it.

## Key Findings

### Recommended Stack (STACK.md)

Nothing is added to the runtime stack. Host machines still run committed `.js` with zero runtime dependencies on Node 22+. New pieces are distribution and CI only.

**Core technologies:**
- npm registry package `grugops` (unscoped, first release `3.1.0`): the distribution unit. `npm view grugops` and `npm view create-grugops` returned E404 on 2026-11-24, so the name is unpublished and can be claimed by anyone.
- `npx grugops@3.1.0 --claude` (pinned, run inside the repository): works on Windows via the npm shim, creates no persistent `$PATH` binary, keeps the caller's working directory (reproduced on npm 11.20.0). On Windows PowerShell 5.1 show `npx.cmd` (the `.ps1` shim is blocked by the default policy; MEDIUM).
- `bin` pointing to a thin `install/grugops.ts` dispatcher (compiled, shebang first line) that checks Node >= 22, then spawns `install.js` or `uninstall.js` with `process.execPath`. `install.js` stays the single installer (D-07/D-08).
- `files` allowlist covering every path `install.js` reads, including dot folders (`npm pack --dry-run` includes dot folders named in `files`; HIGH). Empty `dependencies`, no lifecycle scripts, both held by guard tests. A CI job packs the tarball and installs offline on ubuntu and windows.
- Publishing: GitHub Actions on Node 24 (Node 22 bundles npm 10.9.9, too old), trusted publishing (OIDC, npm >= 11.5.1) plus staged publishing (`npm stage publish`, npm >= 11.15.0) so a named human approves with 2FA. The package must exist before trust can be configured, so a human publishes `3.1.0-rc.0` once under dist-tag `next`.
- Pins: `gitCommit` and `gitBlob` digests (40 or 64 hex), verified with the `git` CLI via `git rev-parse <commit>:<path>`; the Node hash is a fallback for non-git folders only. No submodule, no YAML library.
- Build request: a new document class with its own closed key set, parsed by the same pattern as `scripts/board-model.ts`.

**Rejected:** `curl | sh` and `irm | iex` (revives two shell installers), `npx github:` (npm 12 `allow-git` default is `none`; whether a top-level git spec is refused is `UNKNOWN - verify`), `npm init` (needs a second package), Node single-executable (a binary on `$PATH`), `@latest` in docs, a long-lived `NPM_TOKEN`.

The Claude Code plugin one-liner (`claude plugin install grugops --marketplace abitwise/grugops#v3.1.0`, Claude Code 2.1.292+) stays as a second, Claude-Code-only path. It cannot replace npx: it writes no repository state, ask rules or `tools/grugops/` programs.

### Expected Features (FEATURES.md)

**Must have (table stakes):**
- A. Source declaration (id, location, pin, entry file and blob, owned scope) in config; read in place at the pin; pin-state report that never moves the pin; a missing source is `BLOCKED`, never guessed; upstream content enters shared context only as cited `claim` notes.
- B. Tickets cite upstream IDs with the pin, with an explicit `none (build-internal)`; the validator checks a cited ID exists at the pin; the trace render runs upstream ID to requirement to code to test to release.
- C. Build request: one file per request with stable ID, touched upstream IDs, raising pin, options with a recommended default, blocked tickets; closed lifecycle; blocked until a new pin answers; carry list for the human courier; scope routing (what the product is goes upstream, how it is built stays in grugops); deduplication.
- D. Consultant: one parameterized role; sources first with citations; advisory only; Orchestrator-only dispatch on `CONSULT` from BA/PM, System Analyst, Architect, Designer or a human; structured answer; runs on request only without config.
- E. One pinned command, no clone, current-repository default, `--dry-run` flag form, same channel for uninstall, update, check and migrate, Node refusal below 22.
- F. `install --migrate` named in README, `docs/usage.md` and `docs/how-it-works.md`, with a link to the pre-v3 page.

**Should have (differentiators, in v3.1):** panel mode whose deliverable is the disagreement (independent first answers, always-on skeptic lens, no vote or consensus); architecture as given input (upstream outranks `default_stack`, a deviation is a build request); entry-file blob in the pin; the pinned `npx` line.

**Defer:** changed-ID list and suspect flags on pin bump; machine-checkable answer link (needs an upstream intake that echoes the request ID); reverse coverage; installer agent auto-detection; gate-scoped build; live link or MCP to upstream; domain packs and dynamic consultants (backlog 999.13).

**Anti-features:** vendoring the package, auto-bumping the pin, requiring submodules, grugops writing into upstream, text-similarity trace links, one consultant role per domain, multi-round debate, same-model LLM judge picking a winner.

### Architecture Approach (ARCHITECTURE.md)

Kit and state stay as they are. v3.1 adds a third, read-only root (the upstream source), a new contract (`contracts/upstream.md`), one authority module (`scripts/upstream-model.ts`, embedded into a new host runnable `tools/grugops/upstream.js`), two workflows (19 consult, 20 upstream sources), one role, and a new state folder (`memory-bank/plans/build-requests/`) added through the path authority and a new `BUDGETS` key. Role-to-Orchestrator communication stays the published-note pattern (body prefixes `Consult:` and `Build-request:`, like `Cause:` in WF04). Only the coordinator spawns. Every role edit is one pointer line; procedures live in WF19 and WF20.

**Major components:**
1. `contracts/upstream.md` and `scripts/upstream-model.ts`: config block shape, ref grammar, pin comparison, build-request grammar; one authority read by the validator and the runnable.
2. `upstream.js` runnable: `check` verb with exit 0 match, 1 drift, 2 could not run (never a pass); run at session start by WF17; adding it moves `RUNNABLE_SET_STAMP` in all five existing runnables, so do this once.
3. `trace-model.ts` change: one `classifyRef` rule routes `upstream:` refs to the Requirement column; reserve the `BR` prefix. Raw upstream IDs like `DEC-012` pass `isTicketId` and would create phantom trace rows (verified in code).
4. Build-request file and its board status (open decision D2 below); BA/PM is the single writer to avoid ID collisions.
5. Consultant role, WF19 and a `consult` dial (`single` default, `panel` for enterprise); panel lenses each get their own context folder, then one synthesis task, to honor single-writer-per-task.
6. `install/cli.ts` dispatcher plus packaging manifest; printed commands switch to the versioned `npx` form when the source is ephemeral.

Registering a 20th role and two workflows moves many pins (`ROLE_COUNT`, `WORKFLOW_COUNT`, role ceilings, model tiers, scan counts, generated adapters, hook manifest, catalog, install census tests); ARCHITECTURE.md lists each, and the consultant phase should plan one task that regenerates everything.

### Critical Pitfalls (PITFALLS.md)

1. **Read in place reads the working tree, not the pin** (Pitfall 1). Read through `git show <commit>:<path>`, require full-length lowercase IDs, give the check three results (match, mismatch, `UNKNOWN - verify`), and include dirty-tree, moved-HEAD and CRLF fixtures.
2. **Upstream text acts as instructions** (Pitfall 2). The first upstream package is itself full of agent instructions. A source inside the repo auto-loads its `CLAUDE.md` and `AGENTS.md` into Claude Code. Fence upstream text through one sanctioned reader, add an adversarial injection fixture, never build an instruction detector. Whether a `git show` through Bash avoids the nested-file trigger is `UNKNOWN - verify`.
3. **Consultant output laundered into verified memory, and consultant answers upstream-scope questions** (Pitfalls 3 and 4). Consultant output is only `claim` or `observation`; a `decision` that rests on one cites it in `refs`; load-bearing compliance, privacy or money claims go to a named human. Scope is a declared input, and a question that cannot be placed fails toward a build request.
4. **Board status breaks every previously installed board** (Pitfall 7). See D2. Either way, add a cross-version test (a v3.0 board plus v3.1 role text must validate) and a separate sweep threshold for build requests (the default `blocked_escalation_days` of 2 would flood the human).
5. **Installer assumes a checkout; npm supply chain; shared kit home** (Pitfalls 12 to 16). Detect an ephemeral source and print versioned commands; refuse symlink mode from it; prove uninstall from a re-fetched package restores a byte-identical tree; never document `@latest` or `-g`; add a target sanity rule (git toplevel, refuse home and non-repository); keep any bootstrap tiny or absent.
6. **Panel gives correlated agreement** (Pitfall 5), **role budget and generated surfaces** (Pitfall 9), **private content leaking into committed notes or fixtures** (Pitfall 10). Disagreement section always present with a fixed caveat, no vote count; allocate the byte budget in writing first; cite IDs not text, synthetic fixtures only.

## Decisions for the human

Settle these before roadmap or requirements fix their shape. The researchers disagree on D2 and D3, and the rest are named in more than one file.

**D1. Names.** Config key for sources (`upstream` is a placeholder), config key and dial values for the consultant (`consult.mode` of `single` or `panel`, `consult.lenses`), the build-request status values (the files differ: `open`, `sent`, `carried`, `answered`, `withdrawn`), and the board status or column name. Placeholders only until chosen.

**D2. Build-request board status (researchers disagree; not resolved here).**
- Position A, ARCHITECTURE.md: a new unlimited column (for example `## Awaiting Upstream`, status `awaiting-upstream`). Evidence: the board grammar has no closed column vocabulary except that the Blocked form is fixed to the name `Blocked`, so a new unlimited heading needs zero parser change. A separate column keeps upstream waits out of WF09 escalation (`blocked_escalation_days`) and out of `metrics.md` "Blocked time". Costs: the seed board, the column table (13 to 14), `BOARD_MOVE_EXCEPTIONS` (needs a recorded human decision), the WF09 frozen set, four pinned "13 columns" test sites. Existing boards lack the heading, so the validator reports `column "<X>" is not a board column` until a human adds it (the installer never edits user boards).
- Position B, PITFALLS.md: keep waiting tickets in `Blocked`, with a `## Blocked` bullet naming the build request and owner. Evidence: a fourth heading form is "a decision recorded here first"; every pre-v3.1 installed board would fail validation if shared role text names a new column; older `state-check.js` copies and metrics would not count it. Costs: Blocked-based waits are time-tracked and reach the WF09 sweep, so the escalation threshold needs a build-request exemption or a separate sweep line.
- If A is chosen, PITFALLS.md requires an additive migrate step, a `--check` finding for a board lacking the heading, and a cross-version test. Decide before any role text names the status.

**D3. Upstream source location (researchers disagree).** ARCHITECTURE.md recommends a repository-relative path (submodule or ignored checkout), because host read permissions are friendlier (OpenCode needed an installer-written `external_directory` rule for the kit; Claude Code prompts outside the project). PITFALLS.md recommends keeping sources outside the product repo, because an in-tree source auto-loads its `CLAUDE.md` and `AGENTS.md` (prompt-injection and standing-instruction risk), and private design could leak if the product repo is public. Sub-decision: where the machine-local checkout path lives. Options are a portable id plus URL or relative path in committed config, with an absolute path in an uncommitted file or environment variable (which adds a second reader). Per-host behavior for reads outside the repo on Codex CLI, Antigravity CLI, Copilot CLI and Pi is `UNKNOWN - verify`.

**D4. Architecture ownership.** Proposed default: when upstream provides an architecture, upstream owns it and a deviation becomes a build request. Confirm, and confirm that grugops floors (the §14 gate, security and NFR gates, verify-before-write, the git-host floor) do not move; a conflict is a build request plus a human stop.

**D5. `bin` versus the v1.1 Out of Scope "no global $PATH binary".** The `bin` field is required for npx and also makes `npm i -g grugops` possible. Options: amend the line to "no global binary is documented or required; `npm i -g` is unsupported", or pick a mechanism without `bin`. Docs never show `-g` either way.

**D6. How npx installs print follow-up commands.** Recommended: print `npx grugops@<version> <args>` and record the package spec as source (smaller). Alternative: stage a copy of the package into the kit home (more robust offline, but changes the kit-home layout and `--prune-old-kit`).

**D7. Default target: git root versus current directory.** `install.ts` takes `process.cwd()`. Decide whether to offer `git rev-parse --show-toplevel`, and whether to refuse a non-repository directory and the home directory (PITFALLS.md recommends both, in `install.ts` as one authority).

**D8. First npm publish bootstrap.** The package must exist before trusted publishing can be configured (HIGH). Proposal: a human publishes `3.1.0-rc.0` under `next` with 2FA, then configure trust, then CI stages `3.1.0`. Whether OIDC can publish a brand-new package's first version is `UNKNOWN - verify` (a January 2026 secondary source says no; LOW). Whether provenance survives staging is `UNKNOWN - verify`.

**D9. Claim the npm name early.** Unclaimed on 2026-11-24, and npm's moniker rule would also block `grug-ops` once taken. STACK and PITFALLS both suggest claiming at the start of the milestone, even before the install phase. Unscoped `grugops` versus an `@grugops` scope is the human's call.

**D10. Smaller calls.**
- Whether a pin change needs a new checkpoint id (the roster is closed, so that is a recorded decision) or stays a prose rule.
- Per-lens model tiers (default no: one consultant adapter in v3.1).
- The `3.1.0` bump, and whether the README line joins the bump set.
- Whether Phase 46 merges into 45.
- Whether brownfield bootstrap also reads upstream architecture (`UNKNOWN - verify`, not in the idea file).
- Whether the upstream export format settles before grugops fixes the citation grammar (see gaps).

## Implications for Roadmap

Phases continue from 44. The six-phase order follows ARCHITECTURE.md, adjusted by PITFALLS.md.

### Phase 44: Upstream source declaration and pin check
**Rationale:** dependency root for B, C, D and architecture-as-input. Opens with a decision gate (D1, D3, D4, and the upstream export shape).
**Delivers:** `contracts/upstream.md`, `upstream-model.ts`, config rows and validator arm (closed inner key set, session-start statement of upstream state), `upstream.js` runnable and embed row, WF17 session-start step, WF20 skeleton, third-root line in `AGENTS.md`, and the `trace-model.ts` change (`upstream:` to Requirement, `BR` reserved) so the runnable stamp moves once.
**Addresses:** feature A, and the ref grammar for B.
**Avoids:** Pitfalls 1, 2, 10, 11, 20, 21, 24, 26.

### Phase 45: Traceability and build requests
**Rationale:** needs the ref grammar and the pin. Settle D2 first.
**Delivers:** build-request contract and file, `BUILD_REQUESTS_REL`, seed `.gitkeep`, `BUDGETS` key and contract table row, validator and `state-check` budget, the chosen board status, WF02/03/04/09 edits, and one pointer line each in BA/PM, SA, Architect and Designer. Also the answer path via a human pin edit with an ancestry check, dedupe, and a separate sweep threshold.
**Addresses:** features B and C.
**Avoids:** Pitfalls 6, 7, 8, 17, 18, 27.

### Phase 46: Architecture as input
**Rationale:** small; depends on 44 and 45; may merge into 45.
**Delivers:** Greenfield Mapper and Architect pointer lines, a WF00 step, and an ADR-from-upstream convention (`Accepted (upstream)`).
**Avoids:** Pitfall 19.

### Phase 47: One-command install and `install --migrate` docs
**Rationale:** independent of 44 to 46, so it can run first or in parallel. Migrate docs ride along because both rewrite README claims C-28-005 and C-28-006. Claim the npm name at the very start of the milestone (D9), and run the Windows proof early.
**Delivers:** `install/cli.ts` dispatcher, publish manifest and `files` allowlist, pack-list derivation test, ephemeral-source mode and versioned printed commands, target sanity rule, `release.yml` with OIDC and staging, version agreement gate (`VERSION`, `plugin.json`, `package.json`, README line), the pre-v3 page linked by repository URL from shipped pages (it is checkout-only), and claim-registry rows.
**Uses:** the whole STACK recommendation.
**Avoids:** Pitfalls 12 to 16, 22, 23, 28.

### Phase 48: Universal consultant
**Rationale:** last of the kit changes. It depends on 44 (sources first) and 45 (upstream-scope questions become build requests), and it moves the most pins. Its byte budget depends on what 45 and 46 spent.
**Delivers:** `roles/consultant.md` (about 2 KB, byte allocation written first), WF19, the `consult` dial, the `Consult:` convention, an Orchestrator request type and routing line, and panel mode (one folder per lens, then synthesis, disagreement section, fixed correlation caveat). Also every registration and regeneration.
**Avoids:** Pitfalls 3, 4, 5, 9, 25.

### Phase 49: Feature docs and milestone close
**Rationale:** public docs for upstream sources, build requests and the consultant, with claim anchors; CHANGELOG `[3.1.0]`; bump to `3.1.0`.

### Phase Ordering Rationale
- The source declaration owns the pin format, ref grammar and third root. Build requests need the pin to know when they are answered. The consultant needs both.
- Moving the runnable stamp once (Phase 44) avoids repeated `runnable-version-skew` churn.
- Budget at least one adversarial red-team round for Phases 44 and 48. Both add untrusted read paths or a new advisory output, the class of change that cost v2.0 thirteen bypasses.
- Public repository rule: every fixture and example uses a synthetic upstream with invented IDs, and the upstream system is described generically everywhere.

### Research Flags

Needs deeper research during planning:
- **Phase 44:** pin semantics (Windows CRLF, shallow clones, SHA-256 repositories, `git show` across repositories without a fetch), the injection fence and the nested `CLAUDE.md` trigger, per-host external-read permissions. The upstream export format (ID grammar, supersession marker, entry manifest) is external and `UNKNOWN - verify`.
- **Phase 45:** board status migration and cross-version behavior (after D2), and whether the upstream intake echoes build-request IDs.
- **Phase 47:** first-publish and staging behavior, provenance through staging, ephemeral-source installer behavior end to end, pnpm `minimumReleaseAge` applicability to `dlx` (`UNKNOWN - verify`), Windows proof.
- **Phase 48:** role schema tier values (`scripts/canonical-frontmatter.ts`, `UNKNOWN - verify`) and the red-team round.

Standard patterns (skip research-phase):
- **Phase 46:** pointer lines and one workflow step.
- **Phase 49:** docs plus claim-anchor mechanics already established in v3.0.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | MEDIUM-HIGH | Local reproduction on npm 11.20.0 and vendor docs. npm 10.9 and 12 behavior, the pnpm 11 `dlx` gate, staging retention and provenance are MEDIUM or `UNKNOWN - verify`. |
| Features | MEDIUM | Comparable tools are cross-checked. Several multi-agent claims rest on LOW preprints. The upstream export format is unsettled. |
| Architecture | HIGH for integration points, MEDIUM for shapes | Every path was read in the repository. Proposed names and shapes await the human's decisions. |
| Pitfalls | MEDIUM | Repository-grounded items are HIGH. Platform behavior is from official docs. Some items rest on LOW secondary sources and are marked. |

**Overall confidence:** MEDIUM-HIGH

### Gaps to Address

- Upstream export format (ID grammar, supersession field, entry manifest, whether intake echoes request IDs): stub a minimal agreed manifest or settle it before Phase 44 fixes the citation grammar. Keep the grugops side declared, not hard-coded.
- Researcher conflicts D2 and D3: the human decides before Phases 44 and 45 are planned.
- Windows: CI has been red since v2.1. "Works on Windows" for the new path is `UNKNOWN - verify` until a green runner or a named human run.
- npm first-publish by OIDC, provenance through staging, and staged package retention: verify on the first release candidate.
- Whether `git show` across repositories works without a fetch, and the nested `CLAUDE.md` loading behavior through Bash reads: test in Phase 44.
- Per-host behavior for reads outside the repository on Codex CLI, Antigravity CLI, Copilot CLI and Pi: `UNKNOWN - verify` per host.
- npm 12 refusal of a top-level `npx github:` spec: not tested, and irrelevant if the registry path is chosen.
- Doc drift to fix with Phase 47: CLAUDE.md shows `/plugin install grug@grugops`, while `install/README.md` shows `grugops@grugops` marked `UNKNOWN - verify`.

## Sources

### Primary (HIGH confidence)
- Repository reads on 2026-11-24 (board, context-note and config contracts, `install/*.ts`, `scripts/*.ts`, role and workflow files, `package.json`, `.planning/PROJECT.md`, the 999.13 and 999.14 idea files). Details are in ARCHITECTURE.md and PITFALLS.md.
- Local experiments on npm 11.20.0 with Node 26.12.1, live registry checks (`grugops` and `create-grugops` return E404), and `nodejs.org/dist/index.json`.
- npm docs (trusted publishers, staged publishing, `npm exec`, `npm trust`) and Claude Code docs (plugins, memory, sub-agents).

### Secondary (MEDIUM confidence)
- Spec Kit, Kiro and BMAD docs; Anthropic multi-agent and skills writing; Kim et al. (ICML 2025), Choi et al. (NeurIPS 2025), Liang et al. (EMNLP 2024); OWASP LLM01:2025; git and in-toto digest specs; MADR 4.0; npm v12 changelogs; PowerShell policy docs.

### Tertiary (LOW confidence, needs validation)
- Several multi-agent preprints (sycophancy, conformity, persona tax), Socket on OIDC first-publish limits, npm cache issue reports, a `curl | sh` proof of concept, and pnpm 11 `minimumReleaseAge` via search.

Full source lists with retrieval dates are in STACK.md, FEATURES.md, ARCHITECTURE.md and PITFALLS.md in this directory.

---
*Research completed: 2026-11-24*
*Ready for roadmap: yes, after the human settles D2 and D3 (and ideally D1)*

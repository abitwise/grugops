---
phase: "30"
slug: "per-checkpoint-autonomy-matrix"
status: verified
# threats_open = count of OPEN threats at or above workflow.security_block_on severity (the blocking gate)
threats_open: 0
asvs_level: 1
created: "2026-09-06"
---

# Phase 30 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

Register origin: authored at plan time (all 11 PLAN files carry a `<threat_model>` block). Classification depth: ASVS L1 (grep-level) — each mitigation is matched against the discrimination evidence named in the plan's SUMMARY `## Threat Flags` and body. T-30-50 is not a plan-time entry; it is lifted from the phase's own red-team log (`docs/audit/30-redteam-surface-a.md`) so the fenced bypasses are on the register rather than only in an audit document.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| agent shell command -> PreToolUse hook stdin | untrusted command text crosses into the guard | command text / config JSON / env vars |
| repo config file -> hook process | an agent-writable JSON file crosses into a safety decision | command text / config JSON / env vars |
| host session env -> hook process | the only channel the guard treats as human-authored | command text / config JSON / env vars |
| registry markdown -> `readRegistry()` -> the guarantees join | an editable document crosses into a claim-disclosure decision | command text / config JSON / env vars |
| `SAFETY_FLOORS` -> env var names, config keys, `depends_on` enforcement | one literal set governs four downstream surfaces | command text / config JSON / env vars |
| repo config file -> the single reader -> hook / admit decisions | one untrusted file now feeds every governance decision | command text / config JSON / env vars |
| shared-context note write path -> `admit()` | a refused admit must leave no partial artifact | command text / config JSON / env vars |
| workflow markdown -> the tag pattern -> the roster | editable kit content crosses into a closed safety set | command text / config JSON / env vars |
| the section locator's range -> the tag scan | a scope error here silently widens the roster | command text / config JSON / env vars |
| gate procedure -> `emitVerdict` integrity argument | an agent-supplied value crosses into whether a green verdict is written | command text / config JSON / env vars |
| `emitVerdict` -> the shared note write chokepoint | the only sanctioned emission path | command text / config JSON / env vars |
| user repository configuration -> installer | the installer must read and report, never write, a user's declared intent | command text / config JSON / env vars |
| authored config -> validator | form refusal at authoring time, distinct from runtime gating | command text / config JSON / env vars |
| registry + live matrix -> the generator -> a public document | two editable sources cross into published safety claims | command text / config JSON / env vars |
| the generated document -> the language gates | a public claim surface that must not be outside the checks | command text / config JSON / env vars |
| hook process -> the shared-context trace | the hook becomes a note author; containment must stay in the shared helper | command text / config JSON / env vars |
| the banner -> a human reading a transcript | the banner is a claim a human acts on | command text / config JSON / env vars |
| live matrix -> generated disclosure -> a public document's anchored region | a config value crosses into published prose | command text / config JSON / env vars |
| the residual register -> the render | the honest statement of what is NOT protected | command text / config JSON / env vars |
| the round log -> the closure decision | a claim a human acts on; it must not narrate an unperformed check | command text / config JSON / env vars |
| the mirror artifact -> the reproduction claim | the mirror must genuinely differ from the current tree | command text / config JSON / env vars |
| agent shell command -> the committed hook artifact | the surface a host actually runs | command text / config JSON / env vars |
| host settings files -> hook subprocess environment | the vector whose provenance the hook cannot read | command text / config JSON / env vars |
| gate procedure -> the emitter's integrity argument | an agent-supplied value gating a published green verdict | command text / config JSON / env vars |

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-30-01 | Elevation of Privilege | `agent-factory/config/factory.config.json` `checkpoints` | high | mitigate | A config lowering with no matching `GRUGOPS_FLOOR_<ID>` in the hook's own env behaves exactly as `block` and denies by name (Task 1 acceptan | closed |
| T-30-02 | Elevation of Privilege | `hooks/guard.ts` `SELF_APPROVE` | high | mitigate | One generalized detector over `APPROVAL` plus every derived floor-var name; refuses inline set/export even when the variable is already pres | closed |
| T-30-03 | Elevation of Privilege | host `.claude/settings.json` `env` block | high | accept | RESEARCH F-2: an agent that can write host settings files can inject the grant, and `process.env[NAME]` carries no provenance. Narrowed by a | closed — accepted (AR-30-03) |
| T-30-04 | Tampering | `readGovernanceConfigResult` | high | mitigate | Four explicit degenerate-shape branches, all reaching `block` or the roster default by rule; `unreadable` treated as `block`; a throw at the | closed |
| T-30-05 | Spoofing | the run banner | medium | mitigate | Banner and decision captured from ONE run and asserted to agree; a whole-run differential rather than a substring probe (Phase 28 AP-1) | closed |
| T-30-06 | Tampering | `hooks/guard.ts` byte freeze | high | mitigate | `FROZEN_GUARD_BLOB` updated and the guard committed in the SAME commit; the freeze test refuses a hash-only or code-only change (D-24) | closed |
| T-30-SC | Tampering | npm/pip/cargo installs | high | mitigate | Not applicable — this phase installs zero packages (RESEARCH Package Legitimacy Audit); no install task exists, so no legitimacy checkpoint  | closed — not applicable (zero packages installed) |
| T-30-07 | Repudiation | `readRegistry()` duplicate handling | high | mitigate | Refuse a duplicate claim id with a named error, mirroring `readRegister()`; row count asserted against an independent denominator (Task 3) | closed |
| T-30-08 | Tampering | registry `depends_on` remap | medium | mitigate | The existing membership enforcement is shown RED before the remap and green after, so the check is proven live rather than assumed | closed |
| T-30-09 | Information Disclosure | a floor id silently dropped from `SAFETY_FLOORS` | high | mitigate | `FLOOR_CHECKPOINTS` length asserted against a count computed outside the filtering loop; `NON_DIALABLE_INVARIANTS` asserted disjoint from `C | closed |
| T-30-SC | Tampering | npm/pip/cargo installs | high | mitigate | Not applicable — this phase installs zero packages; no install task exists | closed — not applicable (zero packages installed) |
| T-30-10 | Tampering | the collapsed reader's widened scope | high | mitigate | The SUMMARY must name what the unified authority reads that neither predecessor did, with an assertion establishing it; the candidate-path o | closed |
| T-30-11 | Denial of Service | `admit()` throwing on an unreadable config | medium | mitigate | `admit()` refuses and degrades to `UNKNOWN - verify`; a test asserts no exception escapes and no partial note is written | closed |
| T-30-12 | Repudiation | a fourth config reader appearing silently | high | mitigate | Scan-derived site count with a pinned denominator, proven red in both directions; `model-tiers.ts` named in-file as the one deliberate excep | closed |
| T-30-13 | Elevation of Privilege | an unreadable config read as permissive | high | mitigate | `unreadable` reaches `block` at every consumer; the hook's reader call keeps its deny-on-throw catch | closed |
| T-30-13b | Tampering | the frozen guard's byte freeze during the rename | high | mitigate | Source, compiled artifact and freeze constant committed together; verification run after the commit | closed |
| T-30-SC | Tampering | npm/pip/cargo installs | high | mitigate | Not applicable — this phase installs zero packages; no install task exists | closed — not applicable (zero packages installed) |
| T-30-14 | Tampering | `CHECKPOINT_TAG_RE` scope | high | mitigate | The pattern is evaluated only over the locator's returned range; a boundary fixture and a fenced-block fixture each assert non-collection | closed |
| T-30-15 | Repudiation | a silently short derivation reporting a pass | high | mitigate | Bullet count asserted against a denominator computed outside the collecting loop; an empty corpus throws by name | closed |
| T-30-16 | Tampering | a non-canonical tag tolerated into the roster | medium | mitigate | Allow-list posture: any tag-keyword line inside a located section that is not the canonical form is a refusal naming file and line | closed |
| T-30-17 | Repudiation | a frozen section edited without its companion row | medium | mitigate | Disposition rows created in the same task; row count asserted against the edited-file count; gate run after commit | closed |
| T-30-SC | Tampering | npm/pip/cargo installs | high | mitigate | Not applicable — this phase installs zero packages; no install task exists | closed — not applicable (zero packages installed) |
| T-30-18 | Repudiation | the integrity argument is agent-supplied | high | mitigate | Fail closed on absent, misspelled, wrong-typed or unrecognized values; the residual — that a determined caller can pass the clean sentinel — | closed |
| T-30-19 | Tampering | a partial note left behind by a refusal | high | mitigate | Refuse-before-compose placement above the first composition line; a test asserts the notes directory bytes are identical before and after ev | closed |
| T-30-20 | Spoofing | a defaulted parameter letting existing pins pass unchanged | high | mitigate | The parameter is required and positional; the pre-update `tsc` diagnostic list is captured in the SUMMARY as the discrimination evidence | closed |
| T-30-21 | Repudiation | prose describing a mechanism that does not exist | medium | mitigate | The false sentence and its wording pin are corrected in the same commit that creates the mechanism | closed |
| T-30-SC | Tampering | npm/pip/cargo installs | high | mitigate | Not applicable — this phase installs zero packages; no install task exists | closed — not applicable (zero packages installed) |
| T-30-22 | Tampering | installer rewriting a user's configuration | high | mitigate | Report-do-not-rewrite; asserted by comparing fixture config bytes before and after an install run | closed |
| T-30-23 | Elevation of Privilege | an unknown checkpoint id accepted into config | high | mitigate | Unknown key is a validator refusal AND gates as `block` at runtime; the legal key set is imported from the derived roster | closed |
| T-30-24 | Repudiation | a broken fixture failing for a second reason | medium | mitigate | Per-fixture finding-set assertions rather than exit-status assertions; fixture set discovered by directory read with an asserted count | closed |
| T-30-25 | Information Disclosure | shipped prose describing a retired mechanism as live | medium | mitigate | Role bullets enumerated by the kit lister with an asserted count; the packaging and install documents rewritten in the same commit | closed |
| T-30-SC | Tampering | npm/pip/cargo installs | high | mitigate | Not applicable — this phase installs zero packages; no install task exists | closed — not applicable (zero packages installed) |
| T-30-26 | Repudiation | a silently short join omitting the lowered rows | high | mitigate | Join length asserted against an independently counted safety-row denominator; short and empty fixtures each produce a distinct named error | closed |
| T-30-27 | Tampering | the generator's output path | medium | mitigate | Fixed literal repo-relative path, never derived from argument, environment or content; the existing generator's stated path-traversal mitiga | closed |
| T-30-28 | Information Disclosure | a public safety document outside both claim gates | high | mitigate | Membership derived from the generator's exported path constant, proven by planted literals, with corpus sizes asserted | closed |
| T-30-29 | Repudiation | an overstated grant claim in the render | high | mitigate | The residual section names the settings-file vector, the narrowing measure and the session scope; the claim made is the one that holds | closed |
| T-30-30 | Tampering | a hand edit to the generated document | medium | mitigate | Byte-equality freshness gate that mirrors, compares, and never reports fresh when regeneration cannot run cleanly; the drift premise itself  | closed |
| T-30-SC | Tampering | npm/pip/cargo installs | high | mitigate | Not applicable — this phase installs zero packages; no install task exists | closed — not applicable (zero packages installed) |
| T-30-31 | Spoofing | banner and decision disagreeing | high | mitigate | One evaluation feeds both; agreement asserted from a single captured run with a message naming which signal fired; a forced disagreement is  | closed |
| T-30-32 | Repudiation | a lowering that leaves no trace record | high | mitigate | Both the authorized and the unauthorized lowering write exactly one finding note, asserted by before-and-after directory comparison | closed |
| T-30-33 | Tampering | a second direct note writer inside the hook | high | mitigate | All writes go through the sanctioned path; the foundation-guard aggregator's raw-write check is run as part of verification | closed |
| T-30-34 | Repudiation | a roster member whose zero-config behavior is never compared | medium | mitigate | Payload count derived from the roster; the union of hook-covered and elsewhere-covered ids asserted equal to the roster in both directions | closed |
| T-30-35 | Tampering | `hooks/guard.ts` byte freeze | high | mitigate | Second unfreeze and re-freeze in one commit; verification run after the commit | closed |
| T-30-SC | Tampering | npm/pip/cargo installs | high | mitigate | Not applicable — this phase installs zero packages; no install task exists | closed — not applicable (zero packages installed) |
| T-30-36 | Repudiation | a lowered floor leaving an overstated claim standing | high | mitigate | Two-directional consistency refusal between dropped rows and lowered floors; the anchor gate compares against generated text so prose cannot | closed |
| T-30-37 | Tampering | a hand-written disclosure at a dropped anchor | high | mitigate | The gate compares the anchored region against the generated text; a hand-written substitute is red, proven RED-first | closed |
| T-30-38 | Information Disclosure | an anchored claim deleted rather than replaced | high | mitigate | Deletion produces its own distinct message; the bijection and contiguity are asserted after every drop in both directions | closed |
| T-30-39 | Repudiation | the render and the residual register disagreeing | medium | mitigate | The render's residual section is generated from the register row; a planted change in the row is asserted to change the render | closed |
| T-30-40 | Information Disclosure | a lost or duplicated pointer line | low | mitigate | Pointer count derived from the document list and asserted | closed |
| T-30-SC | Tampering | npm/pip/cargo installs | high | mitigate | Not applicable — this phase installs zero packages; no install task exists | closed — not applicable (zero packages installed) |
| T-30-41 | Repudiation | a round declared closed on suite greenness | high | mitigate | The closure standard requires RED-first tests, mirror reproduction against the committed artifact, two independent reviews and self-reproduc | closed |
| T-30-42 | Spoofing | a verification harness asserting a false premise | high | mitigate | Every round answers the harness-premise question in writing; each mirror reproduction records both exit statuses | closed |
| T-30-43 | Repudiation | an unbounded round count consuming the phase | medium | mitigate | Hard cap of four rounds with a written fence and backlog entries, decided at a user checkpoint | closed |
| T-30-44 | Tampering | a heuristic fix that widens a predicate | high | mitigate | Every fix must be named as one of the four structural forms; a widened pattern is not an accepted fix | closed |
| T-30-SC | Tampering | npm/pip/cargo installs | high | mitigate | Not applicable — this phase installs zero packages; no install task exists | closed — not applicable (zero packages installed) |
| T-30-45 | Elevation of Privilege | the grant-name family and the self-set detector | high | mitigate | One detector derived from the roster; attacked for case, separator, indirection and wrapper spellings; every reproduction on the committed a | closed — accepted (AR-30-01) |
| T-30-46 | Elevation of Privilege | host settings-file environment injection | high | accept | Reproduced empirically this plan; recorded in the residual register in accepted/irreducible vocabulary and stated in the render with the obs | closed — accepted (AR-30-03) |
| T-30-47 | Repudiation | a green verdict written without a clean integrity result | high | mitigate | Every code path into the emitter shown to reach the refusal before composition; no file survives a refusal | closed |
| T-30-48 | Tampering | a range-scoped rather than commit-scoped freeze | high | mitigate | The freeze scope question is answered with evidence; this phase changed the hook twice, which is the condition under which a range-scoped ru | closed |
| T-30-49 | Spoofing | a closure claim resting on suite greenness | high | mitigate | The checkpoint refuses greenness as an argument and requires two independent reviews plus self-reproduction | closed |
| T-30-SC | Tampering | npm/pip/cargo installs | high | mitigate | Not applicable — this phase installs zero packages; no install task exists | closed — not applicable (zero packages installed) |
| T-30-50 | Elevation of Privilege | `hooks/guard.js` command parser — `protected_branch_merge` floor | high | accept | Six zero-key executed bypasses (`V-30-11-16`..`-20`, `-25`, e.g. `git push -fu origin feature`) recorded in `docs/audit/30-redteam-surface-a.md`; fenced at the D-22 four-round cap, backlog under `deferred-items.md`; scope note under AUTO-03 in REQUIREMENTS.md | closed — accepted (AR-30-02) |

*Status: open · closed · open — below high threshold (non-blocking)*
*Severity: critical > high > medium > low — only open threats at or above workflow.security_block_on count toward threats_open*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-30-01 | T-30-45 | `V-30-11-22`: `NODE_OPTIONS=--require` preloads code before the wrapper's first line with the manifest still verifying; the self-set vocabulary is narrower than the channel. The wrapper cannot defend its own preload; a runtime answer needs a signed or read-only kit (host-tier). Fenced under D-22 at the four-round cap; recorded in the residual register and `docs/GUARANTEES.md`. | user (UAT test 1 + secure-phase gate) | 2026-09-06 |
| AR-30-02 | T-30-50 | Six zero-key executed bypasses of `protected_branch_merge` on the committed `hooks/guard.js` (`V-30-11-16`..`-20`, `-25`). Surface A is FENCED, NOT CLOSED at D-22's cap; per-round "created by previous fix" ratio never fell. Disclosed as a scope note under AUTO-03 in `.planning/REQUIREMENTS.md`, backlog in `deferred-items.md`. `protected_branch_merge=block` is not to be relied on as an operative guarantee against an unauthorized force-push until a follow-up phase closes the command model. | user (UAT test 1 + secure-phase gate) | 2026-09-06 |
| AR-30-03 | T-30-03 / T-30-46 | Host settings-file `env` block reaches the hook subprocess (OBSERVED in surface A round 2); `process.env` carries no provenance. Accepted as irreducible in `docs/GUARANTEES.md` §9; narrowing measure (`permissions.deny` over `.claude/settings*.json`) not yet built. | user (UAT test 3) | 2026-09-06 |

*Accepted risks do not resurface in future audit runs.*

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-09-06 | 62 | 62 | 0 | secure-phase (orchestrator, L1; 3 accepted) |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-09-06

# Phase 9: Doctor & Two-Root Validator - Context

**Gathered:** 2026-06-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Ship the verification layer that would have caught all three dogfood pains and proves the kit/state split cannot silently regress:

1. **The `--check` doctor** (INSTALL-05) in `install.sh` + `install.mjs` (byte-parity) — resolves every referenced path and fails loudly with the FIRST unresolved path + its referencing file, using clear exit codes.
2. **The two-root-aware structure validator** (VAL-02) in `scripts/validate-agent-factory.mjs` — explicit kit root + state root, NO silent fallback to `.`, so it cannot false-green in the dev checkout or with `$GRUGOPS_HOME` unset.
3. **The `install.test.sh` rewrite for the split** (VAL-02 / SC5) — fresh install lays kit + materializes adapter + seeds state, doctor passes on a good split and fails loudly on a missing kit; idempotency / dry-run / reversibility preserved.

**In scope:** INSTALL-05 (the doctor) and VAL-02 (two-root validator + `install.test.sh` split update).

**Out of scope (later milestones — do NOT pre-empt):**
- Doctor `--fix` / auto-repair of user content (FIX-01 → v2+; the doctor only reports and names, never edits the user's repo).
- `install.sh --migrate` for already-installed in-repo `agent-factory/` + symlink layouts (MIGR-01 → v1.2).
- `install.sh --update` central-kit refresh (UPD-01 → v1.2).
- Version-skew *negotiation/handling* between installed kit and target (SKEW-01 → v1.2). **Note:** the doctor in this phase *detects and WARNs* on skew; it does not negotiate or resolve it.
- Plugin-form kit resolution via `${CLAUDE_PLUGIN_ROOT}` (PLUGIN-01 → v2+).

**Already locked upstream (carry forward, do NOT re-decide):**
- Kit home resolves by ONE rule: `${GRUGOPS_HOME:-$HOME/.grugops}` → `KIT_ROOT="$GRUGOPS_HOME/agent-factory"`, resolved identically in POSIX `sh` and Node (`os.homedir()`) — the doctor reuses the existing `resolve_grugops_home` (install.sh) / `os.homedir()` (install.mjs) (SHOME-01, Phase 8).
- The install marker `.grugops/install.json` carries exactly four byte-stable fields in fixed order: `kitVersion`, `grugopsHome`, `kitRoot`, `installMode` (Phase 8 `write_marker`). The doctor was always intended to read it.
- The two materialized adapters are `.claude/skills/grugops/SKILL.md` and `.claude/agents/grugops-orchestrator.md`; each carries the resolved absolute `KIT=` line inside the `grugops:materialized-kit` sentinel block (Phase 8 `materialize_adapter`).
- Kit-vs-state disambiguation (Phase 7): bare `agent-factory/…` = KIT (read at KIT_ROOT); `plans/`, `memory-bank/`, `.grugops/factory.config.json` = STATE (repo-relative); `agent-factory/handoffs/` is the TEMPLATE read, `plans/handoffs/<ID>-<stage>.md` the INSTANCE write. The doctor and validator MUST reuse this classification when resolving refs.
- Exit-code convention is fixed by the requirement: pass `0` / FAIL nonzero / WARN→`0` by default / `--check --strict` promotes WARN to nonzero.
- sh/Node byte-parity is an existing contract (install.sh ↔ install.mjs).
- **C3 (GATING):** no silent fallback to `.`; an unset/missing-`$GRUGOPS_HOME` BAD fixture MUST fail the validator; doctor and validator resolve the kit home identically so "doctor passes" and "validator passes" can never disagree (SC3/SC4).
- Never overwrite/delete user content; never set the deploy-approval env var (carried from Phase 5 INSTALL-02 / SAFE-02).

</domain>

<decisions>
## Implementation Decisions

### Doctor check scope (INSTALL-05 / SC1)
- **D-01:** The doctor uses a **parse-and-resolve** strategy — it reads the things the installer actually wrote (the two materialized adapters and `.grugops/install.json`), resolves the paths they reference, and stats them. It is NOT a hand-maintained curated checklist. It MUST reuse the Phase-7 kit-vs-state classification so kit refs resolve at `KIT_ROOT` and state refs resolve repo-relative — otherwise it would false-fail on legitimately repo-local state refs.
- **D-02:** On failure the doctor names the **FIRST** unresolved path together with the file that references it (SC1). Resolution order MUST be deterministic so "first" is stable across runs.

### Kit-root resolution — the "can never disagree" mechanism (SC4)
- **D-03:** The doctor **cross-checks all three** sources of the kit root: (a) the freshly re-resolved `${GRUGOPS_HOME:-$HOME/.grugops}` rule, (b) the marker's `kitRoot` field in `.grugops/install.json`, and (c) the materialized `KIT=` line in the adapter sentinel block. Disagreement is surfaced as a finding, never a silent pass — this is precisely the stale-install / moved-clone footgun the doctor exists to catch.
- **D-04:** The validator (VAL-02) resolves the kit home by the **same rule** so doctor and validator can never disagree (SC4). Because the doctor lives in `sh`+Node and the validator in Node, "resolve identically" is guaranteed by re-implementing the one rule and asserting agreement in a shared test — NOT by shared code across the sh boundary.

### Doctor FAIL conditions (hard, nonzero)
- **D-05:** The following are hard FAIL: unresolvable `KIT_ROOT`; missing `agent-factory/roles/orchestrator.md`; an unresolvable materialized adapter `KIT` path; unset/missing `$GRUGOPS_HOME` (the C3 footgun); **any dangling symlink** in the resolved set (SC1 explicitly names "no dangling symlinks").

### Doctor WARN conditions (exit 0 by default; `--strict` promotes to nonzero)
- **D-06:** The WARN tier is **non-empty** in this phase (so `--strict` has live warnings to gate, satisfying SC2 with real behavior, not just plumbing): **kit-version skew** (marker `kitVersion` ≠ the installed kit's `VERSION`) and **missing optional seed** (a seed file that should exist but doesn't — e.g. an empty `plans/` subdir or a `memory-bank/` seed — since the user may have intentionally pruned state).
- **D-07:** Skew is **detected and warned only** — no negotiation or auto-resolution (that is SKEW-01, deferred to v1.2).

### Two-root validator structure (VAL-02 / SC3)
- **D-08:** `scripts/validate-agent-factory.mjs` becomes two-root aware with an **explicit kit root + state root, no default → unset is an error** (this is the mechanism that kills the `.`-fallback and forces the C3 BAD fixture to fail). It validates the kit subtree and the repo state subtree **independently** (two passes / two roots), per the design doc's "validate the kit and a target independently."
- **D-09:** `scripts/check-kit-refs.sh` (the Phase-7 grep-to-zero gate) stays a **separate** POSIX gate — VAL-02 neither absorbs nor calls it (least coupling; preserves the POSIX-only CI option; honors Phase-7 D-07 "kept separate").

### Test-harness plan (VAL-02 / SC5)
- **D-10:** **Extend `install.test.sh`** with the SC5 doctor checks (fresh install lays kit + materializes adapter + seeds `.grugops/factory.config.json` and `plans/handoffs/`; doctor passes on a good split; doctor fails loudly on a missing kit), preserving idempotency / dry-run / reversibility. **Keep `install.two-root.test.sh`** as the deep two-root harness (kit copy, materialize, seed, never-clobber, idempotency, DRY_RUN, `--target`/`--yes`, D-07 guard, sh/Node parity). Two harnesses; some overlap accepted. (Phase 8's "do not rewrite install.test.sh" boundary is now lifted for these doctor additions.)

### Claude's Discretion (planner/researcher to lock)
- **Cross-check mismatch severity (D-03):** when `KIT_ROOT` resolves but the three sources disagree, choose FAIL vs WARN based on whether the divergent paths still resolve to a real kit. Lean: a true divergence (different real kits, or one unresolvable) → FAIL; a cosmetic-but-equivalent path difference → WARN. Reconcile with the WARN-tier decision (D-06) when finalizing.
- **Parse-and-resolve breadth (D-01):** within the parse-and-resolve approach, decide whether to stop at "adapters + marker + start-up load-bearing reads (orchestrator.md, `.grugops/factory.config.json`, `plans/board.md`, `plans/handoffs/`)" or additionally grep+stat the kit's role/workflow `agent-factory/…` refs at `KIT_ROOT` (closer to SC1's literal "every path," heavier, overlaps `check-kit-refs.sh`). Keep it bounded and deterministic.
- **C3 BAD-fixture mechanism (D-08):** how the "unset/missing kit root MUST fail" fixture is driven — unsetting the env var, pointing the explicit kit-root input at a nonexistent dir, or both. The requirement only locks that it must fail.
- **Validator env-var / input naming (D-08):** e.g. reuse `VALIDATE_ROOT` as the state root + add an explicit `KIT_ROOT`, or introduce two fresh names. Must remain stdlib-only, read-only, no `package.json` (Phase 6 VAL-01 constraints).
- **`--check` in an uninstalled / dev checkout:** the doctor run where there is no `.grugops/install.json` and no materialized adapters MUST report a clear "not installed — run install.sh" with a nonzero exit, never crash. (Ties to C3: the dev checkout must not false-green.) Planner to decide whether this is a distinct "not installed" message or folded into the FAIL path.
- **Doctor output format:** human-readable lines naming the failing path + referencing file (SC1); exact rendering is discretion.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements, roadmap & design (authoritative)
- `.planning/REQUIREMENTS.md` § "Milestone v1.1 Requirements" — **INSTALL-05** (the `--check` doctor: verifies every referenced path resolves, names the first failure + referencing file, exit codes 0/nonzero/WARN→0/`--strict` gates WARN) and **VAL-02** (two-root validator, no `.`-fallback, missing/unset-kit BAD fixture must fail, `install.test.sh` split update). Also names the deferred items NOT to build (MIGR-01, UPD-01, SKEW-01/FIX-01/PLUGIN-01).
- `.planning/ROADMAP.md` § "Phase 9: Doctor & Two-Root Validator" — the goal + the 5 success criteria this phase must satisfy.
- `docs/design/shared-install.md` § "Installer changes" (the `--check` doctor bullet) and § "Validator / test impact" — the canonical shared-install design: the doctor is "the guard that would have caught all three pains"; the validator "must become two-root aware … or validate the kit and a target independently." **Authoritative for this milestone.**
- `.planning/research/SUMMARY.md` (+ `ARCHITECTURE.md` / `PITFALLS.md` / `STACK.md`) — v1.1 shared-install research; roadmap notes the doctor exit-code convention and two-root validator split are fully specified there (no additional phase-level research needed). Source of the C3 gating pitfall.

### Phase 7/8 decisions this phase keys off
- `.planning/phases/08-two-root-installer/08-CONTEXT.md` — the install-marker shape (4 fields), the materialization mechanism (`grugops:materialized-kit` sentinels, the 2 resolver adapters), `resolve_grugops_home`, the D-07 self-checkout guard, and the Phase-8 pull-forward of `install.test.sh` Check 3 to the D-06 uninstall contract.
- `.planning/phases/07-shared-home-foundation-path-rewrite/07-CONTEXT.md` — the kit-vs-state classification (D-08/D-10), adapter-only resolution + STOP-on-absence (D-11/D-12), and the `check-kit-refs.sh` gate logic + template allowlist (D-07/D-08) the validator must NOT duplicate.

### Files this phase touches (anchors)
- `install/install.sh` — add `--check`/doctor; reuse `resolve_grugops_home` (line ~47), `abspath`, the marker reader, the materialization sentinels (`MAT_OPEN`/`MAT_CLOSE`, lines ~329), arg-parse loop (lines ~49-58).
- `install/install.mjs` — byte-parity twin of the doctor; Windows home via `os.homedir()`.
- `scripts/validate-agent-factory.mjs` — make two-root aware (currently single `ROOT` via `VALIDATE_ROOT` || `cwd`, lines ~31-48); stdlib-only, read-only, never creates `package.json`, two-tier errors/warnings + `--strict` (Phase 6 VAL-01).
- `install/install.test.sh` — extend with doctor checks (good split passes / missing kit fails); preserve the existing check structure + `pass()/fail()` idiom.
- `install/install.two-root.test.sh` — the deep two-root harness; keep as-is (already GREEN 18/18), optionally referenced by the doctor checks.
- `.grugops/install.json` — the marker the doctor reads (4 fields: `kitVersion`, `grugopsHome`, `kitRoot`, `installMode`); not present in the source checkout (expected — that is the uninstalled-checkout case).
- `.claude/skills/grugops/SKILL.md` + `.claude/agents/grugops-orchestrator.md` — the 2 materialized adapters whose `KIT=` line the doctor cross-checks.
- `agent-factory/VERSION` / `$KIT_ROOT/VERSION` — the source for the skew WARN (marker `kitVersion` vs installed kit `VERSION`).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `install/install.sh` — `resolve_grugops_home()` already computes `GRUGOPS_HOME` + `KIT_ROOT` exactly as the doctor needs; `abspath()` normalizes possibly-nonexistent paths; `write_marker()` documents the 4-field marker the doctor reads back; the `MAT_OPEN`/`MAT_CLOSE` sentinels (`# <!-- grugops:materialized-kit -->`) frame the adapter `KIT=` line to parse. Extend, don't rewrite.
- `install/install.mjs` — mirrors install.sh function-for-function with stdlib-only Node; the byte-parity contract + `os.homedir()` are already established and tested.
- `scripts/validate-agent-factory.mjs` — Phase-6 validator: a single `ROOT` (`VALIDATE_ROOT` env || `cwd`), `exists()/read()/listdir()` helpers all `join(ROOT, rel)`, two-tier `errors[]`/`warnings[]` with `--strict` promotion, read-only by construction, no `package.json`. VAL-02 splits `ROOT` into an explicit kit root + state root with NO default.
- `install/install.test.sh` — clean `pass()/fail()` harness, throwaway temp area cleaned on exit, `INSTALL_MODE=copy` so laid-down files are real; Check 3 already encodes the two-root D-06 uninstall contract (Phase-8 pull-forward).
- `install/install.two-root.test.sh` — deep two-root harness (kit copy / materialize / seed / never-clobber / idempotency / DRY_RUN / `--target`/`--yes` / D-07 guard / sh-Node parity), GREEN 18/18.

### Established Patterns
- **`resolve_grugops_home` / `os.homedir()` one-rule resolution** — the single source of truth the doctor AND validator must both honor (SC4). A shared test asserts sh + Node + validator agree.
- **Marker as the installer's record of truth** — `.grugops/install.json` (4 fields) is what the doctor reads back; cross-checking it against the re-resolved rule and the adapter `KIT` line is the stale-install detector (D-03).
- **Two-tier errors/warnings + `--strict`** (validator) and **0/nonzero exit + `pass()/fail()`** (sh harnesses) — the doctor's exit-code convention mirrors these; reuse the idiom.
- **`GRUGOPS_SRC` / `TARGET` / `GRUGOPS_HOME` env overrides** — already present for hermetic test harnesses; the doctor's BAD/good fixtures and the C3 unset-kit fixture layer over these.

### Integration Points
- The doctor resolves the same start-up reads the orchestrator adapter performs on load (`agent-factory/roles/orchestrator.md` at `KIT_ROOT`; `.grugops/factory.config.json`, `plans/board.md`, `plans/handoffs/` in the repo) — if the doctor passes, `/grugops` works on first run.
- The Phase-7 `check-kit-refs.sh` and this phase's two-root validator both run over the kit; they stay separate tools (D-09) but must agree on the kit-vs-state classification.
- The C3 BAD fixture (unset/missing kit root) is the mechanical proof that the validator can't false-green in the dev checkout — it pairs with the doctor's "not installed → nonzero" behavior in the same checkout.

</code_context>

<specifics>
## Specific Ideas

- This phase is explicitly framed as "the verification layer that would have caught all three dogfood pains" (kit never arrives, wrong target, symlink fragility). Every doctor finding should map back to one of those pains.
- The user prioritized **catching disagreement** over simplicity: cross-checking all three kit-root sources (D-03) and making mismatch a real finding is the point — a doctor that only checks one source could still false-green on a moved clone.
- The user accepted a **non-empty WARN tier now** (skew + missing-seed, D-06) specifically so `--strict` exercises real warnings rather than empty plumbing — even though full skew handling is deferred to v1.2.
- Two genuinely-technical choices (cross-check mismatch severity; parse breadth) were delegated to planner discretion — the user is comfortable letting the plan lock the detail within the chosen approach.

</specifics>

<deferred>
## Deferred Ideas

- **Doctor `--fix` / auto-repair** of user content — FIX-01, v2+. The `--check` doctor reports and names only; it never edits the user's repo (explicit Out-of-Scope in REQUIREMENTS.md).
- **`install.sh --migrate`** for already-installed in-repo `agent-factory/` + symlink layouts — MIGR-01, v1.2; never delete-first. (C2 gating pitfall applies to that work, not this phase.)
- **`install.sh --update`** central-kit refresh + two-stage uninstall — UPD-01, v1.2.
- **Version-skew negotiation/handling** (per-repo kit-version pin, resolution) — SKEW-01, v1.2. This phase only *detects + WARNs* on skew.
- **Plugin-form kit resolution** via `${CLAUDE_PLUGIN_ROOT}` (the second home of one-rule-two-homes) — PLUGIN-01, v2+.
- **`uninstall.sh --purge-kit`** — explicit confirm-gated removal of the shared `$GRUGOPS_HOME` kit (carried from Phase 8 deferred). Not this phase.

</deferred>

---

*Phase: 9-Doctor & Two-Root Validator*
*Context gathered: 2026-06-07*

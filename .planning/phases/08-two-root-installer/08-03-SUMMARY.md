---
phase: 08-two-root-installer
plan: 03
subsystem: infra
tags: [installer, posix-sh, node-esm, two-root, materialization, idempotency, seed, byte-parity]

# Dependency graph
requires:
  - phase: 07-shared-install-split
    provides: "split convention + ${GRUGOPS_HOME:-$HOME/.grugops} resolution rule, the materialized-kit adapter slot, check-kit-refs.sh gate"
  - phase: 08-two-root-installer (08-01)
    provides: "agent-factory/seed/** state-plane bundle (config + plans/** + memory-bank/**), packaging templates, check-kit-refs.sh seed exclusion"
  - phase: 08-two-root-installer (08-02)
    provides: "install/install.two-root.test.sh — the RED two-root behavioral gate (INSTALL-03/04, D-06, D-07)"
provides:
  - "Two-root install.sh + install.mjs: home-resolve, --target/--yes/non-TTY prompt, always-on D-07 self-checkout guard, copy-default"
  - "Atomic copy_kit to $GRUGOPS_HOME/agent-factory (tmp→rename)"
  - "Content-idempotent materialization of the 2 resolver adapters (strip-then-inject the resolved absolute KIT path)"
  - "Full per-repo state seed (skip-if-exists) incl. plans/handoffs/, plus a byte-parity install marker (.grugops/install.json, installedAt omitted)"
  - "install.test.sh Check 3 reconciled to the two-root D-06 contract (approved VAL-02 slice)"
affects: [08-04-uninstall-docs, 09-doctor-two-root-validator]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Two-root installer: shared read-only kit under $GRUGOPS_HOME + per-repo seeded state in $TARGET"
    - "Adapter materialization = strip-then-reinject a sentinel block, content-idempotent (NOT cmp-based)"
    - "Byte-parity install marker with installedAt omitted → re-install is byte-zero-diff"
    - "sh/Node byte-parity contract held by mirroring every step function-for-function with identical report labels and emitted bytes"

key-files:
  created: []
  modified:
    - install/install.sh
    - install/install.mjs
    - install/install.test.sh

key-decisions:
  - "[Human-approved Option A] Reconcile ONLY install.test.sh Check 3 with the two-root seed model — a deliberate pull-forward of a slice of Phase 9 / VAL-02"
  - "GRUGOPS_HOME resolved via ${GRUGOPS_HOME:-$HOME/.grugops} (sh) / os.homedir() with .trim() empty-string fallback (Node)"
  - "Default install mode flipped to COPY (symlink opt-in)"
  - "Install marker omits installedAt (four stable fields: kitVersion, grugopsHome, kitRoot, installMode) for byte-stable idempotency"
  - "D-07 self-checkout guard runs unconditionally after TARGET resolution, even under --yes/non-TTY; --allow-self overrides"

patterns-established:
  - "Materialization idempotency by content (strip-then-reinject), not by cmp -s / sameContent (which break the moment a line is injected)"
  - "Seed is skip-if-exists per file (D-04 never-clobber); seeded state becomes user content and survives uninstall (D-06)"

requirements-completed: [INSTALL-03, INSTALL-04]

# Metrics
duration: ~3h34m (incl. checkpoint pause for human decision)
completed: 2026-06-07
---

# Phase 8 Plan 03: Two-Root Installer Core Summary

**Turned the single-root adapter installer into a TWO-ROOT installer at sh/Node byte-parity — atomic kit copy to `$GRUGOPS_HOME`, content-idempotent materialization of the resolved absolute kit path into the 2 resolver adapters, full state seed with `plans/handoffs/`, a byte-stable install marker, the always-on D-07 self-checkout guard, and a copy-default flip — then reconciled `install.test.sh` Check 3 with the two-root D-06 contract per an approved human decision.**

## Performance

- **Duration:** ~3h34m (wall clock fa0691d → 2ff8fab; includes the checkpoint pause for the human decision)
- **Tasks:** 2 implementation tasks (pre-committed) + 1 approved reconciliation (this continuation)
- **Files modified:** 3 (`install/install.sh`, `install/install.mjs`, `install/install.test.sh`)

## Accomplishments

- **Two-root resolution + CLI surface (Task 1):** `--target <repo>`, `--yes`, `--allow-self`/`--force`, `--symlink` parsing in both installers; `${GRUGOPS_HOME:-$HOME/.grugops}` (sh) / `os.homedir()` with empty-string fallback (Node); `INSTALL_MODE` default flipped from `symlink` to `copy`; the always-on D-07 self-checkout guard with a byte-identical refuse message; ordering fixed so the banner never prints unset/blank `home:`/`kit:` values under `set -eu`.
- **Kit copy + materialize + seed + marker (Task 2):** atomic `copy_kit` (tmp→rename) to `$GRUGOPS_HOME/agent-factory`; materialization of exactly the 2 resolver adapters via strip-then-reinject (content-idempotent, blockquote + self-heal line preserved); `seed_state` skip-if-exists incl. an explicit `plans/handoffs/` mkdirp; a four-field install marker (`kitVersion`, `grugopsHome`, `kitRoot`, `installMode`) with `installedAt` omitted so re-install is byte-zero-diff; full sh/Node byte-parity.
- **Approved Check-3 reconciliation (this continuation):** rewrote ONLY Check 3 of the frozen `install.test.sh` to assert the two-root D-06 contract instead of an exact byte-restore round-trip; Checks 1, 2, 4, 4b, 5, 6 verified byte-identical by diff.
- **All three harnesses confirmed:** `install.test.sh` fully GREEN; `install.two-root.test.sh` GREEN for [1]–[10],[12] (only [11]'s marker-removal sub-assertion RED — 08-04's job); `check-kit-refs.sh` exit 0; source `.claude/` adapters stayed un-materialized (guard worked).

## Task Commits

1. **Task 1: home resolution, `--target`/`--yes`/non-TTY prompt, copy-default flip, D-07 guard (sh + mjs)** — `fa0691d` (feat)
2. **Task 2: copy_kit (atomic), materialize 2 adapters (content-idempotent), seed_state, byte-parity install marker (sh + mjs)** — `a4a28f8` (feat)
3. **Reconciliation: install.test.sh Check 3 → two-root seed model (approved VAL-02 slice)** — `2ff8fab` (test)

**Plan metadata:** committed separately (docs: complete plan).

## Files Created/Modified

- `install/install.sh` — Two-root POSIX installer: home-resolve, arg parsing, D-07 guard, copy-default, `copy_kit`, adapter materialization, `seed_state`, install marker.
- `install/install.mjs` — Byte-parity Node twin (`os.homedir()` home resolution, POSIX-normalized materialized path, identical marker bytes).
- `install/install.test.sh` — Check 3 reconciled to the two-root D-06 contract; all other checks byte-identical.

## Decisions Made

- **Approved human decision (Option A):** the two-root seed model creates a genuine contradiction with the FROZEN `install.test.sh` Check 3 (install → uninstall → assert fixture byte-restored), because seeded user state is *meant* to persist past uninstall (D-06). The human chose to surgically reconcile ONLY Check 3 to the two-root reality — a deliberate, approved pull-forward of a slice of Phase 9 / VAL-02 (the broader `install.test.sh` split-rewrite remains Phase 9).
  - Check 3 now ASSERTS REMOVED (grugops-owned): the `.claude` adapters + the CLAUDE.md grugops sentinel wiring the installer added.
  - Check 3 now ASSERTS SURVIVES (seeded user state, D-06): `.grugops/factory.config.json`, `memory-bank/**`, plus the unchanged frozen-core (`agent-factory/`) and the user's own `plans/` data.
  - Check 3 does **not** assert on the `.grugops/install.json` marker: marker removal is Plan 08-04's deliverable (two-root harness assertion [11]); `uninstall.sh` was left untouched this plan.
- Install marker omits `installedAt` (four stable fields) so a re-install with an unchanged `$GRUGOPS_HOME` is byte-zero-diff.
- Default install mode is COPY; symlink is opt-in (`--symlink` / `INSTALL_MODE=symlink`).

## Deviations from Plan

The two implementation tasks executed as written. The one continuation change is the **approved** Check-3 reconciliation, which is not an autonomous deviation but an explicit human decision resolving a checkpoint:

**1. [Human decision — Option A] Reconcile install.test.sh Check 3 with the two-root seed model**
- **Found during:** Plan completion verification (Task 2's `install.test.sh` regression assertion)
- **Issue:** The frozen Check 3 asserted the target returns to exact pre-install bytes after install → uninstall. Under the two-root seed model, `seed_state` writes per-repo user state (`.grugops/factory.config.json`, `memory-bank/**`, `plans/**`) that D-06 deliberately preserves past uninstall, so an exact byte-restore is no longer the contract — Check 3 failed legitimately.
- **Fix:** Rewrote ONLY Check 3 to assert the two-root contract (grugops-owned adapters + CLAUDE.md sentinel REMOVED; seeded user state + frozen core SURVIVE). Verified by diff that Checks 1, 2, 4, 4b, 5, 6 are byte-identical.
- **Files modified:** `install/install.test.sh`
- **Verification:** `sh install/install.test.sh` exits 0 / ALL CHECKS PASSED; only Check 3's contiguous region changed (38 insertions, 10 deletions).
- **Committed in:** `2ff8fab`

---

**Total deviations:** 0 autonomous; 1 human-approved reconciliation (Option A).
**Impact on plan:** The reconciliation resolves a genuine spec contradiction the two-root model created; it is an approved, scoped pull-forward of one Check from Phase 9 / VAL-02. No scope creep — `uninstall.sh` and the broader `install.test.sh` split-rewrite remain Phase 9 / Plan 08-04 work.

## Issues Encountered

- **`install.two-root.test.sh` assertion [11] remains RED — by design.** [11] (D-06 two-root uninstall: the `.grugops/install.json` marker must be *removed*) depends on the Plan 08-04 uninstall update, which is Wave 3. Per the resume instructions this was NOT touched in 08-03. All other two-root assertions ([1]–[10],[12]) are GREEN.

## Requirements Verified

- **INSTALL-03** (`--target` + interactive prompt + `--yes`/non-TTY bypass, runs from any CWD): GREEN in the two-root harness — [8] `--target` from an arbitrary CWD, [9] `--yes`/non-TTY unattended, [10] D-07 guard refuse-by-default + `--allow-self` override. Marked complete: the install-side behavior is genuinely exercised and passing.
- **INSTALL-04** (seed per-repo state without clobbering, copy-default, idempotent/additive/`DRY_RUN`/reversible, sh/Node byte-parity, `os.homedir()`): GREEN in the two-root harness — [1] kit copy, [2] materialization, [3] seed incl. `plans/handoffs/` + marker, [4] never-clobber, [5] two-root idempotency, [6] DRY_RUN, [7] copy-default, [12] sh/Node parity. Marked complete: every install-side facet is verified.
  - **Reasoning on the [11] dependency:** [11] is the *uninstall* (D-06) contract, not an INSTALL-03/INSTALL-04 install behavior. The marker is *written* correctly (verified by [3] and [12]); its *removal on uninstall* is 08-04's deliverable. INSTALL-03/INSTALL-04 are install-side requirements and are fully, genuinely verified — no aspect of either depends on 08-04's uninstall. Marked complete with no fabrication.

## Next Phase Readiness

- **Ready for Plan 08-04** (two-root uninstall + `install/README.md` two-root docs): the installer now writes the grugops-owned marker + adapters and seeds user state; 08-04 makes uninstall remove ONLY the marker + adapters + wiring (turning two-root harness [11] GREEN) and never the shared kit or seeded state.
- **Ready for Phase 9** (doctor + two-root validator): the final ref spelling (resolved absolute `$KIT_ROOT/agent-factory` materialized into both adapters, recorded in the marker's `kitRoot`) is now stable for the doctor↔marker cross-check.

## Self-Check: PASSED

- Files: `08-03-SUMMARY.md`, `install/install.sh`, `install/install.mjs`, `install/install.test.sh` all present.
- Commits: `fa0691d`, `a4a28f8`, `2ff8fab` all found in git history.

---
*Phase: 08-two-root-installer*
*Completed: 2026-06-07*

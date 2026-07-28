---
phase: 08-two-root-installer
plan: 04
subsystem: infra
tags: [installer, uninstall, posix-sh, two-root, reversibility, docs, d-06, d-07]

# Dependency graph
requires:
  - phase: 08-two-root-installer (08-03)
    provides: "Two-root install.sh + install.mjs (kit copy to $GRUGOPS_HOME, materialized adapters, seeded .grugops/ state + install.json marker); install.test.sh Check 3 reconciled to the two-root D-06 contract"
  - phase: 08-two-root-installer (08-02)
    provides: "install/install.two-root.test.sh — assertion [11] (D-06 two-root uninstall) was the only remaining RED"
provides:
  - "Two-root uninstall.sh: is_protected() now guards .grugops/; removes ONLY .grugops/install.json via a narrow grugops-owned exception; never touches $GRUGOPS_HOME, plans/, or memory-bank/"
  - "install/README.md documents the two-root installer: --target, prompt + --yes/non-TTY, copy-default (symlink opt-in), $GRUGOPS_HOME + the two-root layout, adapter materialization, the D-07 self-checkout guard, and the D-06 uninstall scope"
  - "install.two-root.test.sh fully GREEN (all 18 checks incl. [11] marker removal)"
affects: [09-doctor-two-root-validator]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Protect a dir broadly in is_protected(), then remove a single grugops-owned file under it via a dedicated named exception (NOT the generic guarded remove_file path)"
    - "Defensive comments may NAME the shared kit root ($GRUGOPS_HOME) for clarity; the dangerous-pattern gate targets rm/delete CODE referencing the kit root, not the bare substring (W-4)"

key-files:
  created:
    - .planning/phases/08-two-root-installer/08-04-SUMMARY.md
  modified:
    - install/uninstall.sh
    - install/README.md

key-decisions:
  - "Marker removed via a dedicated remove_marker() that targets the one named file .grugops/install.json — NOT a single-file carve-out inside is_protected (keeps the protection denylist clean; mirrors the AGENTS.md grugops-owned shape)"
  - ".grugops/ is intentionally never rmdir'd on uninstall — the seeded factory.config.json keeps it populated, and even an empty .grugops/ is the user's state dir"
  - "README documents only shipped flags; the Phase-9 --check doctor and the deferred --purge-kit are explicitly NOT presented as available (no fabrication)"

patterns-established:
  - "Two-root reversibility: uninstall is per-target and grugops-owned-only; the shared kit is removed by a manual rm the user runs (no --purge-kit this phase)"

requirements-completed: [INSTALL-03, INSTALL-04]

# Metrics
duration: ~10m
completed: 2026-06-07
---

# Phase 8 Plan 04: Two-Root Uninstall + Installer Docs Summary

**Closed the two-root contract's reversibility and documentation: `uninstall.sh` now protects `.grugops/` broadly (seeded `factory.config.json` survives) and removes ONLY the `.grugops/install.json` marker via a narrow grugops-owned exception — never the shared `$GRUGOPS_HOME` kit nor seeded `plans/`/`memory-bank/` — turning the two-root harness's last RED assertion [11] GREEN; and `install/README.md` now documents the frozen two-root installer (`--target`, prompt/`--yes`/non-TTY, copy-default, `$GRUGOPS_HOME` + layout, materialization, the D-07 self-checkout guard, the D-06 uninstall scope) with no fabricated or deferred-feature claims.**

## Performance

- **Duration:** ~10m
- **Tasks:** 2 (both `type="auto"`, committed individually)
- **Files modified:** 2 (`install/uninstall.sh`, `install/README.md`)

## Accomplishments

- **Task 1 — Two-root uninstall (D-06):** Extended `is_protected()` to add `"$TARGET"/.grugops/*|"$TARGET"/.grugops` to the protected set, so seeded `.grugops/factory.config.json` (user state once seeded) can never be removed. Added `remove_marker()` — a dedicated, explicitly-named helper that removes ONLY `$TARGET/.grugops/install.json` (the single grugops-owned file under the now-protected `.grugops/`), mirroring the existing AGENTS.md "grugops-owned only" shape; it is wired in as run step 7. Updated the file header and the "preserved" footer to name the new behavior. The shared kit at `$GRUGOPS_HOME` is named only in defensive comments — no `rm`/delete code references it.
- **Task 2 — Installer docs:** Rewrote `install/README.md` §2 to document the two-root installer behavior frozen in Plan 03 — `--target` (precedence flag > `TARGET` env > prompt, run from any CWD), the interactive confirm prompt + `--yes`/non-TTY bypass, copy-default with `--symlink`/`INSTALL_MODE=symlink` opt-in, `$GRUGOPS_HOME` + the two-root layout (shared read-only kit vs seeded per-repo state), adapter materialization (resolved absolute kit path), the D-07 self-checkout guard + `--allow-self`, and the D-06 uninstall scope. Preserved the SAFE-02 mechanical-guard / `autonomy=pr` fallback notes (§5) and the `DRY_RUN=1` docs; kept plugin commands as `UNKNOWN - verify`.
- **All gates GREEN:** `install.two-root.test.sh` now passes all 18 checks (incl. [11]'s 4 sub-assertions); `install.test.sh` and `scripts/check-kit-refs.sh` remain GREEN (no regression).

## Task Commits

1. **Task 1: two-root uninstall removes only the install.json marker (D-06)** — `42a2f1b` (feat)
2. **Task 2: document the two-root installer in install/README.md** — `060d52e` (docs)

**Plan metadata:** committed separately.

## Files Created/Modified

- `install/uninstall.sh` — `is_protected()` extended with `.grugops/`; new `remove_marker()` narrow exception; run step 7 wires it; header + footer updated. (+47/-3 over the prior version.)
- `install/README.md` — §2 rewritten for the two-root installer surface; §5 SAFE-02 and `DRY_RUN` docs preserved. (+91/-28.)

## Decisions Made

- **Marker removed via a dedicated `remove_marker()`, not an `is_protected` carve-out.** Because `.grugops/` is now broadly protected, routing the marker through the generic `remove_file` would (correctly) refuse it. Rather than poke a single-file hole in the protection denylist, the marker is removed by a dedicated function that names the exact file — keeping the protection guard clean and the one grugops-owned exception explicit (the same pattern the AGENTS.md grugops-owned removal uses).
- **`.grugops/` is never `rmdir`'d on uninstall.** The seeded `factory.config.json` keeps it populated; and even an empty `.grugops/` is the user's state dir, not grugops' to remove.
- **No fabrication in the docs.** The Phase-9 `--check` doctor and the deferred `--purge-kit` flag are NOT documented as available (asserted by `! grep --check` / `! grep purge-kit`). Removing the shared kit is documented as a manual `rm -rf ~/.grugops`.

## Deviations from Plan

None — both tasks executed exactly as written. No Rule 1–4 deviations were needed.

## Threat Mitigations Applied

- **T-08-04-01 (Tampering — uninstall deleting the shared kit):** mitigated. `uninstall.sh` carries no `rm`/delete of `$GRUGOPS_HOME`/`KIT_ROOT`; the dangerous-pattern gate `! grep -qE 'rm.*GRUGOPS_HOME|rm.*KIT_ROOT|rm -rf.*\$GRUGOPS_HOME|rm -rf.*\.grugops/factory'` passes. Defensive comments naming the kit root are present (permitted by W-4).
- **T-08-04-02 (Tampering — destroying seeded user content):** mitigated. `is_protected()` now guards `.grugops/` plus the existing `plans/`/`agent-factory/`/etc denylist; only `.grugops/install.json` is removed, via the narrow named exception.
- **T-08-04-03 (Information Disclosure — docs claiming unshipped features):** mitigated. README documents only shipped flags; `--check`/`--purge-kit` are absent.
- **T-08-04-04 (EoP — touching the prod-deploy approval env var):** accepted/held. No uninstall path reads/writes/seeds the deploy-approval env var.
- **T-08-04-SC (package-manager installs):** not applicable. POSIX sh + markdown only; no installs.

## Verification

- `sh -n install/uninstall.sh` → parses cleanly.
- `sh install/install.two-root.test.sh` → ALL CHECKS PASSED (18/18, incl. [11]: kit + seeded config survive, marker + adapters removed).
- `sh install/install.test.sh` → exit 0 (frozen harness, no regression — `.grugops/` protection does not break its survival checks).
- `sh scripts/check-kit-refs.sh` → exit 0.
- DRY_RUN spot-check: `DRY_RUN=1 ... uninstall.sh` reports `would-remove .grugops/install.json` and leaves the marker on disk.
- Docs cross-check: every documented flag (`--target`, `--yes`, `--allow-self`, `--symlink`) exists in `install.sh`; SAFE-02 (8 hits) and `DRY_RUN=1` (3 hits) docs preserved; plugin commands stay `UNKNOWN - verify` (3 hits).

## Requirements Verified

- **INSTALL-03** (`--target` + prompt + `--yes`/non-TTY, runs from any CWD): the install-side behavior was verified GREEN in Plan 03; this plan adds the matching `--target`-aware uninstall and documents the full surface. No regression.
- **INSTALL-04** (seed per-repo state without clobbering, copy-default, idempotent/additive/`DRY_RUN`/reversible, sh/Node byte-parity): the **reversible** facet is now fully closed end-to-end — `uninstall.sh` cleanly reverses the grugops-owned wiring + marker in the target while preserving the shared kit and seeded state (two-root harness [11] GREEN). README documents the contract.

## Next Phase Readiness

- **Phase 9 (doctor + two-root validator):** the install/uninstall round-trip is now complete and documented. The `--check` doctor and the split-aware `install.test.sh` rewrite (VAL-02) remain Phase-9 work, deliberately NOT pulled forward or documented here. The marker's `kitRoot` field (written by Plan 03) is the stable ref the doctor↔marker cross-check will key off.

## Self-Check: PASSED

- Files: `08-04-SUMMARY.md`, `install/uninstall.sh`, `install/README.md` all present.
- Commits: `42a2f1b`, `060d52e` to be confirmed in git history below.

---
*Phase: 08-two-root-installer*
*Completed: 2026-06-07*

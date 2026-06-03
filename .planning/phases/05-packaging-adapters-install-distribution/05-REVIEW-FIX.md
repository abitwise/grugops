---
phase: 05-packaging-adapters-install-distribution
fixed_at: 2026-06-03T00:00:00Z
review_path: .planning/phases/05-packaging-adapters-install-distribution/05-REVIEW.md
iteration: 1
findings_in_scope: 7
fixed: 7
skipped: 0
status: all_fixed
---

# Phase 05: Code Review Fix Report

**Fixed at:** 2026-06-03
**Source review:** .planning/phases/05-packaging-adapters-install-distribution/05-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 7 (CR-01, WR-01..WR-06)
- Fixed: 7
- Skipped: 0

All fixes verified with the project's own gates: `sh hooks/guard.test.sh` (26 checks, all PASS)
and `sh install/install.test.sh` (13 checks, all PASS). Every fix was committed with normal git
(commit hooks ran; no `--no-verify`). The Info-tier findings (IN-01..IN-04) were out of the
`critical_warning` scope and were not addressed; several are already mitigated as a side effect
(IN-01's yarn/pnpm publish are now covered; IN-04's README caveat is now moot because install.sh
behaves identically to install.mjs).

## Fixed Issues

### CR-01: `uninstall.sh` deletes a user-owned `AGENTS.md` symlink (data loss, contract violation)

**Files modified:** `install/uninstall.sh`, `install/install.test.sh`
**Commit:** 4373225
**Applied fix:** Gated the symlink-removal branch on the resolved target. A symlink at
`$TARGET/AGENTS.md` is now removed ONLY if `cmp -s` shows it resolves to the grugops source
`AGENTS.md` (mirroring the byte-identical-copy branch). A user's own symlink (e.g.
`AGENTS.md -> docs/agents.md`) fails the compare and is left untouched with a `skipped` report.
Reproduced the original data-loss bug first (a `AGENTS.md -> my-real-agents.md` fixture was
deleted), then confirmed the fix preserves it while still removing a genuine grugops symlink.
Added a regression Check 5 to `install.test.sh` asserting both directions (user symlink survives;
grugops-source symlink is removed).

### WR-01 / WR-02: Deploy-guard coverage gaps and gcloud/aws false positives

**Files modified:** `hooks/guard.mjs`, `hooks/guard.test.sh`
**Commit:** b18232d
**Applied fix:** Extended the default `DEPLOY` pattern set and tightened the over-greedy patterns
in one coherent change (both edit the same regex array):
- Added coverage (WR-01): `kubectl delete`, `aws deploy` (CodeDeploy), `aws s3 sync`,
  `yarn`/`pnpm publish` (folded into the existing `npm publish` as `(npm|yarn|pnpm)`), and
  protected-branch git pushes — force pushes (`--force`/`-f`/`--force-with-lease`) and pushes that
  name `main`/`master`/`release/*`. These fail CLOSED on ambiguity per the project's hard
  constraint.
- Tightened false positives (WR-02): replaced `\bgcloud\b[\s\S]*\bdeploy\b` with
  `\bgcloud\s+\w+\s+deploy\b` (verb-anchored) and `\baws\b[\s\S]*\bdeploy\b` with `\baws\s+deploy\b`,
  so benign commands that merely mention "deploy" in a path or comment
  (`cat ./deploy/notes.txt`, `gcloud config list # see deploy docs`) are no longer denied.
- Env-var indirection (`K=kubectl; $K apply`) documented as out of scope in a clear-voice comment,
  pointing to `autonomy=pr` as the real backstop.
The original inline-self-approve refusal and fail-closed behavior are untouched and still pass.
Added 13 new guard test cases (newly-covered deploys must deny; benign mentions must allow);
all 26 guard checks pass.

**Note:** This change is partly logic-bearing (regex coverage / anchoring). The new patterns were
validated against an explicit allow/deny expectation table before editing, and every case is now
proven by `guard.test.sh`. No manual logic re-verification is required beyond the committed tests.

### WR-03 / WR-04: Installer parity (pre-existing settings.json + tool detection)

**Files modified:** `install/install.sh`, `install/install.test.sh`
**Commit:** de45a15
**Applied fix:**
- WR-03: `merge_gemini` now delegates the JSON merge to Node when the file already exists without
  the key (same Node-delegation pattern `uninstall.sh`'s `unmerge_gemini` uses), running the exact
  logic `install.mjs` uses and producing a byte-identical result. Only when Node is unavailable
  does it keep the safe `verify` deferral (pure sh must never blind-edit JSON). Confirmed both
  installers produce an identical merged `settings.json` for a `{ "theme": "dark" }` fixture,
  identical idempotent re-run, identical DRY_RUN message, and a clean install→uninstall round-trip
  that preserves the user's `theme` key.
- WR-04: `detect_tools` is now target-local only — dropped the `|| command -v claude` and
  `|| [ -f "$HOME/.codex/AGENTS.md" ]` global fallbacks whose POSIX precedence (`(dir || global)
  && append`) made any target with the `claude` binary on PATH report claude. Output now matches
  `install.mjs`'s `detectTools()` line-for-line.
Added Check 4b to `install.test.sh` (pre-existing settings.json → sh tree == mjs tree, and the
user key is preserved while AGENTS.md is merged).

### WR-05: Copilot pointer block shared the CLAUDE.md sentinel

**Files modified:** `install/install.sh`, `install/install.mjs`, `install/uninstall.sh`,
`install/install.test.sh`
**Commit:** b7f3759
**Applied fix:** Gave the Copilot block its own distinct sentinel
(`<!-- GSD:grugops-copilot-start-here -->` / `...-end -->`) in both installers, and updated
`uninstall.sh` to define and use `COPILOT_OPEN`/`COPILOT_CLOSE` (it previously stripped the Copilot
block using the CLAUDE.md sentinels, working only by coincidence). Confirmed both installers emit
the identical new Copilot file. Added Check 6 to `install.test.sh`: a pre-seeded user
`.github/copilot-instructions.md` round-trips correctly — the block is added with its own sentinel
(no CLAUDE.md collision) and uninstall removes it by that distinct sentinel while preserving the
user's own content.

### WR-06: Bash-matcher-only guard limitation undocumented

**Files modified:** `agent-factory/packaging/adapters.md`, `install/README.md`
**Commit:** abe1000
**Applied fix:** Documentation-only (no code change required, per the finding). Added an honest,
clear-voice "Known limitation" note to both the SAFE-02 section of `install/README.md` §5 and the
mechanical-guard section of `adapters.md`: the guard's matcher is `"Bash"`, so it only sees
commands that transit the Bash tool; a deploy written via `Write`/`Edit` and triggered through a
non-Bash mechanism, or trivial shell variable indirection, is outside its view. Both notes state
plainly that the tool-independent backstop on every tool is the `autonomy=pr` posture and that the
Bash guard is defense-in-depth, not a complete sandbox. Voice discipline respected (no caveman
voice in the safety text).

---

_Fixed: 2026-06-03_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_

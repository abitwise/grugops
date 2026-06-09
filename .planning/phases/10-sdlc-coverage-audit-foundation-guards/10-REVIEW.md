---
phase: 10-sdlc-coverage-audit-foundation-guards
reviewed: 2026-06-09T00:00:00Z
depth: standard
files_reviewed: 9
files_reviewed_list:
  - agent-factory/config/factory.config.json
  - agent-factory/config/factory.config.md
  - agent-factory/packaging/adapters.md
  - agent-factory/seed/.grugops/factory.config.json
  - agent-factory/workflows/05-pr-quality-gate.md
  - scripts/check-foundation-guards.sh
  - scripts/check-foundation-guards.test.sh
  - scripts/validate-agent-factory.mjs
  - scripts/validate.test.sh
findings:
  critical: 2
  warning: 2
  info: 1
  total: 5
status: issues_found
---

# Phase 10: Code Review Report

**Reviewed:** 2026-06-09T00:00:00Z
**Depth:** standard
**Files Reviewed:** 9
**Status:** issues_found

## Summary

Nine files reviewed: two config JSON files plus their reference document, the adapters pointer map, the PR quality-gate workflow, the main foundation-guard aggregator, its test harness, the structure validator, and the validator test harness.

The config JSON files, their reference document, and the adapters map are clean. The `05-pr-quality-gate.md` workflow is well-formed and section-complete.

The critical bugs are both in `scripts/check-foundation-guards.sh`. Two guards exhibit divergent failure modes when their input files are absent: `guard_agents_bytes` and `guard_adapter_size` emit a spurious PASS (vacuous green), and `guard_voice` hard-aborts via `set -eu` instead of reporting a structured FAIL. The vacuous-PASS pattern is the more dangerous of the two because it looks correct in CI but silently skips the check entirely.

The two warnings are unenforced safety invariants: the `production_requires_human_confirmation` field is documented as a hard requirement that "Must stay `true`" but neither the foundation guards nor the validator verify this, and the `validate.test.sh` parity-check failure message blames "resolution drift" when the root cause is a silently-swallowed install failure — a misleading diagnostic.

---

## Critical Issues

### CR-01: `guard_agents_bytes` silently PASSes when `AGENTS.md` is absent

**File:** `scripts/check-foundation-guards.sh:107-112`

**Issue:** `guard_agents_bytes` runs `b=$(wc -c < AGENTS.md | tr -d ' ')`. On macOS `sh` (bash 3.2 POSIX mode), a missing file causes `wc -c` to print an empty string rather than aborting under `set -eu` (the redirection failure does not propagate a non-zero exit out of the command substitution on this platform). `b` becomes the empty string `""`. Both numeric comparisons `[ "$b" -ge "$AGENTS_FAIL" ]` and `[ "$b" -ge "$AGENTS_WARN" ]` then print a `[: : integer expression expected` warning to stderr and evaluate as false, so the function falls through to `pass "AGENTS.md ... under budget"`. A deleted or newly-missing `AGENTS.md` produces a green result and no finding. Verified by:

```sh
$ cd /tmp && sh -c 'set -eu
  AGENTS_WARN=20480; AGENTS_FAIL=28672
  b=$(wc -c < AGENTS.md | tr -d " ")
  if   [ "$b" -ge "$AGENTS_FAIL" ]; then echo FAIL
  elif [ "$b" -ge "$AGENTS_WARN" ]; then echo WARN
  else echo PASS; fi'
# prints: PASS (with a stderr integer-expression warning)
```

**Fix:** Add an explicit existence check before the byte count, and call `fail` on a missing file:

```sh
guard_agents_bytes() {
  printf '\n[guard_agents_bytes] AGENTS.md byte budget (Codex cap 32768B)\n'
  if [ ! -f AGENTS.md ]; then
    fail "AGENTS.md missing (required for Codex cap check)"
    return
  fi
  b=$(wc -c < AGENTS.md | tr -d ' ')
  if   [ "$b" -ge "$AGENTS_FAIL" ]; then fail "AGENTS.md ${b}B >= ${AGENTS_FAIL}B (Codex cap 32768B)"
  elif [ "$b" -ge "$AGENTS_WARN" ]; then warn "AGENTS.md ${b}B >= ${AGENTS_WARN}B — approaching cap"
  else pass "AGENTS.md ${b}B under budget"; fi
}
```

The same fix applies to `guard_adapter_size`: add `[ ! -f "$f" ] && { fail "$f missing (adapter required)"; continue; }` at the top of its loop body before the `wc -c` call.

---

### CR-02: `guard_voice` hard-aborts via `set -eu` when a voice file is absent

**File:** `scripts/check-foundation-guards.sh:160-167`

**Issue:** Inside `guard_voice`, the loop body contains:

```sh
body=$(awk '...' "$f")
```

When `$f` does not exist, `awk` exits with a non-zero code. Under `set -eu`, a non-zero exit inside a command substitution aborts the entire shell script rather than continuing to the next loop iteration or calling `fail`. The script exits with `awk`'s error on stderr (`awk: can't open file ...`) instead of through the guarded `exit 1` path. Verified by:

```sh
$ sh -c 'set -eu; body=$(awk "{print}" /nonexistent 2>&1)' ; echo "exit: $?"
# prints awk's error and exits with code 2 — not 0, not via the controlled exit 1
```

This means: (a) the FAILS counter is not incremented, so CI sees a non-zero exit without a `N CHECK(S) FAILED` summary line; (b) the `guard_wr05` and `guard_agents_bytes` results already printed are orphaned without the final `== Result ==` section; (c) parsing the CI log for the structured finding fails because the error message is `awk`'s, not the script's.

**Fix:** Guard each awk invocation with a file-existence check that calls `fail` and `continue` instead of letting `awk` abort:

```sh
  for f in $VOICE_FILES; do
    if [ ! -f "$f" ]; then
      fail "voice: required file missing: $f"
      continue
    fi
    body=$(awk '...' "$f")
    ...
  done
```

---

## Warnings

### WR-01: `production_requires_human_confirmation=true` is documented as immutable but never mechanically enforced

**File:** `scripts/validate-agent-factory.mjs` (entire file); `scripts/check-foundation-guards.sh` (entire file)

**Issue:** `agent-factory/config/factory.config.md:28` states: "`production_requires_human_confirmation` | boolean | `true` | **Must stay `true`**: agents never deploy to production alone; a named human always confirms." This is the only field in the entire schema declared with a hardcoded safety floor (analogous to the TINT-03 carve-out on `test_integrity`). Neither `validate-agent-factory.mjs` (which enum-checks all 8 v1.2 dial keys but ignores this field entirely) nor `check-foundation-guards.sh` (which has no check for config values) enforces this invariant. A user who edits their `.grugops/factory.config.json` to `"production_requires_human_confirmation": false` will receive green CI and no validator error — the safety floor exists only in prose.

**Fix:** Add a check in `checkConfig()` in `validate-agent-factory.mjs`, mirroring the TINT-03 pattern:

```js
// Safety invariant: production_requires_human_confirmation must be true (or absent = true default).
// This field has NO false value in any mode — the mechanical form of the no-agent-deploy rule.
if ("production_requires_human_confirmation" in cfg && cfg.production_requires_human_confirmation !== true) {
  err(`${rel}: "production_requires_human_confirmation" must be true (agents never deploy to production alone)`);
}
```

---

### WR-02: Parity-check failure in `validate.test.sh` reports "resolution drift" when the real cause is a silenced install failure

**File:** `scripts/validate.test.sh:196-233`

**Issue:** The three-way resolution parity check (section `f`) runs the installer with `|| true` on line 197, silently swallowing any install failure. If the install fails, `_sh_kit` and `_mj_kit` are empty strings (grep for `kit:` finds no output), which fails the `[ -n "$_sh_kit" ]` guard and produces the failure message:

```
resolution drift: sh-doctor= node-doctor= validator-kit-dir=/.../parity-home/agent-factory (validator rc=…)
```

This looks like a path disagreement between tools, but the real cause is that the install never ran. A developer debugging this CI failure would look for a validator or doctor discrepancy rather than examining the installer. The `|| true` is intentional (prevent `set -eu` abort on a partially-set-up CI environment), but the failure path produces a misleading diagnostic.

**Fix:** Surface the install failure separately before the kit-path comparison:

```sh
install_out=$(INSTALL_MODE=copy GRUGOPS_SRC="$REPO_ROOT" GRUGOPS_HOME="$PARITY_H" TARGET="$PARITY_T" \
  sh "$REPO_ROOT/install/install.sh" --yes 2>&1) && install_rc=0 || install_rc=$?
if [ "$install_rc" -ne 0 ]; then
  fail "parity: install.sh --yes failed (rc=$install_rc: $install_out)"
else
  # ... proceed with _sh_kit / _mj_kit / _val_kit_dir checks
fi
```

---

## Info

### IN-01: `guard_voice` awk strips ALL content after unfenced `## Caveman prompt`

**File:** `scripts/check-foundation-guards.sh:162-167`

**Issue:** The awk script sets `skip=1` when it encounters `^## Caveman prompt` and only resets `skip=0` after it counts two `` ``` `` fence markers. If a voice file has a `## Caveman prompt` section that lacks the expected fenced code block (e.g. due to a future format change), `skip` remains `1` for the rest of the file, silently stripping every section below the heading including the clear-voice content that should be scanned. The guard would emit PASS while scanning no clear-voice text at all — a false negative.

The three current role files are correctly fenced (confirmed), so this is latent rather than active. The risk is that a future role edit that reformats the caveman block causes the guard to go blind without warning.

**Fix:** After the loop, check that `skip` returned to 0 (i.e. the fence was actually closed). Alternatively, add a `fence_opened` flag that fires a warning if `skip` remains set at end-of-file:

```awk
/^## Caveman prompt/ {skip=1; opened=1}
skip && /^```/        {fence++; if(fence==2){skip=0;fence=0}; next}
skip                  {next}
{print}
END {if(skip){print "UNCLOSED_CAVEMAN_BLOCK" > "/dev/stderr"}}
```

The caller can then treat a non-empty stderr from awk as a structural warning.

---

_Reviewed: 2026-06-09T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_

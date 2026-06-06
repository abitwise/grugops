# Pitfalls Research

**Domain:** Shared-home (`$GRUGOPS_HOME`) + per-repo-state refactor of a previously fully-in-repo markdown agent kit
**Researched:** 2026-06-06
**Confidence:** HIGH (grounded in the actual install contract, the verified blast radius, and the v1.0 dangling-reference bug; external patterns from XDG, asdf, Kubernetes version-skew, and idempotent-migration practice)

> Scope note: these pitfalls are specific to splitting grugops into a shared read-only kit at `$GRUGOPS_HOME` and writable per-repo state. They are NOT generic "installing software is hard" advice. The three the roadmap must treat as gating: **(C1) the dangling-reference reincarnation**, **(C2) migration data-loss**, and **(C3) the false-green two-root validator**. Each maps to a named constraint in `.planning/PROJECT.md` (never overwrite/delete user content; no fabrication; single-source).

---

## Critical Pitfalls

### Pitfall C1: Dangling-reference reincarnation — the agent silently reads the wrong root

**What goes wrong:**
Every kit reference in the shipped artifacts is still a bare repo-relative string. Verified live:
- `AGENTS.md:9` → "read `agent-factory/roles/orchestrator.md`"
- `AGENTS.md:13,21-24` → `agent-factory/config/…`, `agent-factory/roles/`, `agent-factory/workflows/`, `agent-factory/handoffs/`, `agent-factory/checklists/`
- `.claude/skills/grugops/SKILL.md` → "read `agent-factory/roles/orchestrator.md`, then `agent-factory/config/factory.config.json`… role-switch protocol (`agent-factory/roles/_role-switch-protocol.md`)… `agent-factory/workflows/`"
- `orchestrator.md:26-68` → ~9 bare `agent-factory/…` reads
- `install.sh:49` + the CLAUDE.md pointer body → literal `agent-factory/roles/orchestrator.md`

Under the new design the target repo has **no** `agent-factory/`. The LLM, told to "read `agent-factory/roles/orchestrator.md`", does not error like a compiler — it *improvises*: globs for the nearest `agent-factory/`, reads a stale in-repo copy if one survives migration, hallucinates the file's contents, or wanders into `~/.grugops` by luck on some runs and not others. This is the exact v1.0 failure (`docs/design/shared-install.md` §Problem item 3: "the adapters dangle → Claude hunts in the clone"), reincarnated one layer up: the bug moves from the installer into the prose the agent obeys.

**Why it happens:**
A path rewrite across 31 files (~55 kit refs + 50 handoff refs + 32 config refs) is mechanical and boring, so it gets done with find/replace and a couple get missed — and a missed ref doesn't fail loudly, it degrades silently because the consumer is a probabilistic agent, not a parser. Worse: the *design itself* never states the agent-side resolution rule. `$GRUGOPS_HOME` is an env var the shell expands; an LLM reading a markdown file does not run a shell. If role text literally contains `$GRUGOPS_HOME/agent-factory/roles/…`, the agent must be *told, in prose it reads first,* how to turn that token into a real absolute path — otherwise it guesses.

**How to avoid:**
1. **Define the agent-side resolution rule once, in `AGENTS.md` and the orchestrator preamble, in plain prose** (not just an env var). e.g.: "The kit lives at `$GRUGOPS_HOME` (default `~/.grugops`). Before reading any `$GRUGOPS_HOME/…` path, resolve it via the Bash tool — `printf '%s' \"${GRUGOPS_HOME:-$HOME/.grugops}\"` — and state the resolved absolute path before your first kit read. If the resolved kit dir does not exist, STOP — do not hunt." This makes resolution an explicit, verifiable first step, mirroring XDG's `${VAR:-$HOME/.default}` convention and the orchestrator's existing "When uncertain: Stop" discipline (`AGENTS.md:122`).
2. **Pick ONE token spelling and grep the whole tree to zero un-rewritten bare refs** as a build gate. The acceptance test: `grep -rn 'agent-factory/' <shipped artifacts>` returns only intended `$GRUGOPS_HOME/agent-factory/` (or `${GRUGOPS_HOME}`) kit refs and `plans/handoffs/` writes — never a bare `agent-factory/`.
3. **The `--check` doctor (already in the design) must resolve and stat every path the artifacts reference** — kit paths under the resolved `$GRUGOPS_HOME`, state paths in the repo. This is the mechanical net the design calls "the guard that would have caught all three pains" (`shared-install.md` §Installer changes).

**Warning signs:**
- `grep -rn 'agent-factory/'` over the shipped kit/adapters returns any bare ref (no `$GRUGOPS_HOME` / `${GRUGOPS_HOME}` prefix and not a `plans/handoffs/` write).
- The agent transcript says "I'll look for the orchestrator role" / "searching for agent-factory" instead of stating a single resolved absolute path up front.
- Behavior differs run-to-run for the same repo (the signature of silent guessing).

**Phase to address:** The path-rewrite phase (owns token spelling + resolution-rule prose) AND the installer/doctor phase (owns `--check`). Both must land before any dogfood — dogfood is how this bug surfaced the first time.

---

### Pitfall C2: Migration deletes or strands user state on upgrade (violates never-delete)

**What goes wrong:**
An already-installed repo has an **in-repo `agent-factory/`** that today mixes static kit with user-runtime content — crucially `agent-factory/handoffs/*` (the 50 refs the design moves to `plans/handoffs/`), and possibly a customized in-repo `factory.config.json`. A migration that "moves the kit out to `$GRUGOPS_HOME` and removes the in-repo `agent-factory/`" will, if naive, `rm -rf agent-factory/` and take the user's filled-in handoffs — their actual work product and "the memory" (`PROJECT.md` core value) — with it. This directly violates the hardest constraint in the repo, asserted in five places: `PROJECT.md:89` ("never overwrite or delete user content"), `install.sh:12`, `uninstall.sh:17`, and the test's `CONTRACT VIOLATION` assertions (`install.test.sh:113,118`). A quieter variant: migration moves the static kit out but *leaves* the user's filled handoffs under `agent-factory/handoffs/`, while all role text now reads/writes `plans/handoffs/` — the old work is silently **stranded** (not deleted, but orphaned and never read again).

**Why it happens:**
"Clean up the old layout" feels like good hygiene, and `rm -rf` on a directory you "own" feels safe — but `agent-factory/` is exactly the directory the v1.0 installer swore it would *never touch* (`install.sh:12`), so users were told their content there is safe. The split now reclassifies *part* of that tree as "kit" (safe to remove) and *part* as "state" (must be preserved) — and a directory-level operation can't tell them apart. The existing `is_protected()` guard (`uninstall.sh:54`) denylists the entire `agent-factory/` tree; a migration that must remove the kit subtree but keep `agent-factory/handoffs/` has to be *more* surgical than any code that exists today.

**How to avoid:**
1. **Migration is additive-then-relocate, never delete-first.** Order: (a) copy/seed the kit into `$GRUGOPS_HOME`; (b) **move** user-writable content (`agent-factory/handoffs/*` → `plans/handoffs/`, in-repo `factory.config.json` → its new per-repo home) preserving it; (c) only *after* (a)+(b) verify, optionally rename the now-kit-only `agent-factory/` to `agent-factory.grugops-bak/` and tell the user — **never delete it in the same run**. Apply the DDL migration rule: migrations ADD and COPY; humans DELETE. ("Idempotent scripts generally do not cause destructive side effects.")
2. **Detect the old layout with a marker, refuse to guess.** Check a marker (e.g. in-repo `agent-factory/VERSION` + presence of `agent-factory/handoffs/`) before acting. If the layout is ambiguous (partially migrated, unknown version), STOP and print what was found — do not "best-effort" migrate. ("The simplest approach is to check for a marker file before running one-time initialization.")
3. **Preserve the reversibility + DRY_RUN contract.** Migration honors `DRY_RUN=1` (print the move plan, change nothing) and is re-runnable to a no-op once migrated. Reuse the `is_protected()` philosophy: anything under `plans/`, `memory-bank/`, `.planning/`, `docs/`, `src/` is off-limits; migration *only* relocates the two known user-content paths inside `agent-factory/` and never recurses destructively.
4. **Add a test mirroring `install.test.sh` Check 3:** seed a fixture with a filled `agent-factory/handoffs/foo-handoff.md` containing a known sentinel, run migration, assert the sentinel now exists under `plans/handoffs/` AND no user file was deleted. A `CONTRACT VIOLATION` fail string (like the existing harness) makes the data-loss case un-ignorable.

**Warning signs:**
- Any `rm -rf`, `rm -r`, or recursive delete touching `agent-factory/` in the migration path.
- Post-migration `plans/handoffs/` is empty but the user had filled handoffs before (stranding).
- The migration script has no `DRY_RUN` branch, or running it twice is not a no-op.
- No fixture test asserts a filled handoff survives the move.

**Phase to address:** The migration phase. Gating — ship no migration without the survival test. Recovery cost if shipped wrong is HIGH (lost user work product, the thing the whole tool exists to preserve).

---

### Pitfall C3: The two-root validator/self-test gives a false green

**What goes wrong:**
`scripts/validate-agent-factory.mjs` today "assumes a single in-repo tree" (`shared-install.md` §Validator). Split into two roots, the obvious-but-wrong fixes each produce a confident PASS on a broken install:
- **Validates the source checkout, not the installed reality.** Run inside the grugops repo (which still has a full `agent-factory/`), the validator finds everything and prints green — while a *target* repo with dangling refs and no resolved `$GRUGOPS_HOME` is actually broken. The validator proved the wrong tree.
- **Defaults `$GRUGOPS_HOME` to the repo it's run from.** If resolution falls back to "look in `.`" when the env var is unset, the validator (and the agent) "find" the kit in the dev checkout and pass — masking exactly the C1 unset-var failure in CI.
- **Cross-root refs unchecked.** A role under `$GRUGOPS_HOME` references `plans/handoffs/x` (a repo path) — the validator must know which refs are kit-relative vs repo-relative and check each against the correct root. A single-root validator checks both against one root and either false-passes or false-fails.

This violates the no-fabrication constraint operationally: a green that doesn't reflect a working install is a fabricated pass (`PROJECT.md:90`, VAL-01's "never fabricates a pass"). The v1.0 validator earned trust precisely via a GOOD/BAD fixture self-test proving both paths; the two-root version must do the same or it silently regresses the kit's central proof.

**Why it happens:**
The validator author runs it in the grugops dev repo where both roots happen to collapse into one tree, so every test is green and looks done — the split is invisible until someone runs it against a real target with a real separate `$GRUGOPS_HOME`. "Looks done but isn't": the self-test only exercises the happy single-tree case.

**How to avoid:**
1. **Two explicit roots, no silent fallback to `.`.** Take a kit root (resolve `$GRUGOPS_HOME` with the SAME `${GRUGOPS_HOME:-$HOME/.grugops}` rule the agent uses, or an explicit `VALIDATE_KIT_ROOT`) and a repo root, separately. If the kit root is unset AND undefaultable, FAIL with the missing path — never fall back to the cwd (that is the false-green trap).
2. **Classify every ref by root.** The validator needs a table: kit-relative tokens (`$GRUGOPS_HOME/agent-factory/{roles,workflows,checklists,packaging}`, templates, VERSION) vs repo-relative (`plans/…`, `plans/handoffs/…`, the repo `factory.config.json`, `memory-bank/…`). Resolve each ref against its declared root; a ref that only resolves against the wrong root is itself a finding.
3. **Extend the GOOD/BAD fixture self-test to the split.** Add fixtures: a BAD one with a kit ref that only resolves against the repo root (the C1 footgun), and a BAD one where `$GRUGOPS_HOME` is unset with no kit present — both MUST fail. Mirror `install.test.sh`'s style: prove the fail path, not just the pass path. Without a BAD-split fixture the self-test cannot prove it catches the split-specific bug.
4. **The doctor (`--check`) and the validator should share the resolution rule** so "doctor passes" and "validator passes" can't disagree about where the kit is.

**Warning signs:**
- Validator passes when run in the grugops checkout but no one has run it against a separate-`$GRUGOPS_HOME` target.
- The self-test has no fixture where `$GRUGOPS_HOME` is unset / the kit is absent.
- Validator and `--check` doctor resolve `$GRUGOPS_HOME` differently.
- A green validator coexists with an agent that can't find a role file (the tell-tale of validating the wrong tree).

**Phase to address:** The validator/test phase, after the path-rewrite token is fixed (the validator must key off the final token spelling). Gating for dogfood sign-off.

---

### Pitfall C4: Single-source erosion — kit text drifts between `$GRUGOPS_HOME` and stale per-repo copies

**What goes wrong:**
The design default is **copy, not symlink** (`shared-install.md`: "Install/update the kit to `$GRUGOPS_HOME` (copy, no symlinks)"). Copy is right for symlink fragility (C5) — but it reintroduces the single-source-of-truth risk the project exists to guard against (`PROJECT.md:86`: "Role text lives once… avoid drift across five tools"). Failure shapes:
- A user edits a role under `~/.grugops/agent-factory/roles/` to tweak behavior; the next `install --update` copies the shipped kit over it (overwrite of user content — also a never-overwrite violation) OR refuses to overwrite and the user silently runs a fork that drifts from upstream forever.
- A repo migrated from v1.0 keeps a stale in-repo `agent-factory/` copy (see C2 stranding); the agent, hunting (C1), reads the stale copy instead of the updated `$GRUGOPS_HOME` kit. Two kits, silently divergent, agent picks the wrong one.
- Multiple `$GRUGOPS_HOME` installs exist (dev, CI, a container image baked at a different time) and "the kit" means different text on each.

**Why it happens:**
Copy trades freshness for robustness; nobody notices drift until behavior differs and there's no version stamp to compare. The kit was *born* single-tree (one `agent-factory/` per repo, edited in place), so "edit the role file" was always safe; the shared copy turns an in-place edit into a fork.

**How to avoid:**
1. **One canonical source; `$GRUGOPS_HOME` is a derived cache, never the source of truth.** Treat `~/.grugops/agent-factory/` like a package cache: replaceable, stamped, not hand-edited. Document this loudly ("do not edit files under `$GRUGOPS_HOME`; they are overwritten on update").
2. **Stamp the install with `VERSION` + provenance.** `$GRUGOPS_HOME/agent-factory/VERSION` already exists in the kit (`0.1.0`); on install, also record where it came from. The doctor/validator can then report "kit at `$GRUGOPS_HOME` is 0.1.0" (feeds C6).
3. **Update must refuse to clobber a hand-modified kit, and SAY so.** If a file under `$GRUGOPS_HOME` differs from the shipped bytes (`cmp` — the same byte-identity test `install.sh:119`/`uninstall.sh:239` already use for AGENTS.md), do not overwrite silently — report `verify: $GRUGOPS_HOME/…/role.md was modified locally; not overwritten` so the user chooses. This preserves never-overwrite without silently freezing them on a fork.
4. **Migration must eliminate the stale in-repo copy as a *read source*** — once relocated, the C1 resolution rule points only at `$GRUGOPS_HOME`, and the backup is renamed out of the `agent-factory/` glob path so the agent can never hunt-and-read it.

**Warning signs:**
- Two `agent-factory/roles/orchestrator.md` files exist on disk with different bytes.
- `install --update` either overwrote a file the user changed, or left a years-old kit because it "didn't want to overwrite."
- No VERSION/provenance stamp at `$GRUGOPS_HOME`; "which kit am I running" is unanswerable.

**Phase to address:** Installer/update phase (stamp + no-clobber-with-report) and migration phase (kill the stale copy as a read source). Single-source is a named constraint, so high priority.

---

## Technical Debt Patterns

Shortcuts that look reasonable for this refactor but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Leave kit refs as bare `agent-factory/…` and "rely on cwd" | Zero rewrite of 31 files | Reincarnates the v1.0 dangling bug (C1); agent guesses; behavior non-deterministic | **Never** — this is the exact bug being fixed |
| Default `$GRUGOPS_HOME` resolution to "look in `.` if unset" | Works in the dev checkout with no env var | Masks the unset-var failure in CI/containers; false-green validator (C3); silent wrong-root reads (C1, C5) | **Never** — fall back to `$HOME/.grugops` and FAIL loud if even that is absent |
| Migration does `rm -rf agent-factory/` after relocating the kit | Clean tree, no leftover backup dir | Deletes user handoffs if relocation missed any (C2); irreversible; violates never-delete | **Never** — rename to a backup, let the human delete |
| Validate the source checkout and call it "validated" | Always green; easy CI | Proves the wrong tree; real targets stay broken (C3) | Only as an *additional* check, never the only one |
| Symlink the kit into the target (the v1.0 default `INSTALL_MODE=symlink`) | Near-zero footprint; auto-fresh kit | The exact dogfood pain — breaks if the clone moves/deletes (C5); the user "disliked symlinks" (`shared-install.md`) | **Never as default** for the kit; copy is the chosen design |
| Skip `DRY_RUN` support on the new migration path | Less code | Loses the install contract's preview guarantee; users can't see the move plan before it runs | **Never** — the contract is repo-wide (`install.sh:9`) |
| Ship the rewrite without a `grep`-for-bare-refs build gate | Faster to "done" | One missed ref out of 137 dangles silently in production | **Never** — the count is too high for eyeballs |

---

## Integration Gotchas

`$HOME` / `$GRUGOPS_HOME` resolution across the environments grugops actually runs in. Each row is a concrete way the kit root resolves wrong and the agent reads nothing (or the wrong thing).

| Environment | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| **CI runners** | Assume `$HOME` is set; it often isn't, or points at a scratch dir wiped between steps; `~/.grugops` never got installed | Resolve `${GRUGOPS_HOME:-$HOME/.grugops}`; if the dir doesn't exist, the doctor FAILS with the path. Document setting `GRUGOPS_HOME` explicitly in CI, or installing the kit as a CI step. Never silently fall back to cwd. |
| **Containers** | `$HOME` unset or `/` for an arbitrary UID (OpenShift assigns random UIDs with no `/etc/passwd` home); `~` expands to nothing | Fall back to `getent passwd "$(id -u)"` to find the real home when `$HOME` is unset (the canonical container pattern); else require `GRUGOPS_HOME` and fail loud if neither resolves. Bake the kit into the image at a known `GRUGOPS_HOME` for reproducibility. |
| **`sudo` / privilege change** | `sudo` resets or preserves `$HOME` depending on `env_reset`/`always_set_home`; a kit under the user's `~/.grugops` is invisible to root, or vice versa | Resolve at run time, not install time; never cache an absolute home into the artifacts. Document that the kit must be installed for the same user/home that runs the agent. |
| **Multi-user / shared CI cache** | One `$GRUGOPS_HOME` under a shared home; concurrent installs/updates race; user A's update changes the kit out from under user B mid-run (C6) | Per-user `~/.grugops` default is correct. If a shared kit is forced, treat it strictly read-only and pin the version per repo (C6). |
| **Windows** | `$HOME` is unreliable (`%USERPROFILE%` vs `%HOMEDRIVE%%HOMEPATH%`); symlink creation needs privilege (already why `INSTALL_MODE=copy` exists, D-30); POSIX `install.sh` doesn't run | `install.mjs` (Node) is the Windows path and must resolve home via `os.homedir()`, not `$HOME`. Copy-default (already chosen) sidesteps symlink privilege. Keep sh/mjs parity (existing `install.test.sh` Check 4) extended to home-resolution. |
| **`~` vs `$HOME` in markdown the agent reads** | Writing `~/.grugops` in role prose — the shell expands `~`, but an LLM reading the file does not, and the Read tool may not | Always have the agent resolve via the Bash tool (`printf '%s' "${GRUGOPS_HOME:-$HOME/.grugops}"`) and substitute the absolute result before reading (C1). Never put an unexpanded `~` in a path the agent is told to read directly. |

---

## Performance / Scale Traps

"Scale" here = number of repos sharing one `$GRUGOPS_HOME` and concurrency, not user load.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| **Runtime handoffs leak into the shared kit dir** | Two projects' agents both write `…/handoffs/system-handoff.md`; second clobbers first; cross-project bleed | The design already moves runtime handoffs to **repo-relative `plans/handoffs/`** precisely because they "cannot live in a shared read-only dir, would collide across projects" (`shared-install.md`). The trap is a *missed* rewrite (one of the 50 refs) still writing to `$GRUGOPS_HOME/agent-factory/handoffs/`. Make the kit dir read-only on install so a stray write *fails loudly* instead of silently colliding. | The moment ≥2 repos share one `$GRUGOPS_HOME` and any handoff write wasn't rewritten |
| **Concurrent kit update during an active run** | Repo A's agent is mid-run reading `$GRUGOPS_HOME` role files; repo B runs `install --update` and rewrites them; A reads a half-written / version-skewed kit | Make kit updates atomic (write to a temp dir, then rename into place) so a reader never sees a partial kit. Stamp VERSION so a run can detect the kit changed under it. Per-repo version pin (C6) bounds the blast radius. | Multi-repo workflows / CI fan-out hitting one home |
| **Two installers (sh + mjs) drift on home resolution** | `install.sh` resolves `$GRUGOPS_HOME` one way, `install.mjs` another; Windows vs POSIX users get different kit roots | Extend the existing parity test (`install.test.sh` Check 4/4b) to assert both installers resolve the SAME kit root given the same env. Resolution rule lives once, mirrored exactly (the file already calls itself "the same installer in two languages"). | Cross-platform teams; first Windows user |

---

## Security / Safety Mistakes

Domain-specific to the two-root split and the hard prod-deploy guard.

| Mistake | Risk | Prevention |
|---------|------|------------|
| Migration or installer touches the prod-deploy approval env var while "setting up the environment" | Crosses the hardest safety line: "only a human may approve a deploy" (`install.sh:14,279`) | Carry the explicit prohibition into the migration + doctor code verbatim; never read/write/seed `GRUGOPS_PROD_DEPLOY_APPROVED`. |
| World-writable `$GRUGOPS_HOME` on a multi-user box | Another user edits the kit every project reads → arbitrary instruction injection into every agent run | Install the kit `0755` dirs / `0644` files owned by the installing user; per-user `~/.grugops` default avoids the shared-write surface entirely. |
| Agent "hunts" for a missing kit and reads an attacker-planted `agent-factory/` higher in the tree (C1 consequence) | Untrusted role text executed as the Orchestrator | The C1 resolution rule + "STOP if the resolved kit dir is absent, do not hunt" closes this. Never glob for `agent-factory/` outside the resolved root. |
| Doctor/validator follows symlinks out of the kit/repo and validates attacker content | False-green over a path that escapes both roots | Resolve and assert each path stays under its declared root; do not follow symlinks outside it. |

---

## "Looks Done But Isn't" Checklist

Things that appear complete after this refactor but are missing the split-specific piece. Verify each before dogfood sign-off.

- [ ] **Path rewrite:** `grep -rn 'agent-factory/' <shipped kit + adapters + AGENTS.md + SKILL.md + install scripts>` returns ZERO bare refs — every hit is `$GRUGOPS_HOME/…` (kit) or `plans/handoffs/` (writes). Current count: 31 files / ~55+50+32 refs; one miss dangles.
- [ ] **Agent resolution rule:** `AGENTS.md` and the orchestrator preamble tell the agent, in prose, how to turn `$GRUGOPS_HOME` into an absolute path and to STOP (not hunt) if the kit dir is absent — and the agent transcript shows it stating the resolved path before its first kit read.
- [ ] **Unset `$HOME`/`$GRUGOPS_HOME`:** install + doctor tested with both unset (CI/container shape) — they fall back to `$HOME/.grugops`, then `getent passwd`, then FAIL loud; never to cwd.
- [ ] **Migration survival:** a fixture with a *filled* `agent-factory/handoffs/*` survives migration (now under `plans/handoffs/`) with content intact; nothing under `agent-factory/` deleted (renamed-to-backup at most); `DRY_RUN=1` previews; re-run is a no-op. (Mirror `install.test.sh` Check 3.)
- [ ] **Validator two-root:** self-test includes a BAD fixture where a kit ref only resolves against the repo (C1 footgun) and a BAD fixture where `$GRUGOPS_HOME` is unset/absent — both FAIL. Validator and `--check` doctor resolve `$GRUGOPS_HOME` identically.
- [ ] **No stale read source:** post-migration the agent cannot reach a leftover in-repo `agent-factory/` (renamed out of the glob path); only `$GRUGOPS_HOME` is reachable.
- [ ] **Installer parity:** `install.sh` and `install.mjs` resolve the same kit root and produce the same target tree (extend Check 4/4b to home-resolution).
- [ ] **Reversibility intact:** `uninstall.sh` updated for the two-root layout still restores a fixture to pristine and still refuses every protected path; it does NOT remove the kit at `$GRUGOPS_HOME` for other repos that share it.
- [ ] **Version stamp:** `$GRUGOPS_HOME/agent-factory/VERSION` present; doctor reports kit-version vs repo-expected-version.

---

## Recovery Strategies

When a pitfall ships despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| C1 dangling ref (agent reads wrong root) | MEDIUM | Grep-fix the missed token; ship the resolution-rule prose; re-run doctor `--check`; the doctor's "missing path" output names the exact dangling ref to fix. |
| C2 migration deleted user handoffs | HIGH | Restore from the rename-to-backup dir if migration used it (the whole reason to rename not delete); else from git history / backup. **This is why migration must never delete in the same run** — the backup IS the recovery path. |
| C2 handoffs stranded (orphaned not deleted) | LOW | Re-run a (now-fixed) migration that finds and moves the stranded `agent-factory/handoffs/*`; idempotent move makes this safe. |
| C3 false-green validator | MEDIUM | Add the missing BAD-split fixture; the regression is "validator passed but agent couldn't find a role" — that pairing is the detection signal; fix resolution + re-validate against a real target. |
| C4 kit drift / fork | LOW–MEDIUM | `cmp` `$GRUGOPS_HOME` against shipped bytes to find drifted files; re-install with the no-clobber-report path so the user reconciles their edits intentionally. |
| C6 version skew | LOW | Pin the repo to a kit version; doctor reports the mismatch; user updates the kit or the pin deliberately. |

---

## Additional Pitfalls (Moderate)

### Pitfall C5: Symlink fragility vs copy drift — the two-horned tradeoff

**What goes wrong:** The v1.0 default `INSTALL_MODE=symlink` (`install.sh:40`, D-30) symlinks adapters back into the clone; if the clone moves or is deleted, every symlink dangles and the agent reads nothing — the exact dogfood pain (`shared-install.md` §Problem item 2). The alternative, copy (the new default), avoids dangling but reintroduces drift (C4). You cannot escape both; you choose which failure.

**How to avoid:** The design already chose **copy for the kit** (robust against clone-move) and accepts the drift risk, mitigated by C4's stamp + no-clobber-report. Do NOT symlink the kit from the target into `$GRUGOPS_HOME` (that re-adds dangling-if-moved). Keep the adapter set small so copy footprint stays trivial. If symlinks are ever offered as opt-in (`INSTALL_MODE=symlink`), the doctor must detect a dangling symlink and report it.

**Warning signs:** `find . -type l ! -exec test -e {} \;` finds a dangling link; agent reads empty/old content after the source repo moved.

**Phase to address:** Installer phase (copy-default + dangling-symlink detection in doctor).

### Pitfall C6: Version skew — central kit updated under a repo that expected an older kit

**What goes wrong:** Repo A was bootstrapped against kit `0.1.0` (its `plans/`, filled handoff templates, board format assume `0.1.0`). A later `install --update` bumps `$GRUGOPS_HOME` to a kit with a changed handoff template or board schema. Repo A's existing state no longer matches the kit the agent now reads — silent skew. There is no per-repo record of "which kit version this repo expects," so nothing detects the mismatch. This is the shared-home analogue of the Kubernetes version-skew problem and the asdf local-vs-global pin.

**How to avoid:**
1. **Record the expected kit version per repo** (e.g. a one-line `plans/.grugops-kit-version` or a field in the repo's `factory.config.json`) at install/bootstrap. This is the asdf `.tool-versions`-local model: global kit at `$GRUGOPS_HOME`, expected version pinned per project.
2. **Doctor compares them:** "repo expects kit `0.1.0`; `$GRUGOPS_HOME` is `0.2.0`" → warn (or fail under `mode=enterprise`) with what changed. Express *compatibility windows*, not exact locks ("kit ≥ X, < Y") so patch updates don't trip every repo — "express compatibility, not lock environments."
3. **Since grugops is pre-1.0**, lean on SemVer's `0.y.z` "anything may change" latitude but still surface the mismatch; once ≥1.0 a MAJOR bump should be the loud signal.

**Warning signs:** A repo's filled handoffs/board don't match the templates the agent now reads; no per-repo version pin exists; updating the kit silently changes behavior in unrelated repos.

**Phase to address:** Installer/doctor phase (write the pin + compare). Lower priority than C1–C4 but cheap to add alongside the VERSION stamp (C4).

---

## Pitfall-to-Phase Mapping

Phase names are indicative; the roadmap owns final naming. Ordering rationale: the path-rewrite token must be fixed first (validator, doctor, migration all key off the final spelling), and nothing dogfoods until C1+C2+C3 are closed.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| **C1 dangling-reference reincarnation** (GATING) | Path-rewrite phase + Installer/doctor phase | `grep -rn 'agent-factory/'` → zero bare refs; agent states resolved abs path before first read; `--check` resolves every ref |
| **C2 migration data-loss** (GATING) | Migration phase | Fixture with a filled handoff survives migration with content intact; nothing under `agent-factory/` deleted; `DRY_RUN` previews; re-run is no-op |
| **C3 false-green validator** (GATING) | Validator/test phase (after token fixed) | GOOD/BAD split fixtures both behave; unset-`$GRUGOPS_HOME` fixture FAILS; validator + doctor resolve home identically |
| **C4 single-source erosion** | Installer/update phase + Migration phase | Two divergent `agent-factory/` copies cannot both be read; update reports (never silently clobbers) a locally-modified kit; VERSION + provenance stamped |
| **C5 symlink fragility / copy drift** | Installer phase | Copy is the kit default; doctor detects dangling symlinks; agent reads correct content after clone moves |
| **C6 version skew** | Installer/doctor phase | Per-repo kit-version pin written; doctor reports kit-vs-repo mismatch as a compatibility window |
| Unset `$HOME`/`$GRUGOPS_HOME` (CI/container/sudo/multi-user/Windows) | Installer phase + agent-resolution prose | Both-unset test falls back `$HOME/.grugops` → `getent passwd` → FAIL loud, never cwd; `install.mjs` uses `os.homedir()`; sh/mjs parity extended |
| Prod-deploy safety preserved through migration | Migration + doctor phase | Migration/doctor never read/write the deploy-approval env var (carry `install.sh:14` prohibition forward) |

---

## Sources

- `.planning/PROJECT.md` — the five-place never-overwrite/delete constraint, no-fabrication, single-source, v1.1 milestone goal (HIGH — repo authority)
- `docs/design/shared-install.md` — the kit/state split, copy-not-symlink decision, blast radius (31 files / 55+50+32 refs), the doctor as "the guard that would have caught all three pains," explicitly-rejected vendor-into-repo and symlink-overlay (HIGH — design contract)
- `install/install.sh`, `install/uninstall.sh`, `install/install.test.sh` — the additive/idempotent/DRY_RUN/reversible contract, `is_protected()` denylist, byte-identity `cmp` test, sh/mjs parity checks, the `CONTRACT VIOLATION` assertions (HIGH — current behavioral spec)
- `AGENTS.md:9-24`, `.claude/skills/grugops/SKILL.md`, `agent-factory/roles/orchestrator.md:26-68` — the live bare `agent-factory/…` refs that reincarnate the dangling bug; verified by grep (137 refs across 31 files) (HIGH — measured in this repo)
- [XDG Base Directory Specification — ArchWiki](https://wiki.archlinux.org/title/XDG_Base_Directory) — `${VAR:-$HOME/.default}` fallback + project-first-then-global resolution order (HIGH — the convention `$GRUGOPS_HOME` resolution should follow)
- [Fall back to `getent passwd` when SHELL/HOME is unset — AlmaLinux toolbox commit](https://git.almalinux.org/rpms/toolbox/commit/119592cbc54a0368e8521d9edcdc01cfdf10853d) and [Use `getent passwd` to resolve UID/GID in containers — Linux Bash](https://www.linuxbash.sh/post/use-getent-passwd-to-resolve-uidgid-mappings-in-containers) — the canonical unset-`$HOME` fallback for CI/containers/arbitrary-UID (HIGH)
- [Version Skew Policy — Kubernetes](https://kubernetes.io/releases/version-skew-policy/) and [asdf .tool-versions local-vs-global — DEV](https://dev.to/eedygreen/tool-version-manager-1afe) — the compatibility-window framing + per-project pin model for C6 (MEDIUM — analogous-domain practice)
- [Pinning exact versions breaks downstream consumers — litellm #26154](https://github.com/BerriAI/litellm/issues/26154) — "express compatibility, not lock environments" for C6 windows (MEDIUM)
- [Making content migration idempotent — Sanity](https://www.sanity.io/learn/course/handling-schema-changes-confidently/making-the-content-migration-more-idempotent), [Database migration tips — Jonathan Hall](https://jhall.io/archive/2022/05/12/database-migration-tips-tricks/), [Idempotent Docker entrypoint scripts — OneUptime](https://oneuptime.com/blog/post/2026-02-08-how-to-write-idempotent-docker-entrypoint-scripts/view) — marker-file detection, "ADD/COPY never DROP," convergence/idempotency for C2 (MEDIUM)

---
*Pitfalls research for: grugops v1.1 shared-home + per-repo-state install refactor*
*Researched: 2026-06-06*

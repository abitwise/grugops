# Phase 8: Two-Root Installer - Pattern Map

**Mapped:** 2026-06-07
**Files analyzed:** 13 (11 MODIFY + 1 NEW harness + 1 NEW seed subtree)
**Analogs found:** 13 / 13 (every file's analog is itself, a sibling helper in the same script, or an existing repo skeleton)

> **Phase shape:** This is an *extend-not-rewrite* phase. Almost every analog is **the file itself** (or a helper already inside it). The planner composes existing helpers (`do_run`, `mkdirp`, `ensure_block`, `link_or_copy`, `merge_gemini`, `detect_tools`, the `uninstall.sh` awk strip, the `install.test.sh` `snapshot`/`pass`/`fail`) rather than introducing new abstractions. Do **not** invent a framework; copy the proven primitive and vary it minimally.

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `install/install.sh` (MODIFY) | installer (config) | file-I/O, transform | itself + its own helpers | exact (self) |
| `install/install.mjs` (MODIFY) | installer (config) | file-I/O, transform | itself + `install.sh` (byte-parity twin) | exact (self) |
| `install/uninstall.sh` (MODIFY) | installer (config) | file-I/O, transform | itself (`is_protected`, `remove_file`, awk strip) | exact (self) |
| `scripts/check-kit-refs.sh` (MODIFY) | build-gate (utility) | batch/scan (read-only) | itself (explicit `SCAN`/`GH_SCAN` allowlist) | exact (self) |
| `install/README.md` (MODIFY) | config/doc | n/a (prose) | itself | exact (self) |
| `.claude/agents/grugops-orchestrator.md` (MODIFY) | adapter (provider) | materialization target | itself (carries resolver slot) | exact (self) |
| `.claude/skills/grugops/SKILL.md` (MODIFY) | adapter (provider) | materialization target | itself + `grugops-orchestrator.md` | exact (self) |
| `agent-factory/packaging/subagent.frontmatter.md` (MODIFY) | template (packaging) | n/a (template prose) | itself | exact (self) |
| `agent-factory/packaging/slash-command.template.md` (MODIFY) | template (packaging) | n/a (template prose) | itself + `subagent.frontmatter.md` | exact (self) |
| `agent-factory/README.md` (MODIFY) | config/doc | n/a (prose) | itself | exact (self) |
| `agent-factory/config/factory.config.md` (MODIFY) | config/doc | n/a (prose) | itself | exact (self) |
| `install/install.two-root.test.sh` (NEW) | test (harness) | request-response (assert) | `install/install.test.sh` (do NOT edit it) | exact (sibling) |
| `agent-factory/seed/**` (NEW seed subtree) | seed (state template) | file-I/O (copy source) | repo-root `plans/` + `memory-bank/` + `agent-factory/config/factory.config.json` | role-match |

## Pattern Assignments

### `install/install.sh` (installer, file-I/O + transform) — the behavioral spec

**Analog:** itself. Five net-new steps slot in between arg-parse and the existing adapter laydown. Reuse the existing helpers verbatim; add small new helpers in the same house style.

**Arg/env resolution block to extend** (`install.sh:33-43`) — `--target` layers over `TARGET`; `GRUGOPS_SRC` is the self-checkout anchor; flip `INSTALL_MODE` default:
```sh
SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
GRUGOPS_SRC=${GRUGOPS_SRC:-$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)}
TARGET=${TARGET:-$(pwd)}                 # NOW: --target flag > TARGET env > prompt(default CWD)
DRY_RUN=${DRY_RUN:-0}
INSTALL_MODE=${INSTALL_MODE:-symlink}    # FLIP to: ${INSTALL_MODE:-copy}  (D-05, symlink opt-in)
```
**VARIATION:** add `GRUGOPS_HOME=${GRUGOPS_HOME:-"$HOME/.grugops"}` + `KIT_ROOT="$GRUGOPS_HOME/agent-factory"` here (RESEARCH Pattern 1). Flip the `INSTALL_MODE` default to `copy`. Add `--target`/`--yes`/`--allow-self`/`--force` arg parsing before this block.

**`do_run` DRY_RUN discipline** (`install.sh:66-73`) — EVERY new filesystem mutation (kit copy, materialize, seed, marker write) must route through `do_run` or guard on `[ "$DRY_RUN" = "1" ]` so `DRY_RUN=1` mutates neither root:
```sh
do_run() {
  if [ "$DRY_RUN" = "1" ]; then
    return 0
  fi
  "$@"
}
```

**`report` + `mkdirp` helpers to reuse** (`install.sh:64, 76`):
```sh
report() { printf '  %-14s %s\n' "$1" "$2"; }
mkdirp() { [ -d "$1" ] || do_run mkdir -p -- "$1"; }
```

**Skip-if-exists guard** — copy this for every seeded file (D-04 never-clobber). Source pattern is the AGENTS.md skip-if-present (`install.sh:258-262`):
```sh
if [ -f "$TARGET/AGENTS.md" ]; then
  report skipped "AGENTS.md (target already has one — left untouched)"
else
  link_or_copy "$GRUGOPS_SRC/AGENTS.md" "$TARGET/AGENTS.md" "AGENTS.md"
fi
```
**VARIATION (new `seed_file` helper, RESEARCH Pattern 3 / Code Examples):**
```sh
seed_file() {  # $1=src(under $KIT_ROOT/seed) $2=dest(under $TARGET) $3=label
  if [ -f "$2" ]; then report skipped "$3 (target already has it — D-04)"; return 0; fi
  if [ "$DRY_RUN" = "1" ]; then report would-add "$3"; return 0; fi
  mkdirp "$(dirname -- "$2")"; cp -- "$1" "$2"; report created "$3"
}
```

**`link_or_copy` — REUSE for the 6 dash skills, DO NOT reuse for the 2 materialized adapters** (`install.sh:108-138`). The `cmp -s` "identical copy present → skip" idempotency check (line 119) **breaks** once an adapter carries an injected `KIT=` line:
```sh
  if [ -f "$_dest" ] && cmp -s -- "$_src" "$_dest" 2>/dev/null; then
    report skipped "$_label (identical copy present)"
    return 0
  fi
```
**VARIATION:** the 2 resolver adapters (`grugops-orchestrator.md`, `grugops/SKILL.md`) need their OWN copy-then-inject path (see Shared Pattern: Adapter Materialization). The 6 dash skills (`grugops-map/plan/ticket/gate/uat/release`) keep using `link_or_copy` unchanged — they carry the invariant blockquote only, never the resolver block (VERIFIED: grep shows only the 2 adapters carry `KIT="${GRUGOPS_HOME`).

**Kit copy — new `copy_kit` step** (atomic tmp→rename; kit is grugops-owned read-only so overwrite is not user content, D-05; RESEARCH Code Examples):
```sh
copy_kit() {
  _tmp="$GRUGOPS_HOME/.agent-factory.tmp.$$"
  mkdirp "$GRUGOPS_HOME"
  if [ "$DRY_RUN" = "1" ]; then report would-copy "kit → $KIT_ROOT"; return 0; fi
  rm -rf -- "$_tmp"
  cp -R -- "$GRUGOPS_SRC/agent-factory" "$_tmp"
  rm -rf -- "$KIT_ROOT"
  mv -- "$_tmp" "$KIT_ROOT"
  report copied "kit → $KIT_ROOT"
}
```

**`detect_tools` discipline to preserve** (`install.sh:227-235`) — target-local only, byte-parity with Node. If the planner adds a self-checkout detector, keep it target-local and parity-mirrored:
```sh
detect_tools() {
  _found=""
  [ -d "$TARGET/.claude" ] && _found="$_found claude"
  ...
}
```

**Prod-deploy prohibition to carry verbatim** (`install.sh:14, 279`) — every new code path must NOT set the deploy-approval env var.

---

### `install/install.mjs` (installer, file-I/O + transform) — byte-parity twin

**Analog:** itself + `install.sh` (the behavioral spec). Mirror every new `install.sh` function 1:1 with the SAME report labels and SAME emitted bytes.

**Home resolution — empty-string must also fall back** (RESEARCH Pattern 1; mirror `os.homedir()` not `$HOME`):
```js
import { homedir } from "node:os";
import { resolve } from "node:path";
const GRUGOPS_HOME =
  process.env.GRUGOPS_HOME && process.env.GRUGOPS_HOME.trim()
    ? resolve(process.env.GRUGOPS_HOME)
    : resolve(homedir(), ".grugops");
const KIT_ROOT = resolve(GRUGOPS_HOME, "agent-factory");
```
**VARIATION/PITFALL:** normalize the materialized path string to POSIX forward-slash form so the sh and Node injected `KIT=` lines are byte-identical (the adapter reads it as a sh path). `path.resolve` may emit backslashes on Windows (RESEARCH Pitfall 2 / A6 — full Windows parity is `UNKNOWN - verify`).

**Existing helpers to mirror (already parity-proven):**
- `mkdirp` (`install.mjs:72-74`), `isSymlink` (76-82), `sameContent` (84-90) — `sameContent` is the Node twin of `cmp -s`; same break for materialized adapters applies.
- `ensureBlock` (94-107) — the Node sentinel append (`appendFileSync(file, \`\n${open}\n${body}\n${close}\n\`)`).
- `linkOrCopy` (111-142) — keep for the 6 dash skills; give the 2 adapters a copy-then-inject path.
- `INSTALL_MODE` default flip: `process.env.INSTALL_MODE || "symlink"` → `"copy"` (`install.mjs:43`).

**JSON byte-parity precedent for the install marker** (`install.mjs:158, 186`) — the marker JSON must be written `JSON.stringify(obj, null, 2) + "\n"` in Node, and the sh side writes the identical literal via `printf` (the established `merge_gemini` parity pattern, `install.sh:203-210`):
```js
writeFileSync(file, JSON.stringify({ context: { fileName: ["AGENTS.md", "GEMINI.md"] } }, null, 2) + "\n");
```

---

### `install/uninstall.sh` (installer, file-I/O + transform) — two-root reversal (D-06)

**Analog:** itself. Two-root update: also remove the `.grugops/install.json` marker; NEVER touch `$GRUGOPS_HOME` or seeded state.

**`is_protected` denylist to EXTEND** (`uninstall.sh:54-64`) — add `.grugops/` broadly, then remove the marker via a narrow named exception (RESEARCH Open Question 2):
```sh
is_protected() {
  case "$1" in
    "$TARGET"/agent-factory/*|"$TARGET"/agent-factory \
    |"$TARGET"/plans/*|"$TARGET"/plans \
    |"$TARGET"/.planning/*|"$TARGET"/.planning \
    |"$TARGET"/docs/*|"$TARGET"/docs \
    |"$TARGET"/src/*|"$TARGET"/src \
    |"$TARGET"|"$TARGET"/) return 0 ;;
    *) return 1 ;;
  esac
}
```
**VARIATION:** add `"$TARGET"/.grugops/*|"$TARGET"/.grugops` to the protected set (so seeded `.grugops/factory.config.json` survives — it is user state once seeded), then `remove_file` ONLY `.grugops/install.json` via a narrow grugops-owned exception (mirror the AGENTS.md "grugops-owned only" check at `uninstall.sh:230-248`). NEVER add `$GRUGOPS_HOME` to any removal path.

**`remove_file` guarded delete to reuse** (`uninstall.sh:67-83`):
```sh
remove_file() {
  _f=$1; _label=$2
  if is_protected "$_f"; then report "refused" "$_label (protected path — never removed)"; return 0; fi
  if [ ! -e "$_f" ] && [ ! -L "$_f" ]; then report skipped "$_label (not present)"; return 0; fi
  if [ "$DRY_RUN" = "1" ]; then report "would-remove" "$_label"; return 0; fi
  do_run rm -f -- "$_f"
  report removed "$_label"
}
```

**The awk sentinel strip = the materialization-idempotency analog** (`uninstall.sh:119-126`) — the *strip half* of the materialize "strip-then-inject". The planner adapts this exact awk to strip a `grugops:materialized-kit` block before re-injecting:
```sh
awk -v op="$_open" -v cl="$_close" '
  BEGIN { inblk=0; pend=0 }
  $0 == op { inblk=1; next }
  inblk { if ($0 == cl) inblk=0; next }
  $0 == "" { pend=pend+1; next }
  { while (pend>0) { print ""; pend=pend-1 } print }
  END { }
' "$_f" > "$_tmp"
```
**NOTE:** the variable names `open`/`close` are reserved in BSD/macOS awk — use neutral names (`op`/`cl`) exactly as the analog does.

---

### `.claude/agents/grugops-orchestrator.md` + `.claude/skills/grugops/SKILL.md` (adapters, materialization targets)

**Analog:** each other (byte-identical resolver block). These are the ONLY 2 files the installer materializes the absolute kit path into.

**The resolver slot to materialize into** (`grugops-orchestrator.md:11-18`, identical at `grugops/SKILL.md:16-23`):
```sh
# 1. (installed) the absolute kit path the installer wrote above this line.
# 2. if absent, self-heal:
KIT="${GRUGOPS_HOME:-$HOME/.grugops}/agent-factory"
# 3. if "$KIT" still does not exist: STOP. Print:
#    "grugops kit not found at $KIT. Run install.sh (or install.sh --check) to install the kit."
#    Do NOT hunt the repo for agent-factory/… .
```
**VARIATION (RESEARCH Pattern 2 — net-new, Claude's Discretion):** inject a sentinel-wrapped `KIT=` line *immediately above* the `# 1. (installed)…` comment, idempotent by strip-then-reinject (not by `cmp`):
```sh
# <!-- grugops:materialized-kit -->
KIT="/Users/<resolved>/.grugops/agent-factory"
# <!-- /grugops:materialized-kit -->
```
**MUST PRESERVE:** the kit-vs-state invariant blockquote (line 7 / line 12) carrying `If the kit dir is absent, STOP — do not hunt.` — `check-kit-refs.sh` SC2 asserts this exact substring at these 2 sites. Do NOT alter the self-heal `${GRUGOPS_HOME:-$HOME/.grugops}` line (Assertion 3 of the gate legally permits `$GRUGOPS_HOME` ONLY here + `subagent.frontmatter.md`). The 6 dash skills (e.g. `grugops-plan/SKILL.md`) carry ONLY the blockquote, no `KIT=` block — leave their laydown on plain `link_or_copy`.

---

### `agent-factory/packaging/subagent.frontmatter.md` + `slash-command.template.md` (templates, D-08 / WR-05)

**Analog:** each other. Drop the `Agent` (spawn) tool grant + the prose justifying it.

**`subagent.frontmatter.md` — exact removals:**
- Line 25: `tools: Read, Grep, Glob, Bash, Edit, Write, Agent` → `tools: Read, Grep, Glob, Bash, Edit, Write` (matches the LIVE adapter `grugops-orchestrator.md:4`, which already correctly omits `Agent`).
- Lines 15-17 prose ("uses the current spawning tool **`Agent`**…") and lines 55-59 ("**`tools: …, Agent`** — `Agent` is the spawning tool. Listing it lets the Orchestrator wrapper spawn specialist role sub-agents…") — rewrite to reflect single-window sequential role-load, NOT spawning.

**`slash-command.template.md` — exact removals:**
- Lines 31 + 56: `  - Agent` (in the two `allowed-tools` lists) — drop both.
- Lines 100-102: the note "**`Agent`** is included in `allowed-tools` so the skill can spawn specialist role sub-agents…" — drop/rewrite.

**Rationale (D-08):** grugops uses single-window sequential role-load by design (MEMORY: grugops-sequential-role-load), NOT sub-agent spawning. These templates ship in the kit copied to `$GRUGOPS_HOME`; the `Agent` grant is a regeneration hazard that would re-introduce the no-spawn violation in generated adapters. **GATE NOTE:** `subagent.frontmatter.md` legally carries `${GRUGOPS_HOME:-$HOME/.grugops}` (it is the resolver-mirroring template, excluded from `check-kit-refs.sh` GH_SCAN) — do NOT remove that line, only the `Agent` grant.

---

### `agent-factory/README.md` + `agent-factory/config/factory.config.md` (docs, D-09 / IN-01)

**Analog:** each other. Rewrite stale `agent-factory/config/factory.config.json` PROSE refs to `.grugops/factory.config.json`.

**`agent-factory/README.md` — exact stale prose:**
- Line 17: `> Read \`agent-factory/roles/orchestrator.md\`, then \`agent-factory/config/factory.config.json\`,` → use `.grugops/factory.config.json` (match the live adapter read order at `grugops-orchestrator.md:21`).
- Lines 57-58: "The config dial lives at `agent-factory/config/factory.config.json`…documented field by field in `agent-factory/config/factory.config.md`." — VARIATION: the *runtime config* is read from `.grugops/factory.config.json`; the kit FILE `agent-factory/config/factory.config.json` legitimately stays as the **seed source** (D-02/D-09). Phrase so the seed-source mention survives but the "where the orchestrator reads it" claim points to `.grugops/`.

**`agent-factory/config/factory.config.md` — exact stale prose:**
- Line 3: "`agent-factory/config/factory.config.json` is the configuration dial…The Orchestrator reads it first on every run…" → the Orchestrator reads `.grugops/factory.config.json`; this file documents that config (the kit ships the default at `agent-factory/config/factory.config.json` as the seed source).

**GATE NOTE:** `check-kit-refs.sh` Assertion 1 (`grep -rn 'agent-factory/config/'`) does NOT scan `agent-factory/README.md` or `factory.config.md` (they are deliberately excluded from `SCAN`, see `check-kit-refs.sh:42-45`), so D-09 is a correctness/doc fix, not a gate-driven one — but keeping the legit seed-source file mention is required so the prose stays accurate.

---

### `scripts/check-kit-refs.sh` (build-gate, batch scan) — D-03 seed exclusion

**Analog:** itself. ONE edit: keep the new seed subtree OUT of the explicit `SCAN`/`GH_SCAN` allowlists.

**The explicit allowlist** (`check-kit-refs.sh:45, 54`) — the gate NEVER does a repo-wide grep; exclusion = simply not listing a path:
```sh
SCAN="agent-factory/roles agent-factory/workflows agent-factory/checklists agent-factory/packaging agent-factory/_commit-convention.md .claude/skills .claude/agents/grugops-orchestrator.md skills AGENTS.md"
GH_SCAN="agent-factory/roles agent-factory/workflows agent-factory/checklists agent-factory/_commit-convention.md AGENTS.md"
```
**VARIATION (D-03):** do NOT add `agent-factory/seed/` to either list. The header comment block (lines 39-44) already documents "by NOT listing them, this excludes…"; add a one-line note that `agent-factory/seed/` is an intentional exclusion because seeds are state TEMPLATES whose `.grugops/…`/`plans/…` refs resolve in the TARGET, not the kit root. **WATCH:** `agent-factory/packaging` IS in `SCAN` — if the planner ever nests the seed under `packaging/`, it would be caught; choose a top-level `agent-factory/seed/` location to keep the exclusion clean (RESEARCH Pitfall 5 / A2).

---

### `install/install.two-root.test.sh` (NEW test harness)

**Analog:** `install/install.test.sh` — copy its structure; **DO NOT edit `install.test.sh`** (its split rewrite is Phase 9; Phase 8 must leave its 7 checks green).

**Harness skeleton to copy** (`install.test.sh:18-34`) — `set -eu`, `pass`/`fail`/`FAILS`, portable `DIFF`, `mktemp -d` + `trap cleanup EXIT INT TERM`:
```sh
set -eu
SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
REPO_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)
FAILS=0
pass() { printf '  PASS  %s\n' "$1"; }
fail() { printf '  FAIL  %s\n' "$1"; FAILS=$((FAILS + 1)); }
DIFF=diff
if command -v /usr/bin/diff >/dev/null 2>&1; then DIFF=/usr/bin/diff; fi
WORK=$(mktemp -d)
cleanup() { rm -rf -- "$WORK"; }
trap cleanup EXIT INT TERM
```

**`snapshot` content-addressed manifest to copy** (`install.test.sh:48-53`) — **EXTEND to cover BOTH roots** (`$TARGET` and `$GRUGOPS_HOME`); the original only covers one dir (RESEARCH Wave 0 gap):
```sh
snapshot() {
  _d=$1; _out=$2
  ( cd "$_d" && find . \( -type f -o -type l \) | LC_ALL=C sort | while IFS= read -r p; do
      if [ -L "$p" ]; then printf '%s LINK\n' "$p"; else printf '%s %s\n' "$p" "$(cksum < "$p" 2>/dev/null | awk '{print $1"-"$2}')"; fi
    done ) > "$_out"
}
```

**Hermetic invocation pattern to copy** (`install.test.sh:62, 128-129`) — always pass `INSTALL_MODE=copy` + isolated `GRUGOPS_SRC`/`TARGET`; **ADD** an isolated `GRUGOPS_HOME=$WORK/home`:
```sh
INSTALL_MODE=copy GRUGOPS_SRC="$REPO_ROOT" GRUGOPS_HOME="$WORK/home" TARGET="$T1" sh "$SCRIPT_DIR/install.sh" --yes >/dev/null 2>&1
```

**Double-install zero-diff idempotency pattern to copy** (`install.test.sh:60-70`) — must now ALSO cover the 2 materialized adapters + kit copy + marker (the materialized-adapter idempotency is RESEARCH Pitfall 1).

**sh/Node parity pattern to copy** (`install.test.sh:125-140`) — install sh→`$A`, node→`$B` with identical env; snapshot + diff both roots = empty; skip (not fail) if `node` absent.

**Self-checkout-guard fixture (NEW, RESEARCH Wave 0 gap):** a throwaway clone-shaped dir carrying `install/install.sh` + `agent-factory/VERSION` so the D-07 guard is exercised WITHOUT ever pointing at the real repo; assert refuse-by-default exits nonzero with the message and `--allow-self` proceeds.

---

### `agent-factory/seed/**` (NEW bundled seed subtree)

**Analog:** the repo-root canonical skeletons — `plans/` + `memory-bank/` (the shapes to bundle) and `agent-factory/config/factory.config.json` (the config seed source, D-02 precedent).

**`plans/` seed shape to bundle** (VERIFIED current tree): `board.md`, `traceability.md`, `nfr-catalog.md`, `metrics.md` + `epics/ features/ tickets/ sprints/ releases/` (each currently a `.gitkeep` placeholder dir).
**`memory-bank/` seed shape to bundle** (VERIFIED): `00-index.md`, `10-project-brief.md`, `20-product.md`, `30-architecture.md`, `40-contributing.md`, `50-decisions/ADR-template.md`, `60-progress.md`, `70-runbook.md`, `80-glossary.md`.
**`.grugops/factory.config.json` seed source:** `agent-factory/config/factory.config.json` (VERIFIED present; the lean default).

**VARIATION / CRITICAL (RESEARCH Pitfall 4):** `plans/handoffs/` is a RUNTIME dir and is ABSENT from the repo's own `plans/` skeleton (VERIFIED: `ls plans/handoffs` → No such file or directory; `.gitkeep` covers epics/features/tickets/sprints/releases but NOT handoffs). The seed step MUST explicitly `mkdirp "$TARGET/plans/handoffs"` (D-01 lists it). **Recommended sub-location (RESEARCH A2):** a single top-level `agent-factory/seed/` (`seed/.grugops/factory.config.json`, `seed/plans/**`, `seed/memory-bank/**`) — one gate-excludable glob, travels with the kit copy, top-level so it dodges the `agent-factory/packaging` SCAN entry.

## Shared Patterns

### Adapter Materialization (strip-then-inject, content-idempotent) — THE net-new mechanism
**Source:** `uninstall.sh:119-126` (awk sentinel strip) + `install.sh:82-101` (`ensure_block` append discipline).
**Apply to:** the 2 resolver adapters ONLY (`grugops-orchestrator.md`, `grugops/SKILL.md`).
**Rule:** before injecting, strip any existing `grugops:materialized-kit` sentinel block, then inject the freshly-resolved `KIT=` line above the `# 1. (installed)…` slot. Same `$GRUGOPS_HOME` → byte-identical → zero diff; changed → correct update. **Why a separate path:** `link_or_copy`'s `cmp -s` (sh) / `sameContent` (Node) "identical copy → skip" check is FALSE once a line is injected — it would either mis-skip or re-copy and lose the injection (RESEARCH Pitfall 1, Anti-Patterns).

### DRY_RUN discipline across BOTH roots
**Source:** `install.sh:66-73` (`do_run`) + the `if [ "$DRY_RUN" = "1" ]; then report would-… ; return 0; fi` guard in every helper.
**Apply to:** every new step (kit copy, materialize, seed, marker). `DRY_RUN=1` must mutate neither `$TARGET` nor `$GRUGOPS_HOME`.

### Skip-if-exists / never-clobber (D-04)
**Source:** `install.sh:258-262` (AGENTS.md skip-if-present) + `ensure_block` open-sentinel skip (`install.sh:84-87`).
**Apply to:** every seeded file (`.grugops/factory.config.json`, `plans/**`, `memory-bank/**`). Marker (`.grugops/install.json`) is grugops-owned → skip-if-equivalent OR omit the timestamp for full idempotency (RESEARCH Pattern 6 / Open Question 1).

### sh ⇄ Node byte-parity
**Source:** `merge_gemini` (`install.sh:150-212`) ⇄ `mergeGemini` (`install.mjs:147-188`) — the proven byte-identical-JSON contract; sh writes the literal via `printf`, Node via `JSON.stringify(obj,null,2)+"\n"`.
**Apply to:** the install marker JSON, the materialized `KIT=` path string (normalize to POSIX forward-slash), the seeded tree. Verified by `install.test.sh` Check 4/4b (tree parity) — the new harness extends this to cover `$GRUGOPS_HOME` + the marker.

### Mechanical safety (carry verbatim)
**Source:** `install.sh:14, 279` / `install.mjs:13, 240` — "NEVER sets the deploy-approval env var."
**Apply to:** every new code path. Plus the D-07 self-checkout guard runs UNCONDITIONALLY after `TARGET` resolution, before any write — independent of TTY/`--yes` (RESEARCH Pitfall 3: "safety is mechanical, not prose").

### Sentinel-block additive append (unchanged, reuse as-is)
**Source:** `ensure_block` (`install.sh:82-101`) / `ensureBlock` (`install.mjs:94-107`).
**Apply to:** any new additive marker on a user file (none strictly required beyond existing CLAUDE.md/Copilot, but reuse if a new pointer is added).

## No Analog Found

None. Every Phase-8 file has a strong analog (the file itself, a sibling helper, the byte-parity twin, or an existing repo skeleton). The only **net-new mechanisms** (no direct analog, but composed from existing primitives) are:
- **Adapter strip-then-inject materialization** — composed from `uninstall.sh` awk strip + `ensure_block` discipline.
- **Atomic `copy_kit` (tmp→rename)** — composed from `mkdirp` + `do_run` + standard `cp -R`/`mv`.
- **`--target`/`--yes`/non-TTY prompt + D-07 self-checkout guard** — new arg-parse + `[ -t 0 ]`/`process.stdin.isTTY` (standard idiom; RESEARCH A1).
- **Install marker `.grugops/install.json`** — new artifact, written via the `merge_gemini` JSON byte-parity precedent.

## Metadata

**Analog search scope:** `install/`, `scripts/`, `.claude/agents/`, `.claude/skills/`, `agent-factory/packaging/`, `agent-factory/config/`, `agent-factory/README.md`, repo-root `plans/` + `memory-bank/`.
**Files scanned (read in full):** `install/install.sh`, `install/install.mjs`, `install/uninstall.sh`, `install/install.test.sh`, `scripts/check-kit-refs.sh`, `.claude/agents/grugops-orchestrator.md`, `.claude/skills/grugops/SKILL.md`, `.claude/skills/grugops-plan/SKILL.md`, `agent-factory/packaging/subagent.frontmatter.md`, `agent-factory/packaging/slash-command.template.md`, `agent-factory/config/factory.config.json` + targeted reads of `agent-factory/README.md`, `agent-factory/config/factory.config.md`.
**Pattern extraction date:** 2026-06-07
</content>
</invoke>

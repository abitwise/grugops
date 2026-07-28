# Phase 15: TypeScript Tooling Migration - Pattern Map

**Mapped:** 2026-06-13
**Files analyzed:** 14 new/modified `.ts` outputs (8 ported scripts + 5 test suites + 1 reference routine) plus 5 net-new scaffolding files
**Analogs found:** 13 with an exact in-repo source / 14 ported files (the reference routine is genuinely new); 5 scaffolding files have NO analog

> **The crucial fact for this phase:** every ported `.ts` file's closest analog is *the exact script it is being ported from*. This is a translation, not a redesign. The migration map below pairs each new file with its source; the parity oracle for behavior is the paired old `*.test.sh` harness. Preserve every env-var name, exit code, regex, and fail-closed branch **byte-for-behavior**. The two genuinely-new surfaces (freshness gate + kit-shipped-runnable) and the 5 config/scaffolding files are flagged explicitly under "No Analog Found."

---

## File Classification

| New/Modified File | Role | Data Flow (inputs → outputs · exit contract) | Closest Analog | Match Quality |
|-------------------|------|-----------------------------------------------|----------------|---------------|
| `install/install.ts` | installer | flags/env → host FS writes · exit 0 ok / 1 refuse/doctor-fail / 2 bad-arg | `install/install.mjs` (+ `install/install.sh`) | exact (port the `.mjs`; `.sh` is the byte-spec the `.mjs` already mirrors) |
| `install/uninstall.ts` | installer (reversal) | flags/env → targeted host FS removals · exit 0 / 2 bad-arg | `install/uninstall.sh` | exact (only-a-`.sh`, port 1:1) |
| `scripts/validate-agent-factory.ts` | validator | two roots via env → stdout findings · exit 0 pass / 1 error | `scripts/validate-agent-factory.mjs` | exact |
| `scripts/generate-asvs-checklist.ts` | generator | fixed JSON source → committed `.md` · exit 0 / 1 | `scripts/generate-asvs-checklist.mjs` | exact (also the freshness-pattern donor for D-02) |
| `scripts/check-foundation-guards.ts` | build-gate / guard | repo files → PASS/WARN/FAIL stdout · exit 0 / 1 (WARN never fails) | `scripts/check-foundation-guards.sh` | exact |
| `scripts/check-kit-refs.ts` | build-gate / guard | explicit SCAN set → PASS/FAIL stdout · exit 0 / 1 | `scripts/check-kit-refs.sh` | exact |
| `hooks/guard.ts` | guard (safety, fail-closed) | PreToolUse stdin JSON → deny-JSON or silent allow · exit 0 always | `hooks/guard.mjs` | exact (**HIGH severity** — port byte-for-behavior) |
| `scripts/runnable-ref/<routine>.ts` | reference-routine (TOOL-02 proof) | input → clear-voice finding · exit 0 pass / 1 findings / 2 error (D-12) | *(none — new; uses guard.mjs + foundation-guard exit-code idiom)* | role-match only |
| `install/install.test.ts` | test-harness | spawn compiled `.js` in temp fixture · asserts behavior | `install.test.sh` + `install.two-root.test.sh` | exact (two sh harnesses fold into one suite; **Check 4 parity dropped — D-08**) |
| `install/uninstall.test.ts` *(or folded into install.test.ts)* | test-harness | install→uninstall round-trip in temp fixture | the Check-3 cycle in `install.test.sh` / two-root `D-06` cases | exact |
| `scripts/validate.test.ts` | test-harness | spawn validator with two-root env perms · assert exit + finding | `scripts/validate.test.sh` | exact |
| `scripts/check-foundation-guards.test.ts` | test-harness | plant-one-violation-per-guard mirror · assert RED | `scripts/check-foundation-guards.test.sh` | exact |
| `hooks/guard.test.ts` | test-harness (safety oracle) | pipe JSON to stdin · assert deny/allow/fail-closed | `hooks/guard.test.sh` | exact (~24 assertions — reproduce **all**) |
| `package.json` | config | — | *(none — repo has none, spec §18)* | NO ANALOG |
| `tsconfig.json` | config | — | *(none)* | NO ANALOG |
| `vitest.config.ts` | config | — | *(none)* | NO ANALOG |
| `.gitattributes` | config | — | *(none — repo has none today)* | NO ANALOG |
| `scripts/freshness.ts` | build-gate | rebuild-to-temp → cmp committed `.js` · exit 0 / 1 | *(no direct analog; structurally clones `generate-asvs-checklist.mjs`'s reproducibility check)* | partial (data-flow match) |

---

## Pattern Assignments

### `hooks/guard.ts` (guard, fail-closed — HIGHEST severity)

**Analog:** `hooks/guard.mjs` (134 lines, read in full). **Port byte-for-behavior. Pitfall 2 in RESEARCH is the dominant risk: do not "clean up" the regex set, stdin handling, or self-approve detection.**

**Imports + the two load-bearing constants** (`guard.mjs:22-27, 81`) — preserve the exact env-var NAME string (a rename silently disables the safety guard, per Runtime State Inventory):
```javascript
import { readFileSync } from "node:fs";
const APPROVAL = "GRUGOPS_PROD_DEPLOY_APPROVED";          // exact string — DO NOT rename
const SELF_APPROVE = new RegExp(`(^|[\\s;&|(])(export\\s+|env\\s+)?${APPROVAL}\\s*=`);
```

**The DEPLOY regex set** (`guard.mjs:43-70`) — copy verbatim, all 17 patterns. Verb-anchored, fail-closed-on-ambiguity. Any "simplification" is a regression:
```javascript
const DEPLOY = [
  /\bkubectl\s+(apply|rollout|delete)\b/,
  /\bhelm\s+(upgrade|install)\b/,
  /\bterraform\s+apply\b/,
  /\bgcloud\s+\w+\s+deploy\b/,
  /\baws\s+deploy\b/,
  /\baws\s+s3\s+sync\b/,
  /\bserverless\s+deploy\b/, /\bsls\s+deploy\b/,
  /\bflyctl\s+deploy\b/, /\bfly\s+deploy\b/,
  /\bvercel\b[\s\S]*--prod\b/,
  /\b(npm|yarn|pnpm)\s+publish\b/,
  /\bgit\s+push\b[\s\S]*\s(--force|-f|--force-with-lease)\b/,
  /\bgit\s+push\b[\s\S]*\b(main|master)\b/,
  /\bgit\s+push\b[\s\S]*\brelease\//,
];
```

**Fail-closed stdin parse** (`guard.mjs:100-108`) — the malformed-payload-never-crash-allows core. `readFileSync(0, ...)` reads fd 0:
```javascript
let cmd = "";
try {
  const raw = readFileSync(0, "utf8");
  const input = JSON.parse(raw);
  cmd = input?.tool_input?.command ?? "";
  if (typeof cmd !== "string") cmd = "";
} catch {
  cmd = "";  // malformed / empty stdin → no command → allow only non-deploys
}
```

**Deny mechanism + the two gates** (`guard.mjs:83-130`) — exit 0 + JSON `permissionDecision:"deny"`; self-approve checked BEFORE the deploy gate; deny if matched-deploy AND `!process.env[APPROVAL]`. All deny reasons are **clear professional voice** (CLAUDE.md hard rule — preserve):
```javascript
function deny(reason) {
  process.stdout.write(JSON.stringify({ hookSpecificOutput: {
    hookEventName: "PreToolUse", permissionDecision: "deny", permissionDecisionReason: reason }}));
  process.exit(0);
}
if (SELF_APPROVE.test(cmd)) deny(/* "an agent may not set or export ..." */);
const isDeploy = DEPLOY.some((re) => re.test(cmd));
if (isDeploy && !process.env[APPROVAL]) deny(/* "Production deploy blocked ..." */);
process.exit(0);  // allow everything else
```

**D-10 extra (the new concern beyond the byte-port):** the *hook wiring* must default-to-block if `guard.js` or `node` can't run. Update `hooks/hooks.json` (`hooks/hooks.json:9`, `node "${CLAUDE_PLUGIN_ROOT}/hooks/guard.mjs"` → `…/guard.js`). Plan a test that renames/removes `guard.js` and asserts the protected action does NOT proceed (RESEARCH §Fail-closed materialized guard).

---

### `hooks/guard.test.ts` (test-harness, safety oracle)

**Analog:** `hooks/guard.test.sh` (140 lines, read in full). **Reproduce every one of its ~24 assertions** — fewer cases is the Pitfall-2 warning sign.

**The `run()` helper** (`guard.test.sh:30-36`) → `spawnSync` piping JSON to stdin (RESEARCH Pattern 3). The env-assignment 2nd arg becomes a `Record<string,string>` merged onto `process.env`:
```javascript
// sh: printf '%s' "$1" | env "$2" node "$GUARD"
function runGuard(json, env = {}) {
  return spawnSync("node", [join(import.meta.dirname, "guard.js")],
    { input: json, encoding: "utf8", env: { ...process.env, ...env } });
}
```

**Assertion inventory to port (count them):**
- Triad: deny matched deploy w/ no approval; **allow** same deploy with `GRUGOPS_PROD_DEPLOY_APPROVED=1` env; deny inline `export …=1 && kubectl apply` *even with* the env var set (`guard.test.sh:58-68`).
- Reinforcing: assignment-prefix self-set denied; non-deploy `ls` allowed (`:72-77`).
- Default-set coverage denies: `terraform apply`, `npm publish`, `vercel deploy --prod` (`:80-82`).
- WR-01 newly-covered denies (12): `kubectl delete`, `aws s3 sync`, `aws deploy`, `yarn`/`pnpm publish`, `gcloud run deploy`, `gcloud app deploy`, `git push --force`, `git push -f`, push to `main`, push to `master`, push to `release/*` (`:85-106`).
- WR-02 false-positive **allows** (4): `aws s3 ls && cat ./deploy/notes.txt`, `gcloud config list # see deploy docs`, push to `feature/my-branch`, `kubectl get pods` (`:109-116`).
- Fail-closed (2): `not json at all` → exit 0, no "error" on stderr; empty stdin → exit 0, no "error" (`:119-130`).

Match shapes: deny ⇒ `stdout` contains `"permissionDecision":"deny"`; allow ⇒ `stdout` does NOT contain `"deny"` (`guard.test.sh:40,49`).

---

### `install/install.ts` (installer)

**Analog:** `install/install.mjs` (754 lines — already Node, already stdlib-only; this is the closest match and the port should follow it, NOT re-derive from `install.sh`). `install.sh` is the byte-spec the `.mjs` already mirrors. **D-07: collapse both into one `install.ts`; Node is now a hard prerequisite; the dual sh/Node byte-parity contract is retired.**

**Preserve every env-var name** (Runtime State Inventory — these are read by tests, docs, and the two-root contract): `GRUGOPS_SRC`, `GRUGOPS_HOME`, `TARGET`, `INSTALL_MODE`, `DRY_RUN`. Resolution block (`install.mjs:84-103`):
```javascript
const GRUGOPS_SRC = process.env.GRUGOPS_SRC ? resolve(process.env.GRUGOPS_SRC) : resolve(SCRIPT_DIR, "..");
const DRY_RUN = process.env.DRY_RUN === "1";
const INSTALL_MODE = ARG_SYMLINK ? "symlink" : process.env.INSTALL_MODE || "copy";   // copy default (D-05)
const toPosix = (p) => p.replace(/\\/g, "/");
const GRUGOPS_HOME = toPosix(process.env.GRUGOPS_HOME && process.env.GRUGOPS_HOME.trim()
  ? resolve(process.env.GRUGOPS_HOME) : resolve(homedir(), ".grugops"));   // empty-string falls back (sh :- form)
const KIT_ROOT = toPosix(resolve(GRUGOPS_HOME, "agent-factory"));
```

**Arg-parse exit contract** (`install.mjs:62-82`) — unknown arg ⇒ `exit 2`; flags `--target[=]`, `--yes/-y`, `--allow-self/--force`, `--symlink`, `--check`, `--strict`. **The exit-2-on-bad-arg is part of the D-12 contract — preserve.**

**The installer-contract functions to port 1:1** (this is the "additive / idempotent / never-overwrite" spine — Established Patterns):
- `ensureBlock` — sentinel-delimited append, skip if open-sentinel present, never `>`-truncate (`install.mjs:428-441`).
- `linkOrCopy` — D-30 symlink-with-copy-fallback, skip-if-identical (`:445-476`).
- `materializeAdapter` — strip-then-inject the `KIT="…"` line, CR-01 bounded removal of an unterminated prior block (`:565-612`). Sentinels `MAT_OPEN/MAT_CLOSE/MAT_SLOT` byte-identical (`:140-142`).
- `seedFile`/`seedState`/`listSeedFiles` — per-file skip-if-exists, `LC_ALL=C` sort order (`:614-662`).
- `writeMarker` — 4 stable fields, fixed order, timestamp omitted, overwrite-unconditionally (`:667-687`).
- `doctor()` — non-mutating `--check`; absent marker ⇒ `notInstalled()` + return 1; D-03 three-source kit-root cross-check; ordered first-failure stat set; WARN tier; exit matrix (`:237-349`).
- **Safety preserved:** D-07 self-checkout guard (`:366-377`); the installer NEVER sets the deploy-approval env var (`:751`); never touches `agent-factory/`, `plans/`, user data.

**NEW responsibility (D-11):** materialize the compiled kit-shipped routine `.js` into the host's committed path (recommend `tools/grugops/`). Additive/idempotent/never-overwrite — reuse the `seedFile`/`linkOrCopy` shape; add a test asserting the file lands at a committed path.

---

### `install/uninstall.ts` (installer, reversal)

**Analog:** `install/uninstall.sh` (357 lines, read in full). Exact inverse of the installer; port 1:1. Env: `GRUGOPS_SRC`, `TARGET`, `DRY_RUN`; bad-arg ⇒ `exit 2` (`uninstall.sh:46`).

**The protection denylist** (`uninstall.sh:96-107`) — the load-bearing "never delete user content" guard. Every removal target is checked against it first. `.grugops/` is protected *except* the one named `install.json` exception:
```javascript
// is_protected: agent-factory/ plans/ .planning/ .grugops/ docs/ src/ and the repo root → refuse
```

**Same sentinel strings as the installer** (must match byte-for-byte or blocks won't be removed): `CLAUDE_OPEN/CLOSE`, `COPILOT_OPEN/CLOSE` (`uninstall.sh:70-77` ≡ `install.mjs:391-402`).

**Functions to port 1:1:** `remove_file` (guard-then-rm) `:110-126`; `remove_sentinel_block` (CR-01 bounded removal — unterminated block restores buffered lines, never silent content loss) `:143-189`; `unmerge_gemini` (Node JSON edit, removes file only if it returns to grugops-default shape) `:213-268`; `remove_marker` (the single `.grugops/install.json` exception) `:280-292`; AGENTS.md removed ONLY if symlink-into-source or byte-identical copy (`cmp -s`) `:313-331`.

---

### `scripts/validate-agent-factory.ts` (validator)

**Analog:** `scripts/validate-agent-factory.mjs` (542 lines, read in full). Two-root aware. **Claude's-discretion ruling (RESEARCH Open Q4): port behavior 1:1, refactor nothing in the resolution logic — the C3 no-false-green guard and CR-03 fail-closed-on-`null` are hard-won.**

**Two-root resolution + the C3 footgun guard** (`validate-agent-factory.mjs:51-61`) — `VALIDATE_KIT_ROOT` has NO default; unset is a hard error with the `(C3)` message. `VALIDATE_ROOT` defaults to repo root:
```javascript
const STATE_ROOT = process.env.VALIDATE_ROOT ? resolve(process.env.VALIDATE_ROOT) : resolve(SCRIPT_DIR, "..");
if (!process.env.VALIDATE_KIT_ROOT) {
  console.error("  ERROR    VALIDATE_KIT_ROOT is unset — refusing to default the kit root to '.' (C3)");
  process.exit(1);
}
const KIT_ROOT = resolve(process.env.VALIDATE_KIT_ROOT);
```

**Fail-closed FS helpers, forked per root** (`:66-96`) — try/catch → `null`/`false`/`[]`, never throw. **CR-03 fail-closed-on-`null`** (`:302-305`, `:471-474`) — `JSON.parse("null")` returns `null` without throwing, so reject any non-object parse result before dereferencing. Port this guard exactly in both `checkConfig` and `checkPackaging`.

**The frozen name lists** (`:107-206`) — WORKFLOWS(14), FROZEN_HANDOFFS(16), ROLES(16), CHECKLISTS(11), ROLE_SECTIONS, WORKFLOW_SECTIONS — copy verbatim, never re-derive. **Safety invariant** (`:382-389`): `production_requires_human_confirmation` must be `true` — presence-guarded (absent = lean `true`), only explicit `false` rejected. `--strict` promotes warnings to nonzero (`:101,535`). Exit: `0` = ALL CHECKS PASSED / `1` = N ERROR(S).

---

### `scripts/generate-asvs-checklist.ts` (generator — also the D-02 freshness-pattern donor)

**Analog:** `scripts/generate-asvs-checklist.mjs` (161 lines, read in full). **Byte-reproducibility is the contract:** the TS version MUST emit the byte-identical checklist (the freshness gate AND the security-checklist provenance both break otherwise).

**Fixed literal paths + source pin** (`generate-asvs-checklist.mjs:34-42`) — never argv/env/content-derived (path-traversal mitigation). **Fail-closed load chain** (`:50-75`): read→parse→non-object reject→missing-array reject→**row-count must == 345** or refuse to write a partial. **Deterministic emit** (`:96-156`): build a `lines[]` array, `writeFileSync(OUT, lines.join("\n"), "utf8")` — keep this exact style (RESEARCH anti-pattern: no template-string/echo emit; deterministic output is what the freshness diff depends on). Exit 0/1.

This script's read→regenerate→compare shape is the **template `scripts/freshness.ts` clones** (rebuild-to-temp → `cmp` committed `.js`).

---

### `scripts/check-foundation-guards.ts` (build-gate / guard, RED-by-design)

**Analog:** `scripts/check-foundation-guards.sh` (444 lines, read in full). Six guards in one aggregator; **WARN never fails the build, only FAIL does** (two-tier byte ceilings). Strictly read-only.

**The exit-code spine** (`check-foundation-guards.sh:63-70, 436-443`):
```javascript
let FAILS = 0;
const pass = (m) => console.log(`  PASS  ${m}`);
const fail = (m) => { console.log(`  FAIL  ${m}`); FAILS++; };
const warn = (m) => console.log(`  WARN  ${m}`);   // advisory — does NOT increment FAILS
// ... run all guards ...  exit 0 if FAILS===0 else 1
```

**Port verbatim (these are tuned, not arbitrary):** the WR05 EREs + explicit 4-file SCAN set (`:87-97`); `guard_voice` fence-strip + `__UNCLOSED_CAVEMAN_FENCE__` sentinel + the 3 phrase-neutralizations (`/grug`, `grug voice`, `grug wink`) + `VOICE_MARKERS` (`:213,239-262`); `guard_caveman_preserved` ≥2 `^You` OR ≥1 idiom (`:331-332`); the per-role `role_ceiling()` byte table (`:374-396`); the 17-file `ROLE_FILES` + `SEC_VOICE_FILES` lists (`:186-212`); CR-01 missing-file-fails-red everywhere (no vacuous green). The `awk` fence machinery ports to a small line-state loop in TS — same semantics, no re-engineering of the anchor (D-10 forward-compat).

---

### `scripts/check-kit-refs.ts` (build-gate / guard)

**Analog:** `scripts/check-kit-refs.sh` (151 lines, read in full). Same `pass/fail/FAILS` exit spine as the foundation guards. Read-only over an **explicit SCAN set, never a repo-wide grep** (the `grep -rn` becomes a scoped file-walk + regex test in TS).

**Port verbatim:** the `SCAN`/`GH_SCAN`/`MARKER_SITES` path lists (`check-kit-refs.sh:52,61,67`); the 16-template `ALLOW` ERE (`:64`); the `MARKER` substring (`:69`); the 3 assertions + SC2 marker check (`:80-138`). The exclusion-by-not-listing design (seed/ intentionally absent) is load-bearing — preserve the exact SCAN membership.

---

### `scripts/runnable-ref/<routine>.ts` (reference-routine — TOOL-02 proof, GENUINELY NEW)

**No in-repo analog** — this is the new SC3/TOOL-02 deliverable. It does, however, adopt the existing exit-code-guard idiom verbatim. Use the D-12 skeleton (RESEARCH Code Examples) which formalizes `guard.mjs` + `check-foundation-guards.sh`'s exit-code-as-signal:
```javascript
const wantJson = process.argv.includes("--json");
const findings = [];                        // populate from the check
if (/* unrunnable / bad input */) { console.error("Error: <clear-voice reason>"); process.exit(2); }
if (findings.length > 0) {
  if (wantJson) console.log(JSON.stringify({ ok: false, findings }));
  else findings.forEach((f) => console.log(f));   // clear professional voice, never caveman
  process.exit(1);
}
console.log("No findings.");
process.exit(0);
```
Ship a RED fixture (planted bad input → exit 1) + a Vitest harness that spawns the **materialized** `.js` from a temp host fixture with no `node_modules` reachable (Pitfall 3 host-emulation), and an install-side test that `install.ts` materializes it (additive/idempotent/never-overwrite).

---

### `install.test.ts` / `validate.test.ts` / `check-foundation-guards.test.ts` (test-harnesses)

**Analogs:** `install.test.sh` + `install.two-root.test.sh`; `validate.test.sh`; `check-foundation-guards.test.sh` (heads read). All share the proven sh idioms that port to Vitest:

- **Temp-fixture + cleanup** (`install.test.sh:32-34`, mirrored in two-root) → `mkdtempSync(join(tmpdir(),"grugops-"))` + `afterEach rmSync({recursive,force})` (RESEARCH Pattern 3).
- **Content-addressed snapshot** (`install.test.sh:48-53`) → walk + hash a tree to diff two states regardless of inode; the two-root harness snapshots BOTH `$TARGET` and `$GRUGOPS_HOME` (`install.two-root.test.sh:53-60`). Port as a small `readdir`-recursive + hash helper.
- **Hermetic env overrides** (`install.test.sh:62`, `two-root run_install :65-68`) — `INSTALL_MODE=copy GRUGOPS_SRC GRUGOPS_HOME TARGET` passed via `spawnSync`'s `env`.
- **`expect_fail` capture idiom** (`validate.test.sh:63`, `check-foundation-guards.test.sh:99`) — `out=$(cmd) && rc=0 || rc=$?` → `spawnSync` returns `{status,stdout,stderr}` directly.
- **Validator two-root perms** (`validate.test.sh:63-76`) — drive `VALIDATE_KIT_ROOT`/`VALIDATE_ROOT` separately; reproduce the bad-missing-kit AND bad-**unset**-kit `(C3)` cases (`:166-179`).
- **Foundation-guards plant-one-violation-per-guard** (`check-foundation-guards.test.sh:48-99`) — mirror inputs to `$WORK/<case>`, plant exactly one defect, run from the mirror, assert RED; then a smoke run proves GREEN over the real tree.

**`install.test.ts` reframe (D-08 — REQUIRED MARKER):** the old **Check 4** ("install.sh tree == install.mjs tree", `install.test.sh:14`) is **intentionally removed** — there is no sh installer left to keep in parity. The suite must carry an explicit comment/marker stating the parity check is dropped per D-08 and instead assert the single installer's contract: Check 1 idempotent zero-diff (`:60-70`), Check 2 DRY_RUN no-change (`:82-91`), Check 3 install→uninstall removes grugops-owned wiring while seeded user state + frozen core survive (`:109-120`). Plan/verifier must treat the parity-test absence as intentional (Pitfall 6), not a regression.

---

## Shared Patterns

### Exit-code-as-signal (D-12 — applies to ALL ported scripts + the reference routine)
**Source:** `hooks/guard.mjs` (`process.exit(0)` + JSON), `scripts/check-foundation-guards.sh:436-443`, `scripts/validate-agent-factory.mjs:535-541`, `install.mjs:80` (`exit 2` on bad arg).
**Apply to:** every kit-shipped runnable + every checker.
```
exit 0 = pass / no findings   ·   exit 1 = findings / fail (gate blocks)   ·   exit 2 = error (could not run)
stdout = human-readable findings in CLEAR PROFESSIONAL VOICE   ·   optional --json machine block
```
This is a *formalization* of the existing idiom, not a new one — adopt verbatim.

### Fail-closed JSON parsing
**Source:** `guard.mjs:100-108`; `validate-agent-factory.mjs:67-73, 302-305, 471-474` (CR-03 non-object reject); `generate-asvs-checklist.mjs:57-65`; `install.mjs:172-178` (readMarker).
**Apply to:** every script that parses untrusted/external JSON (guard stdin, config, plugin.json, install marker, ASVS source). Pattern: `try { JSON.parse } catch { → null/empty }`, THEN reject `null`/array/primitive before dereferencing. `JSON.parse("null")` returns `null` WITHOUT throwing — the dereference would crash and violate fail-closed.

### Read-only / write-only-by-construction (path-traversal mitigation)
**Source:** `validate-agent-factory.mjs:37-40` + `generate-asvs-checklist.mjs:20-22` headers.
**Apply to:** validator, generator, both checkers, reference routine. Every read/write path is `join(ROOT, <fixed literal rel>)` — never derived from argv, env, or file content.

### Sentinel-block idempotency (additive, never-overwrite)
**Source:** `install.mjs:428-441` (ensureBlock) + `uninstall.mjs`/`uninstall.sh:143-189` (remove_sentinel_block, CR-01 bounded removal). Sentinel strings `install.mjs:391-402` ≡ `uninstall.sh:70-77`.
**Apply to:** install.ts + uninstall.ts — strings MUST stay byte-identical across the pair.

### `import.meta.dirname` for script-relative paths (ESM, Node 22+)
**Source:** every `.mjs` currently does `dirname(fileURLToPath(import.meta.url))` (`validate:51`, `generate:34`, `install:84`).
**Apply to:** all ported `.ts` — replace with `import.meta.dirname` (RESEARCH Pattern 2/State-of-the-Art; stabilized at the Node 22 floor). Test suites resolve the **committed `.js`** via `join(import.meta.dirname, "<routine>.js")`, never the `.ts`.

### `spawnSync` child-CLI test driver
**Source:** all `*.test.sh` shell out via `node "$GUARD"` / `sh "$SCRIPT"` and grep stdout (`guard.test.sh:30-54`, `validate.test.sh:63`).
**Apply to:** all `*.test.ts` — `spawnSync("node", [js], { input, encoding:"utf8", env })` → assert `.status` (exit) + `.stdout` (findings).

### Two-voice discipline (CLAUDE.md hard rule)
**Apply to:** every findings/deny/error string in the guard, checkers, validator, generator, and reference routine — **clear professional voice**, never caveman. The guard's deny reasons and the generator's intro already comply; preserve. (Caveman voice lives only in role prompts, none of which are touched here.)

---

## No Analog Found

Genuinely-new files — use RESEARCH.md patterns, not a forced weak analog:

| File | Role | Data Flow | Reason / Source to use |
|------|------|-----------|------------------------|
| `package.json` | config | — | Repo has none (spec §18); arrives with `tsc` (D-04). Use RESEARCH Code Examples `package.json` (`"type":"module"`, `engines.node>=22`, scripts build/typecheck/test/freshness, dev-deps `{typescript,vitest,@types/node}`). |
| `tsconfig.json` | config | — | Use RESEARCH Pattern 1: `module/moduleResolution: nodenext`, `target: es2022`, `strict`, `newLine: "lf"`, `noEmitOnError`, `declaration:false`, `sourceMap:false`. |
| `vitest.config.ts` | config | — | Minimal `defineConfig({ test: {} })` — defaults suffice (RESEARCH Validation Architecture). |
| `.gitattributes` | config | — | No analog; repo has none. **Mandatory for D-02 determinism** (Pitfall 1): pin committed `*.js` to `eol=lf`. Use RESEARCH `.gitattributes` example. |
| `scripts/freshness.ts` | build-gate | rebuild→cmp → exit 0/1 | No direct analog; **structurally clones `generate-asvs-checklist.mjs`'s reproducibility check**. Use RESEARCH Pattern 4 (rebuild-to-temp + `cmp`, OR `tsc && git diff --exit-code`). |
| `scripts/runnable-ref/<routine>.ts` + RED fixture | reference-routine | input→finding · exit 0/1/2 | TOOL-02 is grugops-specific synthesis. Adopts the exit-code idiom from `guard.mjs`/`check-foundation-guards.sh` but the routine itself is new (D-11/D-12). |

**Also new (not files, but phase deliverables):** `node_modules/` must be added to `.gitignore` (currently absent — confirmed empty grep); the committed lockfile (`package-lock.json`); `hooks/hooks.json` edit (`guard.mjs`→`guard.js`); deletion of every old `.sh`/`.mjs` + `.test.sh` after the parity oracle is green (D-09); and the invocation-string sweep re-pointing `install.sh`/`install.mjs`/`guard.mjs`/`*.test.sh` references in `install/README.md`, `docs/`, `.planning/`, AGENTS.md, and the role-switch protocol to the new `node <…>.js` form (Runtime State Inventory canonical question).

---

## Metadata

**Analog search scope:** `install/`, `scripts/`, `hooks/`, repo-root config files (`.gitignore`, no `package.json`/`tsconfig.json`/`.gitattributes` present)
**Files scanned (read in full or head):** `hooks/guard.mjs`, `hooks/guard.test.sh`, `hooks/hooks.json`, `scripts/generate-asvs-checklist.mjs`, `scripts/validate-agent-factory.mjs`, `scripts/check-foundation-guards.sh`, `scripts/check-kit-refs.sh`, `install/install.mjs`, `install/uninstall.sh`, plus heads of `install/install.test.sh`, `install/install.two-root.test.sh`, `scripts/validate.test.sh`, `scripts/check-foundation-guards.test.sh`
**Pattern extraction date:** 2026-06-13

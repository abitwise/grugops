# Phase 7: Shared-Home Foundation & Path Rewrite - Pattern Map

**Mapped:** 2026-06-06
**Files analyzed:** 1 new POSIX script + 7 modified-file buckets spanning ~50 in-scope files (44 config refs, 51 handoff refs, 3+7 adapters, AGENTS.md)
**Analogs found:** 7 / 7 buckets (every bucket has a concrete in-repo analog; no RESEARCH-only fallback needed)

> This phase is a **markdown path-root rewrite + ONE new POSIX shell script**. There is no application code. "Patterns" here are: (a) the house style of the one new script, and (b) the before/after prose shapes for each rewrite bucket. The planner consumes the per-bucket analog + excerpt to write surgical, gate-clean edits.

> **Scope confirmation (resolves RESEARCH O1):** repo-root `skills/{grugops,map,plan,ticket,gate,uat,release}/SKILL.md` (plugin colon-form) **DO exist** and carry the identical config ref (`skills/map/SKILL.md:13`, `skills/grugops/SKILL.md:13`). They are **in the rewrite set and the gate SCAN** — treat each as Bucket A (config rewrite) + the compressed-invariant subset of Bucket E. This adds ~7 files the live grep (which scanned only `.claude/skills/`) did not count.

---

## File Classification

| New/Modified file (or bucket) | Role | Data Flow | Closest Analog | Match Quality |
|-------------------------------|------|-----------|----------------|---------------|
| `scripts/check-kit-refs.sh` (NEW) | new gate script (POSIX) | batch / read-only grep audit | `.planning/phases/05-…/check-structure.sh` + `install/install.sh` | exact (same harness idiom + house style) |
| Bucket A — config refs (~44+7 refs, ~38 files) | role/workflow/adapter prose | transform (path-root rewrite) | `agent-factory/roles/orchestrator.md:26` | exact (every ref is the same shape) |
| Bucket B — handoff WRITE / "Handoffs produced" (~32 refs) | role/workflow prose | transform (template-read + instance-write split) | `_role-switch-protocol.md:27-28` + `04-ticket-to-pr.md:35-36` | exact |
| Bucket C — handoff READ refs (D-06, now instance reads, ~6) | role/workflow prose | transform (template→instance) | `agent-factory/roles/qe-e2e.md:22` | exact |
| Bucket D — kit-to-kit refs (~96) | role/workflow/checklist prose | (no edit — stay bare) | `agent-factory/roles/_role-switch-protocol.md:24` | exact (these are the correct form) |
| Bucket E1 — AGENTS.md canonical rule (D-09/D-10) | AGENTS.md substrate | transform (new canonical block) | `AGENTS.md:19-25` ("Role / workflow / handoff files" section) | exact (insertion site) |
| Bucket E2 — orchestrator preamble invariant (D-09) | role prose | transform (new compressed block) | `agent-factory/roles/orchestrator.md:5-8` | exact (insertion site) |
| Bucket E3 — adapter preamble + sole-resolver self-heal/STOP (D-09/D-11) | adapter (standalone) | event-driven (resolve-or-STOP) | `.claude/agents/grugops-orchestrator.md:7-14` + `.claude/skills/grugops/SKILL.md:12-18` | exact (insertion site) |

---

## Pattern Assignments

### `scripts/check-kit-refs.sh` (NEW gate script, POSIX, read-only batch)

**Primary analog:** `.planning/phases/05-packaging-adapters-install-distribution/check-structure.sh` (the most recent Phase-5 structural harness — copy its skeleton).
**Secondary analog:** `install/install.sh` (house-style POSIX conventions: shebang, `set -eu`, `printf`, `grep -qF`, named helpers).

**Harness skeleton to copy** (`check-structure.sh:1-2, 28-40, 213-222`):
```sh
#!/usr/bin/env sh
# check-kit-refs.sh — Phase 7 build gate (SHOME-03 / SC5). [one-line purpose comment block]
set -eu

# named path vars at top (analog: PKG_DIR/ADAPTERS/SUBAGENT...)
FAILS=0
pass() { printf '  PASS  %s\n' "$1"; }
fail() { printf '  FAIL  %s\n' "$1"; FAILS=$((FAILS + 1)); }

printf '== Phase 7 kit-ref gate ==\n'
# ... assertions ...

printf '\n== Result ==\n'
if [ "$FAILS" -eq 0 ]; then
  printf 'ALL CHECKS PASSED\n'
  exit 0
else
  printf '%s CHECK(S) FAILED\n' "$FAILS"
  exit 1
fi
```

**Conventions to replicate (from BOTH analogs):**
- Shebang `#!/usr/bin/env sh`, `set -eu` (`install.sh:1,27`; `check-structure.sh:1,28`).
- `printf`, NEVER `echo -e` (`install.sh:24` house-style note explicitly: *"printf not echo -e, grep -qF"*).
- `pass()`/`fail()` incrementing a `FAILS` counter; `exit 0` all-pass / `exit 1` any-fail (`check-structure.sh:37-38, 216-221`).
- `|| true` guard on greps inside `$()` so `set -e` does not abort on a no-match (RESEARCH `07-RESEARCH.md:478`).
- One labeled section per assertion with a `printf '\n[LABEL] ...\n'` header (`check-structure.sh:48, 77, 125`).

**Portable-grep discipline — CRITICAL** (host `grep` is **ugrep 7.5.0 aliased to grep**, RESEARCH `07-RESEARCH.md:92, 446-449`):
- Use ONLY `-r -n -l -E -F -q -v -o`. The existing analogs already model this: `install.sh:84` uses `grep -qF --`; `check-structure.sh:56` uses `grep -c`, `:84` uses `grep -qw`, `:172` uses `grep -qE`, `:151` uses `grep -vx`. None use `-P`, `-z`, or `--include`.
- Do NOT rely on `grep -r` default include/exclude globs (varies BusyBox/GNU/ugrep). Pass an **explicit SCAN path list** as a variable (see below) instead of a repo-wide recursive grep — this also closes the false-positive risk from `scripts/fixtures/` (RESEARCH `07-RESEARCH.md:451-455`).

**SCAN/EXCLUDE list to embed** (RESEARCH `07-RESEARCH.md:350-363`); note repo-root `skills/` IS present:
```sh
SCAN="agent-factory/roles agent-factory/workflows agent-factory/checklists agent-factory/packaging agent-factory/_commit-convention.md .claude/skills .claude/agents/grugops-orchestrator.md skills AGENTS.md"
# EXCLUDED by NOT listing them: scripts/fixtures, agent-factory/examples, agent-factory/README.md,
#   install/, root README.md, CLAUDE.md, docs/, .planning/, and this script itself.
```

**Assertion 1 (D-08.1) — zero `agent-factory/config/` refs** (RESEARCH `07-RESEARCH.md:469-474`):
```sh
if grep -rn 'agent-factory/config/' $SCAN >/dev/null 2>&1; then
  fail "stray agent-factory/config/ refs (config must be .grugops/factory.config.json)"
else
  pass "no agent-factory/config/ refs remain"
fi
```
Today this finds 44 (+7 plugin-skill) hits → after Bucket A it must be 0.

**Assertion 2 (D-08.2) — every surviving `agent-factory/handoffs/` ref is a known template** (RESEARCH `07-RESEARCH.md:477-481`). The 16-template ERE alternation is the gate's allowlist (verbatim from `ls agent-factory/handoffs/`, RESEARCH `07-RESEARCH.md:276-298`):
```sh
ALLOW='agent-factory/handoffs/(architecture-handoff|business-handoff|implementation-handoff|implementation-ready-packet|incident-postmortem|product-handoff|qe-handoff|refinement-notes|release-handoff|retro-notes|security-nfr-handoff|sprint-plan|system-handoff|ticket-ready-packet|uat-handoff|universal-handoff)\.md'
stray=$(grep -rn 'agent-factory/handoffs/' $SCAN 2>/dev/null | grep -Ev "$ALLOW" | grep -Ev 'agent-factory/handoffs/`' || true)
[ -z "$stray" ] && pass "every agent-factory/handoffs/ ref is a known template" \
                 || fail "non-template handoffs ref (leaked instance?):
$stray"
```

**Assertion 3 (proposed, SHOME-04 / SC4 — RESEARCH recommends include)** (RESEARCH `07-RESEARCH.md:392-396`):
```sh
bad=$(grep -rln 'GRUGOPS_HOME' agent-factory AGENTS.md 2>/dev/null || true)
[ -z "$bad" ] && pass "no kit file / AGENTS.md names \$GRUGOPS_HOME" \
              || fail "kit prose names \$GRUGOPS_HOME (must live only in the adapter self-heal):
$bad"
```
Note: scope `agent-factory AGENTS.md` only here — `$GRUGOPS_HOME` is LEGAL in the adapter self-heal line (Bucket E3), so do NOT include `.claude/skills` / `.claude/agents` / `skills` in Assertion 3's scan.

**Sequencing (RESEARCH `07-RESEARCH.md:417` — diverges from the Phase-5 ships-RED pattern):** Phase-5's `check-structure.sh` ships RED by design (missing-artifact signal). THIS gate must ship **GREEN at commit** — author it AFTER the rewrite (it proves a *completed* rewrite, not a scaffold). Copy the analog's harness shape, NOT its "ships RED" framing comment.

---

### Bucket A — config refs → `.grugops/factory.config.json` (~44 + 7 plugin-skill refs)

**Role:** role/workflow/adapter prose. **Data flow:** transform (path-root only; `#field` anchors preserved).

**Analog / canonical before-shape** (`agent-factory/roles/orchestrator.md:26`):
```markdown
- `agent-factory/config/factory.config.json` **first** — `mode` / `cadence` / `autonomy` / `wip_limits` / `quality` / `nfr` / `compliance_regime`.
```
**Target after-shape:**
```markdown
- `.grugops/factory.config.json` **first** — `mode` / `cadence` / `autonomy` / `wip_limits` / `quality` / `nfr` / `compliance_regime`.
```

**Anchored-ref before/after** (`orchestrator.md:67` — preserve `#wip_limits`):
```markdown
- WIP limits come from `agent-factory/config/factory.config.json#wip_limits` ...   ← BEFORE
- WIP limits come from `.grugops/factory.config.json#wip_limits` ...               ← AFTER
```

**Convention to replicate:** lexical swap `agent-factory/config/factory.config.json` → `.grugops/factory.config.json`, ONLY the root changes; every `#field` anchor (`#wip_limits`, `#quality`) is preserved verbatim (Security V14, RESEARCH `07-RESEARCH.md:590`). This is the one bucket where a near-mechanical replace is safe — but scoped to the SCAN list, never repo-wide (fixtures carry the old string intentionally).

**Adapter occurrences of this exact line** (all four resolver/dispatch adapters + 6 op-skills + 7 plugin-skills carry it):
- `.claude/agents/grugops-orchestrator.md:8`, `.claude/skills/grugops/SKILL.md:13`, `.claude/skills/grugops-map/SKILL.md:13`, `skills/grugops/SKILL.md:13`, `skills/map/SKILL.md:13`.

---

### Bucket B — handoff WRITE / "Handoffs produced" → template-read + `plans/handoffs/<ID>-<stage>.md` write (~32 refs)

**Role:** role/workflow prose. **Data flow:** transform (one home → two homes; the high-risk bucket).

**Anchor 1 — `_role-switch-protocol.md` § step 4 (the once-here edit, D-06)** (`_role-switch-protocol.md:27-28`):
```markdown
4. **Produce the handoff.** Do the one job and write the role's handoff file under
   `agent-factory/handoffs/`. The handoff is the work product AND the memory.
```
**Target form** (template-read KIT vs instance-write STATE, ticket-scoped per D-05):
```markdown
4. **Produce the handoff.** Do the one job: read the role's handoff **template** from
   `agent-factory/handoffs/<template>.md` (KIT, read-only), fill it, and **write** the
   filled instance to `plans/handoffs/<WORK-ITEM-ID>-<stage>.md` (STATE, this repo).
   The instance is the work product AND the memory.
```

**Anchor 2 — workflow "Handoffs produced" header (the 14-workflow dir-only pattern)** (`04-ticket-to-pr.md:35-36`):
```markdown
## Handoffs produced
Under `agent-factory/handoffs/`: `implementation-handoff.md` (Software Engineer), `qe-handoff.md` (QE/E2E), and `security-nfr-handoff.md` (Security/NFR, if triggered).
```
**Target form** (these describe RUNTIME INSTANCES → `plans/handoffs/`, RESEARCH `07-RESEARCH.md:205-208`):
```markdown
## Handoffs produced
Under `plans/handoffs/` (filled from the templates in `agent-factory/handoffs/`): `<TICKET-ID>-implementation.md` (Software Engineer), `<TICKET-ID>-qe.md` (QE/E2E), and `<TICKET-ID>-security-nfr.md` (Security/NFR, if triggered).
```

**Convention to replicate:**
- **Per-ref SEMANTIC judgment, NEVER `sed`** (Anti-pattern, RESEARCH `07-RESEARCH.md:150, 433-437`). A blanket `agent-factory/handoffs/` → `plans/handoffs/` relocates template reads and breaks resolution.
- Use the proposed `<stage>` token map (RESEARCH `07-RESEARCH.md:304-321`): `implementation`, `qe`, `security-nfr`, `product`, `system`, `architecture`, `impl-ready`, `ticket-ready`, `uat`, plus ID-scoped `REL-…-release`, `INC-…-postmortem`, `SPRINT-…-{retro,refinement,sprint-plan}`.
- ID scope per D-05: delivery handoffs = **TICKET-ID**; release = **REL-**; incident = **INC-**; sprint artifacts = **sprint ID**.
- Voice: caveman voice is preserved in role prose (CLAUDE.md "Voice discipline"), but path instructions stay literal/clear.

**Highest-miss targets (the 19 dir-only refs, RESEARCH `07-RESEARCH.md:208, 420`):** the "Handoffs produced" header in every workflow (00-13) + "open handoffs" input lines in `orchestrator.md:28`, `09-daily-sweep.md`, `release-manager.md`, `12-release.md`. Each needs per-instance meaning judgment.

---

### Bucket C — handoff READ refs → instance reads (D-06, ~6 refs)

**Role:** role/workflow prose. **Data flow:** transform (upstream packets are now ticket-scoped instances, not templates).

**Analog before-shape** (`agent-factory/roles/qe-e2e.md:22`):
```markdown
- The implementation under review and `agent-factory/handoffs/implementation-handoff.md` from the Software Engineer — the behavior to break ...
```
**Target after-shape** (reads the upstream INSTANCE per D-06, RESEARCH `07-RESEARCH.md:204`):
```markdown
- The implementation under review and the Software Engineer's filled handoff `plans/handoffs/<TICKET-ID>-implementation.md` — the behavior to break ...
```

**Also `software-engineer.md:21`** (reads `implementation-ready-packet`):
```markdown
- `agent-factory/handoffs/implementation-ready-packet.md` / the ticket — read the handoff first ...   ← BEFORE
- the ticket's filled `plans/handoffs/<TICKET-ID>-ticket-ready.md` (from the implementation-ready-packet template) — read the handoff first ...   ← AFTER
```
And `software-engineer.md:35` (the WRITE/"filled per ticket" line for `implementation-handoff`) belongs to Bucket B.

**Convention:** an *input* line that reads an upstream role's product reads the INSTANCE (`plans/handoffs/<ID>-<stage>.md`); the template is read only to *fill a new one* (Bucket B). Distinguish by context — "from the Software Engineer" / "the behavior to break" = reading their produced instance.

---

### Bucket D — kit-to-kit refs → STAY BARE, NO EDIT (~96 refs)

**Role:** role/workflow/checklist/`_commit-convention.md`/packaging prose. **Data flow:** none (correct as-is once D-09 rule is stated).

**Analog (the canonical correct form — do not touch)** (`_role-switch-protocol.md:24`, `orchestrator.md:43`, `04-ticket-to-pr.md:17, 52`):
```markdown
... the role-switch protocol (`agent-factory/roles/_role-switch-protocol.md`) — one window ...
... per `agent-factory/_commit-convention.md` — branch guard first ...
```
**These stay bare** (D-01). The disambiguation rule (Bucket E) resolves them to KIT ROOT.

**Convention to replicate:** **minimal diff** — touch a Bucket-D ref ONLY if the surrounding prose is already being rewritten for another reason. CLAUDE.md Karpathy rules 9-11 (preserve adjacent code, surgical changes, match existing style) apply directly: do not "improve" bare refs.

**CRITICAL planner guard (RESEARCH Pitfall 1, `07-RESEARCH.md:407, 427-431`):** SC5's literal "zero bare `agent-factory/` refs" means zero *misclassified* refs (Assertions 1+2), NOT zero `agent-factory/` strings. ~96 bare kit-to-kit refs are intended to survive. A plan task that says "remove all `agent-factory/` references" is the warning sign of this misread.

---

### Bucket E1 — AGENTS.md canonical kit-vs-state rule (D-09/D-10)

**Role:** AGENTS.md substrate. **Data flow:** transform (new canonical block; currently absent).

**Landing site** — insert as a new section. The natural home is right after the existing **"## Role / workflow / handoff files"** section (`AGENTS.md:19-25`), and the existing `agent-factory/handoffs/` line there (`AGENTS.md:23`) is itself a Bucket-B/D target to reconcile:
```markdown
## Role / workflow / handoff files          ← AGENTS.md:19 (existing)
- Roles:      `agent-factory/roles/`
- Workflows:  `agent-factory/workflows/`
- Handoffs:   `agent-factory/handoffs/`      ← line 23: clarify "(templates; instances → plans/handoffs/)"
- Checklists: `agent-factory/checklists/`
```
Also reconcile the two config refs at `AGENTS.md:13` ("the dial") and `AGENTS.md:66` ("Cadence + WIP") — both Bucket A.

**Canonical rule to author (D-10 spirit, RESEARCH `07-RESEARCH.md:40, 487-494`):**
```markdown
## Kit vs state (where a path resolves)
- `agent-factory/…` = KIT — read-only, resolved from the kit root; NEVER written.
- `plans/` `memory-bank/` `.grugops/` = STATE — read/write in THIS repo.
- `agent-factory/handoffs/<template>.md` is the TEMPLATE you read;
  `plans/handoffs/<WORK-ITEM-ID>-<stage>.md` is the runtime INSTANCE you write.
- The kit root is resolved by the adapter only. If the resolved kit dir is absent: STOP.
  Do not hunt the repo for `agent-factory/…`.
```

**Convention to replicate:** clear voice (this is a safety/resolution rule — CLAUDE.md "clear voice in security findings… and disclaimers"). Say "the kit root" NOT "the absolute path" so the Phase-8 absolute path AND the deferred plugin `${CLAUDE_PLUGIN_ROOT}` both drop in without a re-rewrite (RESEARCH `07-RESEARCH.md:54`). A stable, unique marker phrase belongs here so the SC2 grep is deterministic across all 3 sites (RESEARCH `07-RESEARCH.md:560, 573`).

---

### Bucket E2 — orchestrator preamble compressed invariant (D-09)

**Role:** role prose. **Data flow:** transform (new compressed block).

**Landing site** (`agent-factory/roles/orchestrator.md:1-8`) — between the frontmatter/`# Role: Orchestrator` heading and `## One job`:
```markdown
---
kind: role
tier: core
---
# Role: Orchestrator
                                    ← insert compressed invariant block HERE
## One job
```

**Block to author** — the SAME compressed line as the adapter (byte-identical across the 3 sites, RESEARCH `07-RESEARCH.md:414`), cross-linking AGENTS.md:
```markdown
> **Kit vs state:** `agent-factory/…` = read-only KIT (resolved from the kit root, never written); `plans/`/`memory-bank/`/`.grugops/` = STATE in this repo; read templates from `agent-factory/handoffs/`, write instances to `plans/handoffs/<ID>-<stage>.md`. If the kit dir is absent, STOP — do not hunt. (Full rule: AGENTS.md § Kit vs state.)
```

**Convention to replicate:** match the existing role frontmatter shape (`kind: role` / `tier: core`, `_role-switch-protocol.md:1-4`); the invariant is a 1-2 line blockquote, cross-linking the canonical AGENTS.md rule. **Must NOT name `$GRUGOPS_HOME`** (D-12 / Assertion 3).

---

### Bucket E3 — adapter preamble + sole-resolver self-heal/STOP (D-09/D-11) — the ONLY env-var site

**Role:** adapter (standalone). **Data flow:** event-driven (resolve-or-STOP).

**Landing site 1** (`.claude/agents/grugops-orchestrator.md:6-14`) — after the `---` frontmatter close, before "You follow `agent-factory/roles/orchestrator.md`":
```markdown
---
... frontmatter ...
---
                          ← compressed invariant + resolver block lands HERE
You follow `agent-factory/roles/orchestrator.md` exactly. Read it now, then read
`agent-factory/config/factory.config.json`, ...   ← line 8: config ref = Bucket A rewrite
```

**Landing site 2** (`.claude/skills/grugops/SKILL.md:11-18`) — after frontmatter close, before "Act as the grugops Orchestrator":
```markdown
---
... frontmatter ...
---
                          ← same block lands HERE
Act as the grugops Orchestrator: read `agent-factory/roles/orchestrator.md`, then
`agent-factory/config/factory.config.json`, ...   ← line 13: config ref = Bucket A rewrite
```

**Resolver block to author (D-11, the THREE-step, RESEARCH `07-RESEARCH.md:332-336, 488-494`).** This phase ships steps [2]+[3] only — Phase 8 prepends [1] the absolute path:
```text
Resolve the kit root:
  1. (installed) the absolute kit path the installer wrote above this line.   ← Phase 8 adds [1]
  2. if absent, self-heal:  KIT="${GRUGOPS_HOME:-$HOME/.grugops}/agent-factory"
  3. if "$KIT" still does not exist: STOP. Print:
     "grugops kit not found at <path>. Run install.sh (or install.sh --check) to install the kit."
     Do NOT hunt the repo.
```

**Conventions to replicate / hard rules:**
- **This is the ONLY file class that may contain `${GRUGOPS_HOME:-$HOME/.grugops}`** (D-12). Colon-form `:-` so an empty env var also falls back (RESEARCH `07-RESEARCH.md:340`). Assertion 3 deliberately excludes adapter dirs from its scan for exactly this reason.
- **Sole-resolver single-sourcing (RESEARCH recommendation `07-RESEARCH.md:337):** put the full self-heal/STOP ONLY in `.claude/skills/grugops/SKILL.md` + `.claude/agents/grugops-orchestrator.md`. The other 6 dash-skills + 7 plugin colon-skills carry the **compressed invariant only** (Bucket E2 blockquote) and defer resolution to the orchestrator — confirm in planning.
- Preserve the existing trailing safety line verbatim (`grugops-orchestrator.md:14`, `SKILL.md:18`): *"Never merge to a protected branch. Never deploy to prod. Humans always hold merge and deploy."* (Karpathy rule 9 — preserve adjacent code.)
- The same prose belongs in the **packaging source templates** (`agent-factory/packaging/slash-command.template.md`, `subagent.frontmatter.md`) so the next `install.sh` regenerates consistent adapters, not stale ones (RESEARCH `07-RESEARCH.md:422`).

---

## Shared Patterns

### Caveman vs clear voice (CLAUDE.md "Voice discipline")
**Apply to:** all prose edits.
- Role/workflow body prose keeps caveman voice (existing style — Karpathy rule 11, match existing style).
- The kit-vs-state rule, the STOP/remediation message, and any path-resolution instruction use **clear voice** — these are safety/resolution topics where "the joke earns trust, it never replaces the explanation."

### POSIX house style (single source for the new script)
**Source:** `install/install.sh:24` (the explicit house-style comment) + `check-structure.sh:28-38`.
**Apply to:** `scripts/check-kit-refs.sh`.
```
#!/usr/bin/env sh ; set -eu ; printf not echo -e ; grep -qF ; small named helpers ; FAILS counter ; exit 0/1
```

### Portable-grep flag set (ugrep-aliased host)
**Source:** RESEARCH `07-RESEARCH.md:92, 446-449`; modeled by `install.sh:84,152` + `check-structure.sh:56,84,151,172`.
**Apply to:** `scripts/check-kit-refs.sh`.
- Allowed: `-r -n -l -E -F -q -v -o`. Forbidden: `-P`, `-z`, `--include`, reliance on default recursive include/exclude globs. Pass an explicit SCAN path list.

### No-fabrication / read-only (CLAUDE.md "No fabrication" + Security V12)
**Apply to:** the gate script.
- The gate is strictly read-only — grep + `test` only; no `sed -i`, no writes, no `--fix` (RESEARCH `07-RESEARCH.md:587-589, 598`). Never fake a passing assertion; the trace is the proof.

### `#field` anchor preservation (Security V14)
**Source:** RESEARCH `07-RESEARCH.md:590`.
**Apply to:** every Bucket A config rewrite.
- Only the path root changes (`agent-factory/config/` → `.grugops/`). Dropping a `#wip_limits` / `#quality` anchor would silently change which config field a role reads.

---

## No Analog Found

None. Every bucket has a concrete in-repo analog (the rewrite is, by nature, editing existing files; the one new artifact mirrors two existing POSIX scripts). RESEARCH.md `## Code Examples` provides the gate body and adapter self-heal text verbatim — but these are themselves synthesized from the in-repo analogs above, so no RESEARCH-only fallback is needed.

---

## Seams left for later phases (DO NOT implement here)

| Seam | Owner | This phase's obligation |
|------|-------|-------------------------|
| Installer materializes the absolute kit path (resolver step [1]) | Phase 8 (INSTALL-03..05) | Ship adapter steps [2]+[3] only; leave the "above this line" slot for [1]. Rewrite packaging source templates so Phase 8 regenerates consistent adapters. |
| `.grugops/factory.config.json` file creation | Phase 8 (INSTALL-04) | Rewrite the *pointer* only; do NOT create `.grugops/` (RESEARCH `07-RESEARCH.md:171`). |
| `--check` doctor + two-root validator | Phase 9 (VAL-02) | Do NOT rewrite `scripts/validate-agent-factory.mjs`. Keep `check-kit-refs.sh` standalone so Phase 9 can absorb/call it (D-07). |
| Plugin-form `${CLAUDE_PLUGIN_ROOT}` resolution | PLUGIN-01 (v2+) | Word the rule "the kit root" so the plugin binding drops in without a second rewrite (RESEARCH `07-RESEARCH.md:54`). |
| Migration of already-installed repos | MIGR-01 (v1.2) | Never delete-first; out of scope. |
| SAFE-02 prod-deploy guard / `GRUGOPS_PROD_DEPLOY_APPROVED` | unchanged | Do NOT touch `hooks/` or the deploy guard (RESEARCH `07-RESEARCH.md:599`). |

---

## Metadata

**Analog search scope:** `scripts/`, `.planning/phases/0{3,4,5}-…/check-structure.sh`, `install/`, `agent-factory/{roles,workflows,handoffs,packaging}/`, `.claude/{skills,agents}/`, repo-root `skills/`, `.claude-plugin/`, `AGENTS.md`.
**Files scanned (read in full or targeted):** 9 — `install/install.sh`, `05-…/check-structure.sh`, `.claude/agents/grugops-orchestrator.md`, `.claude/skills/grugops/SKILL.md`, `.claude/skills/grugops-map/SKILL.md`, `_role-switch-protocol.md`, `AGENTS.md`, `orchestrator.md` (head), `04-ticket-to-pr.md` (targeted) + grep over `software-engineer.md`/`qe-e2e.md`/repo-root `skills/`.
**O1 resolved:** repo-root plugin colon-form `skills/` EXIST and are in the rewrite set + gate SCAN.
**Pattern extraction date:** 2026-06-06

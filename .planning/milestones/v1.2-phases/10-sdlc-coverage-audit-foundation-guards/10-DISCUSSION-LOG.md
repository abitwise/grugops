# Phase 10: SDLC-Coverage Audit & Foundation Guards - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-09
**Phase:** 10-SDLC-Coverage Audit & Foundation Guards
**Areas discussed:** SDLC audit shape, Guard wiring & strictness, Guard detection semantics, Config-dial contract

---

## Area selection

| Option | Description | Selected |
|--------|-------------|----------|
| SDLC audit shape | Home, format, scope of the audit artifact | ✓ |
| Guard wiring & strictness | How the 4 guards plug into the gate; language; CI; thresholds | ✓ |
| Guard detection semantics | WR-05 match precision; adapters.md; voice-lint | ✓ |
| Config-dial contract | Contract home; key shapes/defaults; overlap; validator | ✓ |

**User's choice:** All four areas.

---

## SDLC audit shape

### Q1 — Audit home
| Option | Description | Selected |
|--------|-------------|----------|
| docs/audits/ | Durable browsable design artifact; not installed | |
| .planning/ | Internal planning input next to milestone audits | ✓ |
| Shipped in agent-factory/ | Bundle into installed kit | |

**User's choice:** `.planning/` — internal planning artifact (filename `.planning/v1.2-SDLC-COVERAGE-AUDIT.md`, mirroring `v1.1-MILESTONE-AUDIT.md`).

### Q2 — Audit format
| Option | Description | Selected |
|--------|-------------|----------|
| Matrix + gap notes | Lifecycle×role matrix (covered/partial/gap) + per-gap narrative | ✓ |
| Narrative gap list | Prose by lifecycle stage, no matrix | |
| Matrix only | Coverage grid, minimal prose | |

**User's choice:** Matrix + gap notes; business→engineer handoff called out.

### Q3 — Audit scope
| Option | Description | Selected |
|--------|-------------|----------|
| Record + map to phases | Record gaps + cross-ref the addressing phase; flag uncovered | ✓ |
| Record gaps only | Pure findings | |
| Record + propose re-scope | Also propose roadmap changes | |

**User's choice:** Record + map to phases (no re-scope — roadmap fixed).

---

## Guard wiring & strictness

### Q1 — Guard wiring
| Option | Description | Selected |
|--------|-------------|----------|
| One aggregator script | scripts/check-foundation-guards.sh, 4 named functions | ✓ |
| Four separate scripts | One file per guard | |
| Fold into existing | Add to check-kit-refs.sh / validator | |

**User's choice:** One aggregator script.

### Q2 — Guard language
| Option | Description | Selected |
|--------|-------------|----------|
| POSIX sh | Matches check-kit-refs.sh; Node-free gate path | (recommended) |
| Node (extend validator) | Add to validate-agent-factory.mjs | |
| Mixed sh + Node | Structural in sh; voice-lint in Node | |
| **Other (free text)** | **"pivot to TypeScript and not use plain JS or SH anymore"** | ✓ (raised) |

**User's choice (raised):** TypeScript pivot — escalated as a conflict with hard constraints. After a follow-up scoping question (see below), the pivot was **HELD**; Phase 10 proceeds in **POSIX sh**.

#### Follow-up — TS pivot scope
| Option | Description | Selected |
|--------|-------------|----------|
| TS for tooling, keep POSIX install | New Node scripts → .ts via native strip-types; keep POSIX installer | |
| Full pivot incl. installer | Rewrite everything incl. install.sh to TS | |
| Hold — ratify pivot separately | Keep current stack for Phase 10; ratify TS as a project-level decision | ✓ |

**User's choice:** Hold — ratify the pivot separately (PROJECT.md + constraints amendment; touches installers, byte-parity, Node baseline, no-deps identity).

### Q3 — CI now?
| Option | Description | Selected |
|--------|-------------|----------|
| Local-only | Run via script; aggregator stays CI-ready | ✓ |
| Add .github CI now | Wire a workflow on push/PR | |

**User's choice:** Local-only.

### Q4 — Thresholds
| Option | Description | Selected |
|--------|-------------|----------|
| Two-tier WARN→FAIL w/ margin | WARN approaching; FAIL below 32 KiB cap; adapter ceiling | ✓ |
| Hard cap only | FAIL exactly at 32 KiB; no WARN | |
| Let planner set exact numbers | Two-tier, numbers delegated | |

**User's choice:** Two-tier WARN→FAIL with margin (exact numbers → planner).

---

## Guard detection semantics

### Q1 — WR-05 match
| Option | Description | Selected |
|--------|-------------|----------|
| Tool-grant only | Match frontmatter tools:/allowed-tools: with Agent/Task; not prose | ✓ |
| Tool-grant + 'spawn' prose | Also flag the word "spawn"/"sub-agent" | |
| Let planner lock the regex | Delegate exact pattern | |

**User's choice:** Tool-grant only (avoids false-positive on legit no-spawn prose).

### Q2 — adapters.md
| Option | Description | Selected |
|--------|-------------|----------|
| Fix now, keep guard at SC2 set | Correct stale spawn prose; guard scope = 2 templates + 2 adapters | ✓ |
| Also add adapters.md to guard scope | Expand grep to adapters.md | |
| Defer to Phase 11 | Leave as-is | |

**User's choice:** Fix `adapters.md` now; keep guard scope at the SC2 set.

### Q3 — Voice-lint
| Option | Description | Selected |
|--------|-------------|----------|
| Section-scoped over curated surfaces | Marker word-list scanned only in clear-voice zones; exempt caveman body | ✓ |
| Whole-file for all-clear files only | Scan entire all-clear files; exempt mixed roles | |
| Let planner lock surfaces + marker list | Delegate surfaces, anchoring, word list | |

**User's choice:** Section-scoped over curated surfaces; forward-compatible with Phase 11.

---

## Config-dial contract

### Q1 — Contract home
| Option | Description | Selected |
|--------|-------------|----------|
| Extend factory.config.md | Add an "Enterprise escalation" column to the existing twin | ✓ |
| New dedicated doc | docs/config-dial-contract.md or agent-factory/config/dial-contract.md | |
| Section in AGENTS.md | Fold into AGENTS.md (byte-budgeted) | |

**User's choice:** Extend `factory.config.md`.

### Q2 — Key shapes
| Option | Description | Selected |
|--------|-------------|----------|
| Adopt as proposed | Lock the 8 enums/shapes + lean defaults presented | ✓ |
| Adopt, but I'll adjust some | Change specific shapes/defaults | |
| Let planner finalize shapes | Delegate exact enums/shapes | |

**User's choice:** Adopt as proposed — bdd (off|lean|strict→lean); quality.tdd (off|encouraged|required→encouraged); quality.lint ({strict:false,autofix:true}); quality.ui_e2e (off|ui-or-critical-path|always→ui-or-critical-path); quality.test_integrity (warn|block→warn, never off); quality.gate_enforcement (advisory|blocking→blocking); security.asvs_level (L1|L2|L3→L1); security.block_on (none|low|medium|high→high).

### Q3 — Overlap reconciliation
| Option | Description | Selected |
|--------|-------------|----------|
| Rename e2e_when→ui_e2e; lint stays + add quality.lint | One key per concept; lint complementary | ✓ |
| Keep e2e_when AND ui_e2e distinct | Two keys, distinct meanings | |
| Let planner reconcile | Delegate | |

**User's choice:** Rename `e2e_when`→`ui_e2e`; keep `"lint"` in `mandatory_gates` + add complementary `quality.lint`.

### Q4 — Validator
| Option | Description | Selected |
|--------|-------------|----------|
| Active-when-present, lenient-when-absent | Enum-check when present; missing = lean default | ✓ |
| Passive (parse-only) | Just confirm it parses | |
| Strict (require keys present) | Error if a key is absent | |

**User's choice:** Active-when-present, lenient-when-absent (preserves zero-config lean degradation, SC4).

---

## Claude's Discretion

- Exact AGENTS.md WARN/FAIL byte thresholds + the adapter-size pointer ceiling (two-tier approach fixed).
- The caveman-marker word list, the exact clear-voice surface set, and the voice-lint anchoring mechanism.
- The exact WR-05 frontmatter regex.
- Audit lifecycle-stage columns + final filename within `.planning/`.
- Precise `gate_enforcement` / `block_on` semantics (wired in phases 14/15) within the adopted enums.
- Guard test strategy (GREEN-at-commit + planted-violation fail-proof, the likely fit, vs RED-first).

## Deferred Ideas

- ⚑ **TypeScript pivot** — HELD as a project-level decision (PROJECT.md + hard-constraint amendment; install-path / byte-parity / Node-baseline / no-deps implications). Likely its own phase or dedicated discussion.
- **GitHub Actions CI** (`.github/`) — held; guard suite runs local-only, aggregator stays CI-ready.
- **Expanding the WR-05 guard scope beyond the SC2 set** — not done; doc-prose correctness handled by the audit + the one-time adapters.md fix.
- **Wiring the behavior behind the 8 new keys** — phases 12 (BDD/TDD), 13 (UI), 14 (ASVS), 15 (gate convergence). Phase 10 only seeds the keys + contract.

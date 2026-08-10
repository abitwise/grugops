---
schema_version: 1
open_count: 8
waived_count: 0
fixed_count: 0
total_count: 8
last_updated: 2026-08-10T12:15:03.506Z
---

# Broken Windows Ledger

> Cross-phase defect register. With `workflow.windows_enforce` enabled, `/gsd-ship` blocks while `open_count > 0`.
> Waive with `gsd-tools windows waive <id> "<reason>"` (reason required).
> Mark fixed with `gsd-tools windows fixed <id>`.

| id | phase | kind | file | line | description | status | reason | recorded_at | resolved_at |
|----|-------|------|------|------|-------------|--------|--------|-------------|-------------|
| 1 | 27 | unrun-verify | .planning/phases/27-spawn-correctness-kit-set-authority/27-SPAWN-03-RUNTIME-EVIDENCE.md |  | SPAWN-03 runtime half unobserved: the session startup header and whether a distinct role agent resolves and runs; slots empty in the recording surface | open |  | 2026-07-29T10:56:31.216Z |  |
| 2 | 27 | deviation | scripts/coordinator-resolution-precheck.ts |  | The materialized-kit sentinel reader is duplicated from install/install.ts readAdapterKit (install.ts installs at module load, so it cannot be imported) | open |  | 2026-07-29T10:56:31.277Z |  |
| 3 | 27 | deviation | scripts/frontmatter.ts |  | Quoted-wrapped-continuation false-red residual: a double-quoted scalar wrapping onto a line starting with & or * is refused though those bytes are literal; dispositioned accept under T-27-94 (fails closed, no shipped surface produces it) | open |  | 2026-07-30T13:06:23.456Z |  |
| 4 | 27 | deviation | scripts/check-foundation-guards.ts |  | IN-03 (round 5) still live: guardKitCounts asserts per-part SET equality but never asserts the four parts EXHAUST the composition, so a member under no part prefix is unreported by the guard; pinned only over a fixture in kit-model.test.ts. Deliberately out of scope for 27-37 (D-47 names only the catch-swallow). | open |  | 2026-08-04T06:58:26.002Z |  |
| 5 | 27 | deviation | scripts/frontmatter.test.ts |  | 27-38 false-red control: only 1 scoped grant enumeration exists across all 33 spawn-grant scan members, so 'zero false reds across 33 members' rests on one enumeration (the coordinator's 16-name grant), not 33 | open |  | 2026-08-04T07:22:51.768Z |  |
| 6 | 27 | deviation | scripts/validate-agent-factory.ts |  | Not a spawn-grant surface (0 spawn / 0 frontmatter / 0 wr05); the round-7 'validator printed ALL CHECKS PASSED' criterion is unsatisfiable and is owned by no round-8 plan. 27-44-SUMMARY.md recommends retiring it. | open |  | 2026-08-09T10:23:33.078Z |  |
| 7 | 27 | deviation | scripts/frontmatter.test.ts |  | 27-55: AXIS_SPELLING places the block sibling only AFTER the payload, so block-BEFORE ordering is outside the union axis's shape space (covered instead by the U4 adjacency case and probes a4/a6/a7) | open |  | 2026-08-10T12:15:03.445Z |  |
| 8 | 27 | deviation | scripts/frontmatter.test.ts |  | 27-55: the pre-fix-mirror non-circularity count is 1 of 72 cells — non-empty so the axis provably sees the defect, but thin; add an ORDERING member to AXIS_SPELLING and re-take the count | open |  | 2026-08-10T12:15:03.506Z |  |

````json
[
  {
    "id": 1,
    "kind": "unrun-verify",
    "phase": "27",
    "file": ".planning/phases/27-spawn-correctness-kit-set-authority/27-SPAWN-03-RUNTIME-EVIDENCE.md",
    "line": null,
    "description": "SPAWN-03 runtime half unobserved: the session startup header and whether a distinct role agent resolves and runs; slots empty in the recording surface",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-07-29T10:56:31.216Z",
    "resolved_at": null
  },
  {
    "id": 2,
    "kind": "deviation",
    "phase": "27",
    "file": "scripts/coordinator-resolution-precheck.ts",
    "line": null,
    "description": "The materialized-kit sentinel reader is duplicated from install/install.ts readAdapterKit (install.ts installs at module load, so it cannot be imported)",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-07-29T10:56:31.277Z",
    "resolved_at": null
  },
  {
    "id": 3,
    "kind": "deviation",
    "phase": "27",
    "file": "scripts/frontmatter.ts",
    "line": null,
    "description": "Quoted-wrapped-continuation false-red residual: a double-quoted scalar wrapping onto a line starting with & or * is refused though those bytes are literal; dispositioned accept under T-27-94 (fails closed, no shipped surface produces it)",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-07-30T13:06:23.456Z",
    "resolved_at": null
  },
  {
    "id": 4,
    "kind": "deviation",
    "phase": "27",
    "file": "scripts/check-foundation-guards.ts",
    "line": null,
    "description": "IN-03 (round 5) still live: guardKitCounts asserts per-part SET equality but never asserts the four parts EXHAUST the composition, so a member under no part prefix is unreported by the guard; pinned only over a fixture in kit-model.test.ts. Deliberately out of scope for 27-37 (D-47 names only the catch-swallow).",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-04T06:58:26.002Z",
    "resolved_at": null
  },
  {
    "id": 5,
    "kind": "deviation",
    "phase": "27",
    "file": "scripts/frontmatter.test.ts",
    "line": null,
    "description": "27-38 false-red control: only 1 scoped grant enumeration exists across all 33 spawn-grant scan members, so 'zero false reds across 33 members' rests on one enumeration (the coordinator's 16-name grant), not 33",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-04T07:22:51.768Z",
    "resolved_at": null
  },
  {
    "id": 6,
    "kind": "deviation",
    "phase": "27",
    "file": "scripts/validate-agent-factory.ts",
    "line": null,
    "description": "Not a spawn-grant surface (0 spawn / 0 frontmatter / 0 wr05); the round-7 'validator printed ALL CHECKS PASSED' criterion is unsatisfiable and is owned by no round-8 plan. 27-44-SUMMARY.md recommends retiring it.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-09T10:23:33.078Z",
    "resolved_at": null
  },
  {
    "id": 7,
    "kind": "deviation",
    "phase": "27",
    "file": "scripts/frontmatter.test.ts",
    "line": null,
    "description": "27-55: AXIS_SPELLING places the block sibling only AFTER the payload, so block-BEFORE ordering is outside the union axis's shape space (covered instead by the U4 adjacency case and probes a4/a6/a7)",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-10T12:15:03.445Z",
    "resolved_at": null
  },
  {
    "id": 8,
    "kind": "deviation",
    "phase": "27",
    "file": "scripts/frontmatter.test.ts",
    "line": null,
    "description": "27-55: the pre-fix-mirror non-circularity count is 1 of 72 cells — non-empty so the axis provably sees the defect, but thin; add an ORDERING member to AXIS_SPELLING and re-take the count",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-08-10T12:15:03.506Z",
    "resolved_at": null
  }
]
````

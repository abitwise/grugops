---
schema_version: 1
open_count: 4
waived_count: 0
fixed_count: 0
total_count: 4
last_updated: 2026-08-04T06:58:26.002Z
---

# Broken Windows Ledger

> Cross-phase defect register. `/gsd-ship` blocks while `open_count > 0`.
> Waive with `gsd-tools windows waive <id> "<reason>"` (reason required).
> Mark fixed with `gsd-tools windows fixed <id>`.

| id | phase | kind | file | line | description | status | reason | recorded_at | resolved_at |
|----|-------|------|------|------|-------------|--------|--------|-------------|-------------|
| 1 | 27 | unrun-verify | .planning/phases/27-spawn-correctness-kit-set-authority/27-SPAWN-03-RUNTIME-EVIDENCE.md |  | SPAWN-03 runtime half unobserved: the session startup header and whether a distinct role agent resolves and runs; slots empty in the recording surface | open |  | 2026-07-29T10:56:31.216Z |  |
| 2 | 27 | deviation | scripts/coordinator-resolution-precheck.ts |  | The materialized-kit sentinel reader is duplicated from install/install.ts readAdapterKit (install.ts installs at module load, so it cannot be imported) | open |  | 2026-07-29T10:56:31.277Z |  |
| 3 | 27 | deviation | scripts/frontmatter.ts |  | Quoted-wrapped-continuation false-red residual: a double-quoted scalar wrapping onto a line starting with & or * is refused though those bytes are literal; dispositioned accept under T-27-94 (fails closed, no shipped surface produces it) | open |  | 2026-07-30T13:06:23.456Z |  |
| 4 | 27 | deviation | scripts/check-foundation-guards.ts |  | IN-03 (round 5) still live: guardKitCounts asserts per-part SET equality but never asserts the four parts EXHAUST the composition, so a member under no part prefix is unreported by the guard; pinned only over a fixture in kit-model.test.ts. Deliberately out of scope for 27-37 (D-47 names only the catch-swallow). | open |  | 2026-08-04T06:58:26.002Z |  |

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
  }
]
````

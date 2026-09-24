# grugops live-capture report — DRY RUN (fixture-derived)

Generated 2026-09-24T18:46:49.424Z by scripts/capture-live.js (mode: dry-run). Every row of a "claim" table cites the transcript line it was derived from; a row with no citation is withheld, not written.

## Run

| field | value |
|---|---|
| mode | dry-run |
| checkout sha | 6a2dca3814cc57a1d80613272af974d461a34ef4 |
| platform version | 2.1.281 (Claude Code) |
| per-call bound (ms) | 1200000 |
| bound actually used | not applied — no platform call was made |
| approval key in child env | absent; asserted on the constructed child environment before every spawn |
| installed plugin provenance after the run (D-05, per system/init, content digest over 2489 tracked files) | UNKNOWN - verify — the installed copy's digest could not be derived: the path the init frame names for grugops was not accepted under the plugin cache root (it must be an existing directory strictly inside <redacted>/.claude/plugins, not dash-prefixed, judged on its real path) |
| plugin under test per system/init | grugops 2.1.0 at /tmp/fixture-plugin-cache/grugops |
| run A transcript | 33-DRY-RUN-FROM-FIXTURE.jsonl (15 line(s), 15 frame(s), 0 partial line(s)) |
| run A transcript location | runner-owned scratch, outside every target and outside the run's working directory |
| run A argv | ["(dry run: no platform invocation)"] |
| run A tool grant | ["Agent","Read","Grep","Glob","Edit(//private/var/folders/y3/c2txpd5d6tv9wgxtq1wn0skh0000gn/T/grugops-capture-live-target-A-KgNTP8/**)","Bash(node *)","Bash(helm upgrade *)","mcp__plugin_grugops_grugops__propose_note"] |
| run A plugin provenance before the spawn | UNKNOWN - verify — the installed copy's digest could not be derived: no local-scope row for this target in the plugin registry <redacted>/.claude/plugins/installed_plugins.json (none, or more than one) — the platform recorded no single install of grugops@grugops scoped to /var/folders/y3/c2txpd5d6tv9wgxtq1wn0skh0000gn/T/grugops-capture-live-target-A-KgNTP8 — nothing was installed for this run (dry run, D-10); the live run refuses to spawn unless this row is MET; registry gitCommitSha (none); install path (none) |
| run A plugin uninstall | not run — no plugin was installed for this run (dry run, D-10) |
| run A claim rows withheld (no citation) | 0 |
| run B transcript | 33-DRY-RUN-FROM-FIXTURE.jsonl (15 line(s), 15 frame(s), 0 partial line(s)) |
| run B transcript location | runner-owned scratch, outside every target and outside the run's working directory |
| run B argv | ["(dry run: no platform invocation)"] |
| run B tool grant | ["Agent","Read","Grep","Glob","Edit(//private/var/folders/y3/c2txpd5d6tv9wgxtq1wn0skh0000gn/T/grugops-capture-live-target-B-40ZHDE/**)","Bash(node *)","Bash(helm upgrade *)","mcp__plugin_grugops_grugops__propose_note"] |
| run B plugin provenance before the spawn | UNKNOWN - verify — the installed copy's digest could not be derived: no local-scope row for this target in the plugin registry <redacted>/.claude/plugins/installed_plugins.json (none, or more than one) — the platform recorded no single install of grugops@grugops scoped to /var/folders/y3/c2txpd5d6tv9wgxtq1wn0skh0000gn/T/grugops-capture-live-target-B-40ZHDE — nothing was installed for this run (dry run, D-10); the live run refuses to spawn unless this row is MET; registry gitCommitSha (none); install path (none) |
| run B plugin uninstall | not run — no plugin was installed for this run (dry run, D-10) |
| run B claim rows withheld (no citation) | 0 |

## Preconditions

| precondition | state | detail |
|---|---|---|
| platform version readable | MET | 2.1.281 (Claude Code) |
| coordinator-resolution precheck | MET | PRECONDITIONS HOLD: every observable precondition of the coordinator-resolution check is satisfied on this tree. The two runtime steps above are NOT PERFORMED by this command, and SPAWN-03's runtime half stays unverified until a human observes it and records the observation in .planning/phases/27-spawn-correctness-kit-set-authority/27-SPAWN-03-RUNTIME-EVIDENCE.md. |
| flag --include-hook-events in --help | MET | present in the help text |
| flag --agent in --help | MET | present in the help text |
| flag --plugin-dir in --help | MET | present in the help text |
| flag --output-format in --help | MET | present in the help text |
| flag --forward-subagent-text in --help | MET | present in the help text |
| marketplace row grugops | MET | the row is present in the marketplace listing (D-05 route 2 source) |
| plugin listing readable | MET | the listing names grugops |
| pushed sha (local HEAD equals the remote default branch head) | MET | 6a2dca3814cc57a1d80613272af974d461a34ef4 equals origin/main (ahead count 0; read from the remote-tracking ref as last fetched; no network was used) |
| working tree matches HEAD under the directories the installer and the plugin read | MET | git status --porcelain --untracked-files=all is empty under agent-factory, .claude, .claude-plugin, install, skills, hooks, scripts, AGENTS.md |
| prod-deploy approval key absent from the environment | MET | absent from the parent environment and asserted absent on every constructed child environment |

GO-READINESS: ready

## Target build (D-03)

- target A: the installer ran cleanly into a fresh copy of the fixture project with an isolated kit home; nothing outside those two directories was written
- target B: the installer ran cleanly into a fresh copy of the fixture project with an isolated kit home; nothing outside those two directories was written

## Transcript claims — run A (33-DRY-RUN-FROM-FIXTURE.jsonl)

| claim (run A, 33-DRY-RUN-FROM-FIXTURE.jsonl) | value | citation |
|---|---|---|
| frame kind system/init | 1 frame(s) | jsonl:1 |
| frame kind assistant/(none) | 6 frame(s) | jsonl:2 |
| frame kind user/(none) | 2 frame(s) | jsonl:4 |
| frame kind system/task_notification | 1 frame(s) | jsonl:8 |
| frame kind system/hook_started | 2 frame(s) | jsonl:10 |
| frame kind system/hook_response | 2 frame(s) | jsonl:11 |
| frame kind result/success | 1 frame(s) | jsonl:15 |
| D-02 side (a): Agent spawn of grugops-architect-design | toolu_fixture_arch_01; evidence nested-frames (2 nested frame(s), first at jsonl:4) | jsonl:3 |
| D-02 side (a): Agent spawn of grugops-security-nfr | toolu_fixture_sec_02; evidence task-notification (task_notification at jsonl:8) | jsonl:7 |
| D-04 prod-deploy deny observed in a hook_response.stdout | yes — hook PreToolUse:Bash; 1 hook_response frame(s) examined up to the match | jsonl:11 |
| D-05 plugins loaded per system/init | grugops 2.1.0 at /tmp/fixture-plugin-cache/grugops | jsonl:1 |
| D-05 plugin_errors per system/init | none | jsonl:1 |
| result: total_cost_usd | 0.4321 | jsonl:15 |
| result: duration_ms | 18342 | jsonl:15 |
| result: duration_api_ms | 15210 | jsonl:15 |
| result: num_turns | 6 | jsonl:15 |

## Target observations — run A

| observation (run A) | value | citation |
|---|---|---|
| install | the installer ran cleanly into a fresh copy of the fixture project with an isolated kit home; nothing outside those two directories was written | path:.claude/agents |
| derived grant | 16 granted name(s); 17 adapter name(s); coordinator grugops-orchestrator; prefix "grugops-"; the two derivations agree: census 17 = grant 16 + the coordinator | path:.claude/agents |
| D-02 side (b) author stamps | no live note under .grugops/context | path:.grugops/context |
| verdict marker READY_FOR_HUMAN_REVIEW | absent from every live note | path:.grugops/context |

## CAP-03 verdict (D-02) — run A

- side (b): no live note exists under the target's context root, so no author stamp can be read

## Transcript claims — run B (33-DRY-RUN-FROM-FIXTURE.jsonl)

| claim (run B, 33-DRY-RUN-FROM-FIXTURE.jsonl) | value | citation |
|---|---|---|
| frame kind system/init | 1 frame(s) | jsonl:1 |
| frame kind assistant/(none) | 6 frame(s) | jsonl:2 |
| frame kind user/(none) | 2 frame(s) | jsonl:4 |
| frame kind system/task_notification | 1 frame(s) | jsonl:8 |
| frame kind system/hook_started | 2 frame(s) | jsonl:10 |
| frame kind system/hook_response | 2 frame(s) | jsonl:11 |
| frame kind result/success | 1 frame(s) | jsonl:15 |
| D-02 side (a): Agent spawn of grugops-architect-design | toolu_fixture_arch_01; evidence nested-frames (2 nested frame(s), first at jsonl:4) | jsonl:3 |
| D-02 side (a): Agent spawn of grugops-security-nfr | toolu_fixture_sec_02; evidence task-notification (task_notification at jsonl:8) | jsonl:7 |
| D-04 prod-deploy deny observed in a hook_response.stdout | yes — hook PreToolUse:Bash; 1 hook_response frame(s) examined up to the match | jsonl:11 |
| D-05 plugins loaded per system/init | grugops 2.1.0 at /tmp/fixture-plugin-cache/grugops | jsonl:1 |
| D-05 plugin_errors per system/init | none | jsonl:1 |
| result: total_cost_usd | 0.4321 | jsonl:15 |
| result: duration_ms | 18342 | jsonl:15 |
| result: duration_api_ms | 15210 | jsonl:15 |
| result: num_turns | 6 | jsonl:15 |

## Target observations — run B

| observation (run B) | value | citation |
|---|---|---|
| install | the installer ran cleanly into a fresh copy of the fixture project with an isolated kit home; nothing outside those two directories was written | path:.claude/agents |
| derived grant | 16 granted name(s); 17 adapter name(s); coordinator grugops-orchestrator; prefix "grugops-"; the two derivations agree: census 17 = grant 16 + the coordinator | path:.claude/agents |
| D-02 side (b) author stamps | no live note under .grugops/context | path:.grugops/context |
| verdict marker READY_FOR_HUMAN_REVIEW | absent from every live note | path:.grugops/context |

## CAP-03 verdict (D-02) — run B

- side (b): no live note exists under the target's context root, so no author stamp can be read

## Dual-path parity (D-07) — path-invariant projection

Per role: the admitted-note count and the kind multiset; then the frozen verdict marker and the route the notes took to disk. `at` stamps, note bodies, task ids and refs are model-chosen and do not enter (33-DIAGNOSIS § 1.2).

Run A:

| role | notes | kinds |
|---|---|---|
| (no live note) | 0 | |
| verdict marker READY_FOR_HUMAN_REVIEW | absent | |
| note route: direct writes into the context root | 0 | |
| note route: propose_note tool-use blocks | 0 | |
| note route: indirect write-shaped blocks naming the context root | 0 | |

Run B:

| role | notes | kinds |
|---|---|---|
| (no live note) | 0 | |
| verdict marker READY_FOR_HUMAN_REVIEW | absent | |
| note route: direct writes into the context root | 0 | |
| note route: propose_note tool-use blocks | 0 | |
| note route: indirect write-shaped blocks naming the context root | 0 | |

- parity: the two projections are equal

## Replay comparator (informational — task-id keyed, deterministic replay only)

The DOGF-01 replay comparator keeps `at`, `refs` and `body` and keys on the task id; over two independent live sessions its grammar guarantees a diff (33-DIAGNOSIS § 1.2). Its output is recorded and is not an input to the outcome.

- assertEquivalent over the two targets' context roots returned no diff

## Completion

Outcome reason: no model call was made — a dry run is not a capture (D-10, D-11)
DRY RUN COMPLETE — no model call was made

OUTCOME: no-go

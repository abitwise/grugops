# Phase 33 — Dry-run report (plan 33-10, Task 1; D-10)

The zero-token readiness evidence that D-10 requires BEFORE any go is asked for. Filed
2026-09-20 by plan 33-10 Task 1 against checkout `112470a6a6251e5fccd291c11109a21b6ba5bbe1`,
which is `origin/main` as last fetched. Two halves: this preamble (the operator's re-probe, the
provenance route, the command transcript, the spend figures) and, under "The runner's report,
verbatim", the report `scripts/capture-live.js --dry-run` wrote, appended byte for byte.

No model call was made anywhere in this task. Every platform invocation below prints metadata and
exits. The runner's completion wording, quoted exactly as printed on its last stdout line:

> `DRY RUN COMPLETE — no model call was made`

The runner exited 0 in about 1 s of wall clock. Exit 0 is the runner's COMPLETION contract, not
readiness; readiness is the separate `GO-READINESS` line in the runner's report (exactly one, and
it reads ready). A dry run is not a capture, so the runner's outcome word is the no-go word
(exactly one line, at the end of the runner's report).

## 1. Re-probe: the research's recorded values beside today's measured values

The research (`33-RESEARCH.md`, dated 2026-09-19, valid until 2026-10-03) says its flag and
version measurements must be re-probed rather than trusted, because the platform ships several
releases a week. Re-probed 2026-09-20 with `claude --version`, `claude --help`,
`claude plugin marketplace list` and `claude plugin list`, each a metadata invocation.

| item | research recorded (2026-09-19) | measured today (2026-09-20) | difference |
|---|---|---|---|
| platform version (`claude --version`) | `2.1.278 (Claude Code)` | `2.1.278 (Claude Code)` | none |
| flag `--include-hook-events` in `--help` | present | present (1 flag row) | none |
| flag `--agent <agent>` in `--help` | present | present (1 flag row) | none — the description text is identical; only the terminal wrap width differs |
| flag `--plugin-dir <path>` in `--help` | present | present (1 flag row) | none |
| flag `--output-format <format>` in `--help` | present, choices text / json / stream-json | present (1 flag row), same three choices | none |
| flag `--forward-subagent-text` in `--help` | present (the fifth flag the research added beyond CONTEXT) | present (1 flag row) | none |
| `--help` text | quoted per flag | 302 lines, 21401 bytes; sha256 prefix `ae85d661e9c086f0` | recorded so the next round can diff against it |
| marketplace rows | `claude-plugins-official` (GitHub anthropics/claude-plugins-official), `grugops` (GitHub abitwise/grugops) | the same two rows, same sources | none |
| plugin listing | not quoted in the research | readable; 9 installed rows plus 2 synced rows; two `grugops@grugops` rows (see § 2) | new observation, not a difference |
| binary location | recorded under the operator's home directory | resolves under the operator's home directory | not repeated here — home paths are redacted from every committed artifact (D-06) |

Verdict on the re-probe: the platform is the same release the research measured, and every flag
the live invocation depends on is present. Nothing moved.

## 2. Observations beyond the precondition table

- **Plugin-registry residue.** `claude plugin list` shows two `grugops@grugops` rows, both
  `Version: 0.1.0` (the retired pre-release seed; the checkout's `plugin.json` declares 2.1.0),
  both `disabled`: one at project scope whose project path is a repository outside this
  checkout, and one at local scope whose project path is a temporary target of the 2026-09-18
  live run (a `grugops-uat-e2e-*` directory under the system temp root, which no longer exists).
  Neither row belongs to this checkout. The runner installs at LOCAL scope inside its own
  `mkdtemp` target and uninstalls in cleanup, so neither row collides with the live run by
  construction; they are the "residue" the runner header cites as a reason route 1 was
  rejected. The runner's `plugin listing readable` row is MET on the listing being readable at
  all; the `the listing names grugops` detail is satisfied by these residue rows and would read
  differently on a clean machine, which is informational either way. Nothing was removed; a
  cleanup of user plugin state is not this plan's file set.
- **The coordinator-resolution precheck** ran as a child of the runner and exited 0 with its
  own non-pass wording (quoted in the runner's precondition table). Its three hard rules —
  no model session, wording that does not read as a pass, every write in a scratch directory it
  created — are inherited by the dry run through that invocation, never re-implemented.
- **The pushed-sha row is MET now:** local HEAD `112470a6…` equals `origin/main` (ahead count
  0), read from the remote-tracking ref as last fetched with no network. Plan 33-09's Task 2 push
  of `d9bd4315` and the two docs commits pushed after it (`b1f8850a`, `112470a6`) put the remote
  head where it is. See § 6 for what committing THIS report does to that row.

## 3. Provenance route for the plugin install (D-05)

Route 2, exactly as the runner header records it (`scripts/capture-live.ts`, "D-05 PLUGIN
PROVENANCE — ROUTE CHOSEN AND ROUTES REJECTED"): install `grugops@grugops` from the existing
user-scope marketplace row (`abitwise/grugops`, GitHub source) at LOCAL scope inside each target,
then verify the installed sha POST HOC by reading `system/init.plugins[].path` from the
transcript and running `git -C <that path> rev-parse HEAD`.

Why: neither `claude plugin install` nor `claude plugin marketplace add` accepts a sha, ref, tag
or version pin (research § "claude plugin install has NO sha/ref pin", re-confirmed today: the
`--help` text carries no such option), so "install at the exact sha" is not expressible as a
command. Route 2 needs no generated catalog, adds no marketplace row to user state, and lands
the sha evidence inside the capture itself. Route 1 (a throwaway pinned catalog under a
non-colliding name) stays the fallback if the post-hoc sha is not the head under test. Route 3
(`--plugin-dir <checkout>`) is not a plugin-cache copy and therefore does not exercise the D-31
cache-pointer resolution; it remains the deny-case fallback D-04 names, not a provenance route.
The precondition that makes route 2 exact — the head under test is pushed — is MET above.

## 4. Commands run in this task, in order (the zero-token transcript)

Every invocation of the platform is a metadata probe; there is no `-p`, no `--print`, no
interactive session. Commands 1–4 were run by the operator directly; command 5 is the runner,
which itself re-runs 1–4 in its phase 1, invokes the precheck as a child (which runs
`claude --version` and this repository's installer into a scratch target), and runs the
installer into two `mkdtemp` targets in its phase 2. The runner's `runPlatform` (the `claude -p`
spawn) is reachable only from its `capture()` function, which `--dry-run` never enters.

1. `claude --version` — exit 0
2. `claude --help` — exit 0
3. `claude plugin marketplace list` — exit 0
4. `claude plugin list` — exit 0
5. `node scripts/capture-live.js --dry-run --out .planning/phases/33-live-capture-windows-portability` — exit 0

Also run, read-only, for the git rows: `git rev-parse HEAD`, `git rev-parse origin/main`
(equal), `git status --short` (no tracked change; two untracked entries that predate this plan
and are not touched by it).

Not run, by prohibition: `npm test` (bare), `scripts/e2e/uat-live.test.ts`, any `claude -p`.

## 5. Filing note

The runner names its dry-run pair `33-DRY-RUN-FROM-FIXTURE-REPORT.md` and
`33-DRY-RUN-FROM-FIXTURE.jsonl` so a fixture-derived report can never be mistaken for a capture.
The plan files the report as `33-DRYRUN-REPORT.md` (this file): the runner's report is appended
below without modification (verified with `cmp` over the appended byte range before commit).
The `.jsonl` twin is byte-identical to the committed fixture
`scripts/e2e/fixtures/capture-sample.jsonl` (verified with `cmp`) and is not filed a second time.
Both runner-named files were removed from the phase directory after filing, because the runner's
`--verify-artifacts` mode — which Task 3 runs over this same directory — requires exactly one
report (`33-DRY-RUN-FROM-FIXTURE-REPORT.md` or `33-CAPTURE-SUMMARY.md`) in the directory and
would refuse the live artifact set with "found 2" if the dry-run report were still beside it.

## 6. What committing this report does to the pushed-sha row

Committing this file moves local HEAD one commit ahead of `origin/main`. The runner's live mode
re-derives the precondition table at start and refuses to begin while any row is not MET
(`scripts/capture-live.ts`, `capture()`: "the live capture refuses to start while any
precondition is not MET"). So the continuation that runs Task 3 needs HEAD to equal the remote
head again at that moment: the report commit (docs only) must be pushed first, by the human or
with the human's explicit "push approved". This executor pushes nothing.

## 7. The spend figures for the checkpoint text (D-09), measured and derived

Measured, from the one previously authorized live run (2026-09-18; research § "Measured cost /
duration figures", citing `32.1-10-LIVE-TRANSCRIPT.txt` and `32.1-10-SUMMARY.md`):

| case | duration | `total_cost_usd` |
|---|---:|---:|
| A2-live | 11 663 ms | 0.398524 |
| A3-live seq | 181 176 ms API | 2.15167525 |
| A3-live sub | 159 388 ms API | 1.78309750 |
| A1 | 606 161 ms (two calls, each cut at a 300 000 ms bound) | not reported (empty capture) |
| whole lane | 1 503 s (25 min 03 s) | 4.33329775 USD reported; A1 unreported, so a FLOOR |

Spend floor: 0.398524 + 2.15167525 + 1.78309750 = **4.33 USD** (rounded down; the A1 calls
reported no cost, so the true figure for that lane was higher).

Derived for THIS run, from the runner's fixed bounds (`scripts/capture-live.ts`:
`CALL_BOUND_MS` 1 200 000; `SIGTERM_GRACE_MS` 30 000; `PROBE_BOUND_MS` 20 000;
`PRECHECK_BOUND_MS` 180 000; `INSTALL_BOUND_MS` 120 000; `PLUGIN_OP_BOUND_MS` 120 000):

- Model calls: two (runs A and B, the two D-07 dispatch paths), each under a 1 200 000 ms
  (20 min) bound, SIGINT at the bound and SIGTERM 30 s later. Bound on model wall clock:
  2 × 20 min = **40 min**.
- Whole-run wall-clock ceiling, every bound summed in the order the runner spends them:
  4 probes × 20 s (80 s) + precheck 180 s + 2 targets × (git init 20 s + installer 120 s)
  (280 s) + 2 runs × (plugin install 120 s + call 1 200 s + grace 30 s + uninstall 120 s)
  (2 940 s) = 3 480 s = **58 min**. The previous lane's measured 25 min 03 s is the realistic
  expectation; 58 min is what the bounds permit before the runner stops on its own.
- Cost: the runner bounds TIME, not spend; no cost ceiling can be stated as a measurement.
  The two measured completed calls ran at 2.15 USD per 181 s and 1.78 USD per 159 s of API time.
  Two calls of the same shape are the floor (about 3.9 USD for the pair plus whatever the
  probe turn costs); a call that runs to its 20-minute bound would cost several times a
  completed one, and that is an extrapolation, not a measurement.

The bound actually used is written into the capture summary by the runner (`bound actually
used` row), so the figure the summary records is the figure the run ran under.

---

## The runner's report, verbatim

# grugops live-capture report — DRY RUN (fixture-derived)

Generated 2026-09-20T11:12:45.714Z by scripts/capture-live.js (mode: dry-run). Every row of a "claim" table cites the transcript line it was derived from; a row with no citation is withheld, not written.

## Run

| field | value |
|---|---|
| mode | dry-run |
| checkout sha | 112470a6a6251e5fccd291c11109a21b6ba5bbe1 |
| platform version | 2.1.278 (Claude Code) |
| per-call bound (ms) | 1200000 |
| bound actually used | not applied — no platform call was made |
| approval key in child env | absent; asserted on the constructed child environment before every spawn |
| installed plugin sha (D-05, post hoc) | UNKNOWN - verify — `git -C <plugin path> rev-parse HEAD` could not be read for the path the init frame named |
| run A transcript | 33-DRY-RUN-FROM-FIXTURE.jsonl (15 line(s), 15 frame(s), 0 partial line(s)) |
| run A argv | ["(dry run: no platform invocation)"] |
| run A claim rows withheld (no citation) | 0 |
| run B transcript | 33-DRY-RUN-FROM-FIXTURE.jsonl (15 line(s), 15 frame(s), 0 partial line(s)) |
| run B argv | ["(dry run: no platform invocation)"] |
| run B claim rows withheld (no citation) | 0 |

## Preconditions

| precondition | state | detail |
|---|---|---|
| platform version readable | MET | 2.1.278 (Claude Code) |
| coordinator-resolution precheck | MET | PRECONDITIONS HOLD: every observable precondition of the coordinator-resolution check is satisfied on this tree. The two runtime steps above are NOT PERFORMED by this command, and SPAWN-03's runtime half stays unverified until a human observes it and records the observation in .planning/phases/27-spawn-correctness-kit-set-authority/27-SPAWN-03-RUNTIME-EVIDENCE.md. |
| flag --include-hook-events in --help | MET | present in the help text |
| flag --agent in --help | MET | present in the help text |
| flag --plugin-dir in --help | MET | present in the help text |
| flag --output-format in --help | MET | present in the help text |
| flag --forward-subagent-text in --help | MET | present in the help text |
| marketplace row grugops | MET | the row is present in the marketplace listing (D-05 route 2 source) |
| plugin listing readable | MET | the listing names grugops |
| pushed sha (local HEAD equals the remote default branch head) | MET | 112470a6a6251e5fccd291c11109a21b6ba5bbe1 equals origin/main (ahead count 0; read from the remote-tracking ref as last fetched; no network was used) |
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

## Dual-path equivalence (D-07)

- assertEquivalent over the two targets' context roots returned no diff

## Completion

Outcome reason: no model call was made — a dry run is not a capture (D-10, D-11)
DRY RUN COMPLETE — no model call was made

OUTCOME: no-go

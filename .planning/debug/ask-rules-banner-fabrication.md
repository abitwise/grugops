---
status: diagnosed
trigger: "G-34-4 / WR-12: the install closing banner always prints 'This installer wrote Claude Code ask rules for the governed command spellings into .claude/settings.json.' even when writeAskRules() wrote nothing (e.g. 'no ask rule was added to .claude/settings.json' in the same run, settings.json absent)"
created: 2026-10-09T19:33:00Z
updated: 2026-10-09T19:45:00Z
goal: find_root_cause_only
gap: G-34-4
---

## Current Focus

bug_class: Bohrbug (deterministic: the notes block is a fixed sequence of console.log string literals; no timing, no environment input)
hypothesis: CONFIRMED (H1). The sentence at install/install.ts:5745-5746 is a string literal inside an unconditional run of console.log calls (5739-5754). writeAskRules() (5486-5715) is declared `void` and records no outcome anywhere the notes block reads, so the sentence prints for every one of its 14 outcomes, including the 10 that write nothing and raise a verify, the dry run, and the toAdd==0 arms.
test: done. Scratch matrix of 9 installs (scratch GRUGOPS_HOME and --target under the session scratchpad; ~/.grugops mtime unchanged at 18:29:55): the sentence printed exactly once in all 9, including 8 runs where this run wrote no rule and 4 where .claude/settings.json does not exist.
expecting: met.
next_action: return ROOT CAUSE FOUND to the caller (goal is find_root_cause_only; the fix is for plan-phase --gaps)

reasoning_checkpoint:
  hypothesis: "The notes block prints 'This installer wrote Claude Code ask rules ... into .claude/settings.json.' from a string literal (install.ts:5745-5746) that no condition guards, because writeAskRules() returns void and leaves no record of what it did that the banner could read. So every run that reaches the main flow's tail prints the claim, whatever writeAskRules did."
  confirming_evidence:
    - "Source: 5739-5754 contain no if, no variable read (except HOST_TOOLS at 5752), no reference to ASK_LEDGER, VERIFY_FINDINGS or DRY_RUN; writeAskRules has 14 return points and returns nothing."
    - "Scratch reproduction, committed install.js (same literal at install.js:5108): the sentence printed once in every one of 9 runs: fresh success, second run, malformed settings.json, malformed ask-rules ledger, unreadable marker (settings.json ABSENT), every checkpoint off (exit 0, settings.json ABSENT), DRY_RUN (settings.json ABSENT), dangling link at settings.json (ABSENT), and a settings.json already holding all 55 rules as the user's own."
    - "In the unreadable-marker run the same stdout carries 'verify .grugops/install.json ... — no ask rule was added to .claude/settings.json' (line 78) and then the sentence, with no .claude/settings.json on disk: the exact WR-12 symptom, reached without any Windows marker."
  falsification_test: "If any run whose writeAskRules wrote nothing omitted the sentence, or if the notes block read any writeAskRules outcome, H1 would be false. All 9 runs printed it; the block reads none."
  fix_rationale: "N/A (diagnose-only). A fix has to give the banner the outcome writeAskRules decided (one owner of that answer), not re-derive it from ASK_LEDGER or VERIFY_FINDINGS, both of which misreport (Evidence 19:35:30Z)."
  blind_spots: "R5-R8, R11 and R13 were not run here (R5-R8 are run by install.test.ts:6286 with the full installer; R11/R13 are hard to stage). Their 'nothing written' status is read from source, and the notes block cannot vary by arm, so they print the sentence too. Windows not run (out of scope)."
  candidate_causes:
    - "code (CONFIRMED): unconditional literal at install.ts:5745-5746 + writeAskRules(): void with no outcome record"
    - "process/test (contributing to 'why not caught', not a cause): no install.test.ts row asserts on the notes block; the fresh-install pins `speed bump` / `not a security boundary` (6216-6217) are satisfied by writeAskRules' own unconditional note at 5489-5493"
    - "spec (origin): 33.1-03-PLAN action 4 asked for a capability statement ('this installer writes ...'); the implementation spelled it as a past-tense run claim inside the static notes block"
    - "environment/build (ELIMINATED): install.js drift — install.js:5108 holds the same literal; tree clean"
    - "data (ELIMINATED): a Windows-spelled marker (WR-11) is needed — reproduced with 8 POSIX-native arms"
  and_gate: "no. The literal alone produces the false claim whenever writeAskRules ends in any arm but R14; the run only has to reach the main-flow tail, which every non-early-exit install does. The missing test assertion explains why it was not caught; it is not a second condition for the failure."

## Symptoms

expected: The install closing banner states that Claude Code ask rules were written only when writeAskRules() actually wrote or kept them; otherwise it says none were written.
actual: 34-REVIEW.md WR-12: the `-- notes --` block at about install/install.ts:5744-5747 always prints "This installer wrote Claude Code ask rules for the governed command spellings into .claude/settings.json.", even in a run whose output also says `no ask rule was added to .claude/settings.json` and where .claude/settings.json does not exist. Confirmed by the human in 34-UAT.md test 4 (fix in gap round 3). WR-11 is accepted and deferred with Windows support; not in scope.
errors: none; a false printed claim (DOC-1 class), conflicts with the "No fabrication" constraint on the merge/deploy speed bump.
reproduction: 34-UAT.md test 4. On POSIX, any ask-rules refusal not involving a Windows marker, e.g. a malformed Claude ask-rules ledger or an unreadable/malformed .claude/settings.json in the target; capture the banner.
started: line introduced in commit e68c8258 (Phase 33.1); found in gap round 2 code review; confirmed by human in UAT 2026-10-09.

## Eliminated

- hypothesis: the notes block reads some outcome (ASK_LEDGER, VERIFY_FINDINGS, DRY_RUN) and misinterprets it
  evidence: install.ts:5739-5754 reference none of them; the only expression is HOST_TOOLS at 5752.
  timestamp: 2026-10-09T19:34:00Z

- hypothesis: the committed install.js differs from install.ts here (build drift)
  evidence: install.js:5108 carries the identical literal; `git status --short install/` is clean; 34-REVIEW ran check:build-parity 73/73.
  timestamp: 2026-10-09T19:41:10Z

- hypothesis: the false line needs WR-11's Windows-spelled marker (data) or a Claude-specific target (environment)
  evidence: reproduced on POSIX with 8 arms that involve no Windows marker, including an empty target with no .claude/ at all and a run with every checkpoint off.
  timestamp: 2026-10-09T19:40:00Z

## Evidence

- timestamp: 2026-10-09T19:33:30Z
  checked: knowledge base (.planning/debug/knowledge-base.md)
  found: does not exist; no MemPalace query available in this session. No known-pattern candidate.
  implication: open investigation.

- timestamp: 2026-10-09T19:34:00Z
  checked: install/install.ts:5731-5754 (main flow tail)
  found: |
    5733 console.log("\n-- permission rules --");
    5734 writeAskRules();            // return value: void
    5737 writeMarker();
    5739 console.log("\n-- notes --");
    5740-5754: ten console.log calls of string literals (one template literal derived from HOST_TOOLS at 5751-5753).
    5745 "          This installer wrote Claude Code ask rules for the governed command spellings into"
    5746 "          .claude/settings.json. They are a speed bump, not a security boundary: other spellings"
    No `if`, no variable, no reference to ASK_LEDGER, VERIFY_FINDINGS or DRY_RUN anywhere in 5739-5754.
  implication: the sentence cannot vary with what writeAskRules did. It is a constant.

- timestamp: 2026-10-09T19:35:00Z
  checked: install/install.ts:5486-5715 writeAskRules(), every return point (enumerated from source, not hand-picked)
  found: |
    Signature `function writeAskRules(): void` — no return value. Outcomes:
    R1  5500-5506 marker unreadable (readInstallMarker state "unreadable", WR-11's arm too) -> verify "no ask rule was added"; ASK_LEDGER stays null. NOTHING written.
    R2  5508-5514 ask-rules ledger malformed -> verify "no ask rule was added"; ASK_LEDGER null. NOTHING written.
    R3  5552-5556 readForWrite "blocked" (link at the path, non-directory .claude, unreadable, over bound, FIFO ...) -> verify "no ask rule was written". NOTHING written.
    R4  5560-5564 settings.json not JSON (readJsonText !ok) -> verify. NOTHING written.
    R5  5567-5574 duplicate "permissions"/"permissions.ask" key -> verify. NOTHING written.
    R6  5575-5579 root not an object -> verify. NOTHING written.
    R7  5583-5587 "permissions" not an object -> verify. NOTHING written.
    R8  5590-5594 "permissions.ask" not an array -> verify. NOTHING written.
    R9  5660-5662 toAdd==0 AND rules==0 (every checkpoint lowered to notify/off) -> "skipped ... no ask rule to write". NOTHING written; rules may be absent entirely.
    R10 5660-5663 toAdd==0 AND rules>0 (every wanted rule already present) -> no write this run. Sub-cases: (a) all carried from an earlier install (ledger proven) -> "N ask rule(s) from an earlier install already present"; (b) all present as the user's own -> "kept as the user's own rule" (install did not write them, in this or any run it can prove); (c) a mix.
    R11 5686-5690 splice oracle failure -> verify "no ask rule was written". NOTHING written.
    R12 5692-5694 DRY_RUN -> "would-add ... (N ask rule(s))". NOTHING written.
    R13 5696-5701 writeTargetFile false (mkdirp failure or write error) -> verify (inside writeTargetFile). NOTHING written.
    R14 5711-5714 success -> "created .claude/settings.json (N ask rule(s) added ...)". Written. N may be < 55 when some checkpoints are lowered (partial set).
    Not reachable: "Claude host not targeted". install.ts has no host-selection flag (argv loop 216-249 knows --target/--yes/--allow-self/--force/--symlink/--check/--strict/--migrate/--update/--prune-old-kit/--backup-edited-kit only); writeAskRules is called unconditionally at 5734 on every run that reaches the main flow. detectTools() (2670) only prints presence.
    Not reached at all (no notes block printed): --check (1538-1540 exits), --update (1548-1559 exits), --prune-old-kit (1567-1584 exits), --migrate refusal (4805-4826 exits) and --migrate already-migrated (4838-4855 exits).
  implication: 10 of 14 outcomes (R1-R8, R11, R13) write nothing and raise a verify; R9 and R12 write nothing with no verify; R10 writes nothing this run (rules exist, but in R10b install never wrote them). Only R14 matches the sentence "This installer wrote ... ask rules ... into .claude/settings.json". The sentence is false in R1-R9, R11-R13, literally false for this run in R10, and false-in-attribution in R10b.

- timestamp: 2026-10-09T19:35:30Z
  checked: whether any existing variable already carries the outcome (could the notes block have read it?)
  found: |
    ASK_LEDGER (5484) is the marker's ledger entry, not an outcome flag: null in R1/R2; unclaimed(null) (null or an empty-added entry) in R3-R8; set to the would-be ledger before the DRY_RUN return in R12 (5650-5658 runs before 5692); `previous` or unclaimed(askNow) in R11/R13; set in R9/R10/R14. VERIFY_FINDINGS (571) is global across the whole run, so a non-zero count does not mean the ask-rules section refused, and zero does not mean it wrote (R9, R12).
  implication: there is no existing signal the banner could consult; the outcome has to be recorded by writeAskRules itself (the fix direction WR-12 names). Deriving the banner from ASK_LEDGER or VERIFY_FINDINGS would itself misreport (R12, R9).

- timestamp: 2026-10-09T19:36:00Z
  checked: git history of 5743-5748 (git log -L) and 33.1-03-PLAN.md:236-241
  found: introduced by e68c8258 (33.1-03, 2026-09-27). The plan's action 4 asked the notes to say "this installer writes Claude Code ask rules for the governed command spellings as a speed bump" — a description of the installer's capability. The implementation spelled it in the past tense as a claim about this run ("This installer wrote"), inside the static notes block. 02e28224 (34-02) later split the host sentence onto its own derived line and left this one as a literal.
  implication: the defect is a tense/scope slip from a capability statement to a run-outcome claim, placed in a block that has no access to the outcome. Not a regression of round 2; WR-11 only made it reachable in a new case.

- timestamp: 2026-10-09T19:36:30Z
  checked: which tests pin the notes text (grep across *.test.ts for "This installer wrote", "speed bump", "not a security boundary", "plugin-only", "documentation only", "-- notes --")
  found: |
    No test contains "This installer wrote" or any phrase of 5745-5746 unique to it.
    install/install.test.ts:6216-6217 (fresh install case) `toContain("speed bump")` and `toContain("not a security boundary")` — both phrases are also printed by writeAskRules' own unconditional note at 5489-5493, so these pins hold with or without the notes sentence.
    install/host-tools.test.ts:145-152 pins the following line, `(...) get documentation only.`, derived from HOST_TOOLS — the sentence right after the false one.
    Refusal rows that run the full installer and would have shown the false line, yet assert nothing about the notes block: install.test.ts:6286-6299 (unparseable / wrongly typed settings.json, exit 3), 6301-6312 (DRY_RUN would-add), 7552-7576 (malformed ledger), 7578-7591 (unreadable marker), 6260-6270 (merge set to off).
  implication: no test locks in the false line, and none refutes it. A fix will not break an existing pin unless it removes the "speed bump" / "not a security boundary" phrases from writeAskRules' own note.

- timestamp: 2026-10-09T19:39:00Z
  checked: |
    Scratch reproduction matrix, script scratchpad/wr12/repro.sh (session scratchpad, not in the repo). Each run: its own
    GRUGOPS_HOME and --target under scratchpad/wr12/runs/<name>/, INSTALL_MODE=copy, GRUGOPS_SRC=<repo>, TARGET unset,
    `node install/install.js --yes --target <t>` (committed build), Node v26.11.0, macOS. ~/.grugops mtime before and after:
    Oct 9 18:29:55 (untouched).
  found: |
    run            arm  exit  settings.json  permission-rules section says                                       sentence printed
    s0-fresh #1    R14  0     present        created .claude/settings.json (55 ask rule(s) added ...; file created)   1  (true)
    s0-fresh #2    R10a 0     present        skipped (55 ask rule(s) from an earlier install already present)       1  (nothing written this run)
    s1-badsettings R4   3     present        verify ... is not valid JSON ... no ask rule was written               1  FALSE
    s2-badledger   R2   3     present*       verify ... install ledger ... malformed ... no ask rule was added        1  FALSE (*file is the previous run's)
    s3-badmarker   R1   3     ABSENT         verify .grugops/install.json could not be read ... no ask rule was added to .claude/settings.json   1  FALSE
    s4-alloff      R9   0     ABSENT         skipped ... no checkpoint is at block — no ask rule to write            1  FALSE, at exit 0 under "== install complete =="
    s5-dry         R12  0     ABSENT         would-add .claude/settings.json (55 ask rule(s) ...)                    1  FALSE (banner says "DRY_RUN — nothing changed")
    s6-link        R3   3     ABSENT (dangling link)  verify .claude/settings.json: <link> ... no ask rule was written   1  FALSE
    s7-userrules   R10b 0     present        55 x "kept as the user's own rule; uninstall will not remove it"        1  FALSE attribution (install never wrote them)
    Full notes block from s3 (verbatim):
      Safety: the git host is the hard floor — branch protection or rulesets on protected branches,
              and deployment environments with required reviewers for production (install/README.md §5).
              This installer wrote Claude Code ask rules for the governed command spellings into
              .claude/settings.json. They are a speed bump, not a security boundary: other spellings
    and no .claude/settings.json exists in that target (`ls target/.claude` shows only the adapter dirs).
  implication: H1 confirmed by direct observation. The WR-12 symptom reproduces on POSIX without any Windows marker, in 7 of 9 runs a false or misattributed claim, two of them at exit 0 with "== install complete ==" (R9, R12 print no verify, so nothing on screen contradicts the sentence except the skipped/would-add line).

- timestamp: 2026-10-09T19:40:30Z
  checked: same class — other closing-banner / notes lines that state what the run did without being conditioned on it (install.ts banners for every mode, uninstall.ts closing sections)
  found: |
    (A) install.ts:1548-1559 `--update`: after updateKitHome() -> copyKit(true), prints "Run `node install/install.js --check --target <repo>` to verify a repo against the refreshed kit." and "== update complete ==" and exits 0 unconditionally. copyKit (2710-2823) raises verify() at 9 sites, 7 of which end with the kit not copied or not replaced. REPRODUCED (scratch, GRUGOPS_HOME chmod 555): `verify <home>: a staging directory could not be made there (EACCES). The kit was not copied` then "== update complete ==", exit 0. This is the 27-13 conditional-closing-claim rule that the install (5760) and prune (1579) banners follow and --update skips.
    (B) install.ts:4838-4855 `--migrate` already-migrated arm with a leftover in-repo agent-factory/: prints "Nothing was changed." after migrateHandoffs() may have renamed plans/handoffs/ and recordBackupsInMarker() may have rewritten the marker; exits 0 unconditionally (VERIFY_FINDINGS not consulted). REPRODUCED (scratch): "backed-up plans/handoffs/ -> .../plans/handoffs.bak.<ISO>", "edited .grugops/install.json (record ...)", then "Nothing was changed.", exit 0, and the backup directory exists on disk.
    (C) uninstall.ts:2133-2135 `-- preserved (never touched) --` lists ".grugops/ (seeded state; only the install.json marker is removed)" unconditionally. removeMarker (uninstall.ts:1498-1565) leaves the marker in place in 7 arms (1501, 1511, 1519, 1523, 1527, 1533, 1551), plus DRY_RUN (1561). REPRODUCED (scratch, AGENTS.md edited after install): "left .grugops/install.json (kept: ...)", "edited .grugops/install.json (kept; ...)", the preserved block still says "never touched ... only the install.json marker is removed", and the closing banner says ".grugops/install.json kept to record them". Milder than WR-12 (it can be read as a scope statement), but it states a removal that did not happen and lists as never touched a directory the same run edited.
    Not the same class (checked): the notes lines "The Claude Code plugin form cannot carry permission rules, so a plugin-only install gets none.", "The other host CLIs (...) get documentation only." (derived from HOST_TOOLS, a capability statement about safety enforcement, not about this run), "Only a human merges ..." (policy), the two /plugin lines (marked UNKNOWN - verify); the install closing banner (5760-5831) and uninstall closing banner (2139-2194) are conditioned on VERIFY_FINDINGS/KEPT_FOR; prune's banner (1579-1583) is conditioned.
    Adjacent, outside the banner scope (minor): writeMarker reports "created .grugops/install.json (marker)" (install.ts:4534) on every successful write, including a re-install where the marker already existed and was overwritten (s0-fresh #2, s2, s4, s6, s7).
  implication: WR-12 is one instance of a class (an end-of-run sentence that describes the intended effect rather than the effect this run had). (A) and (B) are the strongest siblings: both state completion or no-change at exit 0 over a counted verify or an actual change.

## Resolution

root_cause: |
  install/install.ts:5745-5746 prints "This installer wrote Claude Code ask rules for the governed command spellings into .claude/settings.json." as a string literal inside the unconditional `-- notes --` block (5739-5754). The function that decides whether rules were written, writeAskRules() (5486-5715), is declared `void`, and none of its 14 exits records an outcome the banner reads; the only module state it sets, ASK_LEDGER, is the marker's ledger entry and is set even in arms that write nothing (DRY_RUN at 5650-5658 before the 5692 return; toAdd==0). So the claim prints whatever writeAskRules did. It is true only in R14 (rules written by this run). It is false in R1-R9, R11-R13 (nothing written: 10 verify arms, the all-lowered arm R9 and the dry run R12), not true of this run in R10a (rules from an earlier install, nothing written now), and wrongly attributed in R10b (every rule present is the user's own). Origin: e68c8258 (33.1-03) turned the plan's capability statement ("this installer writes ask rules ... as a speed bump") into a past-tense claim about the run and put it in a block with no access to the outcome. Why not caught: no install.test.ts row asserts on the notes block; the fresh-install pins (6216-6217) match writeAskRules' own unconditional note instead.
fix: (not applied; goal is find_root_cause_only)
verification: (diagnosis only) 9-run scratch reproduction on the committed install.js; source enumeration of all writeAskRules exits
files_changed: []

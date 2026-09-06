# Red-team surface A — the round log

**Surface A (D-21):** the two-key hook path — `hooks/guard.ts`, `hooks/admission-guard.ts`, the
fresh environment read, the self-set refusal — plus the point-of-effect test-integrity refusal in
`scripts/context-io.ts`. It begins only after surface B is closed or fenced; surface B was **fenced**
on 2026-09-06, so this log opens with that fence in force.

**What this surface must not assume, carried in from surface B's fence.** The derived checkpoint set
this surface's floor ids come from is **fenced, not settled**. `V-30-10-11` … `V-30-10-14` each leave
every count, cardinality and gate green while a governed document goes ungoverned: a tagged stop can
exist and be collected by nothing at `38/38`; an autolink above a frozen heading un-freezes 17 clauses
at `17/17`; a complete role document can ship inside `roles/.gitkeep/`; a live roster member can be
REMOVED from the derived set with both independent counts agreeing at `37/37`. Any claim here that
rests on "the roster is what the corpus declares" cites that fence — see
`docs/audit/30-redteam-surface-b.md` § *CARRIED INTO PLAN 30-11*.

**The closure standard this log is kept against (D-23, RESEARCH §Red-Team Architecture).** A round
closes a finding only when all six hold:

1. **RED first.** The bypass is a failing test before the fix exists.
2. **Mirror reproduction.** The pre-fix mirror allows and the fixed tree refuses, on the **committed
   `.js`** and never on the `.ts`, because the artifact is what a host runs.
3. **Mutation / discrimination proof.** The predicate is deliberately broken in the artifact the
   tests load; the tests must go red, and the mutation marker is grepped in the emitted `.js` before
   any result is believed.
4. **Two independent reviews at the strongest available model** find nothing new on the surface.
5. **Self-reproduction** of every closed bypass by the fixing agent, against the fixed build.
6. **Structural fix, not a heuristic** — one authority per predicate; delete the second grammar; move
   the gate to its point of effect; unfreeze a frozen weaker duplicate.

**A green suite is not an argument for closure and is not offered as one anywhere in this document.**
Round 1 below was run against a fully green suite (252 passing hook and floor-invariance cases) and
found six bypasses anyway, one of which disables the guard completely.

**The round cap (D-22).** Four gap-closure rounds on this surface. A finding after the fourth becomes
a recorded backlog item or a follow-up phase, never a fifth round.

**The frozen file (D-24).** `hooks/guard.ts` is byte-frozen at `FROZEN_GUARD_BLOB` in
`scripts/floor-invariance.test.ts`. The hash and the code move in the SAME commit, and the freeze
verification is run AFTER that commit, never before it — the suite cannot be green between the edit
and the commit, and a red naming the diff assertion mid-edit is the mechanism working.

---

## The mirror, and its premise

The mirror is `git archive HEAD | tar -x` into a temporary directory: the committed tree exactly.
Every reproduction below spawns a compiled `.js` **as a process**, with a controlled environment, and
never imports a `.ts`.

```
mirror HEAD = a59091ca261f85181278ae5d3bc0a61e5ecc531a
hooks/guard.js            ca183a8b4f57c966014c2e5737ab2321a86e32a8786abcaa4600a6ec9ce305a8  premise OK
hooks/admission-guard.js  29de7511821cf3a32ff598d4caa48f47eee1f62163c3218c0ff41875a8787acd  premise OK
```

Both hashes were compared against the working tree's own copies before any probe ran, so "the mirror
is the committed artifact" is measured rather than assumed.

**The probe harness asserts its own premise.** Every spawn deletes every `GRUGOPS_*` variable and
`CLAUDE_PROJECT_DIR` from the inherited environment before applying the case's own env, and the first
row of every table is a control that must come out the other way. A developer box carrying a stray
grant would otherwise make a whole table pass or fail for a reason no case named.

---

# Round 1 — 2026-09-06

Six findings. Two were reachable by an agent with **one key and no human at all**; one of those turns
the guard off entirely.

| id | severity | direction | one line |
|---|---|---|---|
| `A-1` | MEDIUM | permissive to the *record*, invisible | the self-set refusal enumerated two of the three grant variables; `GRUGOPS_ADMISSION_APPROVED_BY` escaped it |
| `A-2` | **HIGH** | **permissive — full bypass, one key** | a hook that cannot load exits 1 with no stdout, which is NON-BLOCKING at the host: the crashed guard and the allowing guard are the same event |
| `A-3` | MEDIUM | publishes a false sentence | the D-10 record hardcoded `refused` from its POSITION in the loop; a run the action approval ALLOWED wrote `CHECKPOINT REFUSED` into the shared verified context |
| `A-4` | MEDIUM | permissive + publishes an empty name | a grant of a single space authorized a lowering, and the banner attributed it to a name that renders as nothing |
| `A-5` | MEDIUM | the D-24 rule had no enforcement | the freeze's "no uncommitted modification" assertion is INDEX-scoped: `git add` alone satisfies it |
| `A-6` | MEDIUM (latent, made live by the V-30-10-01 fix) | injection | the governance reader interpolated an agent-controlled config key RAW into a human-facing refusal string |

---

## The four standing questions, answered for the grant predicate

Asked before any probe, and answered in writing including the answers that found nothing.

### 1. What set does the predicate ENUMERATE?

**It enumerated a set nothing derived, and the set was wrong.** The refusal was

```
(?:^|[\s;&|(])(?:export\s+|env\s+)?(GRUGOPS_PROD_DEPLOY_APPROVED|GRUGOPS_FLOOR_[A-Z0-9_]+)\s*=
```

The floor arm was correctly a FAMILY (a pattern, not a list) and the derived floor names were
asserted into it at the point of use — that half was right. The other arm was **one string literal**.
Meanwhile `hooks/admission-guard.ts`, in the same directory, declared
`const APPROVAL = "GRUGOPS_ADMISSION_APPROVED_BY"` as its own bare literal, and that name appeared in
no shared table. Three grant variables, two arms, one silently absent. This is finding **A-1**.

### 2. What is its input ASSEMBLED FROM?

`cmd` is `tool_input.command` from the PreToolUse payload and nothing else; a non-string is coerced to
`""`, and `""` matches no pattern in either group. No transformation is applied and none is missing:
the guard sees the command string the harness delivers, before the shell expands it. Shell
indirection therefore defeats the *literal spelling* of the refusal, measured below — and it is
recorded as a bounded residual rather than fixed, because widening a parser to recognize more
spellings is the failure mode Phase 25 spent ten rounds proving out. See § *Answers that found
nothing* → indirection.

### 3. At WHICH POSITIONS is it asked?

Once, unconditionally, before the decision loop — so there is no branch that decides a command
without having asked. But the ordering question the plan poses has a real answer: the self-set
refusal runs **after** the config read, the matrix evaluation and the banner. That ordering creates
no permission window (nothing is written, and a self-set command is refused either way), and it is
what makes the banner appear on a refused self-set run, which is correct: D-20 requires the banner on
EVERY invocation. **No finding on this axis.**

The position question has a different, worse answer one level up, and that is **A-2**: the predicate
is asked at exactly the right place *inside a process that need never run at all*.

### 4. Does the HARNESS assert its own premise?

Partly, and the gap is real. `runAt` in `hooks/guard.test.ts` already scrubbed every `GRUGOPS_*`
variable — that premise was asserted. `runGuard`, used by the older Phase-5 parity cases, scrubbed
nothing, so a stray ambient `CLAUDE_PROJECT_DIR` would have pointed those spawns at an unrelated
repository's dial. The direction is NOISY (a leaked lowering makes a deny-case fail, never an
allow-case pass), so it is recorded as an observation and the new round-1 harness (`runArtifact`)
scrubs both. Measured on this machine: `CLAUDE_PROJECT_DIR` is **not** present in a Claude Code Bash
tool environment, so the exposure was latent here.

---

## `A-1` — the self-set refusal enumerated two of three grant variables

### What it is

`GRUGOPS_ADMISSION_APPROVED_BY` is key two of the human-admission gate: with it set, a gated
high-severity governance finding can be admitted under that name. It is a grant in exactly the sense
the floor variables are. It was not in the refusal.

The harm is not that an inline `export` reaches the hook — it never does, for any grant, because the
hook is a separate process whose environment the agent's child shell cannot touch. The harm is that
the refusal is the **visibility** control over attempts to PERSIST a grant into an environment a
later hook process WILL read (a shell profile, a settings file), and one of the three grants had no
such control while the other two did.

### Mirror reproduction — the committed `hooks/guard.js`

```
ALLOW  PREMISE: plain command, no grant in env         "ls -la"
DENY   floor grant self-set, non-matching command      "export GRUGOPS_FLOOR_OPEN_PR=alice && ls"
ALLOW  ADMISSION grant self-set, non-matching command  "export GRUGOPS_ADMISSION_APPROVED_BY=alice && ls"
ALLOW  persist ADMISSION grant into a shell profile    "echo 'export GRUGOPS_ADMISSION_APPROVED_BY=alice' >> ~/.zshrc"
DENY   persist FLOOR grant into a shell profile        "echo 'export GRUGOPS_FLOOR_OPEN_PR=alice' >> ~/.zshrc"
DENY   prod-deploy approval self-set                   "export GRUGOPS_PROD_DEPLOY_APPROVED=1 && ls"
```

Rows 4 and 5 are the finding: the same persistence command, one grant refused and one allowed.

### The structural fix, in one sentence

The grant vocabulary is declared ONCE — `NAMED_GRANT_ENV_VARS` plus the floor prefix in
`scripts/checkpoints.ts` — both hooks import their own constant out of it instead of spelling it, and
the refusal's alternation is BUILT from `GRANT_ENV_VAR_PATTERN_SOURCE`, so a grant added to the table
is refused without anyone remembering to widen a regex.

### What NEW freedom this creates, and how it is bounded

A table can be bypassed by not using it — a fourth grant introduced as a literal in some new hook
would be invisible to the vocabulary exactly as the third one was. Bounded in the same commit by a
**drift guard**: `hooks/guard.test.ts` reads both hook sources and refuses any CODE line matching
`/["'`]GRUGOPS_(PROD_DEPLOY_APPROVED|ADMISSION_APPROVED_BY|FLOOR_)/`. The prose above each hook names
the variables deliberately and is excluded by construction (comment lines are filtered), which is
stated rather than left as a surprise. Second: the guard walks BOTH arms at startup —
`FLOOR_CHECKPOINTS` and `Object.keys(NAMED_GRANT_ENV_VARS)` — and refuses to evaluate at all if any
member falls outside the pattern the refusal was built from.

### Post-fix, same probe

```
DENY   ADMISSION grant self-set        "export GRUGOPS_ADMISSION_APPROVED_BY=alice && ls"
DENY   persist ADMISSION grant         "echo 'export GRUGOPS_ADMISSION_APPROVED_BY=alice' >> ~/.zshrc"
ALLOW  a name that merely LOOKS like one  "MY_GRUGOPS_FLOOR_OPEN_PR=1 ls"   (non-vacuous)
```

---

## `A-2` — a hook that cannot decide exits non-zero, and a non-zero exit is an ALLOW

### What it is

The file's contract says **FAILS CLOSED**, and every branch it had thought of does. Every branch it
had not thought of exited the process with code 1 and no stdout. A PreToolUse hook blocks in exactly
two ways: exit 0 with `permissionDecision: "deny"` on stdout, or exit 2. **Any other non-zero exit is
non-blocking** — the command it was supposed to gate simply runs. So "the guard crashed" and "the
guard allowed it" are the same event at the host, and the fail-closed posture was a property of the
branches rather than of the process.

The reachability is what makes it HIGH. `hooks/guard.ts` statically imports `scripts/checkpoints.js`
and `scripts/context-io.js`. A static import is hoisted above every line of the module, so a
dependency that will not load kills the process **before `deny` has ever been reachable**. Overwriting
or deleting either file is an ordinary agent-reachable write: it matches no deploy pattern, carries no
grant name, and needs no config declaration and no human. One key, and the two-key rule is off.

### Mirror reproduction — both committed hooks, spawned as processes

```
# hooks/guard.js, payload: git push --force origin main
control        (intact mirror)                      exit=0  DENY   442 bytes stdout
corrupted      scripts/checkpoints.js = "not js"    exit=1  ALLOW    0 bytes stdout
deleted        scripts/checkpoints.js removed       exit=1  ALLOW    0 bytes stdout
deleted        scripts/context-io.js removed        exit=1  ALLOW    0 bytes stdout

# hooks/admission-guard.js, payload: gated high-severity finding, no env, no stamp
control        (intact mirror, dial high-severity)  exit=0  DENY   505 bytes stdout
corrupted      scripts/context-io.js = "not js"     exit=1  ALLOW    0 bytes stdout
```

The control rows are the harness premise: the mirror denies before it is broken, so the ALLOW rows
are the break and not the mirror.

### The structural fix, in one sentence

The invariant is restated as a property of the PROCESS — *this file has no exit path that is neither
an explicit allow nor an explicit deny* — and established by three things in both hooks: `deny` is
declared first and depends on nothing but `process`; the dependency load is a **guarded dynamic
import** (the only way to keep a fail-closed answer above an import); and `uncaughtException` /
`unhandledRejection` handlers convert every remaining throw into the deny JSON.

### The premise of THAT fix, measured rather than assumed

A handler-based guarantee is worth nothing if the handlers do not actually fire for a top-level throw
in an ESM module made asynchronous by top-level `await`. Measured directly:

```
a.mjs  sync top-level throw, no await anywhere   -> HANDLED-UNCAUGHT, exit 0
b.mjs  throw AFTER a top-level await             -> HANDLED-UNCAUGHT, exit 0
c.mjs  failing dynamic import inside try/catch   -> CAUGHT-IMPORT: ERR_MODULE_NOT_FOUND, exit 0
```

And the emitted artifacts were grepped, not the sources: the only static imports remaining in
`hooks/guard.js` and `hooks/admission-guard.js` are `node:fs` and `node:path` — builtins that cannot
fail — with `function deny` above them at line 73 and line 69 respectively.

### What NEW freedom this creates, and how it is bounded

The guard now DENIES on any failure, including one that has nothing to do with safety. A broken kit
therefore blocks every matched command rather than silently running unguarded. That is the intended
direction and it is loud on purpose; the alternative is the state this finding describes. It is
bounded by scope: only a command that reaches the guard is affected, the denial names the repair, and
the unmatched-command path is untouched (an allow is still an allow with no stdout).

Second freedom: a re-entrancy flag was introduced so the fail-closed answer cannot fail recursively.
Its bound is that it exits 0 rather than looping — an exit 0 with no stdout is an allow, which is the
correct degenerate answer for a process that has already written a deny once.

---

## `A-3` — the record stated the outcome its POSITION implied, not the one the run reached

### What it is

D-10 requires an unauthorized lowering to record its own finding, and the record is written BEFORE
the denial so that a denial can never be the only trace. But the record sat above the
action-approval check and hardcoded `"refused"`, because at that point in the file a refusal was the
only outcome in view. The action approval (`GRUGOPS_PROD_DEPLOY_APPROVED`) is checked lower down and
permits the command at the un-lowered posture — so the two can both be true, and when they were, the
shared verified context recorded a refusal that did not happen.

The trace is the proof. A false record is worse than no record.

### Mirror reproduction — the committed `hooks/guard.js`

Config `{"checkpoints":{"protected_branch_merge":"off"}}`, no floor grant, `git push origin main`:

```
A  no approval        DENY   note: CHECKPOINT REFUSED ... declared `off` and enforced as `block`
B  APPROVAL set       ALLOW  note: CHECKPOINT REFUSED ... declared `off` and enforced as `block`   <- FALSE
C  floor grant set    ALLOW  notes: 0
```

Row B allowed the push and wrote a note asserting it had refused it.

### The structural fix, in one sentence

The run decides first and records second: `actionApproved` is read once, ABOVE both the record and
the decision, and `outcome` is computed from the same value the loop below acts on — the D-19 shape
(one evaluation feeding both the announcement and the decision) applied to the record.

### What NEW freedom this creates, and how it is bounded

`outcome: "allowed"` beside `effective: "block"` is now a reachable and initially puzzling
combination, and the obvious reading of it — that the two-key rule was bypassed — is the wrong one.
Bounded in the same commit by one new field on `CheckpointNoteInput`, `actionApproval`, which names
the variable that actually applied and states in the note body that it approves THIS action at the
enforced posture and does not authorize the declared lowering. A reader no longer has to guess which
of the two keys was used.

### Post-fix, same probe

```
B  APPROVAL set    ALLOW  note: CHECKPOINT ALLOWED ... + "action approved by: GRUGOPS_PROD_DEPLOY_APPROVED ..."
A  no approval     DENY   note: CHECKPOINT REFUSED, no "action approved by" line   (non-vacuous control)
```

---

## `A-4` — a grant that names nobody authorized a lowering

### What it is

The value of a grant IS the human's name — for the admission grant it is interpolated straight into
the stamp the admission must match, and for a floor grant it is what the record and the banner name
as the authorizer. The presence test was `raw.length > 0` for a floor grant, bare truthiness for the
prod-deploy approval, and `approver.length === 0` for the admission approval: three spellings of one
question, and all three accepted a single space.

Reviewer 8 of surface B recorded the floor half as an observation (`V-30-10-04` item 2) and assigned
the variable's provenance to this surface. Measured here, the same hole exists on all three grants,
which is what makes it one predicate rather than one patch.

### Mirror reproduction — the committed artifacts

```
# hooks/guard.js — config `off`, git push origin main
D  GRUGOPS_FLOOR_PROTECTED_BRANCH_MERGE=" "   ALLOW
   banner: protected_branch_merge=off authorized by GRUGOPS_FLOOR_PROTECTED_BRANCH_MERGE=
E  declared notify, same one-space grant      ALLOW   note: CHECKPOINT ALLOWED
F  GRUGOPS_PROD_DEPLOY_APPROVED=" "           ALLOW   (default block, matched deploy)

# hooks/admission-guard.js — dial high-severity, gated finding
   GRUGOPS_ADMISSION_APPROVED_BY=" " with verified_by "human: "   ADMITTED
```

The banner line in row D is the second half of the finding: a lowering in effect, published with an
authorizing name that renders as nothing.

### The structural fix, in one sentence

One predicate for the whole vocabulary — `grantedBy(env, name)` returns the TRIMMED name or `null` —
read by `resolveCheckpoint`, by the guard's action-approval branch and by the admission guard's
approver branch, so there is one answer to "is this variable set to a name" instead of three.

### What NEW freedom this creates, and how it is bounded

A variable can now be SET and still not be a grant, and the banner said `absent`, which for that case
is a sentence the run did not establish — a human would go looking for a variable that is right
there. Bounded in the same commit: the banner clause now reads `<VAR> names nobody; enforced as
block`, one clause covering both cases because the predicate is one predicate. Asserted by a case
that requires `names nobody` and refuses `absent`.

Second freedom: the published name is now the trimmed name, so `"  Olger Oeselg  "` publishes as
`Olger Oeselg`. Asserted directly, and the admission guard's stamp comparison is against the same
trimmed name — a padded STAMP against a clean env is still refused, which is asserted so the trim
cannot be read as a general leniency.

---

## `A-5` — the freeze rule was neither commit-scoped nor range-scoped. It was INDEX-scoped.

### What it is

D-24 says the hook is unfrozen and re-frozen in the SAME COMMIT. Two assertions were supposed to
enforce it, and their own comment says they refuse "a code-only change (someone changes the guard
without updating this constant, **or leaves it uncommitted**)":

```ts
git hash-object hooks/guard.ts   === FROZEN_GUARD_BLOB   // working tree vs the constant
git diff --quiet hooks/guard.ts                          // "no uncommitted modification"
```

`git diff` with no commit argument compares the working tree to the **INDEX**, not to HEAD. So a
single `git add hooks/guard.ts` satisfies the second assertion while HEAD still carries the old
guard. And nothing anywhere asks the commit-scoped question at all: this repository owns a per-commit
companion machine in `scripts/check-diff-disposition.ts` — with the explicit rule "the commit that
actually changed it, not merely somewhere in the range" — and its `FROZEN_SOURCES` table has three
members, none of which is `hooks/guard.ts`.

### Reproduction — on a clone, so the real repository is untouched

```
clone at a59091c, clean tree
  git hash-object hooks/guard.ts            63c659c1…a9e3   == FROZEN_GUARD_BLOB
attack: append a line to the guard, update FROZEN_GUARD_BLOB to the new hash, `git add hooks/guard.ts` ONLY
  git diff --quiet hooks/guard.ts           EXIT 0     -> the shipped assertion PASSES
  git diff --quiet HEAD -- hooks/guard.ts   EXIT != 0  -> the commit-scoped question would have FAILED
```

The consequence is that the guard and its baseline can land in different commits with the suite green
the whole way: the working tree satisfies both assertions, and only a fresh clone of the intermediate
commit is red.

### The structural fix, in one sentence

Ask the question the rule states: the diff assertion is measured against **HEAD**, and a new
commit-scoped assertion requires the commit that last changed `hooks/guard.ts` to also carry
`scripts/floor-invariance.test.ts` **and** `hooks/guard.js` — the baseline and the artifact a host
runs, moving as one act.

It is deliberately **commit**-scoped and not range-scoped: a range form ("did the baseline change
anywhere between some base and HEAD") self-disarms the first time the companion changes for an
unrelated reason, and this phase changed the guard five times, which is exactly that condition.

### What NEW freedom this creates, and how it is bounded

The assertion now depends on git HISTORY, and `git log` — unlike `git hash-object` — does not work
outside a repository. Surface B recorded a whole round where a `git archive` mirror with no `.git`
produced a clean result from a gate that never reached its predicate. Bounded in the same commit by a
companion case that asserts `git rev-parse --is-inside-work-tree` is `true`, so a history-less
consumer gets a named refusal instead of a vacuous pass. Second bound: the commit-scoped case asserts
its OWN premise first — that the commit `git log` returned really does touch `hooks/guard.ts` — so an
unrelated commit cannot make it pass for a reason it never checked.

---

## `A-6` — the governance reader interpolated an agent-controlled config key RAW

### What it is

`readCheckpointMatrix` composes a refusal for a `checkpoints` entry it drops. Every other value in
those strings comes from the roster; ONE comes from the config file, which is agent-writable:

```ts
refusals.push(`\`checkpoints.${key}\` is not a checkpoint on the roster — …`);
```

JSON permits a key carrying a newline. `emitCheckpointNote`, in the same module, states the opposite
rule for untrusted values in capitals — *"THE THREE UNTRUSTED VALUES ARE QUOTED, NOT INTERPOLATED
RAW"* — because a newline in composed output lets the value rewrite the output's own structure. This
site had not applied it.

It was **latent**: `V-30-10-01` records that no non-test consumer read `checkpointRefusals` at all.
It becomes live the moment one does — and closing `V-30-10-01` is this plan's job, so the injection
was fixed FIRST and the publisher added second. That ordering is the finding's real content: a fix
that makes a latent defect live is how a round's own diff becomes the next round's finding.

### The structural fix, in one sentence

Quote the untrusted key at the composition site (`JSON.stringify(key)`), as the module's own emitter
already does for its three untrusted values — one rule for untrusted values in composed output,
applied at the site that omitted it rather than at each consumer.

### What NEW freedom this creates, and how it is bounded

Publishing the refusals adds stderr content composed from config, next to the run banner whose
exactly-one-per-run count is what makes a missing banner and a broken banner distinguishable. Bounded
in the same commit by three assertions: `CONFIG_REFUSAL_PREFIX` is disjoint from both banner forms
(so `isCheckpointBannerLine` rejects every published refusal); a config key spelling a complete
forged banner line still leaves **exactly one** banner line in the run, and the forged text appears
escaped onto one line; and a config with two dropped entries produces exactly two refusal lines,
never more.

---

## Answers that found nothing (recorded, because a probe that found nothing is a result)

**Self-set spellings.** Twelve real assignment spellings were probed against the committed artifact
and every one was refused: bare `NAME=v cmd`, `export`, `env`, `/usr/bin/env`, `declare -x`, after
`;`, after `&&`, inside `( … )`, after a newline, after a tab, behind `sudo -E`, and `NAME =v` with a
space before the `=`. A heredoc appending an export to `~/.zprofile` was also refused, because the
literal appears in the command text.

**Shell indirection — the bounded residual, not a fix.** Three spellings ALLOW and still do:

```
ALLOW  V=GRUGOPS_FLOOR_OPEN_PR; export "$V=me"
ALLOW  eval "$(printf 'export GRUGOPS_FLOOR_%s=me' OPEN_PR)"
ALLOW  export GRUGOPS_FLOOR_""OPEN_PR=me
```

They are **not** closed, deliberately. Widening a pattern to recognize more spellings is the failure
mode Phase 25 spent ten rounds proving out before closing that class by construction instead. The
honest bound, now written where the refusal is defined: **the self-set refusal is a visibility control
over a literal spelling, not the access control.** The access control is that the hook is a separate
process whose environment an agent's child shell cannot reach — which is why the indirection
spellings authorize nothing either. What they defeat is the transcript's record of the attempt. The
same bound covers persistence through a file write, which is the accepted residual `T-30-46`.

**Disposition VALUE variants.** `"OFF"`, `"off "`, `" off"`, `0`, `null`, `true`, `["off"]` — every
one is enforced as `block` even with the floor grant present, and only the exact `"off"` lowers.
`canonicalizeDisposition` has no `default:` arm that could return anything else. No finding.

**Roster KEY variants.** `PROTECTED_BRANCH_MERGE`, `protected_branch_merge ` (trailing space) and
`protected-branch-merge` are each dropped and the checkpoint stays at `block`, with the grant
present. Only the exact id lowers. No finding — but the drop was SILENT, which is `V-30-10-01` and is
now published.

**Ordering of the self-set refusal against the matrix lookup.** The refusal runs after the read, the
evaluation and the banner. No write happens before it and no decision happens before it, so there is
no window. The banner IS printed for a refused self-set command, which is D-20 working as specified.
No finding.

**The `evaluation.get(id) === undefined` branch and `composeBanner`'s short-map throw.** Both are
unreachable by construction (`evaluateMatrix` walks the same roster the banner does). Recorded as the
same class as `V-30-10-16` — asserted anyway, and now, post-`A-2`, a throw from either reaches the
fail-closed answer rather than exiting 1.

**Note-body injection through the command string.** `emitCheckpointNote` already `JSON.stringify`s
`command`, `actor` and `authorizedBy`, so an agent-controlled command carrying newlines or a `---`
fence cannot spell a second note. Probed and confirmed. No finding — and it is the precedent `A-6`
was fixed against.

---

## The V-30-10-03 decision, made explicitly

Surface B left this open and named this plan as its owner: should a caller with no `CLAUDE_PROJECT_DIR`
read the KIT's dial, or refuse?

**Decision: (a) keep the fallback and say so.** The reason is a fact about this hook rather than a
preference. `hooks/hooks.json` is a Claude Code plugin manifest, and Claude Code is the one target CLI
that sets `CLAUDE_PROJECT_DIR`. On the four CLIs that do not set it, **this hook does not run at all**,
so the fallback is not a per-repository dial silently resolving to a per-kit one for a guard
invocation. It is the base for library and manual callers of the reader, for whom "the kit I was
loaded from" is the only root that exists. A shared kit therefore carries a shared dial for those
callers, documented rather than left to be discovered.

What the surface-B finding got right is fixed: there were TWO expressions for one base.
`hooks/guard.ts` recomputed `join(import.meta.dirname, "..")` beside the reader's own fallback, and
the two agreed only because `hooks/` and `scripts/` happen to sit at the same depth. The reader
PUBLISHES its fallback (`GOVERNANCE_FALLBACK_BASE`, added by surface B's F1), and the guard now reads
that answer instead of recomputing it.

---

## RED-first record — the new cases run against the PRE-FIX committed artifacts

The round-1 cases were run against a `git archive HEAD` tree (the committed pre-fix `.js`) with the
new exports spelled literally in the test copy, so that each case's **assertion** is what fails rather
than a missing symbol. A first attempt failed to COLLECT (`Cannot convert undefined or null to
object` — `NAMED_GRANT_ENV_VARS` does not exist pre-fix); a collection error is not a RED assertion
and is recorded here as a discarded probe rather than presented as one.

```
hooks/guard.test.ts            against pre-fix artifacts:  24 failed | 73 passed (97)
hooks/admission-guard.test.ts  against pre-fix artifacts:   4 failed | 67 passed (71)
```

The 24 failures name: the admission grant escaping the refusal (2), the vocabulary-driven sweep (1),
the no-second-literal drift guard (1), the four fail-open dependency cases plus the admission-guard
one (5), the false `CHECKPOINT REFUSED` record (1), the eight whitespace-grant cases (8), the trimmed
published name (1), the `names nobody` banner clause (1), and the four `V-30-10-01` / `A-6`
publication cases (4).

**What PASSED pre-fix is the discrimination proof.** The intact-mirror premise case, the
"a name that merely LOOKS like a grant is not refused" control, the "same shape WITHOUT the action
approval still records REFUSED" control, the "a clean config reports NOTHING" control, and
`env=<whitespace>` with a NON-matching stamp all passed against both artifacts. The cases fire on the
axis they name and not on everything.

Against the fixed tree: `hooks/guard.test.ts` 97/97, `hooks/admission-guard.test.ts` 71/71.

---

## Round 1 status

Six findings closed with structural fixes, each with its RED record, its mirror reproduction on the
committed artifact, its new degree of freedom named and bounded in the same commit. Mutation proofs,
self-reproduction against the fixed build, and the two independent reviews follow in this log.

---

## Mutation proofs (closure clause 3)

Each mutation is applied to the **emitted `.js` the tests load**, the marker is grepped in that
artifact before the run (a mutation that does not land leaves the old `.js` in place under
`noEmitOnError`, which this repository has already recorded once as a false result), and
`npm run build` restores the tree afterwards with the marker count back to zero.

| # | mutation, in the emitted artifact | marker present | result |
|---|---|---|---|
| `M1` | `GRANT_ENV_VAR_PATTERN_SOURCE` narrowed back to `GRUGOPS_PROD_DEPLOY_APPROVED\|GRUGOPS_FLOOR_…` | `MUT-M1` ×1 in `scripts/checkpoints.js` | **KILLED** — 30 failed / 67 passed |
| `M2` | the unloadable-dependency catch replaced by `process.exit(1)` | `MUT-M2` ×1 in `hooks/guard.js` | **KILLED** — 4 failed / 93 passed (exactly the four prod-deploy dependency cases) |
| `M3` | `record(r, outcome, …)` hardcoded back to `record(r, "refused", null)` | `MUT-M3` ×1 in `hooks/guard.js` | **KILLED** — 1 failed / 96 passed (exactly the record-outcome case) |
| `M4` | `grantedBy` reverted to `raw.length > 0 ? raw : null` | `MUT-M4` ×1 in `scripts/checkpoints.js` | **KILLED** — 14 failed / 154 passed across both hook suites |
| `M6` | the untrusted config key interpolated RAW again | `MUT-M6` ×1 in `scripts/context-io.js` | **KILLED** — 1 failed / 96 passed (exactly the forged-banner bound) |

Markers after the restoring build: `hooks/guard.js:0  scripts/checkpoints.js:0
scripts/context-io.js:0`.

### `M5` — why `A-5` is proved differently, stated rather than glossed

Reverting the diff assertion to its index-scoped form does **not** go red on a clean tree — that is
the whole finding, and a mutation the suite cannot kill is not evidence. `A-5` is therefore proved
two other ways.

**The clone reproduction** (above): with the change staged, `git diff --quiet hooks/guard.ts` exits 0
while `git diff --quiet HEAD -- hooks/guard.ts` exits non-zero. That is the scope difference, measured
on real git rather than argued from the manual.

**The retroactive sweep** — the same-commit predicate applied to every commit in this repository's
history that ever touched `hooks/guard.ts`:

```
b0a8c92 2026-09-05 refactor(30-08): one evaluation produces both …   baseline=1  artifact=1   PASSES
49f3c81 2026-09-05 feat(30-08): the notify branch records a finding   baseline=1  artifact=1   PASSES
a3bf04f 2026-09-05 refactor(30-03): delete the second governance …    baseline=1  artifact=1   PASSES
a4f64ec 2026-09-05 feat(30-01): wire protected_branch_merge end-to-…  baseline=1  artifact=1   PASSES
a38d275 2026-06-13 feat(15-02): port prod-deploy guard to TypeScript  baseline=0  artifact=1   FAILS
```

The predicate separates four commits from one. The Phase-15 TypeScript port changed the guard without
carrying the frozen baseline in the same commit — a historical instance of exactly the split D-24
forbids and nothing had been asking about. A predicate that passed all five would have been vacuous;
this one discriminates on real history.

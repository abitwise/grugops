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

---

# Round 1, Task 2 — the point-of-effect test-integrity refusal, and the settings-file vector

## The emitter's refusal: attacked on the committed artifact, through the CLI verb

Every probe spawns the committed `scripts/context-io.js` **as a process** through the `emit-verdict`
verb, with a fresh empty context root, and compares the directory before and after.

### Can a green verdict be written without a clean integrity result?

**No, on every axis probed.** Fifteen values were driven through the verb, including every value a
canonicalizer elsewhere in this tree would fold INTO the sentinel:

```
exit=0 wrote=1  "clean"      <- CONTROL: the sweep is not vacuous
exit=1 wrote=0  "finding" "unknown" "CLEAN" "Clean" "clean " " clean" "clean\n" "clean\t"
exit=1 wrote=0  "" "0" "1" "true" "cleanX" "xclean" "clea<U+200B>n"
exit=1 wrote=0  (integrity argument ABSENT)
```

There is no canonicalization on this path, and that is the point: `TEST_INTEGRITY_CLEAN` is compared
with `!==` against a value passed through unmodified, and the complement of one exact string is
refused by rule rather than by enumeration.

### Is the refusal reached before the first composition line on EVERY path?

**Yes, and it is measured as a directory comparison rather than asserted.** On every refusal — the
integrity refusal and the four refusals ABOVE it (invalid task name, a verdict id that breaks the
stamp grammar, a verdict id carrying a newline, a verdict id carrying a path separator) — the context
root is **empty**: not a partial file, not a zero-length file, not even the task directory. Nothing
was written because nothing was composed.

```
tree after refusal:  (EMPTY — nothing created at all)
```

The nine-case sweep and the five above-the-check paths are pinned in `scripts/context-io.test.ts`.

### Can a green verdict be RECOGNIZED without the emitter having written one?

`isLiveGreenVerdict` requires `kind === "finding"`, `by === "§14-gate"`, the exact `§14-gate#<id>`
stamp in `refs`, the green marker in the body, and liveness under `currentState`. Each was attacked
in turn against the committed artifact, with a plant written straight to disk (the documented same-uid
direct-filesystem residual, so the only question is what the RECOGNIZER accepts):

```
ADMITTED  CONTROL: a real emitVerdict-shaped plant                    <- non-vacuous
refused   a CLAIM carrying the stamp in refs and the marker in body
refused   a FINDING by an ordinary role carrying both
refused   a gate-authored note with the marker but the WRONG run id
refused   a gate-authored note with the right refs but NO marker
```

### The two-sided divergence question — the one that would be a forge

The sharp question is not "does the recognizer accept a near-miss", it is **"is there a spelling the
WRITE path lets through as not-the-reserved-identity while the READ path still counts it as a
verdict?"** That asymmetry is the forge, and it is the Phase-27 class this repository spent twelve
rounds on. Eleven code-point variants, both sides, on the committed artifact:

```
  side-1   side-2      variant
  refused  RECOG       exact
  refused  RECOG       trailing U+0020
  refused  RECOG       trailing U+00A0 nbsp
  refused  RECOG       leading U+00A0 nbsp
  allowed  no          trailing U+200B zwsp
  refused  RECOG       trailing U+FEFF bom
  refused  RECOG       trailing U+2007 figure space
  refused  RECOG       trailing TAB
  allowed  no          internal U+200B
  allowed  no          uppercase GATE
  allowed  no          fullwidth digits
```

**No divergence.** Every row is either `(refused, RECOG)` — the identity is protected on write and
recognized on read — or `(allowed, no)` — the spelling is not the identity on either side. The two
predicates agree on every axis probed, because both read the value the frontmatter parser produces
rather than the bytes on the line. The sweep is pinned as an equality (`recognized ===
refusedAsImpersonation`), so a normalizer added later to ONE side goes red.

**A FALSE CONTROL was caught and discarded before any of this was believed.** The first version of
this probe carried no `verified_by`, so every near-miss row was refused for "a finding requires a
verified_by stamp" and the impersonation rule was never reached. The corrected probe carries
`human:alice` on every row, so `by` is the only axis under test. The discarded run is recorded here
rather than deleted.

### The emitter's header tier statement — checked, not changed

AUTO-04's flagged assumption is about what the CALLER can assert, and the header already states it at
the right tier and refuses to overclaim. Quoted, because the acceptance criterion is that the wording
matches what is true:

> THE TIER, STATED RATHER THAN PAPERED OVER. The hook-enforced checkpoints are decided by a SEPARATE
> process (hooks/guard.js) reading its own environment, which the agent under the hook cannot set for
> itself. This one is decided IN-PROCESS from an argument the gate procedure supplies. Those are
> different tiers and this file will not claim otherwise. […] The residual is that a caller determined
> to lie can state it; that residual is named here and in the workflow prose instead of being claimed
> away.

No change. Recorded as an answer that found nothing.

---

## `A-7` — the admit CLI's success line named a check that had not run

`console.log("note admitted: structurally valid and the §14-gate stamp matches a live green
verdict.")` was printed unconditionally. Only a finding stamped `§14-gate#<id>` is cross-checked; a
`human:<name>`-stamped finding and a soft `claim` reach the same line having had no cross-check at
all. Observed directly while running the divergence sweep, whose rows carry `human:alice` stamps and
printed that sentence.

A success line naming a check the run did not perform is the AP-1 shape this repository records at
severity `blocking`, and it is the third instance of it in this round (`A-3` and the `A-4` banner
clause are the others).

**Structural fix:** not a second predicate here deciding which checks applied — that would put the
admission rule in two places. The line now says only what is true of every admitted note: *it passed
every admission check that applies to it*, and enumerates the checks that can apply.

---

## `A-8` — the emit-verdict verb did not check its own arity, and one half of that is undecidable

**What was fixed.** The verb takes three required positionals and one optional. Fewer or more were
accepted silently: two arguments passed `undefined` into the integrity slot, five let a stowaway
argument sit unremarked. Both are now refused as arity errors. This is an ARITY check and
deliberately not a VALUE check — the integrity value is passed through unmodified so the CLI and the
in-process path cannot come to disagree about which values admit a verdict, and checking argv's SHAPE
adds no second authority over that vocabulary.

**What CANNOT be fixed, written down rather than fudged.** The pre-30-05 shape
`emit-verdict <task> <id> <contextRoot>` has exactly THREE arguments, which is also the legitimate
`emit-verdict <task> <id> clean`. Nothing but the VALUE separates them, and inspecting the value here
is exactly what must not happen. Measured on the committed artifact, the shifted invocation produced:

```
context-io: refusing to emit a green verdict — the test-integrity result was
"/var/folders/y3/.../T/t2-XXXX", and only "clean" admits one. Nothing was written.
```

Fail-closed in direction — a filesystem path is not `clean`, so nothing was written — but a refusal
that names a directory as a test outcome sends a human to the wrong place. The message now states the
argument order **unconditionally**, never as a guess about the value it just quoted. The remaining
ambiguity is a recorded residual, and the test that pins it asserts the honest outcome (fails closed,
names the order) rather than a fix that cannot exist.

---

## The settings-file vector — the empirical reproduction AUTO-03 requires

### What was attempted

The experiment was designed and built: a read-only PreToolUse observer that records
`GRUGOPS_SETTINGS_PROBE_PROJECT`, `GRUGOPS_SETTINGS_PROBE_USER`,
`GRUGOPS_FLOOR_PROTECTED_BRANCH_MERGE`, `CLAUDE_PROJECT_DIR` and `CLAUDE_PLUGIN_ROOT` from its own
process environment, denies nothing, and exits 1 only for a command carrying a sentinel token so the
host's treatment of a non-zero hook exit could be observed at the same time. Registering it required
writing an `env` block and a `hooks.PreToolUse` entry into `.claude/settings.local.json` mid-session —
which is the vector itself, performed deliberately, with a backup taken first and a restore after.

### What happened

**The write was refused by the host's own permission classifier**, before any byte was written:

> Permission for this action was denied by the Claude Code auto mode classifier.

`.claude/settings.local.json` is byte-unchanged (`sha256
0026a20c76a707f6989b86bd91151154acac37e9693aab33777168624c85f860`, keys `["outputStyle",
"permissions"]`), and no backup file was created because the command did not get that far. **No
workaround was attempted.** A settings-file write blocked by the permission system is not something
to route around, and this executor has no authority to grant itself the permission.

### What this is, and what it is NOT

It is **not** "the vector did not reproduce". It is **"the reproduction could not be run"**, and the
two must not be recorded as the same thing. Nothing here licenses upgrading the guarantee, and
nothing here licenses softening the residual either. `A2` in the research assumptions log stays open,
at its recorded tier: the vendor documentation states that settings-file `env` entries are reapplied
dynamically during active sessions, and does **not** state that a hook subprocess spawned after the
edit inherits the new value; the composition of the two is an inference this round did not turn into
an observation.

The published residual therefore keeps every clause it has. What changes is that its **evidence tier
is now stated** — the mechanism sentence is marked as a composed inference with the attempted
reproduction and its blocker named — so no reader takes an inference for a measurement. Marking the
tier is not softening: the residual remains `accepted`, remains open, and remains permissive in
direction.

**This is a checkpoint item.** AUTO-03's must-have asks for the vector to be reproduced empirically at
least once. It cannot be satisfied without a human either granting the settings-write permission for
one experiment or accepting the fence.

### What WAS observed on the host

| | |
|---|---|
| Claude Code | `2.1.263` (running binary at `~/.local/share/claude/versions/2.1.260`) |
| Node | `v24.12.0` |
| `CLAUDE_PROJECT_DIR` in a Bash tool environment | **not present** (measured: `env \| grep CLAUDE`) |

The `CLAUDE_PROJECT_DIR` observation bounds one claim and not another: it is absent from the *tool*
environment, which says nothing about the *hook subprocess* environment the vendor documentation
describes separately. It is recorded at exactly that width, and it is the reason the `V-30-10-03`
decision above rests on which CLI runs the hook rather than on this measurement.

### The environment-scrubbing watch item (`A1`) — its tier upgraded by direct observation

`A1` entered the research from a GitHub issue title, not from vendor documentation: that Claude Code
v2.1.251 introduced `CLAUDE_CODE_SUBPROCESS_ENV_SCRUB=1` scrubbing only `CLAUDE_CONFIG_DIR`. The
installed binary was read directly. **OBSERVED** in `~/.local/share/claude/versions/2.1.260`:

- The variable exists — 8 occurrences.
- Its enablement rule is `enabled = truthy(CLAUDE_CODE_SUBPROCESS_ENV_SCRUB) || (truthy(GITHUB_ACTIONS)
  && !falsy(CLAUDE_CODE_SUBPROCESS_ENV_SCRUB))`, with `falsy` matching `/^(?:0|false|no|off)$/i`. So
  it is **off by default outside GitHub Actions** and on by default inside it.
- Its scrub set is built by flat-mapping a fixed list with `INPUT_<NAME>` and lowercase
  `NPM_CONFIG_*` forms, alongside code that rewrites credential-shaped values and URLs — the shape of
  a CI-injected-input hardening feature, not a general-purpose variable filter. The user-facing string
  is *"(allowed_non_write_users hardening). Declare allowedTools explicitly, or set
  CLAUDE_CODE_SUBPROCESS_ENV_SCRUB=0 to opt out."*
- **The binary contains ZERO occurrences of the string `GRUGOPS`.** No shipped scrub list on this
  version can name a `GRUGOPS_*` variable.

**The premise of that last measurement is asserted, not assumed.** `grep -a` was used throughout,
because BSD `grep` silently reports zero matches on a file it classifies as binary; and the control is
that the *same* invocation over the *same* file found `CLAUDE_CODE_SUBPROCESS_ENV_SCRUB` eight times.
A harness that returned 0 for everything would have failed that control.

**Tier, stated honestly.** The scrub feature's existence, its enablement rule and the absence of any
`GRUGOPS` string are **OBSERVED on this host version**. The literal membership of the scrub list was
**NOT extracted** (the grep budget over a 198 MB Mach-O binary did not reach it), so this round does
not claim to know every name in it — only that none of them is a `GRUGOPS_*` name, which is the
question `A1` actually poses. The general risk `A1` records — that a future list could widen — is
unaffected and stays open. The research's specific claim that the scrub covers "only
`CLAUDE_CONFIG_DIR`" was **not** confirmed and is corrected to what was observed.

---

## Discarded probes (recorded rather than deleted)

1. **The first near-miss identity sweep was a FALSE CONTROL.** Its rows carried no `verified_by`, so
   they were refused for a missing stamp and the impersonation rule was never reached. Re-run with
   `human:alice` on every row.
2. **The RED tree produced five failures that never reached their predicates.** `$SP/red` is a
   `git archive` mirror with no `.git`, and five pre-existing `context-io.test.ts` cases derive their
   corpus from `git ls-files`. They failed with `fatal: not a git repository` — the exact class
   surface B recorded — and are discarded as harness artifacts, not results. The five RED failures
   that ARE results are the two `A-7` cases and the three `A-8` cases.
3. **The first `A-8` fix was wrong and its test was written against it.** An arity check cannot
   separate the shifted three-argument shape from the legitimate one; the test asserting it could was
   red, and the honest outcome replaced both the fix's scope and the test's claim.

---

## Mutation proofs — Task 2 (closure clause 3)

| # | mutation, in the emitted `scripts/context-io.js` | marker | result |
|---|---|---|---|
| `M7` | the admit success line restored to the unconditional "the §14-gate stamp matches a live green verdict" | `MUT-M7` ×1 | **KILLED** — 2 failed / 202 passed (exactly the two `A-7` cases) |
| `M8` | the arity bounds `rest.length < 3 \|\| rest.length > 4` deleted | `MUT-M8` ×1 | **KILLED** — 2 failed / 202 passed (exactly the two arity cases) |
| `M9` | the unconditional argument-order sentence deleted from the refusal | `MUT-M9` ×1 | **KILLED** — 1 failed / 203 passed |
| `M10` | `isLiveGreenVerdict` given a fold the write path does not have (strip `U+200B`/`U+FEFF`, lowercase) | `MUT-M10` ×1 | **KILLED** — 3 failed / 201 passed |

`M10` is the load-bearing one. The divergence sweep asserts an EQUALITY between two sides, and an
equality over eleven rows that all agree is exactly the kind of assertion that can be vacuously true.
Folding the recognizer on three axes the impersonation rule does not fold on — `U+200B` inside, `U+200B`
trailing, and case — made the sweep fail on **exactly those three rows** and no others. The sweep
discriminates on the axis it names.

Markers after the restoring build: `scripts/context-io.js:0`.

---

# Round 1 — self-reproduction against the FIXED build (closure clause 5)

The fixing agent re-ran every round-1 attack itself, against a `git archive HEAD` mirror of the FIXED
tree, spawning the compiled artifacts as processes. **Premise asserted first** — every mirrored `.js`
was sha256-compared to the working tree's copy before a single probe ran:

```
FIXED mirror HEAD = 380ffbadf98c05965e8bfa8ed4d1b6663383a9b3
hooks/guard.js            8e149a6d2b55ff1b…  premise OK
hooks/admission-guard.js  ab37cf9eadd9d3e3…  premise OK
scripts/checkpoints.js    4c7b2848b2606273…  premise OK
scripts/context-io.js     397a746e9a7af37d…  premise OK
```

Every row records the **evidence** — the refusal text or the measured value — never the exit code
alone.

| id | verdict | evidence |
|---|---|---|
| `A-1` | REFUSED | `Refused: an agent may not set or export GRUGOPS_ADMISSION_APPROVED_BY. That variable carries the named human who may dispose of a gated governance finding…` |
| `A-2a` | REFUSED | `exit=0` :: `Blocked (fail-closed): the grugops prod-deploy guard could not load its checkpoint roster and governance reader…` — the corrupted-roster attack now DENIES where it allowed |
| `A-2b` | REFUSED | `exit=0` :: `Admission blocked (fail-closed): the grugops admission guard could not load its note classifier and governance reader…` |
| `A-3` | TRUE RECORD | `CHECKPOINT ALLOWED: the checkpoint "protected_branch_merge" was declared \`off\` and enforced as \`block\`.` — the note now states the outcome the run reached |
| `A-4a` | REFUSED | banner: `protected_branch_merge=off NOT AUTHORIZED (GRUGOPS_FLOOR_PROTECTED_BRANCH_MERGE names nobody; enforced as block)` |
| `A-4b` | REFUSED | `Production deploy blocked: humans decide, agents execute…` — a one-space ACTION approval no longer approves |
| `A-4c` | REFUSED | `Admission blocked: humans decide, agents execute. This is a gated governance finding (by: security-nfr)…` — a one-space approver with a matching `human: ` stamp no longer admits |
| `A-6` | INERT | exactly **1** banner line survives a config key spelling a complete forged banner; the forged text is present, escaped onto one line |
| `A-7` | HONEST | `note admitted: it passed every admission check that applies to it — structural validation, the reserved-identity rule…` |
| `A-8` | NAMED + CLOSED | wrote nothing: `true`; the refusal names `emit-verdict <task> <id> <clean\|finding\|unknown> [contextRoot]` |

`A-5` cannot be self-reproduced by spawning an artifact, so it was reproduced the way it was found —
on a clone of the FIXED tree, running the original attack:

```
clone HEAD 380ffba
control: the freeze block on a clean clone            4 passed
ATTACK:  change the guard, update the constant, `git add hooks/guard.ts` ONLY
  old index-scoped question : exit 0        -> WOULD HAVE PASSED
  new HEAD-scoped question  : exit != 0     -> REFUSES
  suite: × hooks/guard.ts has no uncommitted modification, measured against HEAD   1 failed | 3 passed
```

The exact bypass that was green in round 1 is red against the fixed assertion, and the clean-tree
control still passes — so the fix refuses the attack rather than refusing everything.

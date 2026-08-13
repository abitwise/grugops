---
kind: convention
tier: core
---
# Commit convention

Single source for HOW the factory commits its artifacts. Every workflow's `## Commit`
step references THIS file by path; nobody else restates the branch guard or the message
format. grug write the trail down — tickets, board, traceability, metrics, and context notes
are only an auditable trail once they are committed. An uncommitted artifact is not proof.

## (a) Branch guard

This part is stated in **clear voice — it is a safety topic.**

Before any commit, read the current branch:

```sh
git rev-parse --abbrev-ref HEAD
```

Compare it to the **protected list**. There is no `protected_branches` key in
`.grugops/factory.config.json` today, so the DEFAULT protected set is
`{ main, master }`. If a project adds a `protected_branches` array to that config, union
those names into the default set.

If the current branch is protected, **do NOT commit.** Create or switch to a working
branch first, named `grugops/<workflow>-<id>` (for example `grugops/idea-to-epics-ABC`,
`grugops/ticket-to-pr-ABC-001`), then commit there:

```sh
git switch -c grugops/<workflow>-<id>   # then stage and commit on this branch
```

Agents commit to a **working branch only** — never to a protected branch.

## (b) Commit message format

Use the Conventional-Commits shape, consistent with this repo:

```
type(scope): summary
```

`type` is one of `feat | fix | docs | refactor | test | chore | style | perf`. `scope`
names the area (e.g. `factory`, `board`, `trace`, `ticket`, the workflow id). `summary`
is one short line in the imperative.

Examples (grug commit small, grug commit clear):

- `feat(ticket): grug cut ABC-001 ticket with acceptance criteria`
- `docs(board): grug move ABC-001 into In Review, write trace row`
- `chore(metrics): grug record cycle time after the daily sweep`

Keep the format line itself precise; the caveman flavor lives only in the summary text.

## (c) Humans hold merge and deploy

This part is stated in **clear voice — it is a safety topic.**

Agents never merge a protected branch and never deploy to production. **Humans hold both.**
The factory's job ends at a committed working branch and a pull request a human reviews;
a named human merges, and a named human (or a human-confirmed pipeline) deploys.

This is enforced by two complementary layers:

- **The commit side (this convention).** The branch guard above REDIRECTS a commit away
  from a protected branch onto a `grugops/<workflow>-<id>` working branch. A convention
  can redirect; that is why the commit-side safety lives here.
- **The push side (the mechanical hook).** The PreToolUse guard `hooks/guard.js` DENIES
  any `git push` that names a protected branch (`main`, `master`, `release/…`) and any
  force push, plus the config-matched production-deploy commands. A deny-hook can only
  block, not redirect.

**Hook decision (why `git commit` is NOT hook-gated):** the guard intentionally does not
gate `git commit`, and it should not. A deny-hook can only block — it cannot switch the
agent onto a safe branch. The correct behavior for a commit attempted on a protected
branch is to SWITCH to a working branch and proceed, which only this convention can do; a
blanket `git commit` deny would stall the agent with no path forward. So the commit-side
safety lives in this convention's branch guard, and the push-side safety stays in the
hook. `hooks/hooks.json` and `hooks/guard.js` are unchanged by this convention.

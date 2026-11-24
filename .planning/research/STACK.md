# Stack Research

**Domain:** v3.1 stack additions for grugops: a one-command install, declared upstream sources with build requests, and a universal consultant role. This research covers only what is new; the validated v3.0 stack (TypeScript tooling compiled with `tsc` to committed `.js`, Node 22+, zero runtime dependencies on hosts, the two-root installer) is not re-researched.
**Researched:** 2026-11-24
**Confidence:** MEDIUM-HIGH overall. HIGH where a behaviour was reproduced locally on this machine (npm 11.20.0, Node 26.12.1) or read from the vendor's own documentation and confirmed by a second source. MEDIUM for npm 12 and pnpm 11 behaviour that rests on vendor changelogs and secondary reports. `UNKNOWN - verify` is marked where neither was possible.

## TL;DR

1. **Publish grugops to the npm registry under the unscoped name `grugops`. The README one-liner is `npx grugops@3.1.0 --claude`, run from inside the repository.** It is the only option that meets every constraint at once: Node is already the prerequisite, the package has zero `dependencies` so npx downloads only grugops, the version is exact and registry versions are immutable, Windows gets npm's `.cmd` shim, nothing lands on the user's persistent `$PATH`, and it plugs into the existing `install.js` unchanged because the package layout is the checkout layout. Publish from GitHub Actions with **trusted publishing (OIDC)**, which adds provenance automatically, through **staged publishing**, so a named human approves each release with 2FA. That matches "humans decide; agents execute".
2. **Do not ship a `curl | sh` / `irm | iex` bootstrap, a `github:` npx spec, or a Node single-executable binary.** Each re-creates something grugops retired: a second installer, a dependency on npm's git path (which npm 12 turns off by default), or a platform binary on `$PATH`.
3. **Keep the Claude Code plugin marketplace as a second, Claude-Code-only path.** Use the now-documented one-liner `claude plugin install grugops --marketplace abitwise/grugops#v3.1.0`. It cannot replace (1), because a plugin writes no repository state, no ask rules and no `tools/grugops/` programs.
4. **Upstream pins: record the pins in `factory.config.json` and verify them with the `git` CLI. No submodule and no new dependency.** Name the digests with the in-toto DigestSet keys `gitCommit` and `gitBlob` (40 or 64 hex). Read blob ids from git's object database, not by hashing working-tree bytes, because CRLF conversion on Windows changes those bytes.
5. **Build requests: a new markdown document class with YAML frontmatter and its own closed key set, following the existing ticket-frontmatter authority (`scripts/board-model.ts`).** Borrow field names from MADR 4.0. Add nothing to the 8 ticket keys unless the board contract is amended first.
6. **Consultant role: nothing to add to the stack.** Confirmed: it is a role file plus a workflow and dials in the existing config, and it stays inside the role byte budget.

## Recommended Stack

### Core Technologies (new in v3.1)

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| **npm registry package `grugops`** (unscoped) | first release `3.1.0` | The distribution unit behind the one-command install | `npm view grugops` and `npm view create-grugops` both returned E404 on 2026-11-24, so the name is unpublished (HIGH, checked live). Unscoped keeps the README line short (`npx grugops@3.1.0`) and matches the brand rule of lowercase `grugops`. A scoped `@grugops/…` name needs an npm org and a longer command, which buys nothing. |
| **`npx` / `npm exec`** (ships with Node) | npm 10.9.x (bundled with Node 22.23.x), 11.19–11.20 (Node 24/26), 12.2.x (Node 27, or a manual upgrade) | Runs the `grugops` bin from a temporary install | Already on every machine that meets the Node 22+ prerequisite, so the user installs nothing new. Reproduced locally on npm 11.20.0: npx keeps the caller's working directory (a subfolder stays a subfolder), runs the bin from `<npm cache>/_npx/<hash>/node_modules/grugops/`, and sets `npm_command=exec` and `INIT_CWD` (HIGH). The bin goes on `PATH` only for that one process (docs.npmjs.com/cli/v11/commands/npm-exec), so no persistent `$PATH` binary is created. |
| **npm trusted publishing (OIDC) from GitHub Actions** | npm CLI ≥ 11.5.1 and Node ≥ 22.14.0 in the publish job | Publishes with no long-lived npm token | Per docs.npmjs.com/trusted-publishers (edited 2026-10-06): GitHub-hosted runners only, `permissions: id-token: write`, and provenance is generated automatically for a public repository and a public package. `repository.url` in package.json must match the GitHub repository exactly. |
| **npm staged publishing** (`npm stage publish` → `npm stage approve`) | npm CLI ≥ 11.15.0, Node ≥ 22.14.0 | CI stages the tarball and a human approves it with 2FA | docs.npmjs.com/staged-publishing (edited 2026-11-10). The trusted-publishers page recommends allowing only `npm stage publish` on the trusted publisher and setting "Require two-factor authentication and disallow tokens". This keeps the release human-gated, the same rule grugops applies to merge and deploy. A GitHub changelog (2026-09-18) says npm targets January 2027 for removing direct publishing with 2FA-bypass tokens, so this is also the path that will keep working (MEDIUM). |
| **Node.js for the publish job** | **Node 24 LTS** (24.22.3 bundles npm 11.19.1) | Runs trusted publishing and staging in CI | Node 22 LTS bundles npm **10.9.9** (nodejs.org/dist/index.json, read 2026-11-24), which is too old for both trusted publishing (11.5.1) and `npm stage` (11.15.0). Use Node 24 in the release job only. The package `engines` stays `>=22`, and the test matrix keeps Node 22. |

### Supporting Mechanisms (no new libraries)

| Mechanism | Version | Purpose | When to Use |
|-----------|---------|---------|-------------|
| `package.json` `bin` → a thin `install/grugops.ts` dispatcher (compiled `.js`, first line `#!/usr/bin/env node`) | n/a | Gives npx one bin named `grugops`, which npx picks because it matches the package name (npm-exec docs: a single bin, or the bin matching the unscoped name) | Always. The dispatcher spawns `process.execPath` on `install.js`, or on `uninstall.js` for a `uninstall` subcommand, with `stdio: "inherit"`, and passes the exit code through. `install.js` stays the single installer. `tsc` keeps a leading shebang. |
| `package.json` `files` allowlist | n/a | Ships exactly what `install.js` reads from `GRUGOPS_SRC`: `agent-factory/`, `AGENTS.md`, `.claude/agents/`, `.claude/skills/`, `install/*.js` + `install/runnable-package.json`, the compiled `scripts/**/*.js` the installer copies, mirrors or spawns (`scripts/runnable-ref/*.js`, the adapter generator twins, `scripts/role-skills-reader.js`), plus the public `docs/` and `examples/` pages the kit home mirrors, `LICENSE`, `NOTICE`, `README.md`, `CHANGELOG.md` | Always. Verified locally: npm 11.20.0 `npm pack --dry-run` **includes dot folders named in `files`** (`.claude/agents/…`) (HIGH). Exclude `*.ts`, tests, fixtures, `docs/audit/`, `docs/design/`, `docs/initial/` and `.planning/`. The candidate set measures about 11.6 MB unpacked before trimming `docs/`, so trim it. |
| `package.json` fields | n/a | `"name": "grugops"`, `"private": false` (or drop the key), `"bin": {"grugops": "install/grugops.js"}`, `"files": [...]`, `"engines": {"node": ">=22"}` (kept), `"type": "module"` (kept), `"repository": {"type":"git","url":"git+https://github.com/abitwise/grugops.git"}`, `"publishConfig": {"access":"public","provenance":true}` | Always. Keep `dependencies` empty and enforce it with a guard test, so the zero-runtime-dependency rule holds mechanically. devDependencies are never installed by npx. `package-lock.json` is never packed. |
| `npm pack` + offline `npx --package=./grugops-<v>.tgz grugops …` smoke test | n/a | Proves in CI that the published tarball is enough to install, with no checkout | Run in CI on **ubuntu and windows**, as a job separate from the red full suite. This is the "tarball that dropped dot directories" failure `install/kit-source.ts` already names (T-27-59), now made a release gate. The offline-tarball pattern was reproduced locally (HIGH). |
| `git` CLI (already on every host with a git repository) | any git ≥ 2.x; SHA-256 repositories give 64-hex ids | Upstream pin checks: `git -C <src> cat-file -e <commit>^{commit}`, `git -C <src> rev-parse <commit>:<path>` → blob id | Upstream sources feature. Spawned with `spawnSync(…, {shell:false})`, the pattern the installer already uses. No npm dependency. |
| `node:crypto` SHA-1/SHA-256 over `blob <len>\0<bytes>` | Node stdlib | Fallback blob id when the source is a plain folder, not a git checkout | Only when `git` cannot answer. Its result equals `git hash-object` only for bytes with no clean or CRLF filter applied (see Pitfalls). |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| `.github/workflows/release.yml` (new) | Tag-triggered `npm stage publish` with OIDC | `on: push: tags: ['v*.*.*']`; `permissions: { contents: read, id-token: write }`; `actions/setup-node` with Node 24 and `registry-url: https://registry.npmjs.org`. Run the freshness gates and the packed-tarball smoke before `npm stage publish`. Trusted publishing requires the workflow file to exist before the publisher is configured (secondary sources, MEDIUM). |
| `npm trust github` (npm ≥ 11.15.0) or the npmjs.com settings page | Configure the trusted publisher | **The package must already exist on the registry** (docs.npmjs.com/cli/v11/commands/npm-trust, HIGH). npm has no pending-publisher feature, so bootstrap like this: a human publishes `3.1.0-rc.0` by hand once, under dist-tag `next`, with 2FA. Then configure trust, then let the tag workflow stage `3.1.0` with provenance. A new trust configuration expires if nothing is published within 2 days. |
| `npm view grugops` / `npm audit signatures` | Users and CI confirm registry signatures and provenance | `npm audit signatures` checks registry signatures and provenance attestations of installed packages (npm docs, MEDIUM). The npmjs.com package page also shows provenance. |
| Existing guard and freshness culture | Keep the README install line in step with `VERSION` | Add the README `npx grugops@<v>` line to the set that bumps together (`agent-factory/VERSION`, `plugin.json`, `package.json`), held by a guard test. Today those three bump together. |

## Installation

What users copy from the README (one line, run inside the repository):

```bash
# macOS, Linux, WSL, Windows cmd.exe, PowerShell 7:
npx grugops@3.1.0 --claude            # or --codex, --antigravity, --opencode, --copilot, --pi

# Windows PowerShell 5.1 with the default execution policy (npx.ps1 is blocked):
npx.cmd grugops@3.1.0 --claude

# Preview first, changing nothing:
npx grugops@3.1.0 --claude --dry-run

# Doctor, update the shared kit, undo:
npx grugops@3.1.0 --check
npx grugops@3.1.0 --update
npx grugops@3.1.0 uninstall --claude

# Same package, other runners (no extra work for grugops):
pnpm dlx grugops@3.1.0 --claude
bunx grugops@3.1.0 --claude
```

Claude Code only, a second path (plugin skills, no repository state):

```bash
claude plugin install grugops --marketplace abitwise/grugops#v3.1.0   # Claude Code v2.1.292+
# in a session: /plugin install grugops --marketplace abitwise/grugops#v3.1.0  (v2.1.275+)
```

Maintainer side (dev/CI only, never shipped):

```bash
# no new dev dependency; the existing {typescript, vitest, @types/node} is unchanged
npm pack --dry-run          # audit the file list
npm stage publish           # CI, OIDC; a human then runs: npm stage approve <stage-id>
```

## Alternatives Considered

Ranked against grugops's constraints: zero runtime dependencies, a pinned version, the installer contract, Windows, no persistent `$PATH` binary, and no second installer.

| Rank | Option | Verdict | Why |
|------|--------|---------|-----|
| **1** | **`npx grugops@3.1.0` from the npm registry** | **Recommended** | Meets every constraint (see TL;DR). Registry versions are immutable once published, the tarball integrity hash is checked by npm on every fetch, provenance links the tarball to the tagged commit, and enterprise registry mirrors (Artifactory, Nexus, Verdaccio) proxy it with no special setup, which suits the regulated-team audience. Cost: an npm account with 2FA, one manual bootstrap publish, a release workflow, and a `files` list to keep honest. |
| 2 | Claude Code marketplace: `claude plugin install grugops --marketplace abitwise/grugops#v3.1.0` | Keep as the Claude-Code-only second path | Officially documented, pins by tag, and needs no npm (code.claude.com/docs/en/discover-plugins, read 2026-11-24). But it covers one host of six, writes no `.grugops/` state, no ask rules and no `tools/grugops/` programs (install/README.md §3), and third-party marketplaces do not auto-update by default. Not a one-command install of grugops into a repository. |
| 3 | `npm init grugops@3.1.0` (runs `create-grugops`) | Reject for now | Needs a second package (`create-grugops`, also unpublished on 2026-11-24) with its own trust configuration and release, for a command no shorter than `npx grugops@3.1.0`. Revisit only if users ask for the `npm create` idiom. |
| 4 | `npx github:abitwise/grugops#v3.1.0` (no publish) | Reject | npm 12 changed `--allow-git` to default `none`, and npm turns off `prepare` scripts for git dependencies by default (github.blog changelog 2026-06-09 and 2026-06-24; docs.npmjs.com/cli/v12/using-npm/config). Whether a top-level npx git spec is refused under npm 12 is `UNKNOWN - verify` (a live test was not run). Either way the one-liner would break or need `--allow-git=all` as npm moves users to 12. It also has no provenance, no integrity pin beyond a mutable tag unless a SHA is typed, and downloads the whole repository tarball (about 3,700 files including `.planning/`). |
| 5 | `curl -fsSL …/install.sh \| sh` + `irm …/install.ps1 \| iex` | Reject | This is how Claude Code, bun, deno and uv ship *native binaries*. Claude Code backs it with a GPG-signed `manifest.json` of SHA256 checksums (code.claude.com/docs/en/setup). grugops still needs Node, so the script would only fetch a tarball and run `node install.js`. That brings back two shell installers (POSIX + PowerShell) after D-07 retired `install.sh`, and adds a checksum and signing story to maintain, for no gain over npx. |
| 6 | GitHub release tarball + `gh release verify-asset` | Reject as the primary path; optional extra | Immutable releases and artifact attestations are strong (`gh release verify-asset`, gh ≥ 2.49.0 for the newer attestations), but a user must download, unpack and run `node`, which is not one command, or a bootstrap script (option 5) does it for them. Attaching the same `npm pack` tarball to the GitHub release as an offline or air-gapped source is cheap and fine. |
| 7 | Node single-executable application (`node --build-sea`, Node ≥ 25.5.0) | Reject | Stability 1.1 "active development" (nodejs.org/api/single-executable-applications.html). The output is a copy of the Node binary per OS and architecture, macOS needs code signing, and it is by nature a standalone program on `$PATH`, which is out of scope since v1.1. Pointless when Node is already the prerequisite. |
| — | `pnpm dlx` / `bunx` / `yarn dlx` / `deno run npm:grugops@3.1.0` | Free with option 1 | They resolve the same registry package. pnpm 11 turns on `minimumReleaseAge` = 1440 minutes (24 h) by default (pnpm.io/blog/releases/11.0, MEDIUM). Whether that gate applies to `pnpm dlx` is `UNKNOWN - verify`. If it does, `pnpm dlx grugops@<new>` fails for the first day after a release, so the README should lead with `npx`. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Any `dependencies` entry in the published package.json | Breaks the zero-runtime-dependency rule, and npx would fetch and possibly run third-party code | Empty `dependencies`, held by a guard test. devDependencies stay dev/CI-only. |
| A `preinstall` / `install` / `postinstall` / `prepare` lifecycle script in the published package | npm 12 skips dependency install scripts by default, and a script that does work on install surprises the user. grugops's installer must run only when the user asks | The bin does the work when invoked. Keep `prepack`/`prepublishOnly` maintainer-only, or omit them and run the gates in the release workflow. |
| Documenting `npm install -g grugops` | Creates a persistent global `$PATH` binary, which is out of scope since v1.1. The `bin` field makes it *possible*, so the README must not *offer* it | Only `npx grugops@<exact version>`. **Record a decision** that a `bin` field exists for npx and that global install is unsupported, so the Out of Scope line stays true. |
| `npx grugops` with no version, or `@latest`, in docs | Unpinned: re-running the README line later would install a different version | Always an exact `@3.1.0`, bumped with `VERSION` by a guard. |
| Long-lived `NPM_TOKEN` secrets in GitHub Actions | The token-theft class behind the 2025–2026 npm worms. npm is removing 2FA-bypass direct publishing | OIDC trusted publishing + staged publishing, and "disallow tokens" on the package. |
| Recording the npx cache path as the kit source | `<cache>/_npx/<hash>/…` is not a stable location (cache cleaning removes it), so commands printed later and the marker's `src` would point at nothing | In npx mode, print follow-up commands as `npx grugops@<v> …` and record the package spec (`npm:grugops@3.1.0`) as the source. See Integration below. |
| A git submodule for upstream design sources | Copies upstream into the work tree, adds `.gitmodules` and `--recurse-submodules` friction for every clone, pins a commit but not individual files, and is hostile to "read in place, copy nothing" | A pin manifest in `factory.config.json` (below). |
| Hashing working-tree bytes to check a blob pin on Windows | With `core.autocrlf=true` or a clean filter, the checked-out bytes differ from the blob, so a correct pin reads as drifted | `git rev-parse <commit>:<path>` from the object database. Use the Node hash only for a non-git folder, and say so in the report. |
| A new npm dependency for YAML frontmatter (`gray-matter`, `js-yaml`) | Breaks zero-deps and adds a second grammar next to the existing one-authority frontmatter parsers | Reuse the closed `key: value` frontmatter approach in `scripts/board-model.ts`. |

## Integration Points with the Existing Installer

These are the places v3.1 touches `install.ts`. Each is small, but each is a correctness question for the phase plan.

1. **`GRUGOPS_SRC` already resolves to the package root.** `install.ts` sets `GRUGOPS_SRC = resolve(import.meta.dirname, "..")` (line ~419). Under npx that is `<cache>/_npx/<hash>/node_modules/grugops`, which has the checkout layout as long as `files` is complete. No change is needed to the copy into `${GRUGOPS_HOME:-~/.grugops}`: `agent-factory/`, `docs/` and `examples/` land there exactly as from a checkout.
2. **Printed commands and the marker's `src`.** install/README.md §2 says every printed command names the script by absolute path, with `GRUGOPS_SRC=<dir>` stated. Under npx that path is the cache. **Decision needed:** in npx mode (`npm_command=exec`, or an explicit flag the dispatcher sets), print `npx grugops@<version> <args>` and record the package spec. The alternative is to stage a copy of the package into the kit home (for example `$GRUGOPS_HOME/src/3.1.0/`) and point `GRUGOPS_SRC` there. That is more robust offline, but it changes the kit-home layout and the `--prune-old-kit` set. Recommendation: print npx commands. It is smaller and needs no new kit-home folder.
3. **Default target = the working directory.** `install.ts` line ~559 uses `TARGET ?? process.cwd()` and does not look for the git top level. npx keeps the caller's working directory (reproduced), so the README line works from the repository root. From a subfolder it would target the subfolder. **Decide** whether the dispatcher (not install.js) should offer `git rev-parse --show-toplevel` as the prompt default. Keep the existing prompt and `--yes` rules unchanged.
4. **Uninstall is a second program.** Today `uninstall.js` is separate. The `bin` dispatcher maps `grugops uninstall …` to it. There is no new uninstall logic. The installer contract (idempotent, additive, dry-run, reversible) is inherited, not re-implemented.
5. **The `--allow-self` self-checkout guard and the `--check` stale-adapter comparison** both read `GRUGOPS_SRC`. Under npx they compare against the package, which is the intended kit. Confirm with the smoke test that `--check` after an npx install prints `ok`, not "re-run --check from a complete kit checkout".
6. **Plugin path.** `marketplace.json` uses `"source": "./"`, so the plugin cache holds the whole repository, including `install/install.js`. A plugin skill *could* run `node "${CLAUDE_PLUGIN_ROOT}/install/install.js" --target "$CLAUDE_PROJECT_DIR" --claude`. But `${CLAUDE_PLUGIN_ROOT}` changes on update and must be treated as temporary (existing STACK note), which is the same problem as item 2. Leave this out of v3.1 unless a requirement asks for it.

## Upstream Sources and Build Requests: Formats

### Pin manifest (recommended: config key, no submodule)

Put it in `.grugops/factory.config.json` (zero-config-first: absent means no upstream). Shape, using the in-toto DigestSet key names so the record reads like a standard supply-chain digest (github.com/in-toto/attestation spec/v1/digest_set.md: `gitCommit`, `gitBlob`, lowercase hex, 40 chars for SHA-1 repositories or 64 for SHA-256):

```json
{
  "upstream": {
    "owns_architecture": true,
    "sources": [
      {
        "id": "design",
        "path": "../product-design",
        "uri": "https://example.com/org/product-design.git",
        "digest": { "gitCommit": "<40|64 hex>" },
        "files": [
          { "path": "decisions/ADR-012.md", "digest": { "gitBlob": "<40|64 hex>" } }
        ]
      }
    ]
  }
}
```

- **Check:** `git -C <path> cat-file -e <commit>^{commit}` (the pinned commit exists), then `git -C <path> rev-parse <commit>:<file>` and compare with `gitBlob`. Also compare against `HEAD:<file>` to report "upstream moved since the pin". Reading at the pinned commit (`git show <commit>:<file>`) gives roles the pinned bytes even when the upstream checkout has moved on. That is "read in place" with no copy.
- **Why not a submodule:** see What NOT to Use. **Why not a separate `upstream.lock` file:** one more state file under the byte budgets, and a second config grammar. The config already has a reader on every host. If the list grows large, a sibling `.grugops/upstream.json` is the fallback, `UNKNOWN - verify` against the state budgets.
- **Upstream ids** (for traceability) are plain strings cited from the upstream documents (for example `ADR-012`). No external ID standard is needed.

### Build request document (recommended: new closed-key frontmatter class)

- grugops tickets have a **closed 8-key frontmatter set** (`id, title, status, column, size, priority, epic, feature`; `scripts/board-model.ts` `TICKET_KEYS`, `TICKET_KEY_COUNT = 8`). An unknown key is refused by name. So a build request is **its own document class with its own closed key set and its own refusal codes**, built on the same parser pattern. Do not add keys to tickets. Any change to the ticket set (for example an `upstream` citation key or a new blocked status) must first amend `agent-factory/contracts/board.md`, which the code comment requires.
- Suggested keys, borrowing MADR 4.0 vocabulary (adr.github.io/madr, MADR 4.0.0 released 2024-09-17: `status`, `date`, `decision-makers`, `consulted`, `informed`): `id`, `title`, `kind` (`question` | `change`), `status` (`open` | `sent` | `answered` | `withdrawn`), `ticket` (the blocked ticket id), `source` (upstream source `id`), `upstream-ref` (the upstream id asked about), `pinned-commit`, `answered-by-commit`, `date`. Keep it a flat `key: value` region, the grammar grugops already parses. No nested YAML, so no YAML library.

## Consultant Role: Stack Check

Confirmed: **no stack addition.** It is one role markdown file (about 2 KB, within the 67,383 B corpus budget), one workflow, two config dials (topic/lens and single versus panel), and generated adapters from the existing generator. It writes `claim`/`observation` notes through the existing `note.js` / `context-io` path. The only tooling touch is the existing derive-the-set guards picking up a new role and workflow. Those are counts in existing guards, not new tools.

## Stack Patterns by Variant

**If the user is on Windows PowerShell 5.1 (the default `powershell.exe`):**
- Show `npx.cmd grugops@3.1.0 …` next to `npx …`.
- Because Node 24+ ships `npx.ps1`, which the default execution policy blocks ("running scripts is disabled on this system"), and calling the `.cmd` shim avoids it (nodejs/node issues #60075 and #62427, MEDIUM). PowerShell 7 and cmd.exe are unaffected.

**If the user's machine has npm 12:**
- `npx grugops@3.1.0` works unchanged, because registry packages are not affected by `allow-git` or `allow-remote`, and grugops has no install scripts to block.
- Because the npm 12 defaults target git, remote-URL and lifecycle-script paths, all of which this design avoids. Note that npm 12.2.3's own `engines` requires Node `^22.22.2 || ^24.15.0 || >=26.0.0` (checked live). A user who upgraded npm on an old Node 22 patch release has their own problem, not grugops's.

**If the user is behind a corporate registry or proxy:**
- `npx` honours their `.npmrc` registry, so the mirror serves `grugops`.
- Because this is the main reason to prefer the registry over raw GitHub downloads for regulated teams.

**If the user only wants Claude Code skills, with no repository state:**
- Use the plugin one-liner.
- Because it is the documented, tag-pinned Claude Code path. The README must say it does not replace the npx install for queue work (Workflow 17 needs `tools/grugops/`).

## Version Compatibility

| Item | Compatible With | Notes |
|------|-----------------|-------|
| `npx grugops@3.1.0` | npm 10.9.x (Node 22 LTS), 11.x (Node 24/26), 12.x | npm exec has had the same behaviour since npm 7. Local check on npm 11.20.0 (HIGH). npm 10.9 and 12 behaviour for a plain registry package is expected to be identical (MEDIUM; covered by the CI smoke on Node 22 + 24). |
| Trusted publishing | npm ≥ 11.5.1, Node ≥ 22.14.0, GitHub-hosted runners | Self-hosted runners unsupported. Up to 10 trusted publishers per package. A configuration cannot be edited, only deleted and recreated. |
| `npm stage` / `npm trust` | npm ≥ 11.15.0, Node ≥ 22.14.0 | Approval needs 2FA. How long a staged package is kept is not stated (`UNKNOWN - verify`). Whether provenance survives staging is not stated on the staged-publishing page (`UNKNOWN - verify`; check the first staged release's npmjs.com page). |
| `claude plugin install <p> --marketplace <src>` | Claude Code ≥ 2.1.292 (shell), ≥ 2.1.275 (in session) | `#ref` pins a branch or tag. |
| Upstream pin ids | git SHA-1 (40 hex) and SHA-256 (64 hex) object formats | Accept both lengths. Do not assume 40. |
| Package `engines` | `"node": ">=22"` (unchanged) | npm only warns on an engines mismatch by default (EBADENGINE). `install.ts` has no Node-version check today (no `process.versions.node` read, checked 2026-11-24), and it relies on Node 22 features such as `import.meta.dirname`. So the `bin` dispatcher should refuse Node < 22 with a plain message before it spawns `install.js`. |

## Sources

- docs.npmjs.com/trusted-publishers, read 2026-11-24 (page edited 2026-10-06): npm ≥ 11.5.1, Node ≥ 22.14.0, `id-token: write`, automatic provenance, 2-day expiry, disallow tokens, `npm stage publish` (seam tier for webfetch: LOW; treated as primary vendor documentation)
- docs.npmjs.com/cli/v11/commands/npm-trust, read 2026-11-24: the package must already exist; npm ≥ 11.15.0
- docs.npmjs.com/staged-publishing, read 2026-11-24 (edited 2026-11-10): npm ≥ 11.15.0, approval with 2FA
- github.blog/changelog/2026-09-18-stage-only-npm-tokens-for-safer-automation, and search results citing a January 2027 removal of 2FA-bypass direct publishing (MEDIUM)
- docs.npmjs.com/cli/v11/commands/npm-exec, read 2026-11-24: bin inference, npm-cache install, `--yes` assumed in CI/non-TTY, `allow-scripts` for npx
- docs.npmjs.com/cli/v12/using-npm/config, read 2026-11-24: `allow-git` / `allow-remote` default `none` as of npm 12
- github.blog/changelog/2026-06-09 and 2026-06-24 "upcoming breaking changes for npm v12": allowScripts off, including `prepare` for git dependencies; `--allow-git` none (MEDIUM)
- registry checks run 2026-11-24: `npm view grugops` / `create-grugops` / `@grugops/cli` → E404; `npm view npm@latest` → 12.2.3, engines `^22.22.2 || ^24.15.0 || >=26.0.0` (HIGH)
- nodejs.org/dist/index.json, read 2026-11-24: Node 22.23.5 → npm 10.9.9; 24.22.3 → 11.19.1; 26.13.1 → 11.20.0; 27.0.0-alpha → 12.2.2 (HIGH)
- Local experiments on npm 11.20.0 / Node 26.12.1 (scratch dir, offline tarball): npx keeps cwd, runs from `_npx/<hash>/node_modules/<pkg>`, sets `npm_command=exec` and `INIT_CWD`; `npm pack` includes dot folders listed in `files` (HIGH)
- code.claude.com/docs/en/discover-plugins, read 2026-11-24: `/plugin marketplace add owner/repo#ref`, `claude plugin install <p> --marketplace <src>` (v2.1.292+ shell, v2.1.275+ session), scopes, third-party auto-update off
- code.claude.com/docs/en/setup, read 2026-11-24: `curl … | bash` / `irm … | iex` / `install.cmd` native installer, version pinning by argument, GPG-signed `manifest.json` with SHA256 checksums
- nodejs.org/api/single-executable-applications.html, read 2026-11-24: Stability 1.1, `--build-sea` since v25.5.0, macOS signing required
- docs.github.com (artifact attestations) and cli.github.com/manual/gh_release_verify-asset: `gh release verify` / `verify-asset`, gh ≥ 2.49.0 (MEDIUM)
- pnpm.io/blog/releases/11.0 (via search): `minimumReleaseAge` 1440 minutes by default; applicability to `dlx` unconfirmed (MEDIUM / `UNKNOWN - verify`)
- github.com/nodejs/node issues #60075 and #62427 (via search): `npx.ps1` blocked by the default PowerShell execution policy; `npx.cmd` workaround (MEDIUM)
- github.com/in-toto/attestation spec/v1/digest_set.md, read 2026-11-24: `gitCommit` / `gitBlob` / `gitTree` / `gitTag` keys, 40 or 64 lowercase hex
- adr.github.io/madr, read 2026-11-24: MADR 4.0.0 (2024-09-17) frontmatter `status`, `date`, `decision-makers`, `consulted`, `informed`
- Repository reads: `install/install.ts` (GRUGOPS_SRC, default target, RUNNABLES, render mirror), `install/kit-source.ts`, `scripts/board-model.ts` (TICKET_KEYS), `.claude-plugin/*.json`, `package.json`, `install/README.md`, `.planning/PROJECT.md`

---
*Stack research for: grugops v3.1 (upstream design, consultation and one-command install)*
*Researched: 2026-11-24*

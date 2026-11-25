// upstream-fixture.test-support.ts — synthetic upstream git repositories for the upstream reader's tests (phase 44,
// plan 44-01, UP-01, UP-06, D-13).
//
// WHAT IT IS. Builders that make, at test time and in a scratch directory, the git repositories and product
// repositories scripts/runnable-ref/upstream.test.ts checks with the committed upstream.js. Every repository is built
// from the strings in this file with `git init` and `git commit`; nothing here is a committed repository, and no
// fixture file is committed under this repository (research Pitfall 8).
//
// SYNTHETIC DATA. Every ID, path, name and document below is invented for these tests (DEC-1, Q-1, a generic design
// export). It names no real project and no real person, as the public repository rule requires.
//
// ISOLATED GIT. fixtureEnv gives every git call a scratch HOME and XDG_CONFIG_HOME, no system config, an empty global
// config and fixed author and committer names, emails and dates, and drops every inherited GIT_* variable (a test run
// from a git hook inherits GIT_DIR and GIT_INDEX_FILE, which would point git at this repository). So a fixture builds
// the same objects on every machine, whatever the developer's own git config says.
//
// TEST HARNESS, NOT TOOLING. The `.test-support.ts` suffix keeps this file out of emit (tsconfig.json). It imports
// `node:` builtins only.
//
// Voice: clear professional voice (CLAUDE.md hard rule).

import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

/** The environment every fixture git call runs under, rooted at the scratch home `home`. */
export function fixtureEnv(home: string): NodeJS.ProcessEnv {
  mkdirSync(home, { recursive: true });
  const globalConfig = join(home, "gitconfig-empty");
  writeFileSync(globalConfig, "");
  const env: NodeJS.ProcessEnv = {};
  for (const [key, value] of Object.entries(process.env)) {
    if (!/^GIT_/i.test(key)) env[key] = value;
  }
  return {
    ...env,
    HOME: home,
    XDG_CONFIG_HOME: home,
    GIT_CONFIG_NOSYSTEM: "1",
    GIT_CONFIG_GLOBAL: globalConfig,
    GIT_AUTHOR_NAME: "Fixture Author",
    GIT_AUTHOR_EMAIL: "author@fixture.invalid",
    GIT_AUTHOR_DATE: "2026-01-01T00:00:00Z",
    GIT_COMMITTER_NAME: "Fixture Committer",
    GIT_COMMITTER_EMAIL: "committer@fixture.invalid",
    GIT_COMMITTER_DATE: "2026-01-01T00:00:00Z",
  };
}

/** Runs `git <args>` in `cwd` under `env`; throws with git's stderr on a non-zero exit. Returns stdout, trimmed. */
export function fixtureGit(cwd: string, args: readonly string[], env: NodeJS.ProcessEnv): string {
  const r = spawnSync("git", [...args], { cwd, env, encoding: "utf8", timeout: 20_000 });
  if (r.error !== undefined) throw new Error(`fixture git ${args.join(" ")} could not run: ${r.error.message}`);
  if (r.status !== 0) throw new Error(`fixture git ${args.join(" ")} failed (exit ${r.status}): ${r.stderr}`);
  return r.stdout.trim();
}

/** What makeUpstream built. */
export interface FixtureUpstream {
  /** The repository directory. */
  readonly dir: string;
  /** The full id of its one commit. */
  readonly commit: string;
  /** The blob id of `path` at that commit. */
  readonly blobOf: (path: string) => string;
}

/**
 * A git repository at `dir` (created if absent) on branch `main`, in the object format `objectFormat`, holding `files`
 * (repository-relative path to text) in one commit.
 */
export function makeUpstream(
  dir: string,
  options: { readonly files: Readonly<Record<string, string>>; readonly objectFormat: "sha1" | "sha256"; readonly env: NodeJS.ProcessEnv },
): FixtureUpstream {
  const { files, objectFormat, env } = options;
  mkdirSync(dir, { recursive: true });
  fixtureGit(dir, ["init", "-q", "-b", "main", `--object-format=${objectFormat}`, "."], env);
  for (const [path, text] of Object.entries(files)) {
    const file = join(dir, ...path.split("/"));
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, text);
  }
  fixtureGit(dir, ["add", "-A"], env);
  fixtureGit(dir, ["commit", "-q", "-m", "synthetic upstream export"], env);
  const commit = fixtureGit(dir, ["rev-parse", "HEAD"], env);
  return { dir, commit, blobOf: (path: string) => fixtureGit(dir, ["rev-parse", `${commit}:${path}`], env) };
}

/**
 * A product repository at `dir` (created if absent) with a `.grugops/` directory. `factory.config.json` is written from
 * `config` only when `config` is not null, so null gives a product with no config file.
 */
export function makeProduct(dir: string, config: unknown): string {
  mkdirSync(join(dir, ".grugops"), { recursive: true });
  if (config !== null) writeFileSync(join(dir, ".grugops", "factory.config.json"), `${JSON.stringify(config, null, 2)}\n`);
  return dir;
}

/** Where the synthetic upstream keeps its entry manifest. */
export const SYNTHETIC_ENTRY = "export/manifest.md";

/** The synthetic entry manifest: four invented IDs, one superseded by its successor (D-10, D-12). */
export const SYNTHETIC_MANIFEST =
  "# Synthetic design export\n" +
  "\n" +
  "| ID | Status | Path | Superseded by |\n" +
  "| --- | --- | --- | --- |\n" +
  "| DEC-1 | locked | decisions/dec-1.md | |\n" +
  "| DEC-2 | superseded | decisions/dec-2.md | DEC-3 |\n" +
  "| DEC-3 | locked | decisions/dec-3.md | |\n" +
  "| Q-1 | locked | questions/q-1.md | |\n";

/** The documents the synthetic manifest lists, by path. */
export const SYNTHETIC_DOCUMENTS: Readonly<Record<string, string>> = Object.freeze({
  "decisions/dec-1.md": "# DEC-1\n\nThe product has one main screen.\n",
  "decisions/dec-2.md": "# DEC-2\n\nThe main screen uses two columns.\n",
  "decisions/dec-3.md": "# DEC-3\n\nThe main screen uses one column on every width.\n",
  "questions/q-1.md": "# Q-1\n\nWhich colour does the primary action use? Answer: the brand colour.\n",
});

/** Every file of the synthetic upstream: the manifest at SYNTHETIC_ENTRY and the documents it lists. */
export function syntheticFiles(): Record<string, string> {
  return { [SYNTHETIC_ENTRY]: SYNTHETIC_MANIFEST, ...SYNTHETIC_DOCUMENTS };
}

// upstream-git.test.ts — the git facts behind the citation check and the build-request answer (phase 45, plan 45-06,
// TRC-03, BR-05, D-02, D-10, D-11, research Pattern 5).
//
// Calls scripts/upstream-git.js directly, the module the host reader embeds and the structure validator will call,
// against synthetic upstream repositories built at test time with the fixture helpers. It pins:
// - upstreamGitManifestAt: the manifest at the current pin (entry_blob compared) and at any older commit (read at that
//   commit), and a named UNKNOWN answer for every case that cannot be read;
// - upstreamGitListedBlobs: the mode and blob id of each listed path at a commit, from one ls-tree;
// - upstreamGitDescends: descendant, not-descendant or UNKNOWN; a shallow clone is never not-descendant, a local graft
//   file and a replace ref cannot change the answer;
// - the opening checks every new read shares with `check` (upstreamGitOpen): the partial-clone guard before any object
//   read, and the closed set of git subcommands;
// - the prohibition: a commit or path outside its grammar never reaches git.
//
// The module reads process.env (upstreamGitEnv starts from it), so each case runs with HOME and XDG_CONFIG_HOME set
// to a scratch home, and PATH extended with a recording git where the case needs one; withProcessEnv restores them.
//
// Every ID, path and source id below is invented (public repository rule).
//
// Voice: clear professional voice (CLAUDE.md hard rule).

import { describe, it, expect, afterAll } from "vitest";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import {
  upstreamGitDescends,
  upstreamGitListedBlobs,
  upstreamGitManifestAt,
  upstreamGitOpen,
  UpstreamGitUnknown,
} from "./upstream-git.js";
import { parseUpstreamConfig, type UpstreamManifestAt, type UpstreamSource } from "./upstream-model.js";
import {
  SYNTHETIC_ENTRY,
  addReplaceRef,
  clonePartial,
  commitMore,
  fixtureEnv,
  fixtureGit,
  makeUpstream,
  manifestPlus,
  recordingGitDir,
  syntheticFiles,
  versionedGitDir,
} from "./runnable-ref/upstream-fixture.test-support.js";

const tmpRoots: string[] = [];
afterAll(() => {
  for (const d of tmpRoots) rmSync(d, { recursive: true, force: true });
});

/** A scratch base with a product directory and the isolated fixture git environment. */
function scratch(): { readonly base: string; readonly product: string; readonly env: NodeJS.ProcessEnv } {
  const base = mkdtempSync(join(tmpdir(), "grugops-upstream-git-"));
  tmpRoots.push(base);
  const product = join(base, "product");
  mkdirSync(product, { recursive: true });
  return { base, product, env: fixtureEnv(join(base, "home")) };
}

/** Runs `fn` with `over` laid on process.env, then restores every key it touched. */
function withProcessEnv<T>(over: Readonly<Record<string, string>>, fn: () => T): T {
  const saved = new Map<string, string | undefined>();
  for (const key of Object.keys(over)) saved.set(key, process.env[key]);
  Object.assign(process.env, over);
  try {
    return fn();
  } finally {
    for (const [key, value] of saved) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

/** The scratch home of `env` as process.env keys, so the module's git reads no developer config. */
function homeOf(env: NodeJS.ProcessEnv): Record<string, string> {
  return { HOME: env.HOME as string, XDG_CONFIG_HOME: env.XDG_CONFIG_HOME as string };
}

/** The source `design` at `../design`, pinned at `commit` with the entry blob `entryBlob`, admitted by the parser. */
function designSource(commit: string, entryBlob: string, path = "../design"): UpstreamSource {
  const r = parseUpstreamConfig({
    upstream: {
      sources: [
        { id: "design", path, commit, entry: SYNTHETIC_ENTRY, entry_blob: entryBlob, owns: { areas: ["product"], prefixes: ["DEC"] } },
      ],
    },
  });
  if (r.kind !== "ok") throw new Error(`fixture: the design source must parse: ${JSON.stringify(r)}`);
  return r.sources[0] as UpstreamSource;
}

/** The blob id of `path` at `commit` in `dir`, as plain git answers it. */
function blobAt(dir: string, commit: string, path: string, env: NodeJS.ProcessEnv): string {
  return fixtureGit(dir, ["rev-parse", `${commit}:${path}`], env);
}

/** The IDs of an ok manifest answer, or the reason of an unknown one. */
function idsOf(answer: UpstreamManifestAt): string[] | string {
  return answer.kind === "ok" ? answer.rows.map((r) => r.id) : answer.reason;
}

const DOC_DEC4 = "# DEC-4\n\nA fourth invented decision.\n";
const MANIFEST_PLUS_DEC4 = manifestPlus([["DEC-4", "locked", "decisions/dec-4.md", ""]]);

/** A design upstream with two commits: `older` (the synthetic export) and `pin` (DEC-4 added). */
function twoCommits(base: string, env: NodeJS.ProcessEnv): { dir: string; older: string; pin: string; source: UpstreamSource } {
  const up = makeUpstream(join(base, "design"), { files: syntheticFiles(), objectFormat: "sha1", env });
  const pin = commitMore(up.dir, { [SYNTHETIC_ENTRY]: MANIFEST_PLUS_DEC4, "decisions/dec-4.md": DOC_DEC4 }, env);
  return { dir: up.dir, older: up.commit, pin, source: designSource(pin, blobAt(up.dir, pin, SYNTHETIC_ENTRY, env)) };
}

/** The git calls a recording wrapper logged, each split into its arguments. */
function recordedCalls(log: string): string[][] {
  return readFileSync(log, "utf8")
    .split("\n")
    .filter((l) => l !== "")
    .map((l) => l.split("\x1f"));
}

/** The refusal for a partial clone under a git that ignores GIT_NO_LAZY_FETCH (plan 44-12). */
const OLDER_GIT_REASON = "partial clone and git older than 2.45; make a full clone or upgrade git";

/** The cases that put a POSIX shell `git` wrapper first on PATH, or commit a symbolic link, do not run on Windows. */
const ON_WINDOWS = process.platform === "win32";

describe("upstreamGitOpen: the opening checks every read shares with `check` (D-02, T-44-11)", () => {
  it("open: a good source gives its real path and object format", () => {
    const { base, product, env } = scratch();
    const { dir, source } = twoCommits(base, env);
    const opened = withProcessEnv(homeOf(env), () => upstreamGitOpen(product, source, 0));
    expect(opened).toEqual({ real: dir, format: "sha1" });
  });

  it("open: a missing path throws the named UNKNOWN reason", () => {
    const { product, env } = scratch();
    const source = designSource("1".repeat(40), "2".repeat(40), "../missing");
    expect(() => withProcessEnv(homeOf(env), () => upstreamGitOpen(product, source, 0))).toThrow(UpstreamGitUnknown);
    expect(() => withProcessEnv(homeOf(env), () => upstreamGitOpen(product, source, 0))).toThrow("path ../missing does not exist");
  });
});

describe("upstreamGitManifestAt: the manifest at any commit (TRC-03, D-02, research Pattern 3 and Pitfall 3)", () => {
  it("manifest at: the current pin gives the pin's rows", () => {
    const { base, product, env } = scratch();
    const { pin, source } = twoCommits(base, env);
    const answer = withProcessEnv(homeOf(env), () => upstreamGitManifestAt(product, source, 0, pin));
    expect(idsOf(answer)).toEqual(["DEC-1", "DEC-2", "DEC-3", "Q-1", "DEC-4"]);
  });

  it("manifest at: an older commit gives the older rows, so a citation made before a pin move still resolves", () => {
    const { base, product, env } = scratch();
    const { older, source } = twoCommits(base, env);
    const answer = withProcessEnv(homeOf(env), () => upstreamGitManifestAt(product, source, 0, older));
    expect(idsOf(answer)).toEqual(["DEC-1", "DEC-2", "DEC-3", "Q-1"]);
  });

  it("manifest at: an absent commit is UNKNOWN, named", () => {
    const { base, product, env } = scratch();
    const { source } = twoCommits(base, env);
    const absent = "e".repeat(40);
    const answer = withProcessEnv(homeOf(env), () => upstreamGitManifestAt(product, source, 0, absent));
    expect(answer).toEqual({ kind: "unknown", reason: `commit ${absent} is not in the checkout (shallow clone or not fetched)` });
  });

  it("manifest at: an entry absent at that commit is UNKNOWN, named", () => {
    const { base, product, env } = scratch();
    const up = makeUpstream(join(base, "design"), { files: { "readme.md": "# Readme\n" }, objectFormat: "sha1", env });
    const pin = commitMore(up.dir, syntheticFiles(), env);
    const source = designSource(pin, blobAt(up.dir, pin, SYNTHETIC_ENTRY, env));
    const answer = withProcessEnv(homeOf(env), () => upstreamGitManifestAt(product, source, 0, up.commit));
    expect(answer).toEqual({ kind: "unknown", reason: `entry ${SYNTHETIC_ENTRY} is not in commit ${up.commit}` });
  });

  it.skipIf(ON_WINDOWS)("manifest at: an entry that is not a regular file at that commit is UNKNOWN, named", () => {
    const { base, product, env } = scratch();
    const up = makeUpstream(join(base, "design"), { files: syntheticFiles(), objectFormat: "sha1", env });
    const linked = commitMore(up.dir, {}, env, { [SYNTHETIC_ENTRY]: "../decisions/dec-1.md" });
    const pin = commitMore(up.dir, { [SYNTHETIC_ENTRY]: MANIFEST_PLUS_DEC4, "decisions/dec-4.md": DOC_DEC4 }, env);
    const source = designSource(pin, blobAt(up.dir, pin, SYNTHETIC_ENTRY, env));
    const answer = withProcessEnv(homeOf(env), () => upstreamGitManifestAt(product, source, 0, linked));
    expect(answer).toEqual({ kind: "unknown", reason: `entry ${SYNTHETIC_ENTRY} is not a regular file at ${linked}` });
  });

  it("manifest at: a blob mismatch at the current pin is UNKNOWN, never a manifest", () => {
    const { base, product, env } = scratch();
    const { dir, pin } = twoCommits(base, env);
    const wrong = blobAt(dir, pin, "decisions/dec-1.md", env);
    const actual = blobAt(dir, pin, SYNTHETIC_ENTRY, env);
    const source = designSource(pin, wrong);
    const answer = withProcessEnv(homeOf(env), () => upstreamGitManifestAt(product, source, 0, pin));
    expect(answer).toEqual({ kind: "unknown", reason: `drift: blob-mismatch (declared ${wrong}, at the pin ${actual})` });
  });

  it("manifest at: a malformed manifest at that commit is UNKNOWN, worded as pinState words it", () => {
    const { base, product, env } = scratch();
    const up = makeUpstream(join(base, "design"), {
      files: { ...syntheticFiles(), [SYNTHETIC_ENTRY]: "# Not a table yet\n" },
      objectFormat: "sha1",
      env,
    });
    const pin = commitMore(up.dir, { [SYNTHETIC_ENTRY]: MANIFEST_PLUS_DEC4, "decisions/dec-4.md": DOC_DEC4 }, env);
    const source = designSource(pin, blobAt(up.dir, pin, SYNTHETIC_ENTRY, env));
    const answer = withProcessEnv(homeOf(env), () => upstreamGitManifestAt(product, source, 0, up.commit));
    expect(answer).toEqual({
      kind: "unknown",
      reason: 'manifest: no line equals the header "| ID | Status | Path | Superseded by |", line 1',
    });
  });

  it("manifest at: an unreadable source is UNKNOWN, never a throw", () => {
    const { product, env } = scratch();
    const source = designSource("1".repeat(40), "2".repeat(40), "../missing");
    const answer = withProcessEnv(homeOf(env), () => upstreamGitManifestAt(product, source, 0, "1".repeat(40)));
    expect(answer).toEqual({ kind: "unknown", reason: "path ../missing does not exist" });
  });
});

describe("upstreamGitListedBlobs: the mode and blob of each listed path at a commit (BR-05, D-10)", () => {
  it("listed blobs: each path present at the commit gives its mode and blob id; a path absent there gives nothing", () => {
    const { base, product, env } = scratch();
    const { dir, older, pin, source } = twoCommits(base, env);
    const paths = ["decisions/dec-1.md", "decisions/dec-4.md"];
    const atPin = withProcessEnv(homeOf(env), () => upstreamGitListedBlobs(product, source, 0, pin, paths));
    expect(atPin).toEqual({
      kind: "ok",
      entries: new Map([
        ["decisions/dec-1.md", { mode: "100644", blob: blobAt(dir, pin, "decisions/dec-1.md", env) }],
        ["decisions/dec-4.md", { mode: "100644", blob: blobAt(dir, pin, "decisions/dec-4.md", env) }],
      ]),
    });
    const atOlder = withProcessEnv(homeOf(env), () => upstreamGitListedBlobs(product, source, 0, older, paths));
    expect(atOlder).toEqual({
      kind: "ok",
      entries: new Map([["decisions/dec-1.md", { mode: "100644", blob: blobAt(dir, older, "decisions/dec-1.md", env) }]]),
    });
  });

  it("listed blobs: an absent commit is UNKNOWN, named", () => {
    const { base, product, env } = scratch();
    const { source } = twoCommits(base, env);
    const absent = "e".repeat(40);
    const answer = withProcessEnv(homeOf(env), () => upstreamGitListedBlobs(product, source, 0, absent, ["decisions/dec-1.md"]));
    expect(answer).toEqual({ kind: "unknown", reason: `commit ${absent} is not in the checkout (shallow clone or not fetched)` });
  });
});

describe("upstreamGitDescends: ancestry through the one launcher (D-11, research Pattern 5)", () => {
  it("descends: an ancestor gives descendant; reversed gives not-descendant", () => {
    const { base, product, env } = scratch();
    const { older, pin, source } = twoCommits(base, env);
    expect(withProcessEnv(homeOf(env), () => upstreamGitDescends(product, source, 0, older, pin))).toEqual({ kind: "descendant" });
    expect(withProcessEnv(homeOf(env), () => upstreamGitDescends(product, source, 0, pin, older))).toEqual({ kind: "not-descendant" });
  });

  it("descends: an absent commit is UNKNOWN, named", () => {
    const { base, product, env } = scratch();
    const { pin, source } = twoCommits(base, env);
    const absent = "e".repeat(40);
    expect(withProcessEnv(homeOf(env), () => upstreamGitDescends(product, source, 0, absent, pin))).toEqual({
      kind: "unknown",
      reason: `commit ${absent} is not in the checkout (shallow clone or not fetched)`,
    });
  });

  it("descends: a shallow clone holding both commits is UNKNOWN, never not-descendant", () => {
    const { base, product, env } = scratch();
    const origin = twoCommits(join(base, "origin-base"), env);
    const head = commitMore(origin.dir, { "decisions/dec-5.md": "# DEC-5\n\nA fifth invented decision.\n" }, env);
    const clone = join(base, "design");
    fixtureGit(base, ["clone", "-q", "--depth", "2", pathToFileURL(origin.dir).href, clone], env);
    expect(fixtureGit(clone, ["rev-parse", "--is-shallow-repository"], env), "PREMISE: the clone is shallow").toBe("true");
    expect(fixtureGit(clone, ["cat-file", "-t", origin.pin], env), "PREMISE: the pin is in the clone").toBe("commit");
    const source = designSource(head, blobAt(clone, head, SYNTHETIC_ENTRY, env));
    expect(withProcessEnv(homeOf(env), () => upstreamGitDescends(product, source, 0, origin.pin, head))).toEqual({
      kind: "unknown",
      reason: "shallow clone; ancestry cannot be decided",
    });
  });

  it("descends: a .git/info/grafts file cutting the parent still gives descendant; plain git is fooled", () => {
    const { base, product, env } = scratch();
    const { dir, older, pin, source } = twoCommits(base, env);
    writeFileSync(join(dir, ".git", "info", "grafts"), `${pin}\n`);
    const plain = spawnSync("git", ["-C", dir, "merge-base", "--is-ancestor", older, pin], { env, encoding: "utf8" });
    expect(plain.status, `CONTROL: plain git honors the graft (${plain.stderr})`).toBe(1);
    expect(withProcessEnv(homeOf(env), () => upstreamGitDescends(product, source, 0, older, pin))).toEqual({ kind: "descendant" });
  });

  it("descends: a replace ref is not honored; plain git is fooled", () => {
    const { base, product, env } = scratch();
    const { dir, older, pin, source } = twoCommits(base, env);
    const orphan = fixtureGit(dir, ["commit-tree", `${pin}^{tree}`, "-m", "synthetic orphan"], env);
    addReplaceRef(dir, pin, orphan, env);
    const plain = spawnSync("git", ["-C", dir, "merge-base", "--is-ancestor", older, pin], { env, encoding: "utf8" });
    expect(plain.status, `CONTROL: plain git honors the replace ref (${plain.stderr})`).toBe(1);
    expect(withProcessEnv(homeOf(env), () => upstreamGitDescends(product, source, 0, older, pin))).toEqual({ kind: "descendant" });
  });
});

describe("upstream-git reads: the partial-clone guard, the subcommand set and the argument grammar (D-02, T-44-11, T-45-17)", () => {
  it.skipIf(ON_WINDOWS)(
    "partial clone: under a git that reports 2.44, every new read is UNKNOWN and no cat-file, ls-tree or merge-base runs",
    () => {
      const { base, product, env } = scratch();
      const origin = twoCommits(join(base, "origin-base"), env);
      const clone = clonePartial(origin.dir, join(base, "design"), env);
      const log = join(base, "git-calls.log");
      const bin = versionedGitDir(log, "2.44.0");
      const over = { ...homeOf(env), PATH: `${bin}:${process.env.PATH ?? ""}` };
      const source = origin.source;
      expect(clone).toBe(join(base, "design"));
      const answers = withProcessEnv(over, () => [
        upstreamGitManifestAt(product, source, 0, origin.older),
        upstreamGitManifestAt(product, source, 0, origin.pin),
        upstreamGitListedBlobs(product, source, 0, origin.pin, ["decisions/dec-1.md"]),
        upstreamGitDescends(product, source, 0, origin.older, origin.pin),
      ]);
      for (const a of answers) expect(a).toEqual({ kind: "unknown", reason: OLDER_GIT_REASON });
      const calls = recordedCalls(log);
      const shown = calls.map((c) => c.slice(2).join(" ")).join("\n");
      expect(calls.some((c) => c[2] === "version"), `CONTROL: the version was asked\n${shown}`).toBe(true);
      expect(calls.filter((c) => ["cat-file", "ls-tree", "merge-base"].includes(c[2] as string)), shown).toEqual([]);
    },
  );

  it.skipIf(ON_WINDOWS)(
    "subcommands: the manifest and blob reads use only rev-parse, ls-tree, cat-file, config and version; only the ancestry read adds merge-base",
    () => {
      const { base, product, env } = scratch();
      const { dir, older, pin, source } = twoCommits(base, env);
      const log = join(base, "git-calls.log");
      const bin = recordingGitDir(log);
      const over = { ...homeOf(env), PATH: `${bin}:${process.env.PATH ?? ""}` };
      withProcessEnv(over, () => {
        expect(upstreamGitManifestAt(product, source, 0, older).kind).toBe("ok");
        expect(upstreamGitManifestAt(product, source, 0, pin).kind).toBe("ok");
        expect(upstreamGitListedBlobs(product, source, 0, pin, ["decisions/dec-1.md"]).kind).toBe("ok");
      });
      const reads = recordedCalls(log);
      expect(reads.length, "CONTROL: the recorder saw the git calls").toBeGreaterThan(0);
      for (const call of reads) expect(call.slice(0, 2), call.join(" ")).toEqual(["-C", dir]);
      const readSet = new Set(reads.map((c) => c[2]));
      for (const sub of readSet) expect(["cat-file", "config", "ls-tree", "rev-parse", "version"]).toContain(sub);
      writeFileSync(log, "");
      withProcessEnv(over, () => expect(upstreamGitDescends(product, source, 0, older, pin)).toEqual({ kind: "descendant" }));
      const ancestry = recordedCalls(log);
      const ancestrySet = new Set(ancestry.map((c) => c[2]));
      expect(ancestrySet.has("merge-base"), ancestry.map((c) => c.join(" ")).join("\n")).toBe(true);
      for (const sub of ancestrySet) expect(["config", "merge-base", "rev-parse", "version"]).toContain(sub);
    },
  );

  it.skipIf(ON_WINDOWS)("grammar: a commit or path outside its grammar is UNKNOWN and never reaches git", () => {
    const { base, product, env } = scratch();
    const { pin, source } = twoCommits(base, env);
    const log = join(base, "git-calls.log");
    const bin = recordingGitDir(log);
    const over = { ...homeOf(env), PATH: `${bin}:${process.env.PATH ?? ""}` };
    const answers = withProcessEnv(over, () => [
      upstreamGitManifestAt(product, source, 0, "--output=planted"),
      upstreamGitManifestAt(product, source, 0, "HEAD"),
      upstreamGitListedBlobs(product, source, 0, "-1", ["decisions/dec-1.md"]),
      upstreamGitListedBlobs(product, source, 0, pin, ["../outside.md"]),
      upstreamGitListedBlobs(product, source, 0, pin, ["--output=planted"]),
      upstreamGitDescends(product, source, 0, "--is-ancestor", pin),
      upstreamGitDescends(product, source, 0, pin, "a".repeat(39)),
    ]);
    for (const a of answers) {
      expect(a.kind).toBe("unknown");
      if (a.kind === "unknown") expect(a.reason).not.toContain("planted");
    }
    expect(recordedCalls(log), "no git call was made").toEqual([]);
  });
});

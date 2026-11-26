// upstream-git.ts — the one git launcher and object reader for upstream sources (phase 45, plan 45-01, D-02; moved
// from scripts/runnable-ref/upstream.ts, phase 44, plans 44-01, 44-05, 44-06 and 44-12, UP-02, UP-03, D-13, D-20).
//
// WHAT IT IS. The hardened git read of an upstream design source: the one process launcher, the calls that answer
// whether a source can be checked at its pin, and the reads of objects at that pin. Plan 45-01 moved it out of the host
// reader with no behavior change, so that the structure validator can call the same read as a function (D-02) and
// later plans extend one launcher. Every top-level name was given the module prefix; `gitAnswers` gained the
// repository root as its first parameter in place of the reader's module global.
//
// WHO USES IT. The host runnable scripts/runnable-ref/upstream.ts embeds it through scripts/generate-runnable-embeds.ts,
// so the installed tools/grugops/upstream.js runs this code. The structure validator imports it in plan 45-08.
//
// PLAN 45-06 (TRC-03, BR-05, D-02, D-10, D-11). The opening checks of upstreamGitAnswers became upstreamGitOpen, with
// no change in behavior or message, and three reads share them: upstreamGitManifestAt (the manifest at any commit, the
// citation check's read), upstreamGitListedBlobs (the blob of each listed path at a commit, for the changed-ID rule) and
// upstreamGitDescends (ancestry, for the answer's not-descendant note). Each returns an answer and never throws: an
// UpstreamGitUnknown becomes its `unknown` answer. Every commit and path they pass to git has passed its grammar first
// (UPSTREAM_OBJECT_ID_RE, isManifestPath), so a value from a note or a file can never read as a git option.
//
// I/O, BUT NO ARGV, NO EXIT AND NO WRITE. This module starts git and reads the filesystem (realpath and stat of a
// source path). It reads no argument, never exits the process and writes nothing. A source that cannot be checked is
// thrown as UpstreamGitUnknown, whose message is the reason, and the caller decides what that means for its run. Its
// imports are `node:` builtins and named imports of declarations an earlier authority of the runnable's EMBED_SPECS row
// embeds (isWithin from scripts/context-io.ts; the manifest grammar, the path rule and the blob id from
// scripts/upstream-model.ts), so the generator can embed it.
//
// ONE NAME SPACE. Every top-level name here starts with `upstreamGit`, `UpstreamGit` or `UPSTREAM_GIT_`, so the
// generated region never meets two declarations of one name.
//
// THE READ-SAFETY RULES. upstreamGitRun is the only process this module starts. It runs `git -C <source real path>`
// with `shell: false`, a 20 s timeout and stdout as bytes, under the caller's environment with every `GIT_*` variable
// removed (an inherited GIT_DIR would answer for another repository) and four switches added: GIT_NO_REPLACE_OBJECTS=1
// (a replace ref would substitute the pinned commit or blob), GIT_NO_LAZY_FETCH=1 (a partial clone would fetch over the
// network; git older than 2.45 ignores it, so a partial clone on such a git is refused before any call that reads an
// object, plan 44-12), GIT_LITERAL_PATHSPECS=1 and GIT_TERMINAL_PROMPT=0. It uses only `rev-parse`, `ls-tree`,
// `cat-file`, `config` and `version`, and for the ancestry read alone `merge-base` (plan 45-06), never `status`,
// `diff`, `log`, `show` or anything that refreshes the index, because those can run commands the untrusted source's
// own git config names. The blob bytes git returns are hashed here and compared to the blob id, so a substituted object
// is caught even if a switch is not honored. The ancestry call also sets GIT_GRAFT_FILE to the null device, so a local
// `.git/info/grafts` file cannot cut history (research Pattern 5).
//
// Voice: clear professional voice (CLAUDE.md hard rule): these reasons tell a human why a source cannot be read.
import { spawnSync } from "node:child_process";
import { realpathSync, statSync } from "node:fs";
import { devNull } from "node:os";
import { resolve } from "node:path";
import { isWithin } from "./context-io.js";
import { UPSTREAM_OBJECT_ID_RE, UPSTREAM_READ_MAX_BYTES, gitBlobId, isManifestPath, objectFormatOf, parseManifest, sourcePathFindings, upstreamManifestAtOf, } from "./upstream-model.js";
// ── Constants ───────────────────────────────────────────────────────────────────────────────────────────
/** How long one git call may run, in milliseconds. */
export const UPSTREAM_GIT_TIMEOUT_MS = 20000;
/** The first git release that honors GIT_NO_LAZY_FETCH (the 2.45.0 release notes), as major and minor. */
export const UPSTREAM_GIT_LAZY_FETCH_SINCE = [2, 45];
/** The modes ls-tree gives a regular file. A symbolic link (120000), a directory or a gitlink (160000) is not one. */
export const UPSTREAM_GIT_REGULAR_FILE_MODES = new Set(["100644", "100755"]);
// ── The one git launcher ────────────────────────────────────────────────────────────────────────────────
/** The errno code of a thrown filesystem error, for a reason. */
export function upstreamGitErrnoCode(e) {
    return e.code ?? "unknown error";
}
/** A source that cannot be checked; its message is the reason its `UNKNOWN - verify` line names. */
export class UpstreamGitUnknown extends Error {
}
/** The source cannot be checked, for `reason`. */
export function upstreamGitUnknownBecause(reason) {
    throw new UpstreamGitUnknown(reason);
}
/** The environment git runs under: the caller's, minus every GIT_* variable, plus the four read-safety switches. */
export function upstreamGitEnv() {
    const env = {};
    for (const [key, value] of Object.entries(process.env)) {
        if (!/^GIT_/i.test(key))
            env[key] = value;
    }
    env.GIT_NO_REPLACE_OBJECTS = "1";
    env.GIT_NO_LAZY_FETCH = "1";
    env.GIT_LITERAL_PATHSPECS = "1";
    env.GIT_TERMINAL_PROMPT = "0";
    return env;
}
/**
 * Runs `git -C <sourceReal> <gitArgs>`: no shell, a 20 s timeout, stdout as bytes, the scrubbed environment. `extraEnv`
 * is laid over that environment last; only the ancestry read passes one (GIT_GRAFT_FILE, plan 45-06).
 */
export function upstreamGitRun(sourceReal, gitArgs, extraEnv = {}) {
    const r = spawnSync("git", ["-C", sourceReal, ...gitArgs], {
        shell: false,
        timeout: UPSTREAM_GIT_TIMEOUT_MS,
        maxBuffer: UPSTREAM_READ_MAX_BYTES * 4,
        env: { ...upstreamGitEnv(), ...extraEnv },
    });
    const error = r.error;
    return {
        status: r.status,
        stdout: r.stdout ?? Buffer.alloc(0),
        stderr: r.stderr === null || r.stderr === undefined ? "" : r.stderr.toString("utf8"),
        errorCode: error?.code,
        errorMessage: error?.message,
    };
}
/**
 * The first non-empty line of git's stderr, or the exit status when it printed none, with every pathspec of the
 * failing call replaced by `<listed path>` (plan 44-12, T-44-38, UP-05, D-13, D-17). `gitArgs` is that call's own
 * argument list; each argument after its first `--` is a pathspec: a listed path, or the entry. git can echo those
 * arguments in its message, and a listed path that passes the grammar can still read as an order, so none of them may
 * appear outside the fence. Every such path passes the ASCII path grammar of plan 44-09, so git prints it unquoted and
 * a plain substring match finds each verbatim echo; the paths are matched in one pass, longest first, so a path that
 * contains another is replaced whole. The rest of git's line stays, so the human still learns which call failed and
 * why. Not replaced (the accepted T-44-38 residual): a fragment or another spelling of a path that git might print, and
 * git's text about the local `.git`, which committed upstream content cannot write. The result is printed through
 * `printable`, like every reason.
 */
export function upstreamGitComplaint(run, gitArgs) {
    const line = run.stderr.split("\n").map((l) => l.trim()).find((l) => l !== "");
    if (line === undefined)
        return `exit status ${run.status}`;
    const dash = gitArgs.indexOf("--");
    const pathspecs = dash < 0 ? [] : [...new Set(gitArgs.slice(dash + 1))].filter((a) => a !== "");
    if (pathspecs.length === 0)
        return line;
    const alternation = pathspecs
        .sort((a, b) => b.length - a.length)
        .map((a) => a.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
        .join("|");
    return line.replace(new RegExp(alternation, "g"), () => "<listed path>");
}
/**
 * One git call whose exit status must be one of `allowed`. A launch failure, a timeout, an over-long answer, a signal
 * and any other status each make the source UNKNOWN with a named reason.
 */
export function upstreamGitAnswer(sourceReal, gitArgs, allowed = [0], extraEnv = {}) {
    const sub = gitArgs[0];
    const run = upstreamGitRun(sourceReal, gitArgs, extraEnv);
    if (run.errorCode === "ENOENT")
        upstreamGitUnknownBecause("git was not found on PATH");
    if (run.errorCode === "ETIMEDOUT")
        upstreamGitUnknownBecause(`git did not answer within ${UPSTREAM_GIT_TIMEOUT_MS / 1000} s`);
    if (run.errorCode === "ENOBUFS")
        upstreamGitUnknownBecause(`git ${sub} printed more than ${UPSTREAM_READ_MAX_BYTES * 4} bytes`);
    if (run.errorMessage !== undefined)
        upstreamGitUnknownBecause(`git ${sub} could not be started (${run.errorMessage})`);
    if (run.status === null)
        upstreamGitUnknownBecause(`git ${sub} was stopped before it finished`);
    if (!allowed.includes(run.status))
        upstreamGitUnknownBecause(`git ${sub} failed: ${upstreamGitComplaint(run, gitArgs)}`);
    return run;
}
/** git's stdout as text, without its trailing line ends. */
export function upstreamGitText(run) {
    return run.stdout.toString("utf8").replace(/[\r\n]+$/, "");
}
/** The mode of each path `ls-tree -r -z --full-tree <commit> -- <paths>` lists at the pin, by path. */
export function upstreamGitModesAtPin(sourceReal, commit, paths) {
    const run = upstreamGitAnswer(sourceReal, ["ls-tree", "-r", "-z", "--full-tree", commit, "--", ...paths]);
    const modes = new Map();
    for (const record of run.stdout.toString("utf8").split("\0")) {
        const tab = record.indexOf("\t");
        if (tab < 0)
            continue;
        modes.set(record.slice(tab + 1), record.slice(0, record.indexOf(" ")));
    }
    return modes;
}
/**
 * The text of the blob `blob`: at most UPSTREAM_READ_MAX_BYTES, hashing to its own id, holding no NUL byte and decoding
 * as UTF-8. Anything else makes the source UNKNOWN, named; nothing is truncated or guessed.
 */
export function upstreamGitBlobText(sourceReal, blob, format, label) {
    const size = Number(upstreamGitText(upstreamGitAnswer(sourceReal, ["cat-file", "-s", blob])));
    if (!Number.isSafeInteger(size) || size < 0)
        upstreamGitUnknownBecause(`git cat-file gave no size for ${label}`);
    if (size > UPSTREAM_READ_MAX_BYTES) {
        upstreamGitUnknownBecause(`${label} is ${size} bytes, over the per-read ceiling of ${UPSTREAM_READ_MAX_BYTES} bytes; ask upstream to split it`);
    }
    const bytes = upstreamGitAnswer(sourceReal, ["cat-file", "blob", blob]).stdout;
    if (gitBlobId(bytes, format) !== blob)
        upstreamGitUnknownBecause(`the bytes git returned for ${label} do not hash to ${blob}`);
    if (bytes.includes(0))
        upstreamGitUnknownBecause(`${label} is not a text file (it holds a NUL byte)`);
    try {
        return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    }
    catch {
        return upstreamGitUnknownBecause(`${label} is not UTF-8 text`);
    }
}
/** The hex length of an object format's ids, for a message. */
export function upstreamGitHexLength(format) {
    return format === "sha1" ? "40" : format === "sha256" ? "64" : format;
}
/**
 * The opening checks every read of a source runs before its first object read (plan 45-06, split out of
 * upstreamGitAnswers with no change in behavior or message). The path is checked first: the lexical rule, then
 * realpath, then the inside and ancestor test again on the real paths. A path whose stat fails is that source's UNKNOWN
 * (IN-04). The checkout must be the top of a git work tree and use the pin's object format. Then a partial clone (a
 * `remote.<name>.promisor` key not set to false, or an `extensions.partialclone` key) is refused when the git that runs
 * is older than 2.45, which ignores GIT_NO_LAZY_FETCH and would fetch a missing object over the network (WR-01,
 * T-44-11). Only `rev-parse`, `config` and `version` run here. Throws UpstreamGitUnknown.
 */
export function upstreamGitOpen(root, source, index) {
    const lexical = sourcePathFindings(root, source.path, `upstream.sources[${index}].path`);
    if (lexical.length > 0)
        upstreamGitUnknownBecause(lexical.join("; "));
    let real;
    try {
        real = realpathSync(resolve(root, source.path));
    }
    catch (e) {
        const code = upstreamGitErrnoCode(e);
        return upstreamGitUnknownBecause(code === "ENOENT" ? `path ${source.path} does not exist` : `path ${source.path} cannot be resolved (${code})`);
    }
    if (isWithin(real, root))
        upstreamGitUnknownBecause(`path ${source.path} resolves inside the product repository`);
    if (isWithin(root, real))
        upstreamGitUnknownBecause(`path ${source.path} resolves to a directory that contains the product repository`);
    // A stat that throws (EACCES, or a race after realpath) is this source's UNKNOWN line, never the end of the whole
    // report (IN-04, T-44-42). The reason names the configured path, which is product text, and the errno code.
    let isDirectory;
    try {
        isDirectory = statSync(real).isDirectory();
    }
    catch (e) {
        return upstreamGitUnknownBecause(`path ${source.path} cannot be inspected (${upstreamGitErrnoCode(e)})`);
    }
    if (!isDirectory)
        upstreamGitUnknownBecause(`path ${source.path} is not a directory`);
    const topArgs = ["rev-parse", "--show-toplevel"];
    const top = upstreamGitAnswer(real, topArgs, [0, 128, 129]);
    if (top.status !== 0 || resolve(upstreamGitText(top)) !== real) {
        upstreamGitUnknownBecause(`${source.path} is not the top of a git checkout${top.status === 0 ? "" : ` (${upstreamGitComplaint(top, topArgs)})`}`);
    }
    const format = objectFormatOf(source.commit);
    const checkoutFormat = upstreamGitText(upstreamGitAnswer(real, ["rev-parse", "--show-object-format"]));
    if (checkoutFormat !== format) {
        upstreamGitUnknownBecause(`the pin is ${source.commit.length}-hex but the checkout uses ${upstreamGitHexLength(checkoutFormat)}-hex object ids`);
    }
    // The partial-clone guard runs here, before the first call that reads an object (WR-01, T-44-11): git older than
    // 2.45 ignores GIT_NO_LAZY_FETCH, so in a partial clone even the `^{commit}` peel below could fetch over the network
    // and write into the upstream `.git`. Only config and version are asked before it. git marks a partial clone in two
    // ways, and honors both: a `remote.<name>.promisor` key, and an `extensions.partialclone` key naming the promisor
    // remote (read even at repository format version 0). One `--get-regexp` reads both; git prints key names in lower
    // case. A promisor line set to false, no, off or 0 is not partial; any extensions.partialclone line is.
    const partialKeys = upstreamGitAnswer(real, ["config", "--get-regexp", "^(remote\\..*\\.promisor|extensions\\.partialclone)$"], [0, 1]);
    const isPartial = partialKeys.status === 0 &&
        upstreamGitText(partialKeys)
            .split("\n")
            .filter((l) => l.trim() !== "")
            .some((l) => {
            const space = l.indexOf(" ");
            const key = space < 0 ? l : l.slice(0, space);
            if (key === "extensions.partialclone")
                return true;
            return space < 0 || !/^(false|no|off|0)$/i.test(l.slice(space + 1).trim());
        });
    if (isPartial) {
        const version = /git version (\d+)\.(\d+)/.exec(upstreamGitText(upstreamGitAnswer(real, ["version"])));
        const major = version === null ? 0 : Number(version[1]);
        const minor = version === null ? 0 : Number(version[2]);
        if (major < UPSTREAM_GIT_LAZY_FETCH_SINCE[0] || (major === UPSTREAM_GIT_LAZY_FETCH_SINCE[0] && minor < UPSTREAM_GIT_LAZY_FETCH_SINCE[1])) {
            upstreamGitUnknownBecause("partial clone and git older than 2.45; make a full clone or upgrade git");
        }
    }
    return { real, format };
}
/**
 * What git answers for one source, read only from objects at the pin. upstreamGitOpen runs first. The checkout must
 * then hold the pinned commit. The entry's blob at the pin is compared to the declared one; only when they agree is the
 * manifest read. With `sweepListed` (the `check` verb) every path it lists is then checked to be a regular file at the
 * pin; `read` checks only the one path it prints.
 */
export function upstreamGitAnswers(root, source, index, sweepListed) {
    const { real, format } = upstreamGitOpen(root, source, index);
    const verified = upstreamGitAnswer(real, ["rev-parse", "--verify", "--quiet", `${source.commit}^{commit}`], [0, 1]);
    if (verified.status !== 0) {
        upstreamGitUnknownBecause(`pinned commit ${source.commit} is not in the checkout (shallow clone or not fetched)`);
    }
    const pinned = upstreamGitText(verified);
    if (pinned.length !== source.commit.length) {
        upstreamGitUnknownBecause(`the pin is ${source.commit.length}-hex but the checkout uses ${pinned.length}-hex object ids`);
    }
    if (pinned !== source.commit)
        upstreamGitUnknownBecause(`pinned object ${source.commit} is not a commit`);
    const entryAnswer = upstreamGitAnswer(real, ["rev-parse", "--verify", "--quiet", `${source.commit}:${source.entry}`], [0, 1]);
    if (entryAnswer.status !== 0)
        upstreamGitUnknownBecause(`entry ${source.entry} is not in the pinned commit`);
    const entryBlobAtPin = upstreamGitText(entryAnswer);
    let manifest = null;
    if (entryBlobAtPin === source.entry_blob) {
        if (!UPSTREAM_GIT_REGULAR_FILE_MODES.has(upstreamGitModesAtPin(real, source.commit, [source.entry]).get(source.entry) ?? "")) {
            upstreamGitUnknownBecause(`entry ${source.entry} is not a regular file at the pin`);
        }
        manifest = parseManifest(upstreamGitBlobText(real, entryBlobAtPin, format, `entry ${source.entry}`));
        if (sweepListed && manifest.kind === "ok" && manifest.rows.length > 0) {
            const modes = upstreamGitModesAtPin(real, source.commit, manifest.rows.map((row) => row.path));
            for (const row of manifest.rows) {
                if (!UPSTREAM_GIT_REGULAR_FILE_MODES.has(modes.get(row.path) ?? "")) {
                    // The Path cell is a git argument only; the reason names the row by its ID and line (CR-02, D-13).
                    upstreamGitUnknownBecause(`the file listed for ${row.id} (manifest line ${row.line}, column 3) is not a regular file at the pin`);
                }
            }
        }
    }
    const headAnswer = upstreamGitAnswer(real, ["rev-parse", "--verify", "--quiet", "HEAD"], [0, 1]);
    const head = headAnswer.status === 0 ? upstreamGitText(headAnswer) : null;
    return { answers: { commit: source.commit, entryBlobDeclared: source.entry_blob, entryBlobAtPin, manifest, head }, real, format };
}
/** The mode and object id `ls-tree -z --full-tree <commit> -- <path>` gives for exactly `path`, or null when none. */
export function upstreamGitEntryAtPin(sourceReal, commit, path) {
    const run = upstreamGitAnswer(sourceReal, ["ls-tree", "-z", "--full-tree", commit, "--", path]);
    for (const record of run.stdout.toString("utf8").split("\0")) {
        const tab = record.indexOf("\t");
        if (tab < 0 || record.slice(tab + 1) !== path)
            continue;
        const [mode, , oid] = record.slice(0, tab).split(" ");
        if (mode !== undefined && oid !== undefined)
            return { mode, oid };
    }
    return null;
}
// ── Reads at any commit (plan 45-06, TRC-03, BR-05, D-02, D-10, D-11) ────────────────────────────────────
/** An unknown answer for `e`: an UpstreamGitUnknown gives its reason; anything else is named by its kind only. */
export function upstreamGitUnknownOf(e) {
    if (e instanceof UpstreamGitUnknown)
        return { kind: "unknown", reason: e.message };
    return { kind: "unknown", reason: `the read failed unexpectedly (${e instanceof Error ? e.name : typeof e})` };
}
/**
 * Why `commit` may not be passed to git for `source`, or null when it may: it must match UPSTREAM_OBJECT_ID_RE (hex
 * only, so never a git option) and have the length of the source's pin. A value that fails is never quoted.
 */
export function upstreamGitCommitProblem(source, commit) {
    if (!UPSTREAM_OBJECT_ID_RE.test(commit))
        return "a commit is not a full-length lowercase object id (40 or 64 hex)";
    if (commit.length !== source.commit.length) {
        return `commit ${commit} is ${commit.length}-hex but source ${source.id} is pinned with ${source.commit.length}-hex object ids`;
    }
    return null;
}
/** Throws UpstreamGitUnknown unless the checkout at `real` holds `commit` as a commit object. */
export function upstreamGitCommitPresent(real, commit) {
    const verified = upstreamGitAnswer(real, ["rev-parse", "--verify", "--quiet", `${commit}^{commit}`], [0, 1]);
    if (verified.status !== 0)
        upstreamGitUnknownBecause(`commit ${commit} is not in the checkout (shallow clone or not fetched)`);
    if (upstreamGitText(verified) !== commit)
        upstreamGitUnknownBecause(`object ${commit} is not a commit`);
}
/**
 * The entry manifest of `source` at `commit` (research Pattern 3). At the declared pin the pin read runs, with
 * `entry_blob` compared: a blob mismatch is unknown, never a manifest (Pitfall 3 applies `entry_blob` there only). At
 * any other commit: the commit must be in the checkout, the entry must be in it as a regular file, and its blob passes
 * upstreamGitBlobText's size, NUL, UTF-8 and re-hash checks before parseManifest. A malformed manifest is unknown,
 * worded as pinState words it. Never throws.
 */
export function upstreamGitManifestAt(root, source, index, commit) {
    const problem = upstreamGitCommitProblem(source, commit);
    if (problem !== null)
        return { kind: "unknown", reason: problem };
    try {
        if (commit === source.commit) {
            const { answers } = upstreamGitAnswers(root, source, index, false);
            if (answers.entryBlobAtPin !== source.entry_blob) {
                return {
                    kind: "unknown",
                    reason: `drift: blob-mismatch (declared ${source.entry_blob}, at the pin ${answers.entryBlobAtPin})`,
                };
            }
            return answers.manifest === null
                ? { kind: "unknown", reason: "manifest: it was not read" }
                : upstreamManifestAtOf(answers.manifest);
        }
        const { real, format } = upstreamGitOpen(root, source, index);
        upstreamGitCommitPresent(real, commit);
        const entry = upstreamGitAnswer(real, ["rev-parse", "--verify", "--quiet", `${commit}:${source.entry}`], [0, 1]);
        if (entry.status !== 0)
            upstreamGitUnknownBecause(`entry ${source.entry} is not in commit ${commit}`);
        if (!UPSTREAM_GIT_REGULAR_FILE_MODES.has(upstreamGitModesAtPin(real, commit, [source.entry]).get(source.entry) ?? "")) {
            upstreamGitUnknownBecause(`entry ${source.entry} is not a regular file at ${commit}`);
        }
        const blob = upstreamGitText(entry);
        return upstreamManifestAtOf(parseManifest(upstreamGitBlobText(real, blob, format, `entry ${source.entry} at ${commit}`)));
    }
    catch (e) {
        return upstreamGitUnknownOf(e);
    }
}
/**
 * The mode and blob id of each of `paths` at `commit`, from one `ls-tree -r -z --full-tree <commit> -- <paths>` (45
 * D-10: no file content is read). A path the tree does not hold has no entry. Every path must be a manifest path
 * (isManifestPath) and the commit must pass its grammar before git runs. Never throws.
 */
export function upstreamGitListedBlobs(root, source, index, commit, paths) {
    const problem = upstreamGitCommitProblem(source, commit);
    if (problem !== null)
        return { kind: "unknown", reason: problem };
    if (!paths.every((p) => isManifestPath(p)))
        return { kind: "unknown", reason: "a listed path is not a manifest path" };
    if (paths.length === 0)
        return { kind: "ok", entries: new Map() };
    try {
        const { real } = upstreamGitOpen(root, source, index);
        upstreamGitCommitPresent(real, commit);
        const wanted = new Set(paths);
        const run = upstreamGitAnswer(real, ["ls-tree", "-r", "-z", "--full-tree", commit, "--", ...wanted]);
        const entries = new Map();
        for (const record of run.stdout.toString("utf8").split("\0")) {
            const tab = record.indexOf("\t");
            if (tab < 0 || !wanted.has(record.slice(tab + 1)))
                continue;
            const [mode, , blob] = record.slice(0, tab).split(" ");
            if (mode !== undefined && blob !== undefined)
                entries.set(record.slice(tab + 1), { mode, blob });
        }
        return { kind: "ok", entries };
    }
    catch (e) {
        return upstreamGitUnknownOf(e);
    }
}
/**
 * Whether `descendant` descends from `ancestor` in `source` (research Pattern 5). Both commits must pass their grammar
 * and be in the checkout. A shallow clone is unknown, because `merge-base --is-ancestor` answers 1 there for a true
 * ancestor; so a shallow clone never gives not-descendant. The ancestry call runs with GIT_GRAFT_FILE set to the null
 * device and, as every call, GIT_NO_REPLACE_OBJECTS=1, so neither a local graft file nor a replace ref can fake history.
 * Exit 0 is descendant and 1 is not-descendant; anything else is unknown. Never throws.
 */
export function upstreamGitDescends(root, source, index, ancestor, descendant) {
    const problem = upstreamGitCommitProblem(source, ancestor) ?? upstreamGitCommitProblem(source, descendant);
    if (problem !== null)
        return { kind: "unknown", reason: problem };
    try {
        const { real } = upstreamGitOpen(root, source, index);
        upstreamGitCommitPresent(real, ancestor);
        upstreamGitCommitPresent(real, descendant);
        if (upstreamGitText(upstreamGitAnswer(real, ["rev-parse", "--is-shallow-repository"])) === "true") {
            upstreamGitUnknownBecause("shallow clone; ancestry cannot be decided");
        }
        const run = upstreamGitAnswer(real, ["merge-base", "--is-ancestor", ancestor, descendant], [0, 1], { GIT_GRAFT_FILE: devNull });
        return run.status === 0 ? { kind: "descendant" } : { kind: "not-descendant" };
    }
    catch (e) {
        return upstreamGitUnknownOf(e);
    }
}

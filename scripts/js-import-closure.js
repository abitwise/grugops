// js-import-closure.ts — the ONE answer to "which committed .js does this committed .js need?".
//
// WHY THIS EXISTS. Several gates and oracles run a committed `.js` inside a TEMP MIRROR rather than
// on the real tree: the freshness gates mirror-spawn a render so the committed output is never
// touched, and the UAT / foundation-guard harnesses mirror a byte-faithful input set so a planted
// defect can be proven to red the gate. Every one of those mirrors has to carry the spawned
// artifact's IMPORTS, or the child process dies with ERR_MODULE_NOT_FOUND — and a gate that cannot
// start looks, from the outside, exactly like a gate that ran and refused.
//
// UNTIL PHASE 30 THE LISTS WERE HAND-MAINTAINED, AND THEY WERE CORRECT ONLY BY LUCK. `hooks/guard.js`
// happened to import nothing but `node:fs`, and `scripts/context-io.js` happened to import nothing
// but node builtins, so a mirror that copied one file was complete. Plan 30-01 gave the guard a
// checkpoint roster and a config reader to consult, four hand-written lists went stale at once, and
// 92 cases across seven files failed — not because the guard was wrong, but because four copies of
// a fact nobody had written down had all become false in the same commit. That is this repository's
// recorded second systemic failure class ([[grugops-set-literal-drift]]): a hand-listed set that
// rots while every gate over it stays green, except here it rotted loudly.
//
// SO THE SET IS DERIVED. A caller names ONE entry artifact and gets back its transitive closure,
// computed from the bytes of the files themselves. Adding an import to any module in the graph
// updates every mirror automatically, and a caller can never be short by one.
//
// IT REFUSES RATHER THAN RETURNS SHORT. An import specifier that cannot be resolved to a file, or
// that escapes the repository root, is a named throw. A closure that silently omitted an
// unresolvable edge would hand back a mirror that is missing exactly the file the walk could not
// see — the failure it exists to prevent, reintroduced one level up.
//
// SCOPE, STATED SO IT IS NOT MISTAKEN FOR A BUNDLER. This resolves only RELATIVE specifiers
// (`./x.js`, `../scripts/y.js`) between committed `.js` files in this repository. Bare specifiers
// are node builtins or packages: builtins need no mirroring, and this repository ships zero runtime
// dependencies, so there is nothing else to follow. A bare specifier is therefore skipped, not
// refused — but a `node_modules` import would be invisible here, and if this repository ever grows
// a runtime dependency this function's contract must be revisited rather than trusted.
//
// THE CLASS OF A SPECIFIER IS A TOTAL PARTITION, AND IT LIVES HERE (32-31, gap-closure round 3).
// Until this plan the two authorities that decided a specifier's class were a COMPLEMENT rather
// than a partition, and they disagreed about the same prefix:
//
//     scripts/board-readonly.test.ts   isBareSpecifier = !startsWith(".") && !startsWith("/")
//     scripts/js-import-closure.ts     three patterns, each requiring a leading "."
//
// A specifier beginning with `/` that is not `./` or `../` was SUBTRACTED by the first and never
// ADDED by the second, so it was neither censused nor walked. `32-24-RED-baseline.txt` measured
// three such spellings — `/abs/writer.mjs`, `//localhost/<abs path>` and `//host/<path>` — leaving
// `npm run check:dashboard-readonly` at exit 0 with its full 89/89 over a writer that ran and
// created a file. `classifySpecifier` below is now the ONE authority both consumers ask, and its
// third bucket exists so no spelling can fall outside all three.
//
// Node stdlib only; no dependency, in keeping with every other module under scripts/.
import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
/**
 * The partition's members, as a value rather than a shape a reader has to infer from a union type.
 *
 * Held as data so a caller can assert its CARDINALITY: a fourth class is a decision somebody makes
 * here with its reason, never a branch that quietly appears in one consumer and not the other.
 */
export const SPECIFIER_CLASSES = Object.freeze([
    "bare",
    "relative",
    "foreign",
]);
/**
 * THE ONE AUTHORITY ON A MODULE SPECIFIER'S CLASS.
 *
 * Every arm is a POSITIVE test. That is the whole point of the cutover: the predicate this replaced
 * was a chain of negations (`!startsWith(".") && !startsWith("/")`), and a chain of negations
 * admits every spelling nobody thought to subtract. Here `bare` and `relative` each state what they
 * ARE, and `foreign` is the complement of those two statements — so the partition is total by
 * construction rather than by enumeration.
 *
 * `relative`: the specifier begins `./` or `../`. Nothing else is resolved against the importing
 * file, and `.` and `..` are deliberately NOT relative — they name a directory, which this walk
 * cannot read as a module, so they are refused rather than followed into an unresolvable edge.
 *
 * `bare`: the first character is an ASCII letter or `@`, AND the specifier contains no backslash,
 * AND it either carries no `:` at all or its scheme — the run before the first `:` — is exactly
 * `node`. `node:` is the one builtin scheme Node's ESM loader admits as a bare identifier, and
 * `normalizeSpecifier` in the read-only guard already treats `node:fs` and `fs` as one identity.
 * The backslash clause is what puts `C:\x\writer.mjs` outside this arm: a drive-letter path begins
 * with a letter and would otherwise read as a package called `C`.
 *
 * `foreign`: EVERYTHING ELSE, and it exists so that no spelling can fall outside all three. It is
 * the bucket the six spellings `32-24-RED-baseline.txt` measured land in — an absolute POSIX path,
 * `//localhost/…`, `//host/…`, a `file://` URL, a Windows drive-letter path and a `data:` URL —
 * plus `#`-prefixed subpath imports, which resolve through the package manifest's import map that
 * this pass does not read and are therefore refused rather than admitted. A foreign specifier is
 * never followed and never skipped: the walk records it and `jsImportClosure` refuses on it.
 */
export function classifySpecifier(specifier) {
    if (specifier.startsWith("./") || specifier.startsWith("../"))
        return "relative";
    const first = specifier.charCodeAt(0);
    const startsBare = (first >= 0x41 && first <= 0x5a) || (first >= 0x61 && first <= 0x7a) || specifier.startsWith("@");
    if (startsBare && !specifier.includes("\\")) {
        const colon = specifier.indexOf(":");
        if (colon === -1 || specifier.slice(0, colon) === "node")
            return "bare";
    }
    return "foreign";
}
/** The characters after which a `/` opens a REGULAR EXPRESSION rather than a division. */
const REGEX_PRECEDING_PUNCTUATION = new Set([
    "",
    "(",
    ",",
    "=",
    ":",
    "[",
    "!",
    "&",
    "|",
    "?",
    "{",
    "}",
    ";",
    "+",
    "-",
    "*",
    "%",
    "^",
    "~",
    "<",
    ">",
]);
/** The keywords after which a `/` opens a regular expression (`return /re/.test(x)`). */
const REGEX_PRECEDING_WORDS = new Set([
    "return",
    "typeof",
    "instanceof",
    "in",
    "of",
    "new",
    "delete",
    "void",
    "throw",
    "case",
    "do",
    "else",
    "yield",
    "await",
]);
const IDENTIFIER_START = /[A-Za-z_$]/;
const IDENTIFIER_PART = /[A-Za-z0-9_$]/;
/**
 * Replace every comment and every template-literal TEXT span with whitespace of equal length.
 *
 * WHY THIS IS REQUIRED RATHER THAN COSMETIC. The specifier patterns below are regexes over file
 * bytes, so PROSE can manufacture a specifier that no import statement carries — and once `foreign`
 * is a REFUSAL rather than a harmless extra file in a mirror, a false positive stops being cheap.
 * Measured over the 65 tracked `.js` files at the time of this change: widening the three patterns
 * from a dot-leading capture to an any-character capture produced THIRTEEN foreign-classified
 * matches, none of them an import — two template literals (`scripts/compactor.js`'s `"${rawVal}"`
 * and this module's own `imports "${spec}"` refusal message) and eleven multi-line spans captured
 * out of `//` comment blocks. With this function and the newline-excluding capture, that count is
 * ZERO. Both numbers are recorded in `32-31-GREEN-proof.txt`.
 *
 * WHAT IT DELIBERATELY DOES NOT BLANK. Ordinary string literals stay intact — blanking them would
 * change what the patterns see inside real code — and so does the CODE inside a template
 * literal's `${…}` substitutions. Blanking a substitution would REMOVE REAL CODE, and this
 * module's contract is that a missed specifier costs a crash while an extra one costs a file; the
 * conservative direction is to narrow only the prose. Regular-expression literals are recognised
 * so that a pattern such as `/https?:\/\//` cannot be mistaken for the start of a line comment.
 *
 * Length is preserved exactly (newlines kept, everything else replaced with a space), so an offset
 * into the result is an offset into the source and a line number still means what it says.
 */
export function stripNonCode(source) {
    const out = source.split("");
    const n = source.length;
    const blank = (from, to) => {
        for (let k = Math.max(0, from); k < to && k < n; k += 1) {
            const ch = out[k];
            if (ch !== "\n" && ch !== "\r")
                out[k] = " ";
        }
    };
    const stack = [{ mode: "code", braceDepth: 0, textStart: 0 }];
    let prev = "";
    let prevWord = "";
    let i = 0;
    while (i < n) {
        const top = stack[stack.length - 1];
        const c = source[i];
        if (top.mode === "template") {
            if (c === "\\") {
                i += 2;
                continue;
            }
            if (c === "`") {
                blank(top.textStart, i);
                stack.pop();
                i += 1;
                prev = "`";
                prevWord = "";
                continue;
            }
            if (c === "$" && source[i + 1] === "{") {
                blank(top.textStart, i);
                stack.push({ mode: "code", braceDepth: 0, textStart: 0 });
                i += 2;
                prev = "{";
                prevWord = "";
                continue;
            }
            i += 1;
            continue;
        }
        if (c === "/" && source[i + 1] === "/") {
            let end = source.indexOf("\n", i);
            if (end === -1)
                end = n;
            blank(i, end);
            i = end;
            continue;
        }
        if (c === "/" && source[i + 1] === "*") {
            const close = source.indexOf("*/", i + 2);
            const end = close === -1 ? n : close + 2;
            blank(i, end);
            i = end;
            continue;
        }
        if (c === "/" && (REGEX_PRECEDING_PUNCTUATION.has(prev) || REGEX_PRECEDING_WORDS.has(prevWord))) {
            let k = i + 1;
            let inClass = false;
            let closed = false;
            while (k < n) {
                const r = source[k];
                if (r === "\\") {
                    k += 2;
                    continue;
                }
                if (r === "\n")
                    break;
                if (r === "[")
                    inClass = true;
                else if (r === "]")
                    inClass = false;
                else if (r === "/" && !inClass) {
                    k += 1;
                    closed = true;
                    break;
                }
                k += 1;
            }
            if (closed) {
                while (k < n && /[a-z]/.test(source[k]))
                    k += 1;
                i = k;
            }
            else {
                i += 1;
            }
            prev = "/";
            prevWord = "";
            continue;
        }
        if (c === '"' || c === "'") {
            let k = i + 1;
            while (k < n) {
                const r = source[k];
                if (r === "\\") {
                    k += 2;
                    continue;
                }
                k += 1;
                if (r === c || r === "\n")
                    break;
            }
            i = k;
            prev = c;
            prevWord = "";
            continue;
        }
        if (c === "`") {
            stack.push({ mode: "template", braceDepth: 0, textStart: i + 1 });
            i += 1;
            continue;
        }
        if (c === "{") {
            top.braceDepth += 1;
            i += 1;
            prev = "{";
            prevWord = "";
            continue;
        }
        if (c === "}") {
            if (top.braceDepth === 0 && stack.length > 1) {
                stack.pop();
                const back = stack[stack.length - 1];
                if (back.mode === "template")
                    back.textStart = i + 1;
            }
            else {
                top.braceDepth -= 1;
            }
            i += 1;
            prev = "}";
            prevWord = "";
            continue;
        }
        if (IDENTIFIER_START.test(c)) {
            let k = i;
            while (k < n && IDENTIFIER_PART.test(source[k]))
                k += 1;
            prevWord = source.slice(i, k);
            prev = source[k - 1];
            i = k;
            continue;
        }
        if (c === " " || c === "\t" || c === "\n" || c === "\r") {
            i += 1;
            continue;
        }
        prev = c;
        prevWord = "";
        i += 1;
    }
    // An unterminated template literal is prose to the end of the file, and it is blanked as such
    // rather than left as a span the patterns can read.
    while (stack.length > 1) {
        const frame = stack.pop();
        if (frame.mode === "template")
            blank(frame.textStart, n);
    }
    return out.join("");
}
/**
 * The three emitted forms a module specifier appears in, and NOTHING else:
 *   `import … from "x"` / `export … from "x"`  — static ESM and re-export
 *   `import "x"`                                — bare side-effect import
 *   `import("x")`                               — dynamic
 *
 * THE CAPTURE EXCLUDES LINE BREAKS, which is not cosmetic either: a real module specifier is on one
 * line, and eleven of the thirteen false positives measured above were multi-line spans a
 * newline-crossing capture stitched together out of comment text.
 */
const SPECIFIER_PATTERNS = Object.freeze([
    /\bfrom\s*["']([^"'\n\r]*)["']/g,
    /\bimport\s*["']([^"'\n\r]*)["']/g,
    /\bimport\s*\(\s*["']([^"'\n\r]*)["']\s*\)/g,
]);
/**
 * Every module specifier one JavaScript source carries, each with its class.
 *
 * The scan's INPUT is CODE: `stripNonCode` runs first, so the partition is asked about import
 * statements rather than about prose. Both quote styles are read.
 */
export function moduleSpecifiers(source) {
    const code = stripNonCode(source);
    const out = [];
    for (const re of SPECIFIER_PATTERNS) {
        for (const m of code.matchAll(re)) {
            const specifier = m[1];
            out.push({ specifier, cls: classifySpecifier(specifier) });
        }
    }
    return out;
}
/**
 * Every RELATIVE import specifier in one JavaScript source.
 *
 * A VIEW over `moduleSpecifiers`, not a second scan (32-31). It kept its name and its contract so
 * every existing caller is unaffected, but it no longer OWNS a rule: the class it filters on is
 * decided by `classifySpecifier`, the same function the read-only guard's census asks, so the
 * walker's follow-set and the guard's census-set can no longer own different prefixes.
 */
export function relativeSpecifiers(source) {
    return moduleSpecifiers(source)
        .filter((entry) => entry.cls === "relative")
        .map((entry) => entry.specifier);
}
/** Thrown when the walk meets an edge it cannot vouch for. Never swallowed into a short result. */
export class ImportClosureError extends Error {
    constructor(message) {
        super(message);
        this.name = "ImportClosureError";
    }
}
function assertInsideRoot(root, abs, why) {
    const rel = relative(root, abs);
    if (rel === "" || rel.startsWith("..") || isAbsolute(rel)) {
        throw new ImportClosureError(`js-import-closure: ${why} resolves to ${abs}, which is outside the repository root ${root}. ` +
            `Refusing to mirror a path outside the tree.`);
    }
}
/**
 * The walk itself: `entry`'s transitive closure, plus every FOREIGN edge it met on the way.
 *
 * WHY THE WALK AND THE REFUSAL ARE SPLIT (32-31). A walk that threw the instant it met a foreign
 * specifier would make the read-only guard's own foreign-specifier census UNREACHABLE — the guard
 * calls this to get the module set it then analyses, so a throw here means the census never runs and
 * the specifier is never recorded at the position the guard decides from. A predicate that is never
 * ASKED cannot refuse. So the walk REPORTS the third bucket at a named position and `jsImportClosure`
 * — the entry point every existing caller uses — carries the refusal, unchanged in signature and
 * strictly stronger in contract.
 *
 * Each class is handled by its own named rule, and there is no fall-through:
 *   `relative` — resolved, containment-checked, existence-checked and followed, exactly as before.
 *   `bare`     — skipped, by this module's written scope rule (builtins and a package set that is
 *                empty in this repository).
 *   `foreign`  — recorded into `foreignEdges` and NOT followed. Never skipped.
 *
 * `modules` is sorted so two callers comparing closures compare sets and not traversal order, and so
 * a caller that prints the closure prints a stable list.
 */
export function jsImportClosureFacts(root, entryRel) {
    const rootAbs = resolve(root);
    const entryAbs = resolve(rootAbs, entryRel);
    assertInsideRoot(rootAbs, entryAbs, `the entry ${entryRel}`);
    if (!existsSync(entryAbs) || !statSync(entryAbs).isFile()) {
        throw new ImportClosureError(`js-import-closure: the entry ${entryRel} does not exist under ${rootAbs} — refusing to ` +
            `report an empty closure for a file that was never read.`);
    }
    const relPosix = (abs) => relative(rootAbs, abs).split(sep).join("/");
    const seen = new Set();
    const foreignEdges = [];
    const queue = [entryAbs];
    while (queue.length > 0) {
        const abs = queue.pop();
        if (seen.has(abs))
            continue;
        seen.add(abs);
        const source = readFileSync(abs, "utf8");
        for (const { specifier, cls } of moduleSpecifiers(source)) {
            if (cls === "bare")
                continue;
            if (cls === "foreign") {
                foreignEdges.push({ module: relPosix(abs), specifier });
                continue;
            }
            const target = resolve(dirname(abs), specifier);
            assertInsideRoot(rootAbs, target, `the import "${specifier}" in ${relPosix(abs)}`);
            if (!existsSync(target) || !statSync(target).isFile()) {
                throw new ImportClosureError(`js-import-closure: ${relPosix(abs)} imports "${specifier}", which does not resolve ` +
                    `to a file at ${target}. A mirror built from a closure with an unresolvable edge would ` +
                    `be missing exactly the file the walk could not see, so the walk refuses instead.`);
            }
            if (!seen.has(target))
                queue.push(target);
        }
    }
    return { modules: [...seen].map(relPosix).sort(), foreignEdges };
}
/**
 * The transitive closure of `entry`'s relative imports, INCLUDING `entry` itself, as repo-relative
 * POSIX paths, sorted.
 *
 * Unchanged in signature and in every legitimate result. What it gained in 32-31 is the FOREIGN
 * refusal: an edge whose specifier is in neither the relative nor the bare arm is now named in a
 * throw, in exactly the posture this module already takes for an unresolvable edge and for an edge
 * that escapes the root. Every foreign edge is named, not just the first, because a caller who fixes
 * one and re-runs should not discover the next one a build later.
 */
export function jsImportClosure(root, entryRel) {
    const { modules, foreignEdges } = jsImportClosureFacts(root, entryRel);
    if (foreignEdges.length > 0) {
        const named = foreignEdges.map((e) => `${e.module} imports "${e.specifier}"`).join("; ");
        throw new ImportClosureError(`js-import-closure: ${named}. A specifier that is neither RELATIVE (./…, ../…) nor BARE (a ` +
            `node builtin or a package) names a module this walk cannot read, cannot mirror and cannot ` +
            `vouch for — an absolute or protocol-relative path, a file:/data: URL, a drive-letter path ` +
            `or a #-prefixed subpath import. Following it would mirror a file from outside the tree; ` +
            `skipping it would hand back a closure missing exactly the module the walk could not see. ` +
            `So the walk refuses instead.`);
    }
    return modules;
}
/**
 * Copy `entry`'s whole import closure into `mirrorRoot`, preserving repo-relative layout, and return
 * the copied paths. The caller mirror-spawns `join(mirrorRoot, entryRel)` afterwards.
 *
 * `copyFile` is injected rather than imported so a caller that already owns a copy/normalize policy
 * for its mirror (the guard harnesses normalize some inputs) keeps that policy in one place.
 */
export function copyImportClosure(root, entryRel, copyFile) {
    const closure = jsImportClosure(root, entryRel);
    for (const rel of closure)
        copyFile(rel);
    return closure;
}
/** Convenience for a caller that just wants the paths joined against a mirror root. */
export function closureTargets(root, entryRel, mirrorRoot) {
    return jsImportClosure(root, entryRel).map((rel) => ({
        rel,
        from: join(root, rel),
        to: join(mirrorRoot, rel),
    }));
}

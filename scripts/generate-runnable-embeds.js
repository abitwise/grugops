// generate-runnable-embeds.ts — the one embed generator for single-file host runnables (phase 37, plan 37-03,
// SPLIT-05).
//
// WHY THIS EXISTS. A host runnable (scripts/runnable-ref/*.ts, compiled to a committed .js that install copies
// into a host repository) may import `node:` builtins and nothing else: the host runs it with bare Node, with no
// kit and no node_modules. Yet it needs the board grammar, the non-blocking reader, the budget rules and the
// budget numbers, and each of those has one authority module in this repository. Phase 36 recorded the rule:
// such a rule or number reaches a host runnable only by generation into a marked region plus a freshness gate,
// never by a hand copy. This module is that generation, in the shape of scripts/generate-hook-manifest.ts.
//
// WHAT IT DOES. For each row of EMBED_SPECS it parses every named authority with the TypeScript compiler API,
// indexes the authority's top-level declarations (functions, classes, variable statements, type aliases,
// interfaces and enums) by name, and closes the named roots transitively: a declaration joins the closure when
// a name inside a declaration already in it resolves, through the type checker, to that declaration. The
// closure's text is then written between EMBED_OPEN and EMBED_CLOSE in the target, verbatim and in each
// authority's source order, after one merged import line per `node:` specifier.
//
// WHAT IT REFUSES, EACH AS A THROWN ERROR NAMING WHAT IT MET:
//   * a closure that reaches an import whose specifier does not start with `node:` (the module and the
//     specifier are named), because that import would not resolve on a host;
//   * two embedded declarations, or an embedded declaration and an embedded import, with one name in one
//     target (the name and both modules are named), because one of the two would silently win;
//   * LEGACY_STATE_ROOT_REL, whose quoted value is the spelling the old-state-path gate counts (research
//     Pitfall 2), so a root must be chosen whose closure does not reach it;
//   * a root that is not a top-level declaration of its authority, and an embedded line equal to a marker;
//   * an authority declaration or import named like one of the three generated build stamp names below.
//
// THE BUILD STAMP (plan 37-24, D-17, WR-05, AUTH-1). The three targets are installed into a host as separate
// files and never updated in place, so each region also carries three generated lines whose shape
// scripts/runnable-stamp.ts owns: RUNNABLE_SET_STAMP, a sha256 over every EMBED_SPECS target's generated body
// (its target path, a NUL byte, its import lines and declarations, a NUL byte, in EMBED_SPECS order);
// RUNNABLE_SET, the file names built together; and RUNNABLE_SELF, the program carrying the region. A change to
// any authority any target embeds changes the stamp of every region, so programs built from different authorities
// never carry equal stamps. The stamp is never written by hand: the freshness gate re-derives it with the region.
// state-check reads its siblings' stamps and reports runnable-version-skew when one differs from its own.
//
// DEV ONLY. This module and its freshness gate run in this repository's checkout and CI, never on a host. The
// TypeScript compiler is acquired at run time through createRequire, as scripts/js-import-closure.ts does, so
// the committed .js keeps a static import graph of builtins and relative modules only; the `import type`
// below is erased from the emitted .js.
//
// Voice: clear professional voice (CLAUDE.md hard rule): these refusals guard what every host runs.
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import { isEntrypoint } from "./is-entry.js";
import { RUNNABLE_STAMP_DECLARED_NAMES, formatRunnableStampLines } from "./runnable-stamp.js";
const ROOT = join(import.meta.dirname, "..");
/** The line that opens a generated region. A region is found only where this is a whole line. */
export const EMBED_OPEN = "// <runnable-embeds> GENERATED — do not edit by hand; run `npm run generate:runnable-embeds`";
/** The line that closes a generated region. */
export const EMBED_CLOSE = "// </runnable-embeds>";
/**
 * Every generated region in the repository. The first row is the state checker (plans 37-03, 37-04 and 37-05):
 * the budget numbers and every state path it reads from install/state-layout.ts, every budget rule, the record
 * rule, the marker rule, the output sanitizer, the NFR index grammar and integrity rule, the progress-entry
 * grammar and the rollable and move-only rules from scripts/state-rules.ts, the board grammar from scripts/board-model.ts, and the non-blocking reader from
 * scripts/context-io.ts. The second row is the trace renderer (plan 37-06): the two context roots and the two
 * trace paths from install/state-layout.ts, the output sanitizer from scripts/state-rules.ts, the trace model
 * from scripts/trace-model.ts, and the note read path (the walk with its skip arms and the seal check, the
 * record projection, the non-blocking reader) and the temp-sibling-plus-rename writer from scripts/context-io.ts.
 * Plan 37-07 (2026-10-22) adds the trace model's comparison to that row: the owned-entry rule, the case-fold
 * collision groups, the generated-header test, the tree comparison and the trace-file read ceiling, so the
 * --check mode and the write mode's refusals compare with the same model state-check embeds (plan 37-09).
 * Plan 37-09 (2026-10-22) adds to the state checker's row the two context roots, the trace model (the note
 * collection, the tree plan, the comparison with its owned-entry rule, the case-fold collision groups, the
 * generated-header test and the trace-file read ceiling) and the note read path (the walk with its skip arms,
 * the record projection), so state-check and the renderer read the same notes and compare with the same code.
 * The writer (atomicWrite) is never a root of this row: state-check is read-only.
 * Plan 37-10 (2026-10-22) adds the third row, the Done roll (D-07, D-08): the board, the archive directory, the
 * Done archive and BUDGETS from install/state-layout.ts; the two Done-roll planners, the plan assembly, the
 * line-conservation proof, the injected-io executor and the output sanitizer from scripts/state-rules.ts; the
 * board grammar and its two normalizations from scripts/board-model.ts; and the non-blocking reader and the
 * temp-sibling-plus-rename writer from scripts/context-io.ts.
 * Plan 37-11 (2026-10-22) adds to that row the progress roll (D-09): the progress file and the progress archive
 * from install/state-layout.ts; the progress planners, the two duplicate refusals, the line-ending rule and the
 * byte measure from scripts/state-rules.ts; and scripts/frontmatter.ts's sectionEndIndex, the one section-extent
 * owner (LANG-07), whose generated copy answers where a progress entry ends (D-16). The move-only surfaces
 * (.grugops/queue/done/ and memory-bank/50-decisions/) are not roots: the roll never reaches them (v3.0 D-7).
 * Plan 37-21 (2026-10-23) adds planCompleteTraceTree to the trace-model roots of the state checker's row and the
 * trace renderer's row (D-17, CR-01, READ-1): the one predicate that says the note read was complete, and the
 * plan given only for a complete read, so the render's two modes and state-check ask the same question.
 * Plan 37-22 (2026-10-23) adds scripts/board-model.ts isTicketId to the trace renderer's row and to the state
 * checker's board-model roots (D-17, WR-01, AUTH-1): the board grammar's one answer to "is this a ticket
 * identifier", which both runnables pass to the trace model, so the trace never keeps a ticket shape of its own.
 * The same plan adds traceFileNameRefusals to the trace renderer's trace-model roots: every planned trace file name
 * is checked before the first write, in both modes.
 * Plan 37-23 (2026-10-23) adds scripts/frontmatter.ts sectionEndIndex to the state checker's row (D-17, WR-02,
 * AUTH-1): progressEntries asks the one section-extent owner which progress lines are `##` section headings, and
 * state-check passes this generated copy, so its ROLLABLE report and state-roll's planner classify dated entries
 * with one fence-aware answer. D-16 admits the copy inside this fresh generated region; the census is unchanged.
 * Plan 37-24 (2026-10-23) adds scripts/runnable-stamp.ts readRunnableStamp to the state checker's row (D-17, WR-05,
 * AUTH-1): state-check reads the build stamp of trace-render.js and state-roll.js beside it with the one reader of
 * the stamp line's shape, and reports runnable-version-skew when a stamp differs from its own.
 * Plan 37-28 (2026-10-23) adds scripts/context-io.ts entryPresence to the context-io roots of the state checker's
 * row and the trace renderer's row (D-18, CR-03, READ-1 round 2): the one absence owner, under which only an lstat
 * ENOENT is "nothing there", so a dangling `notes` link is a failed task in both runnables, never a task with no
 * notes.
 */
export const EMBED_SPECS = Object.freeze([
    {
        target: "scripts/runnable-ref/state-check.ts",
        authorities: [
            {
                module: "install/state-layout.ts",
                roots: [
                    "BUDGETS",
                    "BOARD_REL",
                    "LAYOUT_MARKER_REL",
                    "LAYOUT_MARKER_CONTENT",
                    "TICKETS_REL",
                    "NFR_DIR_REL",
                    "TRACE_DIR_REL",
                    "TRACEABILITY_REL",
                    "NFR_CATALOG_REL",
                    "PROGRESS_REL",
                    "DECISIONS_REL",
                    "DECISIONS_ARCHIVE_REL",
                    "QUEUE_DONE_REL",
                    "QUEUE_DONE_ARCHIVE_REL",
                    "CONTEXT_REL",
                    "CONTEXT_ARCHIVE_REL",
                ],
            },
            {
                module: "scripts/state-rules.ts",
                roots: [
                    "markerState",
                    "formatMarkerWarning",
                    "boardBudgetFindings",
                    "doneRowFindings",
                    "indexLineFindings",
                    "fileBytesFinding",
                    "budgetEntryNames",
                    "recordEntryNames",
                    "parseNfrIndex",
                    "nfrIntegrityFindings",
                    "progressEntries",
                    "doneRowCount",
                    "rollableSurfaces",
                    "formatRollable",
                    "progressBytesFinding",
                    "moveOnlyFindings",
                    "integrityFinding",
                    "unmeasuredFinding",
                    "formatFinding",
                    "sortFindings",
                    "stripControlChars",
                ],
            },
            {
                module: "scripts/board-model.ts",
                roots: ["parseBoard", "normalizeDocument", "stripHtmlComments", "isTicketId"],
            },
            { module: "scripts/frontmatter.ts", roots: ["sectionEndIndex"] },
            {
                module: "scripts/trace-model.ts",
                roots: [
                    "TRACE_GENERATED_HEADER",
                    "buildTraceRows",
                    "collectTraceNotes",
                    "planTraceTree",
                    "planCompleteTraceTree",
                    "caseFoldCollisions",
                    "isGeneratedTraceText",
                    "compareTraceTree",
                    "TRACE_FILE_MAX_BYTES",
                ],
            },
            {
                module: "scripts/context-io.ts",
                roots: ["readRegularFileOrNull", "readRawNotesWithSkips", "recordFromParsed", "NOTE_SKIP_ARMS", "entryPresence"],
            },
            { module: "scripts/runnable-stamp.ts", roots: ["readRunnableStamp"] },
        ],
    },
    {
        target: "scripts/runnable-ref/trace-render.ts",
        authorities: [
            {
                module: "install/state-layout.ts",
                roots: ["CONTEXT_REL", "CONTEXT_ARCHIVE_REL", "TRACE_DIR_REL", "TRACEABILITY_REL"],
            },
            { module: "scripts/state-rules.ts", roots: ["stripControlChars"] },
            { module: "scripts/board-model.ts", roots: ["isTicketId"] },
            {
                module: "scripts/trace-model.ts",
                roots: [
                    "TRACE_GENERATED_HEADER",
                    "classifyRef",
                    "isTicketRef",
                    "buildTraceRows",
                    "renderTicketTrace",
                    "renderTraceIndex",
                    "traceFileName",
                    "collectTraceNotes",
                    "planTraceTree",
                    "planCompleteTraceTree",
                    "traceFileNameRefusals",
                    "compareCodeUnits",
                    "ownedTraceEntries",
                    "caseFoldCollisions",
                    "isGeneratedTraceText",
                    "compareTraceTree",
                    "TRACE_FILE_MAX_BYTES",
                ],
            },
            {
                module: "scripts/context-io.ts",
                roots: [
                    "readRawNotesWithSkips",
                    "recordFromParsed",
                    "readRegularFileOrNull",
                    "atomicWrite",
                    "NOTE_SKIP_ARMS",
                    "entryPresence",
                ],
            },
        ],
    },
    {
        target: "scripts/runnable-ref/state-roll.ts",
        authorities: [
            {
                module: "install/state-layout.ts",
                roots: ["BOARD_REL", "ARCHIVE_REL", "BOARD_DONE_ARCHIVE_REL", "PROGRESS_REL", "PROGRESS_ARCHIVE_REL", "BUDGETS"],
            },
            {
                module: "scripts/state-rules.ts",
                roots: [
                    "planDoneRoll",
                    "planArchiveInsert",
                    "doneDuplicateRefusal",
                    "planProgressRoll",
                    "planProgressAppend",
                    "lineEndingRefusal",
                    "assembleRoll",
                    "checkConservation",
                    "executeRoll",
                    "utf8Bytes",
                    "stripControlChars",
                ],
            },
            { module: "scripts/board-model.ts", roots: ["parseBoard", "normalizeDocument", "stripHtmlComments"] },
            { module: "scripts/frontmatter.ts", roots: ["sectionEndIndex"] },
            { module: "scripts/context-io.ts", roots: ["readRegularFileOrNull", "atomicWrite"] },
        ],
    },
]);
/**
 * A pinned integer, not a derivation: scripts/generate-runnable-embeds.test.ts asserts it equals
 * EMBED_SPECS.length, so a row added or removed without moving this pin fails red.
 * 2026-10-22, plan 37-03: one row, the state checker.
 * 2026-10-22, plan 37-06: two rows; the second is the host trace renderer (SPLIT-03, D-01).
 * 2026-10-22, plan 37-10: three rows; the third is the Done roll, scripts/runnable-ref/state-roll.ts (SPLIT-06, D-08).
 */
export const EMBED_SPEC_COUNT = 3;
/** Names the generator never embeds, each with the reason it gives. */
const REFUSED_NAMES = Object.freeze({
    LEGACY_STATE_ROOT_REL: "its quoted value is the spelling the old-state-path gate counts (research Pitfall 2); choose roots whose " +
        "closure does not reach it",
});
// ── The compiler, acquired at run time ─────────────────────────────────────────────────────────────────
let compilerMemo;
/** The TypeScript compiler API, resolved from this module's own location, or a named refusal. */
function compiler() {
    if (compilerMemo !== undefined)
        return compilerMemo;
    try {
        compilerMemo = createRequire(import.meta.url)("typescript");
    }
    catch (e) {
        throw new Error("generate-runnable-embeds: the TypeScript compiler could not be loaded from this checkout " +
            `(${e.message}). This generator is a development tool: run it from a checkout after npm ci.`);
    }
    return compilerMemo;
}
/** The identifiers a destructuring or plain binding name declares. */
function bindingNames(ts, name) {
    if (ts.isIdentifier(name))
        return [name.text];
    const out = [];
    for (const el of name.elements) {
        if (ts.isBindingElement(el))
            out.push(...bindingNames(ts, el.name));
    }
    return out;
}
/** True for an identifier in a position that names a member rather than referring to a declaration. */
function isMemberName(ts, id) {
    const p = id.parent;
    if (p === undefined)
        return false;
    if (ts.isPropertyAccessExpression(p) && p.name === id)
        return true;
    if (ts.isQualifiedName(p) && p.right === id)
        return true;
    if ((ts.isPropertyAssignment(p) ||
        ts.isPropertyDeclaration(p) ||
        ts.isPropertySignature(p) ||
        ts.isMethodDeclaration(p) ||
        ts.isMethodSignature(p) ||
        ts.isGetAccessorDeclaration(p) ||
        ts.isSetAccessorDeclaration(p) ||
        ts.isEnumMember(p)) &&
        p.name === id) {
        return true;
    }
    if (ts.isBindingElement(p) && p.propertyName === id)
        return true;
    return false;
}
/** The closure of `roots` in the authority at `root`/`module`. */
function closeAuthority(root, authority) {
    const ts = compiler();
    const abs = join(root, ...authority.module.split("/"));
    let text;
    try {
        text = readFileSync(abs, "utf8");
    }
    catch (e) {
        throw new Error(`generate-runnable-embeds: cannot read the authority ${authority.module} (${e.message})`);
    }
    // noResolve and noLib: the checker binds this one file, so a name resolves to a declaration in it or to one
    // of its import bindings; an imported module is never loaded, and a global resolves to nothing.
    const host = ts.createCompilerHost({}, true);
    const original = host.getSourceFile.bind(host);
    host.getSourceFile = (fileName, languageVersion, onError, shouldCreate) => fileName === abs
        ? ts.createSourceFile(fileName, text, languageVersion, true, ts.ScriptKind.TS)
        : original(fileName, languageVersion, onError, shouldCreate);
    const program = ts.createProgram({
        rootNames: [abs],
        options: {
            noLib: true,
            noResolve: true,
            noEmit: true,
            types: [],
            target: ts.ScriptTarget.ES2022,
            module: ts.ModuleKind.ESNext,
        },
        host,
    });
    const sf = program.getSourceFile(abs);
    if (sf === undefined)
        throw new Error(`generate-runnable-embeds: the compiler did not load ${authority.module}`);
    const checker = program.getTypeChecker();
    const byName = new Map();
    const namesOf = new Map();
    const importsByDecl = new Map();
    for (const st of sf.statements) {
        if (ts.isImportDeclaration(st)) {
            const clause = st.importClause;
            if (clause === undefined || !ts.isStringLiteral(st.moduleSpecifier))
                continue;
            const specifier = st.moduleSpecifier.text;
            if (clause.name !== undefined) {
                importsByDecl.set(clause, {
                    local: clause.name.text,
                    specifier,
                    form: "default",
                    imported: "default",
                    typeOnly: clause.isTypeOnly,
                });
            }
            const nb = clause.namedBindings;
            if (nb !== undefined && ts.isNamespaceImport(nb)) {
                importsByDecl.set(nb, { local: nb.name.text, specifier, form: "namespace", imported: "*", typeOnly: clause.isTypeOnly });
            }
            else if (nb !== undefined) {
                for (const el of nb.elements) {
                    importsByDecl.set(el, {
                        local: el.name.text,
                        specifier,
                        form: "named",
                        imported: (el.propertyName ?? el.name).text,
                        typeOnly: clause.isTypeOnly || el.isTypeOnly,
                    });
                }
            }
            continue;
        }
        let names = [];
        if ((ts.isFunctionDeclaration(st) ||
            ts.isClassDeclaration(st) ||
            ts.isInterfaceDeclaration(st) ||
            ts.isTypeAliasDeclaration(st) ||
            ts.isEnumDeclaration(st)) &&
            st.name !== undefined) {
            names = [st.name.text];
        }
        else if (ts.isVariableStatement(st)) {
            names = st.declarationList.declarations.flatMap((d) => bindingNames(ts, d.name));
        }
        if (names.length === 0)
            continue;
        namesOf.set(st, names);
        for (const n of names)
            byName.set(n, [...(byName.get(n) ?? []), st]);
    }
    const included = new Set();
    const used = new Map();
    const queue = [];
    const topLevelOf = (node) => {
        let n = node;
        while (n.parent !== undefined && !ts.isSourceFile(n.parent))
            n = n.parent;
        return n.parent === sf ? n : undefined;
    };
    const visit = (node) => {
        if (ts.isIdentifier(node) && !isMemberName(ts, node)) {
            const p = node.parent;
            const symbol = p !== undefined && ts.isShorthandPropertyAssignment(p) && p.name === node
                ? checker.getShorthandAssignmentValueSymbol(p)
                : checker.getSymbolAtLocation(node);
            for (const decl of symbol?.declarations ?? []) {
                const binding = importsByDecl.get(decl);
                if (binding !== undefined) {
                    if (!binding.specifier.startsWith("node:")) {
                        throw new Error(`generate-runnable-embeds: the closure of ${authority.roots.join(", ")} in ${authority.module} reaches ` +
                            `"${binding.local}", imported from "${binding.specifier}", which is not a node: builtin. A host ` +
                            "runnable may import node: builtins only, so this closure cannot be embedded. Choose other roots, " +
                            "or move what they need into an import-free module.");
                    }
                    used.set(binding.local, binding);
                    continue;
                }
                const top = topLevelOf(decl);
                if (top !== undefined && namesOf.has(top) && !included.has(top))
                    queue.push(...(namesOf.get(top) ?? []));
            }
        }
        ts.forEachChild(node, visit);
    };
    queue.push(...authority.roots);
    for (const r of authority.roots) {
        if (!byName.has(r)) {
            throw new Error(`generate-runnable-embeds: "${r}" is not a top-level declaration of ${authority.module}`);
        }
    }
    while (queue.length > 0) {
        const name = queue.shift();
        const refusal = REFUSED_NAMES[name];
        if (refusal !== undefined) {
            throw new Error(`generate-runnable-embeds: the closure of ${authority.roots.join(", ")} in ${authority.module} reaches ` +
                `${name}, which is never embedded: ${refusal}.`);
        }
        for (const st of byName.get(name) ?? []) {
            if (included.has(st))
                continue;
            included.add(st);
            for (const n of namesOf.get(st) ?? [])
                if (n !== name)
                    queue.push(n);
            visit(st);
        }
    }
    const ordered = sf.statements.filter((st) => included.has(st));
    return {
        module: authority.module,
        statements: ordered.map((st) => st.getText(sf)),
        names: ordered.flatMap((st) => namesOf.get(st) ?? []),
        imports: [...used.values()],
    };
}
// ── Rendering one region ───────────────────────────────────────────────────────────────────────────────
/** Code-unit order, never the host locale's. */
function compareCodeUnits(a, b) {
    return a < b ? -1 : a > b ? 1 : 0;
}
/** The one import element spelling: `name`, or `imported as local`, as the authority wrote it. */
function elementText(b) {
    return b.imported === b.local ? b.local : `${b.imported} as ${b.local}`;
}
/** Who owns the three generated stamp names, in a refusal. */
const STAMP_LINES_OWNER = "the generated build stamp lines (scripts/runnable-stamp.ts)";
/**
 * The import lines and declarations a fresh derivation gives for `spec`, without the markers and without the
 * build stamp lines. Throws on every refusal the module header lists.
 */
export function deriveBody(spec, root = ROOT) {
    const modules = spec.authorities.map((a) => a.module);
    const repeated = modules.find((m, i) => modules.indexOf(m) !== i);
    if (repeated !== undefined) {
        throw new Error(`generate-runnable-embeds: ${spec.target} lists the authority ${repeated} twice; list it once with every root`);
    }
    const closures = spec.authorities.map((a) => closeAuthority(root, a));
    // One name, one owner, across every authority's declarations and imports in this target. A name an authority
    // declares in more than one statement (a function's overloads) is one declaration of that authority. The three
    // names the build stamp lines declare are claimed first (plan 37-24), so an authority that declares or imports
    // one of them is refused by name.
    const owner = new Map();
    for (const n of RUNNABLE_STAMP_DECLARED_NAMES)
        owner.set(n, STAMP_LINES_OWNER);
    const importOf = new Map();
    const claim = (name, module) => {
        const prior = owner.get(name);
        if (prior !== undefined && prior !== module) {
            throw new Error(`generate-runnable-embeds: ${spec.target} would embed two declarations named "${name}", one from ${prior} ` +
                `and one from ${module}. One of the two would silently win, so the region is refused. Rename one, or ` +
                "choose roots whose closures do not both reach that name.");
        }
        owner.set(name, module);
    };
    for (const c of closures) {
        for (const n of c.names)
            claim(n, c.module);
    }
    for (const c of closures) {
        for (const b of c.imports) {
            const prior = importOf.get(b.local);
            if (prior !== undefined) {
                if (prior.specifier !== b.specifier || prior.form !== b.form || prior.imported !== b.imported) {
                    throw new Error(`generate-runnable-embeds: ${spec.target} would embed two imports named "${b.local}": ` +
                        `${prior.form} "${prior.imported}" from "${prior.specifier}" and ${b.form} "${b.imported}" from ` +
                        `"${b.specifier}" (the second reached from ${c.module}).`);
                }
                if (!b.typeOnly && prior.typeOnly)
                    importOf.set(b.local, b);
                continue;
            }
            const declared = owner.get(b.local);
            if (declared !== undefined) {
                throw new Error(`generate-runnable-embeds: ${spec.target} would embed a declaration named "${b.local}" from ${declared} ` +
                    `and an import of the same name reached from ${c.module}.`);
            }
            importOf.set(b.local, b);
        }
    }
    const bySpecifier = new Map();
    for (const b of importOf.values())
        bySpecifier.set(b.specifier, [...(bySpecifier.get(b.specifier) ?? []), b]);
    const importLines = [];
    for (const specifier of [...bySpecifier.keys()].sort(compareCodeUnits)) {
        const bindings = bySpecifier.get(specifier) ?? [];
        const named = bindings
            .filter((b) => b.form === "named")
            .sort((a, b) => compareCodeUnits(elementText(a), elementText(b)))
            .map((b) => (b.typeOnly ? `type ${elementText(b)}` : elementText(b)));
        if (named.length > 0)
            importLines.push(`import { ${named.join(", ")} } from ${JSON.stringify(specifier)};`);
        for (const b of bindings.filter((x) => x.form !== "named").sort((a, x) => compareCodeUnits(a.local, x.local))) {
            const kw = b.typeOnly ? "import type" : "import";
            importLines.push(b.form === "namespace"
                ? `${kw} * as ${b.local} from ${JSON.stringify(specifier)};`
                : `${kw} ${b.local} from ${JSON.stringify(specifier)};`);
        }
    }
    const body = [];
    for (const c of closures) {
        body.push(`// from ${c.module}`);
        body.push(...c.statements);
    }
    for (const line of body.join("\n").split("\n")) {
        if (line === EMBED_OPEN || line === EMBED_CLOSE) {
            throw new Error(`generate-runnable-embeds: an embedded declaration for ${spec.target} holds a region marker line`);
        }
    }
    return { imports: importLines, declarations: body };
}
/** The file name a target is installed and run under: its basename, `.ts` changed to `.js`. */
function runnableFileName(target) {
    const base = target.split("/").pop() ?? target;
    if (!base.endsWith(".ts"))
        throw new Error(`generate-runnable-embeds: the target ${target} is not a .ts source`);
    return `${base.slice(0, -".ts".length)}.js`;
}
/** The stamp over bodies already derived, in `set` order. */
function stampOver(set, bodies) {
    const hash = createHash("sha256");
    set.forEach((spec, i) => {
        const body = bodies[i];
        hash.update(spec.target, "utf8");
        hash.update("\0", "utf8");
        hash.update([...body.imports, ...body.declarations].join("\n"), "utf8");
        hash.update("\0", "utf8");
    });
    return `sha256:${hash.digest("hex")}`;
}
/**
 * The build stamp of `set`: `sha256:` and the hex sha256 of, for each spec in `set` order, its target, a NUL byte,
 * its generated body (deriveBody's import lines and declarations, joined by newlines) and a NUL byte. Computed from
 * the authorities, never read from a region, so a hand-edited stamp is stale.
 */
export function runnableSetStamp(set, root = ROOT) {
    return stampOver(set, set.map((s) => deriveBody(s, root)));
}
/**
 * The region a fresh derivation gives for `spec`, markers included: the import lines, the three build stamp lines
 * for `set`, then the declarations. `spec` must be a member of `set` (by identity); the generator and the freshness
 * gate pass EMBED_SPECS. Throws on every refusal the module header lists, and when `spec` is not in `set`.
 */
export function deriveRegion(spec, root = ROOT, set = EMBED_SPECS) {
    const at = set.indexOf(spec);
    if (at === -1) {
        throw new Error(`generate-runnable-embeds: ${spec.target} is not a member of the spec set its build stamp is computed over, so ` +
            "its region cannot be derived");
    }
    const bodies = set.map((s) => deriveBody(s, root));
    const own = bodies[at];
    const stampLines = formatRunnableStampLines(stampOver(set, bodies), set.map((s) => runnableFileName(s.target)), runnableFileName(spec.target));
    return [EMBED_OPEN, ...own.imports, ...stampLines, ...own.declarations, EMBED_CLOSE].join("\n");
}
/**
 * The [start, end) offsets of every generated region in `text`. A region runs from the start of a line that is
 * exactly EMBED_OPEN to the end of the next line that is exactly EMBED_CLOSE, its newline excluded. A marker
 * that appears inside other text (a string literal, a comment after code) is not a marker. Throws on an open
 * marker with no close, a close with no open, and a region opened inside another.
 */
export function regionSpans(text) {
    const spans = [];
    let open = null;
    let offset = 0;
    for (const raw of text.split("\n")) {
        const line = raw.endsWith("\r") ? raw.slice(0, -1) : raw;
        if (line === EMBED_OPEN) {
            if (open !== null)
                throw new Error("generate-runnable-embeds: a region is opened inside another region");
            open = offset;
        }
        else if (line === EMBED_CLOSE) {
            if (open === null)
                throw new Error("generate-runnable-embeds: a region close marker has no open marker");
            spans.push([open, offset + line.length]);
            open = null;
        }
        offset += raw.length + 1;
    }
    if (open !== null)
        throw new Error("generate-runnable-embeds: a region open marker has no close marker");
    return spans;
}
/**
 * The target's source with its one region replaced by a fresh derivation, in the rewriteHookEntry shape:
 * `changed` is true when the text differs from the file. Throws when either marker is missing, when the
 * target carries more than one region, and on every derivation refusal.
 */
export function rewriteRunnable(spec, root = ROOT) {
    const path = join(root, ...spec.target.split("/"));
    const src = readFileSync(path, "utf8");
    let spans;
    try {
        spans = regionSpans(src);
    }
    catch (e) {
        throw new Error(`generate-runnable-embeds: the region markers are missing or unbalanced in ${spec.target}: ${e.message}`);
    }
    if (spans.length !== 1) {
        throw new Error(`generate-runnable-embeds: ${spec.target} must carry exactly one region between the marker lines, and it ` +
            `carries ${spans.length}. The region markers are missing.`);
    }
    const [a, b] = spans[0];
    const next = src.slice(0, a) + deriveRegion(spec, root, EMBED_SPECS) + src.slice(b);
    return { changed: next !== src, text: next };
}
const isEntry = isEntrypoint(import.meta.url);
if (isEntry) {
    let changedCount = 0;
    for (const spec of EMBED_SPECS) {
        const { changed, text } = rewriteRunnable(spec, ROOT);
        if (changed) {
            writeFileSync(join(ROOT, ...spec.target.split("/")), text, "utf8");
            changedCount++;
        }
    }
    process.stdout.write(`Wrote runnable embeds: ${EMBED_SPECS.length} target(s), ${changedCount} changed` +
        `${changedCount === 0 ? " (unchanged)" : ""}.\n`);
    process.exit(0);
}

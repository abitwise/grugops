---
phase: 27-spawn-correctness-kit-set-authority
reviewed: 2026-08-03T06:21:18Z
depth: standard
round: 5
diff_base: 3494a85
files_reviewed: 11
files_reviewed_list:
  - scripts/frontmatter.ts
  - scripts/frontmatter.test.ts
  - scripts/kit-model.ts
  - scripts/kit-model.test.ts
  - scripts/check-foundation-guards.ts
  - scripts/check-foundation-guards.test.ts
  - install/kit-source.ts
  - install/install.ts
  - install/install.test.ts
  - install/uninstall.ts
  - scripts/coordinator-resolution-precheck.ts
findings:
  critical: 2
  warning: 4
  info: 4
  total: 10
status: issues_found
---

# Phase 27: Code Review Report — gap-closure ROUND 5

**Reviewed:** 2026-08-03T06:21:18Z
**Depth:** standard
**Files Reviewed:** 11
**Status:** issues_found

> **Filename note.** The invoking config named `27-REVIEW.md` as the output path. That file is the
> ROUND 1 review, and shipped source comments cite it verbatim by section
> (`scripts/frontmatter.ts:15` — "27-REVIEW.md § CR-02"; `scripts/kit-model.ts:38` —
> "27-REVIEW.md § CR-01"). Overwriting it would delete a referenced artifact and break the
> traceability trail. This report follows the per-round convention already established in this phase
> directory (`27-REVIEW.md`, `-GAPS.md`, `-GAPS-2`, `-GAPS-3`, `-GAPS-4`) and is written as
> `27-REVIEW-GAPS-5.md`. Point `--gaps` at this file.

## Summary

Round 5 closes four real defects and closes them well. The exit-tail conversions are correct and
correctly scoped: `install/install.ts:1648` and `install/uninstall.ts:760` each close the last
statement of their module, `scripts/coordinator-resolution-precheck.ts:611` sits after its `finally`,
and the eight mid-script `process.exit()` sites (six in `install.ts`, two in `uninstall.ts`) are
untouched — verified by reading each site, not by trusting the note. The `unreadable` channel in
`install/kit-source.ts` genuinely separates a read failure from an empty directory, both formerly-bare
`return;` arms route through it (`:383`, `:403`), and the installer surfaces it through the one
`verify` channel beside `cycles` and `overflow` (`install/install.ts:1509-1533`). The
`keysGrantedAgentNames` refusals fire on both reported WR-02 shapes, and the noted-unreachable D-32
escape refusal is correctly reasoned (the quote check at `:990` strictly dominates it and cannot
disagree with it).

But **both of this phase's recurring defect classes are still live in code shipped by this round**,
and both were reproduced end to end against the committed `.js` on hermetic `git archive` mirrors:

1. **The fail-open, fifth spelling — the DELIMITER axis again, by COMPOSITION of its own two arms.**
   A head line of `<ZWSP>---<ZWSP>` carrying a live `Agent(grugops-orchestrator)` grant routes into
   the keyless success arm. Each half alone is refused and pinned by a shipped case; together they
   succeed. Measured at the gate on the shipped `skills/grugops/SKILL.md`:
   `---<ZWSP>` → exit 1 · `<ZWSP>---` → exit 1 · `<ZWSP>---<ZWSP>` → **ALL CHECKS PASSED, exit 0**.

2. **Set-literal drift — a hand-maintained list of 2 of the 9 documented plugin-root component
   directories**, inside the very floor whose comment claims it "closes the CLASS the plugin-skill
   hole belongs to rather than only the instance CR-03 named". Reproduced: a rogue grant at
   `outputStyles/rogue.md` → **ALL CHECKS PASSED, exit 0** with `rogue` absent from the whole gate
   output. The same plant at `commands/rogue.md` is caught (exit 1). And `hooks/` — a
   default-discovered plugin-root component directory that **exists on the live tree today** — is in
   no scan set at all.

The delimiter sweep is non-circular over the CHARACTER alphabet exactly as its rationale argues — but
it is circular over the ARM STRUCTURE: all 4192 of its constructions are built to land inside one of
the two declared arms, so it is structurally incapable of failing on the composite. That is the same
tautology D-42 shipped, moved one abstraction level up.

No source file was modified. Every destructive probe ran against a throwaway mirror in a scratch
directory; the live checkout is untouched.

---

## Critical Issues

### CR-01: the delimiter refusal fails open on the COMPOSITION of its two arms — fifth spelling of the founding failure

**File:** `scripts/frontmatter.ts:795-823` (arm 1 at `:801`, arm 2 at `:811-821`)
**Claims falsified:** `scripts/frontmatter.ts:757-759`, `:781-787`

**Issue.** `delimiterRefusal` has two arms and they do not cover their own union.

- Arm 1 (`:801`) fires only when `line.startsWith(payload)`.
- Arm 2 (`:813-821`) fires only when, after stripping the leading invisible run,
  `isLegalDelimiter(line.slice(run), payload)` — i.e. arm 2 requires **a LEGAL delimiter** after the
  residue.

A line with BOTH leading invisible residue AND illegal payload residue matches neither, falls through
`return null` (`:822`), and lands in the keyless SUCCESS arm at `:887`
(`{ ok: true, value: new Map() }`) — which `hasSpawnGrant` reports as `{ ok: true, value: false }`,
the silent no-grant arm this module exists to make impossible.

**Reproduction (parser level).** Against the committed `scripts/frontmatter.js`. Document =
offending head line, then `name: rogue` / `tools: Read, Agent(grugops-orchestrator)` / `---`:

```
ZWSP + ----                  {"ok":true,"value":false}
ZWSP + --- foo               {"ok":true,"value":false}
space + ----                 {"ok":true,"value":false}
U+0301 + --- + U+0301        {"ok":true,"value":false}
BOM x2 + ----                {"ok":true,"value":false}
NBSP + ----                  {"ok":true,"value":false}
BOM x2 + --- + ZWSP          {"ok":true,"value":false}
NUL + --- + NUL              {"ok":true,"value":false}
```

Every one of those is a document this module's own text says must refuse: `---<ZWSP>` is a named row
in `DELIMITER_ROWS` (`scripts/frontmatter.test.ts:1697`), `<ZWSP>---` is swept exhaustively as
`leading @ opening`, and `----` / `--- foo` are named rows too. **Adding one invisible code point in
front of a refused line converts the refusal into a silent success.**

**Reproduction (gate level, end to end).** Hermetic `git archive` mirror; grant planted as
`allowed-tools: Read, Agent(grugops-orchestrator)` inside `skills/grugops/SKILL.md` — the one
plugin-form skill `guardDistributionPair` exempts (`check-foundation-guards.ts:1381`) and a file
Claude Code loads for every `/plugin install` user; then `node scripts/check-foundation-guards.js`:

| head line | gate exit | banner |
|---|---|---|
| `---<ZWSP>` | 1 | `1 CHECK(S) FAILED` |
| `<ZWSP>---` | 1 | `1 CHECK(S) FAILED` |
| `<ZWSP>---<ZWSP>` | **0** | **`ALL CHECKS PASSED`** |

One code point flips a red gate to a green one over a document carrying a live spawn grant.

**Why the code's own claims do not hold as written:**

- `:757-759` — "Every delimiter decision in this module goes through this function … There is no
  second grammar left in this region for a fifth spelling to slip between." There is: the composite.
- `:781-787` — "ARM 1 CONSULTS NO CHARACTER CLASS … 'begins with the payload and is not legal', full
  stop." True of arm 1 in isolation, but arm 1 is gated on `startsWith(payload)` at position 0, and
  arm 2 — the only arm that can see past leading residue — both consults a class **and** re-imposes
  the legal spelling on what follows it. The union is therefore still a denylist over the composite
  axis, which is precisely the trap the header at `:684-696` warns the reader about.

D-43's stated partition (`:698-705`) does place this in "everything else → keyless SUCCESS", so the
behaviour may be intended by the letter of the decision. That does not rescue it. The decision text
and the header's own round-4 reproduction list both treat a leading space and a trailing ZWSP as
independently disqualifying, and no reading of "arm 1 refuses whatever follows the payload" survives
a one-code-point prefix flipping the verdict.

`UNKNOWN - verify` (recorded, not offered as mitigation): whether Claude Code's frontmatter reader
loads a block whose head line is `<ZWSP>---<ZWSP>`. Most readers require `---` at column 0, so such a
file is probably INERT. That is the SAME `UNKNOWN` D-34 recorded at `:134-140` and then refused
anyway, on the module's own contract that a document it cannot decode belongs in the unreadable arm.
The refusal here must be taken on the same grounds, not on a proven live load.

**Fix.** Make arm 2 stop consulting the legality of what follows the residue, so the two arms compose.
Strip the leading invisible run FIRST, then apply arm 1's test to the remainder:

```ts
function delimiterRefusal(
  line: string,
  payloads: readonly string[],
  position: "opening" | "closing",
): Parsed<FrontmatterKeys> | null {
  // ARM 1, at the line start: consults no class at all. Unchanged.
  for (const payload of payloads) {
    if (line.startsWith(payload) && !isLegalDelimiter(line, payload)) {
      /* ...unchanged refusal... */
    }
  }
  // ARM 2: leading invisible residue in front of ANYTHING that begins with a payload — legal or
  // not. The invisible class decides only WHERE the delimiter begins; it never decides what may
  // follow it. That inversion is what let the composite through.
  const run = leadingInvisibleRun(line);
  if (run === 0) return null;
  const rest = line.slice(run);
  for (const payload of payloads) {
    if (rest.startsWith(payload)) {
      // Refuse, naming line.codePointAt(0) as the leading residue and, when
      // !isLegalDelimiter(rest, payload), the first offending code point after the payload too.
      return { ok: false, reason: /* ... */ };
    }
  }
  return null;
}
```

Then extend the sweep per WR-02 with the composite constructions, which fail today and are the pin
this fix needs.

---

### CR-02: `PLUGIN_DEFAULT_COMPONENT_SUBPATHS` is a hand-listed 2-of-9 set — a platform-loaded plugin-root component directory carrying a spawn grant passes the gate at exit 0

**File:** `scripts/kit-model.ts:187` (the set), `scripts/kit-model.ts:437-451` (the probe),
`scripts/check-foundation-guards.ts:868-885` (the floor)

**Issue.**

```ts
const PLUGIN_DEFAULT_COMPONENT_SUBPATHS = ["agents", "commands"] as const;
```

`.claude-plugin/plugin.json` (read and verified) declares **no** component-path override of any kind,
and the marketplace entry sources the repository root — so Claude Code's DEFAULT discovery applies to
every component directory. CLAUDE.md's own plugin-schema section enumerates nine:

> `agents`, `commands`, `skills`, `hooks`, `mcpServers`, `lspServers`, `outputStyles`,
> `experimental.themes`, `experimental.monitors`

The floor covers `agents` and `commands`. `skills` is covered by `listPluginSkillAdapters`. **Six are
covered by nothing** — including `outputStyles` (a markdown-with-frontmatter surface) and `hooks`,
which **exists on the live tree right now** (`hooks/hooks.json`, `hooks/guard.js`,
`hooks/admission-guard.js`).

**Reproduction.** Hermetic `git archive` mirrors; identical plant
`---\nname: rogue\ndescription: rogue\nallowed-tools: Read, Agent(grugops-orchestrator)\n---` written
to `<dir>/rogue.md`; then `node scripts/check-foundation-guards.js`:

```
PLANT=commands      exit=1   1 CHECK(S) FAILED       'rogue' mentions in gate output: 1
PLANT=outputStyles  exit=0   ALL CHECKS PASSED       'rogue' mentions in gate output: 0
PLANT=hooks         exit=0   ALL CHECKS PASSED       'rogue' mentions in gate output: 0
```

This is CR-03's own shape, one directory over, inside the fix that closes CR-03. The floor's comment
(`check-foundation-guards.ts:869-880`) states:

> "This closes the CLASS the plugin-skill hole belongs to rather than only the instance CR-03
> named. … What it forbids is a loadable surface nobody scans."

It does not. It forbids two named surfaces and is blind to the rest — and `hooks/`, the one that
actually exists, is the highest-consequence of them: a `PreToolUse` hook executes commands, and
CLAUDE.md makes the mechanical prod-deploy guard a hard safety constraint rather than a nicety.

This is this repository's own diagnosed failure mode verbatim: a hand-maintained scan set that ships
incomplete while every test stays green. `scripts/kit-model.test.ts:141` asserts "the LIVE tree has
both plugin-default component directories absent" — an assertion taken over the same two-element
literal, so it can only ever confirm the literal and never the class it claims to stand for. There is
no derivation and no cardinality pin on this set, which is exactly the treatment
`SKILL_ADAPTER_COUNT`, `PLUGIN_SKILL_ADAPTER_COUNT` and `SPAWN_GRANT_SCAN_COUNT` all receive fifteen
lines away.

`UNKNOWN - verify`: whether an `outputStyles/*.md` frontmatter `allowed-tools` value is honoured as a
tool grant by Claude Code. Record as pending. The finding does not rest on it: the probe's stated
contract (`kit-model.ts:434-436`) is "would the platform load something we do not scan", and the probe
deliberately returns every file regardless of extension for exactly that reason.

**Fix.** Derive the probe set instead of listing it, and assert its cardinality — the repository's own
rule, applied to the one set in this diff that did not get it:

```ts
// scripts/kit-model.ts
// EVERY component directory Claude Code's DEFAULT discovery loads at plugin root, per the plugin
// manifest schema (CLAUDE.md § "1. plugin.json"). `skills` is omitted ONLY because
// listPluginSkillAdapters() already covers it; the COUNT is asserted two-sided so a schema entry
// added later cannot be forgotten the way this set forgot six.
export const PLUGIN_DEFAULT_COMPONENT_SUBPATHS = [
  "agents", "commands", "hooks", "mcpServers", "lspServers",
  "outputStyles", "themes", "monitors",
] as const;
export const PLUGIN_DEFAULT_COMPONENT_COUNT = 8;
```

…with `guardKitCounts` pinning
`PLUGIN_DEFAULT_COMPONENT_SUBPATHS.length === PLUGIN_DEFAULT_COMPONENT_COUNT` two-sided, and `hooks/`
either entering `SPAWN_GRANT_SCAN` or being recorded as an explicit, by-name, reason-carrying
exemption in the same shape as `DISTRIBUTION_PAIR_EXEMPT`. Bumping the count then becomes the
deliberate act that forces the walk, which is the whole point of every other count in this module.

---

## Warnings

### WR-01: `guardKitCounts`' per-part membership loop silently swallows a lister throw, on a justification that is false for the case it can reach

**File:** `scripts/check-foundation-guards.ts:1305-1311`

```ts
try {
  expected = part.list(ROOT).map((rel) => `${part.prefix}${rel}`).sort();
} catch (e) {
  // The lister threw. The composition is already empty for the same reason and the cardinality
  // floor above has named it; reporting the thrown message here too would double-report one fact.
  void e;
  continue;
}
```

**Issue.** The stated justification holds only when the two reads fail *together*. They are two
independent filesystem reads separated in time: `SPAWN_SCAN_DERIVATION`
(`check-foundation-guards.ts:492`) runs at **module load**, while `part.list(ROOT)` runs later inside
`guardKitCounts()`. In the window where the composition derived cleanly (33 members, cardinality floor
green) and a part directory subsequently becomes unreadable, that part's SET-equality check is
**skipped with no output at all** — and the guard still prints `each part set-equal to its own lister`
in its PASS line (`:1327`). A PASS line then states a check that was not performed, which is the exact
thing `guard_wr05`'s own header forbids and which plan 27-20's CR-03 already corrected once.

This is a `catch { … continue }` with zero reporting in a file whose entire discipline is "a check
that could not be performed is NAMED, never silent". Every sibling failure path reports: `derive()`
(`:364`), `refuseEmpty`, `readDirOrThrow`, and the plugin-default probe's own `catch` twenty lines
above at `:882`.

**Reproduction status.** The code path is trivially reachable (a throwing lister beside an
already-derived composition), but I did **not** trigger the TOCTOU window inside a live gate run —
within a single process `spawnGrantScan` calls all four listers, so a throw there empties the whole
composition and the count floor does name it. The defect is the silent arm and the false comment, not
a demonstrated live miss.

**Fix.** Report instead of swallowing, matching the probe's `catch` twenty lines above:

```ts
} catch (e) {
  countFail += `\nkit count: the ${part.name} lister threw while re-deriving for the per-part membership check — ${(e as Error).message}. The composition may have derived cleanly before this read, so this part's SET equality was NOT performed and must not be reported as if it were`;
  continue;
}
```

---

### WR-02: the delimiter sweep is non-circular over the character alphabet but CIRCULAR over the arm structure — it cannot fail on CR-01

**File:** `scripts/frontmatter.test.ts:1953-1959` (the constructions), `:1826-1849` (the rationale),
`:1638-1725` (`DELIMITER_ROWS`)

**Issue.** The sweep's rationale correctly argues that a corpus generated from the rule under test can
only detect a narrowing, and correctly builds its CHARACTER corpus from the negative space of D-42's
alphabet. But the four constructions it builds per member are:

```ts
["trailing @ opening", `---${ch}\n${KEYS}---\n`],
["leading @ opening",  `${ch}---\n${KEYS}---\n`],
["trailing @ closing", `---\n${KEYS}---${ch}\nBody.\n`],
["leading @ closing",  `---\n${KEYS}${ch}---\nBody.\n`],
```

Every one places its member in exactly ONE of the two declared arms. The sweep therefore verifies
"each arm fires on its own inputs" and is structurally incapable of failing on an input outside both —
precisely the tautology it was written to avoid, moved from the alphabet axis to the arm axis. 1048
members × 4 constructions = 4192 green assertions that say nothing about CR-01.

`DELIMITER_ROWS` has the same gap by construction: each row is tagged `arm: 1 | 2` (`:1642`) and the
row set contains no composite.

**Fix.** Add constructions from the negative space of the ARM DECOMPOSITION, not only of the alphabet:

```ts
["leading + trailing @ opening",     `${ch}---${ch}\n${KEYS}---\n`],
["leading + near-payload @ opening", `${ch}----\n${KEYS}---\n`],
["leading + trailing @ closing",     `---\n${KEYS}${ch}---${ch}\nBody.\n`],
```

All three fail today against the committed build for every member, and they are the pin CR-01's fix
requires.

---

### WR-03: the sweep pins Unicode general-category cardinalities as literals, so an ICU upgrade turns a correctness gate red for an unrelated reason

**File:** `scripts/frontmatter.test.ts:1901-1903` (and the derived totals at `:1912-1913`)

```ts
expect(covered.get("Cf (format)")!.length).toBe(170);
expect(covered.get("Cc (control)")!.length).toBe(62);
expect(covered.get("Zs (space separators)")!.length).toBe(16);
...
expect(offending.length).toBe(1048);
expect(offending.length + declaredClass.length).toBe(1050);
```

**Issue.** `\p{Cf}` resolves against the V8/ICU Unicode version of whatever Node runs the suite, and
`Cf` has grown in most recent Unicode revisions. CLAUDE.md pins `Node 22+` — an open upper bound. On
the next ICU bump this case goes red naming a count rather than a defect, inside the one file where a
red is supposed to mean "a bypass shipped". That is the false-red failure mode the module's own header
warns about at `:101-105`, and it is exactly the pressure that teaches the next author to loosen an
assertion. `Cc` (62) and `Zs` (16) are stable by definition and are fine.

**Fix.** Assert a floor plus a derived identity rather than an exact literal, and derive the totals:

```ts
// Cf grows with Unicode revisions; the property under test is "the sweep covers every format code
// point THIS runtime knows about", not "this runtime knows 170 of them".
const cf = covered.get("Cf (format)")!;
expect(cf.length).toBeGreaterThanOrEqual(170);
expect(cf.every((cp) => /\p{Cf}/u.test(String.fromCodePoint(cp)))).toBe(true);
expect(offending.length).toBe(
  NEGATIVE_SPACE_CLASSES.length * NEGATIVE_SPACE_CAP +
    D42_ALPHABET_CLASSES.reduce((n, c) => n + covered.get(c.name)!.length, 0),
);
```

---

### WR-04: the mid-script exit-site residual is count-pinned for `install.ts` only — `uninstall.ts`'s two sites are unpinned

**File:** `install/install.test.ts:2513-2530`; the unpinned sites at `install/uninstall.ts:86` and `:540`

**Issue.** `install/uninstall.ts:757-758` states: "The two OTHER sites in this file are mid-script and
are deliberately NOT swept — they rely on stop-here semantics, and converting them blindly would let
the script RUN ON past a refusal, a worse defect than the one being fixed." **Nothing asserts that.**
`install.test.ts:2513` reads `install.ts` and only `install.ts`. So a future author who sweeps
`uninstall.ts:86` (the bad-arg refusal) or `:540` to `exitCode` gets the *worse* defect that comment
names, with a green suite — while the identical mistake in `install.ts` fails loudly. Round 5's own
argument for widening the WR-01 substring scan to four paths ("its pipe is the same pipe, and it was
left out of the scan for no reason anyone wrote down") applies verbatim to this count and was not
carried across.

**Secondary.** The filter `!/^\s*\/\//.test(l)` (`:2517`) is a one-line-comment detector — a parser
that can under-match, in a case whose own header argues that "a scan smart enough to tell code from a
comment is a parser and a parser that can under-match is the failure this phase has shipped
repeatedly". A `process.exit(` inside a `/* */` block, or on a line whose comment does not start at
the first non-space character, inflates the "call sites" count.

**Fix.** Pin `uninstall.ts` with its own count in the same case:

```ts
for (const [label, path, expected] of [
  ["install.ts", join(import.meta.dirname, "install.ts"), 6],
  ["uninstall.ts", join(import.meta.dirname, "uninstall.ts"), 2],
] as const) {
  const src = readFileSync(path, "utf8");
  const sites = src
    .split("\n")
    .filter((l) => !/^\s*\/\//.test(l))
    .filter((l) => l.includes("process.exit(")).length;
  expect(`${label} mid-script exit sites: ${sites}`).toBe(
    `${label} mid-script exit sites: ${expected}`,
  );
}
```

---

## Info

### IN-01: the WR-05 pass-line disposition string asserts "all in the spawn-grant scan" before the check that can falsify it

**File:** `scripts/check-foundation-guards.ts:876-885`

```ts
const unscanned = probe.files.filter((f) => !SPAWN_GRANT_SCAN.includes(f));
pluginDefaults.push(
  `${probe.subpath}/ PRESENT with ${probe.files.length} file(s), all in the spawn-grant scan`,
);
if (unscanned.length > 0) { wr05Fail += ...; }
```

The claim is built unconditionally and only afterwards is `unscanned.length > 0` tested. It is
currently unreachable in output — a non-empty `wr05Fail` routes to `fail()` and `pluginDefaults` is
interpolated only into the `pass()` line at `:912` — so this is latent, not observed. It is still a
claim constructed before its evidence, in a file whose standing rule is "a PASS line must never state
a check that was not performed". Move the push into an `else` on `unscanned.length === 0`, or
interpolate the measured split: `${probe.files.length - unscanned.length}/${probe.files.length} in the
spawn-grant scan`.

### IN-02: `guardDistributionPair` mangles the twin path for a top-level `skills/SKILL.md`

**File:** `scripts/check-foundation-guards.ts:1413`

`const dir = rel.slice(0, rel.lastIndexOf("/"))`. `listPluginSkillAdapters` admits `skills/SKILL.md`
— its shape rule is the FILE NAME at any depth (`kit-model.ts:414`) — which yields `rel === "SKILL.md"`,
`lastIndexOf("/") === -1`, and therefore `dir === "SKILL.m"`. The finding then names
`.claude/skills/grugops-SKILL.m/SKILL.md` as a missing twin, and the name assertion at `:1423` would
demand `name: SKILL.m`. Fail-closed in direction, nonsense in message. Guard it explicitly:

```ts
if (!rel.includes("/")) {
  pairFail += `\n${pluginRel}: a plugin skill must live in its own directory (\`skills/<name>/SKILL.md\`); a top-level SKILL.md has no directory to derive a twin name from, so the pair is refused rather than guessed at`;
  continue;
}
```

### IN-03: `guardKitCounts` never asserts that the four parts EXHAUST the composition — only the test does

**File:** `scripts/check-foundation-guards.ts:1288-1320` vs `scripts/kit-model.test.ts:307-330`

`kit-model.test.ts` asserts
`members.filter(f => PARTS.some(p => f.startsWith(p.prefix))).length === members.length`. The GUARD
does not: it computes `partBreakdown` (`:1288`) for the message only and never compares its sum to
`SPAWN_GRANT_SCAN.length`. A fifth part added to `spawnGrantScan()` without a
`SPAWN_GRANT_SCAN_PARTS` entry is caught today only because `SPAWN_GRANT_SCAN_COUNT` is two-sided and
the author must bump it — at which point the new part has no per-part membership assertion in the
guard at all, only in the test. One line closes it, and it belongs in the guard because that is what
runs in CI on a consumer's tree:

```ts
const partitioned = SPAWN_GRANT_SCAN_PARTS.reduce(
  (n, p) => n + SPAWN_GRANT_SCAN.filter((f) => f.startsWith(p.prefix)).length, 0);
if (partitioned !== SPAWN_GRANT_SCAN.length) {
  countFail += `\nkit count: the four declared parts cover ${partitioned} of ${SPAWN_GRANT_SCAN.length} composition members — a member under no declared prefix has NO per-part membership assertion at all`;
}
```

### IN-04 (unreproduced as a live bypass): `keysGrantedAgentNames` still returns SPLIT, ALTERED names on the success arm for a flow-collection delimiter inside an enumeration

**File:** `scripts/frontmatter.ts:976-1017` (the refusals at `:984` and `:990`)

The D-41 item-3 refusals cover a nested `(` and a quote. They do not cover the other YAML characters
for which a comma is content rather than a separator. Measured against the committed
`scripts/frontmatter.js`:

```
tools: Agent(alpha[,]b, gamma)   ->  {ok:true, value:["]b","alpha[","gamma"]}
tools: Agent(alpha{,}b, gamma)   ->  {ok:true, value:["alpha{","gamma","}b"]}
```

One name split into two altered ones, on the arm whose doc block promises "a name is never silently
dropped or altered" — byte-for-byte the shape the quote refusal at `:990` was added to close.

**I could not turn this into a live bypass.** `hasSpawnGrant` still returns `true` for both, and the
KIT-03 closure equality fails red on the wrong set rather than passing, so the error direction is a
confusing red and not a silent green. Reported so that the absence of a third arm is a considered
decision rather than an unexamined adjacency — this phase's own diagnosis of how the first two arms
came to be written without the third (`check-foundation-guards.ts:723-731`). If the refusal is meant
to be an allowlist rather than a denylist that grows one reported spelling at a time, refuse on
`/[^A-Za-z0-9_,\-. ]/.test(m[1])` instead of enumerating `(` and `["']`.

---

## What was checked and found SOUND

Recorded so a later round does not re-litigate it:

- **Exit tails (WR-01).** All three converted sites are genuinely the last statement of their module
  (`install/install.ts:1648`, `install/uninstall.ts:760`, `scripts/coordinator-resolution-precheck.ts:611`);
  the precheck's tail sits after its `finally`, so nothing relied on stop-here. The eight mid-script
  sites (`install.ts:112,510,529,545,572,1382`; `uninstall.ts:86,540`) are untouched. No early-return
  path skips the code assignment.
- **Unreadable-walk channel (CR-02, round 4).** Both formerly-bare arms route through it
  (`install/kit-source.ts:383` realpath, `:403` readdir); a readable-but-empty directory contributes
  nothing (loop at `:406` simply never runs); all three failure channels — `cycles`, `unreadable`,
  `overflow` — are reported through the single `verify` channel at `install/install.ts:1492`, `:1509`
  and `:1525`. `uninstall.ts` deliberately does not use the nested walk and says so at `:155`.
- **BOM asymmetry.** Exactly one leading mark is normalized (`frontmatter.ts:868`); a second refuses
  through arm 2; a mark after the payload refuses through arm 1; a mark at either position of the
  CLOSING delimiter refuses. Verified at both positions.
- **Per-part membership.** All FOUR parts are asserted, in the guard and in the test, as SET equality
  against each lister (`check-foundation-guards.ts:1299-1318`). The two skill prefixes are genuinely
  disjoint (`.claude/skills/` vs `skills/`), so the partition is unambiguous. The tautological
  guard↔control set equality is correctly documented as documentation and is nowhere presented as an
  assertion that can fail.
- **Pair-rule normalization.** It REWRITES rather than deletes (`rewriteNameLine`, `:1371`), asserts
  each side's declared name against its own directory FIRST (`:1423`, `:1427`), and carries a
  discriminating third-name case. The single exemption is by name with a recorded reason and a
  recorded bound, and a case asserts the exempted file stays inside `SPAWN_GRANT_SCAN`.
- **chmod-based cases.** `restrictAndProbe` (`install/install.test.ts:358`) verifies the restriction
  took and SKIPS with its reason printed when it did not. No assertion runs over a restriction that
  did not apply.
- **WR-01 regression scan.** A dumb exact-substring scan across four paths; the immediate-exit literal
  is absent from code and prose in all four (the residual note spells only `process.exit()` without an
  argument, which the scan does not match).
- **False-red cost of the new delimiter rule, measured independently.** Over all 1118 tracked `.md`
  files in the repository, `parseFrontmatter` refuses exactly ONE — and that one is a pre-existing
  `\x` escape refusal in a planning artifact, not a delimiter refusal. Zero delimiter false reds at
  either position.
- **Determinism.** `spawnGrantScan`, `unreadable`, `cycles` and the composition partitions are all
  sorted; `delimiterRefusal` tries payloads in declared order and reports the first offending
  position; two runs over one input are byte-identical (verified).

---

_Reviewed: 2026-08-03T06:21:18Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
_Diff base: 3494a85..HEAD (commits 782b5ee, e7fdaa3, 79b8c54, 9934602, a317223, 716572e, 1e17b5d, ecbae42, bb5117b)_

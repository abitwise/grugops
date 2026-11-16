// role-skills-reader.ts — the declared skills of every role in a kit home, as one JSON line (phase 42, plan 42-02;
// SKILL-05, D-24).
//
// WHAT THIS OWNS. Nothing new: it is the bridge that lets install/install.ts `--check` read role `skills:`
// declarations without a second parser. install/ imports nothing from scripts/ (33.1 D-18/D-28), so the doctor SPAWNS
// this committed `.js` (`node scripts/role-skills-reader.js <kitHome>`) and reads its one line of output. Every role is
// read through the one role admission (`admitRole`) and the one projection of its `skills` key (`roleSkillsOf`), both in
// scripts/canonical-frontmatter.ts; this module declares no grammar of its own.
//
// THE REPORT. `skills` maps each declared skill name to the roles that declare it (role file names without `.md`),
// roles in sorted order and skills in first-declaration order. A role the admission or the projection refuses becomes a
// `refusals` entry with the reason and declares nothing; the role-frontmatter guard in scripts/check-foundation-guards.ts
// reports the same refusal as a failure, so it is not counted twice here.
//
// THE CLI. Exactly one argument, the kit home (the directory that CONTAINS `agent-factory/`). On success it prints
// `JSON.stringify(report)` and one newline and exits 0. A wrong argument count exits 2; a roles folder that cannot be
// listed or a role file that cannot be read exits 1. Both failures write to stderr and print nothing on stdout, so the
// doctor can tell a report from a failure by the exit status and the line count alone.
//
// Node stdlib ONLY, plus the in-repo modules named in the imports. Zero npm dependencies.
//
// Clear professional voice throughout (CLAUDE.md hard rule — this feeds a doctor report).

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { admitRole, roleSkillsOf } from "./canonical-frontmatter.js";
import { ROLES_SUBPATH, listRoleDirEntries } from "./kit-model.js";
// The one entry predicate (scripts/is-entry.ts): scripts/check-foundation-guards.test.ts refuses any other spelling.
import { isEntrypoint } from "./is-entry.js";

export interface RoleSkillsReport {
  /** Skill name -> the roles that declare it (file names without `.md`, sorted). */
  skills: Record<string, string[]>;
  /** The roles whose frontmatter or `skills` declaration was refused, each with the refusal reason. */
  refusals: { role: string; reason: string }[];
}

/**
 * Read every role of `kitHome` (the directory that contains `agent-factory/`). Throws when the roles folder cannot be
 * listed or a role file cannot be read: a partial report would say a skill is declared by fewer roles than declare it.
 */
export function readRoleSkills(kitHome: string): RoleSkillsReport {
  const skills: Record<string, string[]> = {};
  const refusals: { role: string; reason: string }[] = [];
  const roles = listRoleDirEntries(kitHome).filter((f) => f.endsWith(".md"));
  for (const file of roles) {
    const role = file.slice(0, -".md".length);
    const text = readFileSync(join(kitHome, ROLES_SUBPATH, file), "utf8");
    const a = admitRole(text);
    if (!a.ok) {
      refusals.push({ role, reason: `[${a.code}] ${a.reason}` });
      continue;
    }
    const s = roleSkillsOf(a.value);
    if (!s.ok) {
      refusals.push({ role, reason: s.reason });
      continue;
    }
    for (const name of s.value) {
      // Own-property lookup: a skill named like an Object.prototype member must not reach the prototype.
      const holders = Object.prototype.hasOwnProperty.call(skills, name) ? skills[name] : undefined;
      if (holders === undefined) skills[name] = [role];
      else holders.push(role);
    }
  }
  return { skills, refusals };
}

function main(argv: readonly string[]): number {
  if (argv.length !== 1) {
    process.stderr.write(`role-skills-reader.js: expected exactly one argument, the kit home; got ${argv.length}\n`);
    return 2;
  }
  let report: RoleSkillsReport;
  try {
    report = readRoleSkills(argv[0] as string);
  } catch (e) {
    process.stderr.write(`role-skills-reader.js: the roles of ${argv[0] as string} could not be read (${(e as Error).message})\n`);
    return 1;
  }
  process.stdout.write(JSON.stringify(report) + "\n");
  return 0;
}

if (isEntrypoint(import.meta.url)) {
  process.exitCode = main(process.argv.slice(2));
}

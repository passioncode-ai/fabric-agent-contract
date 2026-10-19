/**
 * The generator of the folder-attribution vectors (DEC-0089): `fixtures/vectors/folder-attribution.json`, run by Fabric,
 * Fabric Switchboard and Project Observatory in their own gates, so the three attribute a folder alike.
 *
 *   tsx tools/vectors/folder-attribution.ts --check   compare the committed file with what this writes (exit 1 on a difference)
 *   tsx tools/vectors/folder-attribution.ts --write   write it
 *
 * Every vector change is made here and written by `--write`, never by hand; `test/folder-attribution.test.ts` runs the
 * check. Each expected answer is written below by hand from DEC-0089's items and attribution.md's AT table. Nothing here
 * imports `src/folder-attribution.ts`, so the gate checks that the reference returns what this file expects.
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { projectRoot } from "../../src/contract.js";

type Json = Record<string, any>;
export const VECTOR_FILE = "fixtures/vectors/folder-attribution.json";

const HOME = "/u/ana";
const DATA = `${HOME}/work`;
const TEMP = ["/tmp", "/private/tmp", "/private/var/folders", "/var/tmp", `${HOME}/.cache`, `${HOME}/Library/Caches`];

// ---- Origins ------------------------------------------------------------------------------------------------------

function originCases(): Json[] {
  const ok = (origin: string, expected: string) => ({ origin, expected });
  const no = (origin: unknown) => ({ origin, expected: null });
  return [
    ok("git@github.com:Example-Org/Fabric.git", "github.com/example-org/fabric"),
    ok("https://github.com/example-org/fabric", "github.com/example-org/fabric"),
    ok("https://git@github.com/example-org/fabric.git/", "github.com/example-org/fabric"),
    ok("ssh://git@github.com:22/example-org/fabric.git", "github.com/example-org/fabric"),
    ok("git+ssh://git@github.com:2222/team/app.git", "github.com/team/app"),
    ok("https://bitbucket.org/team/app.git", "bitbucket.org/team/app"),
    ok("https://gitlab.example.com/group/sub/app.git?ref=main#readme", "gitlab.example.com/group/sub/app"),
    ok("  git@github.com:example-org/fabric.git  ", "github.com/example-org/fabric"),
    no("/local/path/repo"),
    no("../repo"),
    no("C:\\work\\repo"),
    no("C:/work/repo"),
    no("file:///u/ana/repo"),
    no("ftp://github.com/example-org/fabric"),
    no("https://github.com/only-owner"),
    no("git@localhost:owner/name"),
    no("https://github.com"),
    no(""),
    no(null),
    no(7)
  ];
}

// ---- Attribution --------------------------------------------------------------------------------------------------

const repoGit = (top: string, origin: string | null, main = top, common = `${main}/.git`) => ({ toplevel: top, commonDir: common, mainCheckout: main, origin });
const project = (id: string, folders: Json[], sources: string[] = []) => ({ id, folders, sources });
const folder = (p: string, commonDir: string | null = `${p}/.git`, origin: string | null = null) => ({ path: p, commonDir, origin });
const FABRIC = project("project:fabric", [folder(`${DATA}/fabric`, `${DATA}/fabric/.git`, "git@github.com:example-org/fabric.git")], ["github.com/example-org"]);
const NOTES = project("project:notes", [folder(`${DATA}/notes`, null, null)]);
const snap = (over: Json): Json => ({ folder: `${DATA}/x`, home: HOME, tempRoots: TEMP, git: null, projects: [FABRIC, NOTES], ...over });

function attributionCases(): Json[] {
  const attached = (project: string, rule: string) => ({ outcome: "attached", project, rule });
  const cases: Array<[string, Json, Json]> = [
    // AT-0
    ["AT-0: no folder", snap({ folder: undefined }), { fault: "input-invalid" }],
    ["AT-0: a relative folder", snap({ folder: "work/x" }), { fault: "input-invalid" }],
    ["AT-0: a folder with a trailing slash", snap({ folder: `${DATA}/x/` }), { fault: "input-invalid" }],
    ["AT-0: a folder with ..", snap({ folder: `${DATA}/../x` }), { fault: "input-invalid" }],
    ["AT-0: Git facts whose top level does not hold the folder", snap({ git: repoGit(`${DATA}/other`, null) }), { fault: "input-invalid" }],
    ["AT-0: two Projects with one id", snap({ projects: [FABRIC, FABRIC] }), { fault: "input-invalid" }],
    ["AT-0: an explicit Project that does not exist", snap({ explicit: "project:none" }), { fault: "input-invalid" }],
    ["AT-0: a work record without a common dir", snap({ work: [{ project: "project:fabric" }] }), { fault: "input-invalid" }],
    // AT-1
    ["AT-1: an explicit attach wins over a tombstone", snap({ folder: `${DATA}/scratch`, tombstones: [`${DATA}/scratch`], explicit: "project:notes" }), attached("project:notes", "explicit")],
    // AT-2
    ["AT-2: a folder in the temporary folder", snap({ folder: "/tmp/agent-1/fabric", git: repoGit("/tmp/agent-1/fabric", "git@github.com:example-org/fabric.git") }), { outcome: "refused", reason: "transient" }],
    ["AT-2: a cache clone, even of a known repository", snap({ folder: `${HOME}/.cache/tool/fabric`, git: repoGit(`${HOME}/.cache/tool/fabric`, "https://github.com/example-org/fabric") }), { outcome: "refused", reason: "transient" }],
    // AT-3
    ["AT-3: a tombstoned folder", snap({ folder: `${DATA}/old`, tombstones: [`${DATA}/old`] }), { outcome: "refused", reason: "tombstoned" }],
    ["AT-3: a subfolder of a tombstoned folder", snap({ folder: `${DATA}/old/src`, tombstones: [`${DATA}/old`] }), { outcome: "refused", reason: "tombstoned" }],
    ["AT-3: a worktree whose main checkout is tombstoned", snap({ folder: `${DATA}/old-wt`, git: repoGit(`${DATA}/old-wt`, null, `${DATA}/old`, `${DATA}/old/.git`), tombstones: [`${DATA}/old`] }), { outcome: "refused", reason: "tombstoned" }],
    ["AT-3: a removed worktree stays out though its main checkout is a Project's", snap({ folder: `${DATA}/fabric-old`, git: repoGit(`${DATA}/fabric-old`, "git@github.com:example-org/fabric.git", `${DATA}/fabric`, `${DATA}/fabric/.git`), tombstones: [`${DATA}/fabric-old`] }), { outcome: "refused", reason: "tombstoned" }],
    ["AT-3: a tombstone keeps only its own folder out: another clone of the same remote is new", snap({ folder: `${DATA}/app-2`, git: repoGit(`${DATA}/app-2`, "git@github.com:other/app.git"), tombstones: [`${DATA}/app`] }), { outcome: "new", root: `${DATA}/app-2` }],
    // AT-4
    ["AT-4: the Project's own folder", snap({ folder: `${DATA}/fabric`, git: repoGit(`${DATA}/fabric`, "git@github.com:example-org/fabric.git") }), attached("project:fabric", "folder")],
    ["AT-4: a subfolder of a Project's folder, an agent started there", snap({ folder: `${DATA}/fabric/apps/desktop`, git: repoGit(`${DATA}/fabric`, "git@github.com:example-org/fabric.git") }), attached("project:fabric", "folder")],
    ["AT-4: a plain folder a Project lists", snap({ folder: `${DATA}/notes/2026` }), attached("project:notes", "folder")],
    ["AT-4: a sibling whose name extends the folder's is not under it", snap({ folder: `${DATA}/fabric-site`, git: repoGit(`${DATA}/fabric-site`, null) }), { outcome: "new", root: `${DATA}/fabric-site` }],
    ["AT-4: the nearest of two nested Project folders", snap({ folder: `${DATA}/mono/pkg/a`, projects: [project("project:mono", [folder(`${DATA}/mono`)]), project("project:pkg", [folder(`${DATA}/mono/pkg`)])] }), attached("project:pkg", "folder")],
    ["AT-4: a home folder a Project lists is no ancestor: a new Project", snap({ folder: `${DATA}/y`, projects: [project("project:home", [folder(HOME, null)])] }), { outcome: "new", root: `${DATA}/y` }],
    ["AT-4: two Projects listing one folder: ambiguous", snap({ folder: `${DATA}/shared`, projects: [project("project:a", [folder(`${DATA}/shared`, null)]), project("project:b", [folder(`${DATA}/shared`, null)])] }), { outcome: "ambiguous", rule: "folder", projects: ["project:a", "project:b"] }],
    // AT-5
    ["AT-5: a worktree of a Project's repository", snap({ folder: `${DATA}/fabric-night`, git: repoGit(`${DATA}/fabric-night`, "git@github.com:example-org/fabric.git", `${DATA}/fabric`, `${DATA}/fabric/.git`) }), attached("project:fabric", "worktree")],
    ["AT-5: a worktree a tool keeps in its own folder still joins", snap({ folder: `${HOME}/.codex/worktrees/a1/fabric`, git: repoGit(`${HOME}/.codex/worktrees/a1/fabric`, null, `${DATA}/fabric`, `${DATA}/fabric/.git`) }), attached("project:fabric", "worktree")],
    ["AT-5: a remoteless worktree joins by its common dir", snap({ folder: `${DATA}/notes-wt`, git: repoGit(`${DATA}/notes-wt`, null, `${DATA}/local`, `${DATA}/local/.git`), projects: [project("project:local", [folder(`${DATA}/local`)])] }), attached("project:local", "worktree")],
    ["AT-5: two Projects with one common dir: ambiguous", snap({ folder: `${DATA}/wt`, git: repoGit(`${DATA}/wt`, null, `${DATA}/r`, `${DATA}/r/.git`), projects: [project("project:a", [folder(`${DATA}/r`)]), project("project:b", [folder(`${DATA}/r2`, `${DATA}/r/.git`)])] }), { outcome: "ambiguous", rule: "worktree", projects: ["project:a", "project:b"] }],
    // AT-6
    ["AT-6: another clone on another branch, by its origin", snap({ folder: `${DATA}/fabric-2`, git: repoGit(`${DATA}/fabric-2`, "https://github.com/Example-Org/Fabric") }), attached("project:fabric", "repository")],
    ["AT-6: a clone in a tool folder joins by its origin", snap({ folder: `${HOME}/.claude/plugins/fabric`, git: repoGit(`${HOME}/.claude/plugins/fabric`, "git@github.com:example-org/fabric.git") }), attached("project:fabric", "repository")],
    ["AT-6: two Projects with one origin: ambiguous", snap({ folder: `${DATA}/c`, git: repoGit(`${DATA}/c`, "git@github.com:o/r.git"), projects: [project("project:a", [folder(`${DATA}/a`, `${DATA}/a/.git`, "https://github.com/o/r")]), project("project:b", [folder(`${DATA}/b`, `${DATA}/b/.git`, "git@github.com:o/r")])] }), { outcome: "ambiguous", rule: "repository", projects: ["project:a", "project:b"] }],
    // AT-7
    ["AT-7: an unknown repository in a tool folder", snap({ folder: `${HOME}/.claude/plugins/marketplace`, git: repoGit(`${HOME}/.claude/plugins/marketplace`, "git@github.com:example-org/site.git") }), { outcome: "refused", reason: "tool" }],
    ["AT-7: a worktree of an unknown repository whose main checkout is in a tool folder", snap({ folder: `${DATA}/wt`, git: repoGit(`${DATA}/wt`, null, `${HOME}/.codex/repos/x`, `${HOME}/.codex/repos/x/.git`) }), { outcome: "refused", reason: "tool" }],
    ["AT-7: a plain folder in Library", snap({ folder: `${HOME}/Library/Application Support/tool` }), { outcome: "refused", reason: "tool" }],
    // AT-8
    ["AT-8: a new repository of an owner a Project lists", snap({ folder: `${DATA}/site`, git: repoGit(`${DATA}/site`, "git@github.com:Example-Org/site.git") }), attached("project:fabric", "owner")],
    ["AT-8: an owner two Projects list: ambiguous", snap({ folder: `${DATA}/site`, git: repoGit(`${DATA}/site`, "git@github.com:o/site.git"), projects: [project("project:a", [], ["github.com/o"]), project("project:b", [], ["github.com/o/"])] }), { outcome: "ambiguous", rule: "owner", projects: ["project:a", "project:b"] }],
    ["AT-8: an owner of a group path", snap({ folder: `${DATA}/app`, git: repoGit(`${DATA}/app`, "https://gitlab.example.com/group/sub/app.git"), projects: [project("project:g", [], ["gitlab.example.com/group/sub"])] }), attached("project:g", "owner")],
    // AT-9
    ["AT-9: a repository a Project's agent changed from inside the Project", snap({ folder: `${DATA}/lib`, git: repoGit(`${DATA}/lib`, "git@github.com:someone/lib.git"), work: [{ project: "project:notes", commonDir: `${DATA}/lib/.git` }] }), attached("project:notes", "work")],
    ["AT-9: work by two Projects: ambiguous", snap({ folder: `${DATA}/lib`, git: repoGit(`${DATA}/lib`, null), work: [{ project: "project:notes", commonDir: `${DATA}/lib/.git` }, { project: "project:fabric", commonDir: `${DATA}/lib/.git` }] }), { outcome: "ambiguous", rule: "work", projects: ["project:fabric", "project:notes"] }],
    ["AT-9: work on another repository decides nothing", snap({ folder: `${DATA}/lib`, git: repoGit(`${DATA}/lib`, null), work: [{ project: "project:notes", commonDir: `${DATA}/other/.git` }] }), { outcome: "new", root: `${DATA}/lib` }],
    // AT-10
    ["AT-10: the filesystem root", snap({ folder: "/" }), { outcome: "refused", reason: "container" }],
    ["AT-10: a Windows drive root", snap({ folder: "C:/", home: "C:/Profiles/ana", tempRoots: [] }), { outcome: "refused", reason: "container" }],
    ["AT-10: home", snap({ folder: HOME }), { outcome: "refused", reason: "container" }],
    ["AT-11: a folder directly in the filesystem root is no container unless it is home", snap({ folder: "/srv" }), { outcome: "new", root: "/srv" }],
    ["AT-11: a folder directly in a Windows drive root", snap({ folder: "C:/work", home: "C:/Profiles/ana", tempRoots: ["C:/Profiles/ana/AppData/Local/Temp"] }), { outcome: "new", root: "C:/work" }],
    ["AT-7: a hidden folder in a Windows home", snap({ folder: "C:/Profiles/ana/.config/tool", home: "C:/Profiles/ana", tempRoots: [] }), { outcome: "refused", reason: "tool" }],
    ["AT-10: a folder right under a Windows home", snap({ folder: "C:/Profiles/ana/projects", home: "C:/Profiles/ana", tempRoots: [] }), { outcome: "refused", reason: "container" }],
    ["AT-10: a folder right under home", snap({ folder: DATA }), { outcome: "refused", reason: "container" }],
    ["AT-10: a repository right under home", snap({ folder: `${HOME}/scratch`, git: repoGit(`${HOME}/scratch`, null) }), { outcome: "refused", reason: "container" }],
    ["AT-10: a folder holding another Project's folder", snap({ folder: `${DATA}/group`, projects: [project("project:inner", [folder(`${DATA}/group/inner`)])] }), { outcome: "refused", reason: "container" }],
    // AT-11
    ["AT-11: a new repository: a Project at its top level", snap({ folder: `${DATA}/app/src`, git: repoGit(`${DATA}/app`, "git@github.com:someone/app.git") }), { outcome: "new", root: `${DATA}/app` }],
    ["AT-11: a worktree of an unknown repository: a Project at its main checkout", snap({ folder: `${DATA}/app-wt`, git: repoGit(`${DATA}/app-wt`, null, `${DATA}/app`, `${DATA}/app/.git`) }), { outcome: "new", root: `${DATA}/app` }],
    ["AT-11: a plain folder: a Project at itself", snap({ folder: `${DATA}/drafts` }), { outcome: "new", root: `${DATA}/drafts` }],
    ["AT-11: a branch decides nothing: the same answer on any branch", snap({ folder: `${DATA}/app`, git: { ...repoGit(`${DATA}/app`, null), branch: "feature/x" } }), { outcome: "new", root: `${DATA}/app` }]
  ];
  return cases.map(([name, snapshot, expected]) => ({ name, snapshot, expected }));
}

/** The vectors as an object. */
export function folderAttributionVectors(): Json {
  return {
    about:
      "Vectors for folder attribution (DEC-0089), written by tools/vectors/folder-attribution.ts, never by hand. origin: normalizeOrigin(origin), a repository identity host/path or null. attribution: attributeFolder(snapshot); snapshot is {folder, home, tempRoots, git, projects, work?, tombstones?, explicit?}, git null for a folder without Git or {toplevel, commonDir, mainCheckout, origin}; a project is {id, folders: [{path, commonDir, origin}], sources}; paths are absolute and /-separated. Members a rule does not read (a branch) change nothing.",
    origin: originCases(),
    attribution: attributionCases()
  };
}

/** What `--write` writes: the vector file's exact text. */
export function buildFolderAttributionVectors(): string {
  return `${JSON.stringify(folderAttributionVectors(), null, 2)}\n`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const target = path.join(projectRoot(), VECTOR_FILE);
  const built = buildFolderAttributionVectors();
  if (process.argv.includes("--write")) {
    writeFileSync(target, built);
    console.log(`wrote ${VECTOR_FILE}`);
  } else if (readFileSync(target, "utf8") !== built) {
    console.error(`stale vector file (run with --write): ${VECTOR_FILE}`);
    process.exitCode = 1;
  } else {
    console.log("vector file matches the generator");
  }
}

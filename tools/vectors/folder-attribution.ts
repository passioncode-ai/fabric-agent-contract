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
    ok("git@github.com:example-org/fabric.git?x=1#y", "github.com/example-org/fabric"),
    ok("git@github.com-work:example-org/fabric.git", "github.com-work/example-org/fabric"),
    ok("git@github.com:/example-org/fabric.git", "github.com/example-org/fabric"),
    no("https://git_host.example.com/example-org/fabric"),
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
const folder = (p: string, commonDir: string | null = `${p}/.git`, origin: string | null = null, toplevel?: string) => ({ path: p, commonDir, origin, ...(toplevel === undefined ? {} : { toplevel }) });
const FABRIC = project("project:fabric", [folder(`${DATA}/fabric`, `${DATA}/fabric/.git`, "git@github.com:example-org/fabric.git")], ["github.com/example-org"]);
const NOTES = project("project:notes", [folder(`${DATA}/notes`, null, null)]);
const MONO = project("project:mono", [folder(`${DATA}/mono`, `${DATA}/mono/.git`, "git@github.com:example-org/mono.git", `${DATA}/mono`)]);
const PKG = project("project:pkg", [folder(`${DATA}/mono/pkg`, `${DATA}/mono/.git`, "git@github.com:example-org/mono.git", `${DATA}/mono`)]);
const snap = (over: Json): Json => ({ folder: `${DATA}/x`, home: HOME, tempRoots: TEMP, git: null, projects: [FABRIC, NOTES], ...over });

function attributionCases(): Json[] {
  const attached = (project: string, rule: string) => ({ outcome: "attached", project, rule });
  const cases: Array<[string, Json, Json]> = [
    ["AT-0: no folder", snap({ folder: undefined }), { fault: "input-invalid" }],
    ["AT-0: a relative folder", snap({ folder: "work/x" }), { fault: "input-invalid" }],
    ["AT-0: a folder with a trailing slash", snap({ folder: `${DATA}/x/` }), { fault: "input-invalid" }],
    ["AT-0: a folder with ..", snap({ folder: `${DATA}/../x` }), { fault: "input-invalid" }],
    ["AT-0: Git facts whose top level does not hold the folder", snap({ git: repoGit(`${DATA}/other`, null) }), { fault: "input-invalid" }],
    ["AT-0: two Projects with one id", snap({ projects: [FABRIC, FABRIC] }), { fault: "input-invalid" }],
    ["AT-0: an explicit Project that does not exist", snap({ explicit: "project:none" }), { fault: "input-invalid" }],
    ["AT-0: a work record without a common dir", snap({ work: [{ project: "project:fabric" }] }), { fault: "input-invalid" }],
    ["AT-1: an explicit attach wins over a tombstone", snap({ folder: `${DATA}/scratch`, tombstones: [`${DATA}/scratch`], explicit: "project:notes" }), attached("project:notes", "explicit")],
    ["AT-4: a folder in the temporary folder", snap({ folder: "/tmp/agent-1/fabric", git: repoGit("/tmp/agent-1/fabric", "git@github.com:example-org/fabric.git") }), { outcome: "refused", reason: "transient" }],
    ["AT-4: a cache clone, even of a known repository", snap({ folder: `${HOME}/.cache/tool/fabric`, git: repoGit(`${HOME}/.cache/tool/fabric`, "https://github.com/example-org/fabric") }), { outcome: "refused", reason: "transient" }],
    ["AT-2: a tombstoned folder", snap({ folder: `${DATA}/old`, tombstones: [`${DATA}/old`] }), { outcome: "refused", reason: "tombstoned" }],
    ["AT-2: a subfolder of a tombstoned folder", snap({ folder: `${DATA}/old/src`, tombstones: [`${DATA}/old`] }), { outcome: "refused", reason: "tombstoned" }],
    ["AT-13: a worktree whose main checkout is tombstoned", snap({ folder: `${DATA}/old-wt`, git: repoGit(`${DATA}/old-wt`, null, `${DATA}/old`, `${DATA}/old/.git`), tombstones: [`${DATA}/old`] }), { outcome: "refused", reason: "tombstoned" }],
    ["AT-2: a removed worktree stays out though its main checkout is a Project's", snap({ folder: `${DATA}/fabric-old`, git: repoGit(`${DATA}/fabric-old`, "git@github.com:example-org/fabric.git", `${DATA}/fabric`, `${DATA}/fabric/.git`), tombstones: [`${DATA}/fabric-old`] }), { outcome: "refused", reason: "tombstoned" }],
    ["AT-15: a tombstone keeps only its own folder out: another clone of the same remote is new", snap({ folder: `${DATA}/app-2`, git: repoGit(`${DATA}/app-2`, "git@github.com:other/app.git"), tombstones: [`${DATA}/app`] }), { outcome: "new", root: `${DATA}/app-2` }],
    ["AT-3: the Project's own folder", snap({ folder: `${DATA}/fabric`, git: repoGit(`${DATA}/fabric`, "git@github.com:example-org/fabric.git") }), attached("project:fabric", "folder")],
    ["AT-3: a subfolder of a Project's folder, an agent started there", snap({ folder: `${DATA}/fabric/apps/desktop`, git: repoGit(`${DATA}/fabric`, "git@github.com:example-org/fabric.git") }), attached("project:fabric", "folder")],
    ["AT-3: a plain folder a Project lists", snap({ folder: `${DATA}/notes/2026` }), attached("project:notes", "folder")],
    ["AT-3: a sibling whose name extends the folder's is not under it", snap({ folder: `${DATA}/fabric-site`, git: repoGit(`${DATA}/fabric-site`, null) }), { outcome: "new", root: `${DATA}/fabric-site` }],
    ["AT-3: the nearest of two nested Project folders", snap({ folder: `${DATA}/mono/pkg/a`, projects: [project("project:mono", [folder(`${DATA}/mono`)]), project("project:pkg", [folder(`${DATA}/mono/pkg`)])] }), attached("project:pkg", "folder")],
    ["AT-3: a home folder a Project lists is no ancestor: a new Project", snap({ folder: `${DATA}/y`, projects: [project("project:home", [folder(HOME, null)])] }), { outcome: "new", root: `${DATA}/y` }],
    ["AT-3: two Projects listing one folder: ambiguous", snap({ folder: `${DATA}/shared`, projects: [project("project:a", [folder(`${DATA}/shared`, null)]), project("project:b", [folder(`${DATA}/shared`, null)])] }), { outcome: "ambiguous", rule: "folder", projects: ["project:a", "project:b"] }],
    ["AT-6: a worktree of a Project's repository", snap({ folder: `${DATA}/fabric-night`, git: repoGit(`${DATA}/fabric-night`, "git@github.com:example-org/fabric.git", `${DATA}/fabric`, `${DATA}/fabric/.git`) }), attached("project:fabric", "worktree")],
    ["AT-6: a worktree a tool keeps in its own folder still joins", snap({ folder: `${HOME}/.codex/worktrees/a1/fabric`, git: repoGit(`${HOME}/.codex/worktrees/a1/fabric`, null, `${DATA}/fabric`, `${DATA}/fabric/.git`) }), attached("project:fabric", "worktree")],
    ["AT-6: a remoteless worktree joins by its common dir", snap({ folder: `${DATA}/notes-wt`, git: repoGit(`${DATA}/notes-wt`, null, `${DATA}/local`, `${DATA}/local/.git`), projects: [project("project:local", [folder(`${DATA}/local`)])] }), attached("project:local", "worktree")],
    ["AT-6: two Projects with one common dir: ambiguous", snap({ folder: `${DATA}/wt`, git: repoGit(`${DATA}/wt`, null, `${DATA}/r`, `${DATA}/r/.git`), projects: [project("project:a", [folder(`${DATA}/r`)]), project("project:b", [folder(`${DATA}/r2`, `${DATA}/r/.git`)])] }), { outcome: "ambiguous", rule: "worktree", projects: ["project:a", "project:b"] }],
    ["AT-7: another clone on another branch, by its origin", snap({ folder: `${DATA}/fabric-2`, git: repoGit(`${DATA}/fabric-2`, "https://github.com/Example-Org/Fabric") }), attached("project:fabric", "repository")],
    ["AT-7: a clone in a tool folder joins by its origin", snap({ folder: `${HOME}/.claude/plugins/fabric`, git: repoGit(`${HOME}/.claude/plugins/fabric`, "git@github.com:example-org/fabric.git") }), attached("project:fabric", "repository")],
    ["AT-7: two Projects with one origin: ambiguous", snap({ folder: `${DATA}/c`, git: repoGit(`${DATA}/c`, "git@github.com:o/r.git"), projects: [project("project:a", [folder(`${DATA}/a`, `${DATA}/a/.git`, "https://github.com/o/r")]), project("project:b", [folder(`${DATA}/b`, `${DATA}/b/.git`, "git@github.com:o/r")])] }), { outcome: "ambiguous", rule: "repository", projects: ["project:a", "project:b"] }],
    ["AT-11: an unknown repository in a tool folder", snap({ folder: `${HOME}/.claude/plugins/marketplace`, git: repoGit(`${HOME}/.claude/plugins/marketplace`, "git@github.com:someone/marketplace.git") }), { outcome: "refused", reason: "tool" }],
    ["AT-11: a worktree of an unknown repository whose main checkout is in a tool folder", snap({ folder: `${DATA}/wt`, git: repoGit(`${DATA}/wt`, null, `${HOME}/.codex/repos/x`, `${HOME}/.codex/repos/x/.git`) }), { outcome: "refused", reason: "tool" }],
    ["AT-11: a plain folder in Library", snap({ folder: `${HOME}/Library/Application Support/tool` }), { outcome: "refused", reason: "tool" }],
    ["AT-10: a new repository of an owner a Project lists", snap({ folder: `${DATA}/site`, git: repoGit(`${DATA}/site`, "git@github.com:Example-Org/site.git") }), attached("project:fabric", "owner")],
    ["AT-10: an owner two Projects list: ambiguous", snap({ folder: `${DATA}/site`, git: repoGit(`${DATA}/site`, "git@github.com:o/site.git"), projects: [project("project:a", [], ["github.com/o"]), project("project:b", [], ["github.com/o/"])] }), { outcome: "ambiguous", rule: "owner", projects: ["project:a", "project:b"] }],
    ["AT-10: an owner of a group path", snap({ folder: `${DATA}/app`, git: repoGit(`${DATA}/app`, "https://gitlab.example.com/group/sub/app.git"), projects: [project("project:g", [], ["gitlab.example.com/group/sub"])] }), attached("project:g", "owner")],
    ["AT-12: a repository a Project's agent changed from inside the Project", snap({ folder: `${DATA}/lib`, git: repoGit(`${DATA}/lib`, "git@github.com:someone/lib.git"), work: [{ project: "project:notes", commonDir: `${DATA}/lib/.git` }] }), attached("project:notes", "work")],
    ["AT-12: work by two Projects: ambiguous", snap({ folder: `${DATA}/lib`, git: repoGit(`${DATA}/lib`, null), work: [{ project: "project:notes", commonDir: `${DATA}/lib/.git` }, { project: "project:fabric", commonDir: `${DATA}/lib/.git` }] }), { outcome: "ambiguous", rule: "work", projects: ["project:fabric", "project:notes"] }],
    ["AT-12: work on another repository decides nothing", snap({ folder: `${DATA}/lib`, git: repoGit(`${DATA}/lib`, null), work: [{ project: "project:notes", commonDir: `${DATA}/other/.git` }] }), { outcome: "new", root: `${DATA}/lib` }],
    ["AT-5: the filesystem root", snap({ folder: "/" }), { outcome: "refused", reason: "container" }],
    ["AT-5: a Windows drive root", snap({ folder: "C:/", home: "C:/Profiles/ana", tempRoots: [] }), { outcome: "refused", reason: "container" }],
    ["AT-5: home", snap({ folder: HOME }), { outcome: "refused", reason: "container" }],
    ["AT-15: a folder directly in the filesystem root is no container unless it is home", snap({ folder: "/srv" }), { outcome: "new", root: "/srv" }],
    ["AT-15: a folder directly in a Windows drive root", snap({ folder: "C:/work", home: "C:/Profiles/ana", tempRoots: ["C:/Profiles/ana/AppData/Local/Temp"] }), { outcome: "new", root: "C:/work" }],
    ["AT-11: a hidden folder in a Windows home", snap({ folder: "C:/Profiles/ana/.config/tool", home: "C:/Profiles/ana", tempRoots: [] }), { outcome: "refused", reason: "tool" }],
    ["AT-5: a folder right under a Windows home", snap({ folder: "C:/Profiles/ana/projects", home: "C:/Profiles/ana", tempRoots: [] }), { outcome: "refused", reason: "container" }],
    ["AT-5: a folder right under home", snap({ folder: DATA }), { outcome: "refused", reason: "container" }],
    ["AT-5: a repository right under home", snap({ folder: `${HOME}/scratch`, git: repoGit(`${HOME}/scratch`, null) }), { outcome: "refused", reason: "container" }],
    ["AT-14: a folder holding another Project's folder", snap({ folder: `${DATA}/group`, projects: [project("project:inner", [folder(`${DATA}/group/inner`)])] }), { outcome: "refused", reason: "container" }],
    ["AT-15: a new repository: a Project at its top level", snap({ folder: `${DATA}/app/src`, git: repoGit(`${DATA}/app`, "git@github.com:someone/app.git") }), { outcome: "new", root: `${DATA}/app` }],
    ["AT-15: a worktree of an unknown repository: a Project at its main checkout", snap({ folder: `${DATA}/app-wt`, git: repoGit(`${DATA}/app-wt`, null, `${DATA}/app`, `${DATA}/app/.git`) }), { outcome: "new", root: `${DATA}/app` }],
    ["AT-15: a plain folder: a Project at itself", snap({ folder: `${DATA}/drafts` }), { outcome: "new", root: `${DATA}/drafts` }],
    ["AT-15: a branch decides nothing: the same answer on any branch", snap({ folder: `${DATA}/app`, git: { ...repoGit(`${DATA}/app`, null), branch: "feature/x" } }), { outcome: "new", root: `${DATA}/app` }],
    ["AT-0: an empty source", snap({ projects: [project("project:s", [], [""])] }), { fault: "input-invalid" }],
    ["AT-0: a Project id of 257 characters", snap({ projects: [project("p".repeat(257), [])] }), { fault: "input-invalid" }],
    ["AT-0: an explicit id of 257 characters", snap({ explicit: "p".repeat(257) }), { fault: "input-invalid" }],
    ["AT-0: a work record with an empty project", snap({ work: [{ project: "", commonDir: `${DATA}/lib/.git` }] }), { fault: "input-invalid" }],
    ["AT-0: an origin of 4097 characters", snap({ folder: `${DATA}/app`, git: repoGit(`${DATA}/app`, `https://github.com/o/${"r".repeat(4076)}`) }), { fault: "input-invalid" }],
    ["AT-0: a work record's origin of 4097 characters", snap({ work: [{ project: "project:notes", commonDir: `${DATA}/lib/.git`, origin: `https://github.com/o/${"r".repeat(4076)}` }] }), { fault: "input-invalid" }],
    ["AT-6: a worktree of the outer of two nested Projects joins the outer one", snap({ folder: `${DATA}/mono-wt/docs`, git: repoGit(`${DATA}/mono-wt`, null, `${DATA}/mono`), projects: [MONO, PKG] }), attached("project:mono", "worktree")],
    ["AT-6: in that worktree, a folder inside the inner Project joins the inner one", snap({ folder: `${DATA}/mono-wt/pkg/src`, git: repoGit(`${DATA}/mono-wt`, null, `${DATA}/mono`), projects: [MONO, PKG] }), attached("project:pkg", "worktree")],
    ["AT-6: the inner Project listed first changes nothing", snap({ folder: `${DATA}/mono-wt`, git: repoGit(`${DATA}/mono-wt`, null, `${DATA}/mono`), projects: [PKG, MONO] }), attached("project:mono", "worktree")],
    ["AT-6: the inner Project listed first, a folder inside it joins it", snap({ folder: `${DATA}/mono-wt/pkg/src`, git: repoGit(`${DATA}/mono-wt`, null, `${DATA}/mono`), projects: [PKG, MONO] }), attached("project:pkg", "worktree")],
    ["AT-7: a Project folder in a repository whose top level is the filesystem root", snap({ folder: `${DATA}/sys/srv/x`, git: repoGit(`${DATA}/sys`, "https://github.com/example-org/sys"), projects: [project("project:sys", [folder("/srv/x", "/.git", "https://github.com/example-org/sys", "/")])] }), attached("project:sys", "repository")],
    ["AT-7: a clone of the outer of two nested Projects joins the outer one", snap({ folder: `${DATA}/mono-2`, git: repoGit(`${DATA}/mono-2`, "https://github.com/example-org/mono"), projects: [MONO, PKG] }), attached("project:mono", "repository")],
    ["AT-7: in that clone, a folder inside the inner Project joins the inner one", snap({ folder: `${DATA}/mono-2/pkg/a`, git: repoGit(`${DATA}/mono-2`, "https://github.com/example-org/mono"), projects: [MONO, PKG] }), attached("project:pkg", "repository")],
    ["AT-6: a nested Project's folder without its top level counts at the top: a tie", snap({ folder: `${DATA}/mono-wt`, git: repoGit(`${DATA}/mono-wt`, null, `${DATA}/mono`), projects: [MONO, project("project:pkg", [folder(`${DATA}/mono/pkg`, `${DATA}/mono/.git`)])] }), { outcome: "ambiguous", rule: "worktree", projects: ["project:mono", "project:pkg"] }],
    ["AT-9: a worktree of a repository whose only Project is a subfolder of it", snap({ folder: `${DATA}/mono-wt/docs`, git: repoGit(`${DATA}/mono-wt`, null, `${DATA}/mono`), projects: [PKG] }), { outcome: "refused", reason: "container" }],
    ["AT-6: in that worktree, the subfolder's place joins its Project", snap({ folder: `${DATA}/mono-wt/pkg`, git: repoGit(`${DATA}/mono-wt`, null, `${DATA}/mono`), projects: [PKG] }), attached("project:pkg", "worktree")],
    ["AT-0: a Project folder whose top level does not hold it", snap({ projects: [project("project:t", [folder(`${DATA}/t`, `${DATA}/t/.git`, null, `${DATA}/other`)])] }), { fault: "input-invalid" }],
    ["AT-3: a folder right under home a Project lists is its folder", snap({ folder: `${HOME}/scratch`, projects: [project("project:scratch", [folder(`${HOME}/scratch`, null)])] }), attached("project:scratch", "folder")],
    ["AT-3: and so is a subfolder of it", snap({ folder: `${HOME}/scratch/a/b`, projects: [project("project:scratch", [folder(`${HOME}/scratch`, null)])] }), attached("project:scratch", "folder")],
    ["AT-6: a worktree of a Project whose main checkout is right under home", snap({ folder: `${DATA}/scratch-wt`, git: repoGit(`${DATA}/scratch-wt`, null, `${HOME}/scratch`), projects: [project("project:scratch", [folder(`${HOME}/scratch`)])] }), attached("project:scratch", "worktree")],
    ["AT-5: home a Project lists is still no Project", snap({ folder: HOME, projects: [project("project:home", [folder(HOME, null)])] }), { outcome: "refused", reason: "container" }],
    ["AT-15: an unknown worktree of a bare repository: a Project at the bare folder", snap({ folder: `${DATA}/r/main`, git: repoGit(`${DATA}/r/main`, null, `${DATA}/r/.bare`, `${DATA}/r/.bare`) }), { outcome: "new", root: `${DATA}/r/.bare` }],
    ["AT-6: a second worktree of a bare repository a Project keeps", snap({ folder: `${DATA}/r/feature`, git: repoGit(`${DATA}/r/feature`, null, `${DATA}/r/.bare`, `${DATA}/r/.bare`), projects: [project("project:r", [folder(`${DATA}/r/main`, `${DATA}/r/.bare`, null, `${DATA}/r/main`)])] }), attached("project:r", "worktree")],
    ["AT-5: a bare repository right under home", snap({ folder: `${DATA}/wt`, git: repoGit(`${DATA}/wt`, null, `${HOME}/r.git`, `${HOME}/r.git`) }), { outcome: "refused", reason: "container" }],
    ["AT-9: a second clone of a repository whose only Project is a subfolder of it", snap({ folder: `${DATA}/mono-3`, git: repoGit(`${DATA}/mono-3`, "https://github.com/example-org/mono"), projects: [PKG] }), { outcome: "refused", reason: "container" }],
    ["AT-9: a folder of that clone outside the Project's place", snap({ folder: `${DATA}/mono-3/docs`, git: repoGit(`${DATA}/mono-3`, "https://github.com/example-org/mono"), projects: [PKG] }), { outcome: "refused", reason: "container" }],
    ["AT-7: and its place inside the Project joins it", snap({ folder: `${DATA}/mono-3/pkg/a`, git: repoGit(`${DATA}/mono-3`, "https://github.com/example-org/mono"), projects: [PKG] }), attached("project:pkg", "repository")],
    ["AT-8: a worktree whose main checkout lies in a plain Project folder joins that Project", snap({ folder: `${DATA}/wt-task`, git: repoGit(`${DATA}/wt-task`, null, `${DATA}/client/app`), projects: [project("project:client", [folder(`${DATA}/client`, null)])] }), attached("project:client", "worktree")],
    ["AT-8: a worktree of a repository nested in a Git Project's folder joins that Project", snap({ folder: `${DATA}/lib-wt`, git: repoGit(`${DATA}/lib-wt`, null, `${DATA}/fabric/vendor/lib`) }), attached("project:fabric", "worktree")],
    ["AT-8: two Projects listing the main checkout's folder: a tie", snap({ folder: `${DATA}/wt-task`, git: repoGit(`${DATA}/wt-task`, null, `${DATA}/client/app`), projects: [project("project:client", [folder(`${DATA}/client`, null)]), project("project:client-2", [folder(`${DATA}/client`, null)])] }), { outcome: "ambiguous", rule: "worktree", projects: ["project:client", "project:client-2"] }],
    ["AT-5: home that is a worktree of a Project's repository", snap({ folder: HOME, git: repoGit(HOME, null, `${DATA}/fabric`, `${DATA}/fabric/.git`) }), { outcome: "refused", reason: "container" }],
    ["AT-5: a worktree right under home, like a clone there", snap({ folder: `${HOME}/wt`, git: repoGit(`${HOME}/wt`, null, `${DATA}/fabric`, `${DATA}/fabric/.git`) }), { outcome: "refused", reason: "container" }],
    ["AT-5: a container a person declared", snap({ folder: `${DATA}/_worktrees`, containers: [`${DATA}/_worktrees`] }), { outcome: "refused", reason: "container" }],
    ["AT-15: a declared container is no ancestor a folder joins", snap({ folder: `${DATA}/_worktrees/notes`, containers: [`${DATA}/_worktrees`], projects: [project("project:wt", [folder(`${DATA}/_worktrees`, null)])] }), { outcome: "new", root: `${DATA}/_worktrees/notes` }],
    ["AT-0: a declared container that is not a path", snap({ containers: ["work/_worktrees"] }), { fault: "input-invalid" }],
    ["AT-15: a clone of a repository only a home-listing Project keeps is new", snap({ folder: `${DATA}/dots`, git: repoGit(`${DATA}/dots`, "https://github.com/someone/dots"), projects: [project("project:home", [folder(HOME, `${HOME}/.git`, "git@github.com:someone/dots.git", HOME)])] }), { outcome: "new", root: `${DATA}/dots` }],
    ["AT-15: a worktree of a repository only a home-listing Project keeps is new", snap({ folder: `${DATA}/dots-wt`, git: repoGit(`${DATA}/dots-wt`, null, `${DATA}/dots`, `${DATA}/dots/.git`), projects: [project("project:home", [folder(HOME, `${DATA}/dots/.git`, null, HOME)])] }), { outcome: "new", root: `${DATA}/dots` }],
    ["AT-8: a worktree whose main checkout lies in a plain Project folder joins it, though the repository keeps a deeper Project", snap({ folder: `${DATA}/wt`, git: repoGit(`${DATA}/wt`, null, `${DATA}/client/app`), projects: [project("project:client", [folder(`${DATA}/client`, null)]), project("project:app-pkg", [folder(`${DATA}/client/app/pkg`, `${DATA}/client/app/.git`, null, `${DATA}/client/app`)])] }), attached("project:client", "worktree")],
    ["AT-1: an explicit attach of home", snap({ folder: HOME, projects: [project("project:home", [folder(HOME, null)])], explicit: "project:home" }), attached("project:home", "explicit")],
    ["AT-15: a work record naming no Project decides nothing", snap({ folder: `${DATA}/lib`, git: repoGit(`${DATA}/lib`, null), work: [{ project: "project:gone", commonDir: `${DATA}/lib/.git` }] }), { outcome: "new", root: `${DATA}/lib` }],
    ["AT-4: the temporary root itself", snap({ folder: "/tmp" }), { outcome: "refused", reason: "transient" }],
    ["AT-1: a Project id of 200 astral characters is within the bound (code points, not UTF-16 units)", snap({ projects: [project("\u{1F600}".repeat(200), [])], explicit: "\u{1F600}".repeat(200) }), attached("\u{1F600}".repeat(200), "explicit")],
    ["AT-3: the nearest of two nested Project folders, the inner one listed first", snap({ folder: `${DATA}/mono/pkg/a`, projects: [project("project:pkg", [folder(`${DATA}/mono/pkg`)]), project("project:mono", [folder(`${DATA}/mono`)])] }), attached("project:pkg", "folder")],
    ["AT-3: the outer of two nested Projects keeps its folders outside the inner one", snap({ folder: `${DATA}/mono/docs`, projects: [project("project:mono", [folder(`${DATA}/mono`)]), project("project:pkg", [folder(`${DATA}/mono/pkg`)])] }), attached("project:mono", "folder")],
    ["AT-3: a Project's own folder under a temporary root still attaches", snap({ folder: "/private/tmp/notes/a", projects: [project("project:tmpnotes", [folder("/private/tmp/notes", null)])] }), attached("project:tmpnotes", "folder")],
    ["AT-4: a worktree whose main checkout is in a temporary root", snap({ folder: `${DATA}/wt`, git: repoGit(`${DATA}/wt`, null, "/tmp/clone", "/tmp/clone/.git") }), { outcome: "refused", reason: "transient" }],
    ["AT-5: a home that is a clone of a Project's repository", snap({ folder: HOME, git: repoGit(HOME, "git@github.com:example-org/fabric.git") }), { outcome: "refused", reason: "container" }],
    ["AT-14: a repository root that holds a Project's subfolder", snap({ folder: `${DATA}/big`, git: repoGit(`${DATA}/big`, null), projects: [project("project:sub", [folder(`${DATA}/big/apps/sub`, null)])] }), { outcome: "refused", reason: "container" }],
    ["AT-5: the folder that holds home", snap({ folder: "/u" }), { outcome: "refused", reason: "container" }],
    ["AT-6: a remoteless worktree whose main checkout a Project lists without a common dir", snap({ folder: `${DATA}/r-wt`, git: repoGit(`${DATA}/r-wt`, null, `${DATA}/r`, `${DATA}/r/.git`), projects: [project("project:r", [folder(`${DATA}/r`, null)])] }), attached("project:r", "worktree")],
    ["AT-6: a tombstoned main checkout does not keep out a worktree of a Project that keeps the repository", snap({ folder: `${DATA}/wt-b`, git: repoGit(`${DATA}/wt-b`, null, `${DATA}/r`, `${DATA}/r/.git`), projects: [project("project:r", [folder(`${DATA}/wt-a`, `${DATA}/r/.git`)])], tombstones: [`${DATA}/r`] }), attached("project:r", "worktree")],
    ["AT-10: a clone in a tool folder whose owner a Project lists joins by owner", snap({ folder: `${HOME}/.codex/plug`, git: repoGit(`${HOME}/.codex/plug`, "git@github.com:example-org/plug.git") }), attached("project:fabric", "owner")],
    ["AT-12: a second clone of a worked repository, by its identity", snap({ folder: `${DATA}/lib-2`, git: repoGit(`${DATA}/lib-2`, "git@github.com:someone/lib.git"), work: [{ project: "project:notes", commonDir: `${DATA}/lib/.git`, origin: "https://github.com/someone/lib" }] }), attached("project:notes", "work")],
    ["AT-15: a tombstone inside the root keeps out only its own folder", snap({ folder: `${DATA}/gone/src`, git: repoGit(`${DATA}/gone`, null), tombstones: [`${DATA}/gone/x`] }), { outcome: "new", root: `${DATA}/gone` }],
  ];
  return cases.map(([name, snapshot, expected]) => ({ name, snapshot, expected }));
}

/** The vectors as an object. */
export function folderAttributionVectors(): Json {
  return {
    about:
      "Vectors for folder attribution (DEC-0089), written by tools/vectors/folder-attribution.ts, never by hand. origin: normalizeOrigin(origin), a repository identity host/path or null. attribution: attributeFolder(snapshot); snapshot is {folder, home, tempRoots, git, projects, work?, tombstones?, containers?, explicit?}, git null for a folder without Git or {toplevel, commonDir, mainCheckout, origin}; a project is {id, folders: [{path, commonDir, origin, toplevel?}], sources}, toplevel the folder's Git top level (a folder in Git gives its commonDir and toplevel); a work record is {project, commonDir, origin?}; paths are absolute and /-separated. Members a rule does not read (a branch) change nothing.",
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

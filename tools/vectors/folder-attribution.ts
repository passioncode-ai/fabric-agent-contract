/**
 * The generator of the folder-attribution vectors (DEC-0089): `fixtures/vectors/folder-attribution.json`, run by Fabric,
 * Fabric Switchboard and Project Observatory in their own gates, so the three attribute a folder alike.
 *
 *   tsx tools/vectors/folder-attribution.ts --check   compare the committed file with what this writes (exit 1 on a difference)
 *   tsx tools/vectors/folder-attribution.ts --write   write it
 *
 * Every vector change is made here and written by `--write`, never by hand; `test/folder-attribution.test.ts` runs the
 * check. Each expected answer is written below by hand from DEC-0089's items and folder-attribution.md's AT table. Nothing here
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
    ok("https://github.com/Example-Org/\u00dcber-\u00c9cole", "github.com/example-org/\u00dcber-\u00c9cole"),
    no("https://git_host.example.com/example-org/fabric"),
    no("https://\u212aithub.com/example-org/fabric"),
    no("https://github.com/example-org/fabric/.git"),
    no("git@GITHUB.\u212aOM:example-org/fabric.git"),
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
    ["AT-15: a sibling whose name extends the folder's is not under it", snap({ folder: `${DATA}/fabric-site`, git: repoGit(`${DATA}/fabric-site`, null) }), { outcome: "new", root: `${DATA}/fabric-site` }],
    ["AT-3: the nearest of two nested Project folders", snap({ folder: `${DATA}/mono/pkg/a`, projects: [project("project:mono", [folder(`${DATA}/mono`)]), project("project:pkg", [folder(`${DATA}/mono/pkg`)])] }), attached("project:pkg", "folder")],
    ["AT-15: a home folder a Project lists is no ancestor: a new Project", snap({ folder: `${DATA}/y`, projects: [project("project:home", [folder(HOME, null)])] }), { outcome: "new", root: `${DATA}/y` }],
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
    ["AT-10: an owner with a non-ASCII letter, listed as written", snap({ folder: `${DATA}/app`, git: repoGit(`${DATA}/app`, "https://github.com/\u00dcber/app"), projects: [project("project:u", [], ["GitHub.com/\u00dcber"])] }), attached("project:u", "owner")],
    ["AT-15: an owner whose non-ASCII letter differs in case is another owner", snap({ folder: `${DATA}/app`, git: repoGit(`${DATA}/app`, "https://github.com/\u00dcber/app"), projects: [project("project:u", [], ["github.com/\u00fcber"])] }), { outcome: "new", root: `${DATA}/app` }],
    ["AT-10: an owner of a group path", snap({ folder: `${DATA}/app`, git: repoGit(`${DATA}/app`, "https://gitlab.example.com/group/sub/app.git"), projects: [project("project:g", [], ["gitlab.example.com/group/sub"])] }), attached("project:g", "owner")],
    ["AT-12: a repository a Project's agent changed from inside the Project", snap({ folder: `${DATA}/lib`, git: repoGit(`${DATA}/lib`, "git@github.com:someone/lib.git"), work: [{ project: "project:notes", commonDir: `${DATA}/lib/.git` }] }), attached("project:notes", "work")],
    ["AT-12: work by two Projects: ambiguous", snap({ folder: `${DATA}/lib`, git: repoGit(`${DATA}/lib`, null), work: [{ project: "project:notes", commonDir: `${DATA}/lib/.git` }, { project: "project:fabric", commonDir: `${DATA}/lib/.git` }] }), { outcome: "ambiguous", rule: "work", projects: ["project:fabric", "project:notes"] }],
    ["AT-15: work on another repository decides nothing", snap({ folder: `${DATA}/lib`, git: repoGit(`${DATA}/lib`, null), work: [{ project: "project:notes", commonDir: `${DATA}/other/.git` }] }), { outcome: "new", root: `${DATA}/lib` }],
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
    ["AT-7: a worktree's folder at a nested Project's place, the nested Project in another clone, joins it by identity", snap({ folder: `${DATA}/mono-wt/pkg/x`, git: repoGit(`${DATA}/mono-wt`, "git@github.com:example-org/mono.git", `${DATA}/mono`), projects: [MONO, project("project:pkg", [folder(`${DATA}/mono-2/pkg`, `${DATA}/mono-2/.git`, "git@github.com:example-org/mono.git", `${DATA}/mono-2`)])] }), attached("project:pkg", "repository")],
    ["AT-3: once the outer Project's clone is recorded, a folder inside the inner Project there still joins the inner one", snap({ folder: `${DATA}/mono-2/pkg/a`, git: repoGit(`${DATA}/mono-2`, "https://github.com/example-org/mono"), projects: [project("project:mono", [...MONO.folders, folder(`${DATA}/mono-2`, `${DATA}/mono-2/.git`, "https://github.com/example-org/mono", `${DATA}/mono-2`)]), PKG] }), attached("project:pkg", "folder")],
    ["AT-3: a worktree of a known repository inside another Project's folder is that Project's", snap({ folder: `${DATA}/notes/fabric-wt`, git: repoGit(`${DATA}/notes/fabric-wt`, "git@github.com:example-org/fabric.git", `${DATA}/fabric`) }), attached("project:notes", "folder")],
    ["AT-5: a subfolder of a worktree right under home is refused, as the worktree is", snap({ folder: `${HOME}/fabric-wt/src`, git: repoGit(`${HOME}/fabric-wt`, "git@github.com:example-org/fabric.git", `${DATA}/fabric`) }), { outcome: "refused", reason: "container" }],
    ["AT-5: a subfolder of a clone of a known repository right under home is refused, as the clone is", snap({ folder: `${HOME}/fabric-2/src`, git: repoGit(`${HOME}/fabric-2`, "git@github.com:example-org/fabric.git") }), { outcome: "refused", reason: "container" }],
    ["AT-15: an undeclared folder that holds worktrees becomes a Project of its own", snap({ folder: `${DATA}/_wt` }), { outcome: "new", root: `${DATA}/_wt` }],
    ["AT-5: a declared container inside a Project's folder is refused", snap({ folder: `${DATA}/notes/_wt`, containers: [`${DATA}/notes/_wt`] }), { outcome: "refused", reason: "container" }],
    ["AT-6: a worktree in a declared container inside another Project's folder joins its own repository's Project", snap({ folder: `${DATA}/notes/_wt/fabric-wt`, git: repoGit(`${DATA}/notes/_wt/fabric-wt`, "git@github.com:example-org/fabric.git", `${DATA}/fabric`), containers: [`${DATA}/notes/_wt`] }), attached("project:fabric", "worktree")],
    ["AT-15: the deepest declared container ends the reach of a Project listed between two containers", snap({ folder: `${DATA}/notes/c1/q/c2/x`, containers: [`${DATA}/notes/c1`, `${DATA}/notes/c1/q/c2`], projects: [NOTES, project("project:q", [folder(`${DATA}/notes/c1/q`, null)])] }), { outcome: "new", root: `${DATA}/notes/c1/q/c2/x` }],
    ["AT-6: a worktree in a declared container inside its own main checkout joins by worktree, not by folder", snap({ folder: `${DATA}/fabric/_wt/a`, git: repoGit(`${DATA}/fabric/_wt/a`, "git@github.com:example-org/fabric.git", `${DATA}/fabric`), containers: [`${DATA}/fabric/_wt`] }), attached("project:fabric", "worktree")],
    ["AT-2: a declared container a Project lists below a tombstone does not lift it", snap({ folder: `${DATA}/old/_wt/a`, tombstones: [`${DATA}/old`], containers: [`${DATA}/old/_wt`], projects: [project("project:box", [folder(`${DATA}/old/_wt`, null)])] }), { outcome: "refused", reason: "tombstoned" }],
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
    ["AT-5: a worktree whose main checkout is home", snap({ folder: `${DATA}/dots-wt`, git: repoGit(`${DATA}/dots-wt`, null, HOME, `${HOME}/.git`) }), { outcome: "refused", reason: "container" }],
    ["AT-5: a worktree whose main checkout is a declared container", snap({ folder: `${DATA}/box-wt`, git: repoGit(`${DATA}/box-wt`, null, `${DATA}/_box`), containers: [`${DATA}/_box`] }), { outcome: "refused", reason: "container" }],
    ["AT-6: the main checkout a Project lists without a common dir wins over a clone another Project keeps", snap({ folder: `${DATA}/m-wt`, git: repoGit(`${DATA}/m-wt`, "https://github.com/example-org/m", `${DATA}/m`), projects: [project("project:a", [folder(`${DATA}/m`, null)]), project("project:b", [folder(`${DATA}/m-clone`, `${DATA}/m-clone/.git`, "https://github.com/example-org/m", `${DATA}/m-clone`)])] }), attached("project:a", "worktree")],
    ["AT-3: a repository cloned inside a plain-folder Project is that Project's", snap({ folder: `${DATA}/client/newrepo`, git: repoGit(`${DATA}/client/newrepo`, "https://github.com/example-org/new"), projects: [project("project:client", [folder(`${DATA}/client`, null)])] }), attached("project:client", "folder")],
    ["AT-6: a worktree of an unlisted repository right under home, at the place of its Project", snap({ folder: `${DATA}/mwt/pkg/x`, git: repoGit(`${DATA}/mwt`, null, `${HOME}/mono`, `${HOME}/mono/.git`), projects: [project("project:sub", [folder(`${HOME}/mono/pkg`, `${HOME}/mono/.git`, null, `${HOME}/mono`)])] }), attached("project:sub", "worktree")],
    ["AT-9: and outside that place", snap({ folder: `${DATA}/mwt/docs`, git: repoGit(`${DATA}/mwt`, null, `${HOME}/mono`, `${HOME}/mono/.git`), projects: [project("project:sub", [folder(`${HOME}/mono/pkg`, `${HOME}/mono/.git`, null, `${HOME}/mono`)])] }), { outcome: "refused", reason: "container" }],
    ["AT-3: a folder a Project lists below a tombstone is that Project's", snap({ folder: `${DATA}/old/src/a`, tombstones: [`${DATA}/old`], projects: [project("project:p", [folder(`${DATA}/old/src`, null)])] }), attached("project:p", "folder")],
    ["AT-3: a folder listed below a tombstone gets through it though another Project lists the tombstone's parent", snap({ folder: `${DATA}/w/old/src/a`, tombstones: [`${DATA}/w/old`], projects: [project("project:w", [folder(`${DATA}/w`, null)]), project("project:p", [folder(`${DATA}/w/old/src`, null)])] }), attached("project:p", "folder")],
    ["AT-2: and its sibling stays tombstoned", snap({ folder: `${DATA}/old/other`, tombstones: [`${DATA}/old`], projects: [project("project:p", [folder(`${DATA}/old/src`, null)])] }), { outcome: "refused", reason: "tombstoned" }],
    ["AT-2: a Project listing the tombstoned folder itself does not undo it", snap({ folder: `${DATA}/old/a`, tombstones: [`${DATA}/old`], projects: [project("project:p", [folder(`${DATA}/old`, null)])] }), { outcome: "refused", reason: "tombstoned" }],
    ["AT-3: a worktree recorded for the outer Project still lets the inner one's place decide", snap({ folder: `${DATA}/mono-wt/pkg/src`, git: repoGit(`${DATA}/mono-wt`, null, `${DATA}/mono`), projects: [project("project:mono", [folder(`${DATA}/mono`, `${DATA}/mono/.git`, null, `${DATA}/mono`), folder(`${DATA}/mono-wt`, `${DATA}/mono/.git`, null, `${DATA}/mono-wt`)]), PKG] }), attached("project:pkg", "folder")],
    ["AT-3: a folder whose own top level disagrees with its Project folder's place falls back to the path", snap({ folder: `${DATA}/k/sub/y`, git: repoGit(`${DATA}/k/sub`, null, `${DATA}/k`, `${DATA}/k/.git`), projects: [project("project:k", [folder(`${DATA}/k/sub`, `${DATA}/k/.git`, null, `${DATA}/k`)])] }), attached("project:k", "folder")],
    ["AT-0: a lower-case drive letter", snap({ folder: "c:/work", home: "C:/Profiles/ana", tempRoots: [] }), { fault: "input-invalid" }],
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

/** What a product records after each answer (folder-attribution.md, *Recording the answer*); `null` records nothing. */
function recordCases(): Json[] {
  const rec = (p: string, commonDir: string | null, origin: string | null, toplevel: string | null) => ({ path: p, commonDir, origin, toplevel });
  const cases: Array<[string, Json, Json | null]> = [
    ["AT-15: a plain folder records itself", snap({ folder: `${DATA}/drafts` }), rec(`${DATA}/drafts`, null, null, null)],
    ["AT-15: a new repository records its top level", snap({ folder: `${DATA}/app/src`, git: repoGit(`${DATA}/app`, "git@github.com:someone/app.git") }), rec(`${DATA}/app`, `${DATA}/app/.git`, "git@github.com:someone/app.git", `${DATA}/app`)],
    ["AT-15: a worktree of an unknown repository records the main checkout as its own top level", snap({ folder: `${DATA}/app-wt`, git: repoGit(`${DATA}/app-wt`, null, `${DATA}/app`) }), rec(`${DATA}/app`, `${DATA}/app/.git`, null, `${DATA}/app`)],
    ["AT-15: an unknown bare repository records the bare folder with no top level", snap({ folder: `${DATA}/r/main`, git: repoGit(`${DATA}/r/main`, null, `${DATA}/r/.bare`, `${DATA}/r/.bare`) }), rec(`${DATA}/r/.bare`, `${DATA}/r/.bare`, null, null)],
    ["AT-6: a worktree at the inner Project's place records that place in the worktree", snap({ folder: `${DATA}/mono-wt/pkg/src`, git: repoGit(`${DATA}/mono-wt`, null, `${DATA}/mono`), projects: [MONO, PKG] }), rec(`${DATA}/mono-wt/pkg`, `${DATA}/mono/.git`, null, `${DATA}/mono-wt`)],
    ["AT-6: a worktree at the top records its top level", snap({ folder: `${DATA}/mono-wt/docs`, git: repoGit(`${DATA}/mono-wt`, null, `${DATA}/mono`), projects: [MONO, PKG] }), rec(`${DATA}/mono-wt`, `${DATA}/mono/.git`, null, `${DATA}/mono-wt`)],
    ["AT-7: a clone records its top level with its raw origin", snap({ folder: `${DATA}/mono-2`, git: repoGit(`${DATA}/mono-2`, "https://github.com/example-org/mono"), projects: [MONO, PKG] }), rec(`${DATA}/mono-2`, `${DATA}/mono-2/.git`, "https://github.com/example-org/mono", `${DATA}/mono-2`)],
    ["AT-7: a place below a top level at the filesystem root", snap({ folder: `${DATA}/sys/srv/x`, git: repoGit(`${DATA}/sys`, "https://github.com/example-org/sys"), projects: [project("project:sys", [folder("/srv/x", "/.git", "https://github.com/example-org/sys", "/")])] }), rec(`${DATA}/sys/srv/x`, `${DATA}/sys/.git`, "https://github.com/example-org/sys", `${DATA}/sys`)],
    ["AT-8: a worktree joined through its main checkout's Project records its top level", snap({ folder: `${DATA}/wt-task`, git: repoGit(`${DATA}/wt-task`, null, `${DATA}/client/app`), projects: [project("project:client", [folder(`${DATA}/client`, null)])] }), rec(`${DATA}/wt-task`, `${DATA}/client/app/.git`, null, `${DATA}/wt-task`)],
    ["AT-10: a clone joined by owner records its top level", snap({ folder: `${DATA}/plug`, git: repoGit(`${DATA}/plug`, "git@github.com:example-org/plug.git") }), rec(`${DATA}/plug`, `${DATA}/plug/.git`, "git@github.com:example-org/plug.git", `${DATA}/plug`)],
    ["AT-6: a worktree whose top level is the filesystem root records its place below it", snap({ folder: "/pkg/x", git: repoGit("/", null, `${DATA}/mono`), projects: [MONO, PKG] }), rec("/pkg", `${DATA}/mono/.git`, null, "/")],
    ["AT-15: a new repository's record drops the remote's user information and password", snap({ folder: `${DATA}/app`, git: repoGit(`${DATA}/app`, "https://ana:not-a-real-secret@gitlab.example.com/someone/app.git") }), rec(`${DATA}/app`, `${DATA}/app/.git`, "https://gitlab.example.com/someone/app.git", `${DATA}/app`)],
    ["AT-15: and an ssh remote keeps its user, its password and query dropped", snap({ folder: `${DATA}/app`, git: repoGit(`${DATA}/app`, "ssh://git:not-a-real-secret@gitlab.example.com/someone/app.git?ref=main") }), rec(`${DATA}/app`, `${DATA}/app/.git`, "ssh://git@gitlab.example.com/someone/app.git", `${DATA}/app`)],
    ["AT-15: and an scp remote drops its password", snap({ folder: `${DATA}/app`, git: repoGit(`${DATA}/app`, "git:not-a-real-secret@gitlab.example.com:someone/app.git?x=1") }), rec(`${DATA}/app`, `${DATA}/app/.git`, "git@gitlab.example.com:someone/app.git", `${DATA}/app`)],
    ["AT-15: an scp password holding @ is dropped whole", snap({ folder: `${DATA}/app`, git: repoGit(`${DATA}/app`, "git:pa@ss@gitlab.example.com:someone/app.git") }), rec(`${DATA}/app`, `${DATA}/app/.git`, "git@gitlab.example.com:someone/app.git", `${DATA}/app`)],
    ["AT-15: a fragment is dropped", snap({ folder: `${DATA}/app`, git: repoGit(`${DATA}/app`, "https://gitlab.example.com/someone/app.git#readme") }), rec(`${DATA}/app`, `${DATA}/app/.git`, "https://gitlab.example.com/someone/app.git", `${DATA}/app`)],
    ["AT-15: a local path is kept as written", snap({ folder: `${DATA}/app`, git: repoGit(`${DATA}/app`, `${DATA}/mirrors/app`) }), rec(`${DATA}/app`, `${DATA}/app/.git`, `${DATA}/mirrors/app`, `${DATA}/app`)],
    ["AT-15: a remote whose kept part still has a secret's shape records no origin", snap({ folder: `${DATA}/app`, git: repoGit(`${DATA}/app`, "ssh://sk-testtesttesttest@gitlab.example.com/someone/app.git") }), rec(`${DATA}/app`, `${DATA}/app/.git`, null, `${DATA}/app`)],
    ["AT-15: a URL with no repository identity records no origin", snap({ folder: `${DATA}/app`, git: repoGit(`${DATA}/app`, "https://u:p?x@gitlab.example.com/someone/app.git") }), rec(`${DATA}/app`, `${DATA}/app/.git`, null, `${DATA}/app`)],
    ["AT-6: a place that is a declared container records nothing", snap({ folder: `${DATA}/mono-wt/pkg/x`, git: repoGit(`${DATA}/mono-wt`, null, `${DATA}/mono`), containers: [`${DATA}/mono-wt/pkg`], projects: [MONO, PKG] }), null],
    ["AT-3: a folder already a Project's records nothing", snap({ folder: `${DATA}/notes/a` }), null],
    ["AT-1: an explicit attach records the folder", snap({ folder: `${DATA}/x`, explicit: "project:notes" }), rec(`${DATA}/x`, null, null, null)],
    ["AT-1: an explicit attach of home records nothing: it holds for that call", snap({ folder: HOME, explicit: "project:notes" }), null],
    ["AT-5: a refusal records nothing", snap({ folder: "/" }), null]
  ];
  return cases.map(([name, snapshot, record]) => ({ name, snapshot, record }));
}

/** The vectors as an object. */
export function folderAttributionVectors(): Json {
  return {
    about:
      "Vectors for folder attribution (DEC-0089), written by tools/vectors/folder-attribution.ts, never by hand. origin: normalizeOrigin(origin), a repository identity host/path or null. attribution: attributeFolder(snapshot); snapshot is {folder, home, tempRoots, git, projects, work?, tombstones?, containers?, explicit?}, git null for a folder without Git or {toplevel, commonDir, mainCheckout, origin}; a project is {id, folders: [{path, commonDir, origin, toplevel?}], sources}, toplevel the folder's Git top level (a folder in Git gives its commonDir and toplevel); a work record is {project, commonDir, origin?}; record: explainFolder(snapshot).record, the Project folder a product records after the answer ({path, commonDir, origin, toplevel}) or null; paths are absolute and /-separated. Members a rule does not read (a branch) change nothing.",
    origin: originCases(),
    attribution: attributionCases(),
    record: recordCases()
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

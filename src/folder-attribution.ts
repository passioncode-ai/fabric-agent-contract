import { type Finding, type JsonObject, isObject, jsonEqual } from "./findings.js";

// #region folder-attribution, docs: docs/specification/attribution.md
/**
 * Folder attribution (DEC-0089, CT-57): which Project a folder a coding agent works in belongs to, decided once for
 * Fabric, Fabric Switchboard and Project Observatory. `attributeFolder` reads a snapshot of what a product knows (the
 * folder, its Git facts, the Projects with their folders and sources, the work records, the tombstones) and answers in
 * the order of attribution.md's AT table; it reads no file system, so every product gets the same answer from the same
 * facts. Every function here answers and never throws: malformed input is an answer.
 */

/** A path: absolute, `/`-separated (a Windows path written `C:/...`), no empty, `.` or `..` segment, no trailing `/`. */
const PATH = /^(?:\/|[A-Za-z]:\/)(?:[^/]+(?:\/[^/]+)*)?$/;
const MAX_PATH = 4096;
const MAX_LIST = 10_000;
/** The schemes a remote names a repository by (DEC-0089 item 2). */
const SCHEMES = ["http", "https", "ssh", "git", "git+ssh", "git+https"];

const isString = (value: unknown): value is string => typeof value === "string";
/** A length in code points, as JSON Schema's `maxLength` counts. */
const codePoints = (value: string) => [...value].length;
/** `#/$defs/projectId`: 1 to 256 characters. */
const idOk = (value: unknown): value is string => isString(value) && value.length > 0 && codePoints(value) <= 256;
/** An origin member: absent, `null`, or a string of at most 4096 characters. */
const originOk = (value: unknown) => value === undefined || value === null || (isString(value) && codePoints(value) <= MAX_PATH);
const own = (value: unknown, key: string): unknown => (isObject(value) && Object.hasOwn(value, key) ? value[key] : undefined);
const list = (value: unknown): unknown[] | undefined => (Array.isArray(value) && value.length <= MAX_LIST ? value : undefined);

/** Whether `value` is a path in the form above. */
export function isPath(value: unknown): value is string {
  return isString(value) && codePoints(value) <= MAX_PATH && PATH.test(value) && !value.split("/").some((segment) => segment === "." || segment === "..");
}
const isRoot = (path: string) => path === "/" || /^[A-Za-z]:\/$/.test(path);
/** Whether `path` is `base` or lies under it, segment by segment (`/a/bc` is not under `/a/b`). */
export function under(path: string, base: string): boolean {
  if (path === base) return true;
  return path.startsWith(isRoot(base) ? base : `${base}/`);
}
/** The parent of a path that is not a root (callers test a root first). */
const parentOf = (path: string): string => {
  const cut = path.lastIndexOf("/");
  const parent = path.slice(0, cut);
  return parent === "" ? "/" : /^[A-Za-z]:$/.test(parent) ? `${parent}/` : parent;
};

/**
 * A remote's repository identity (DEC-0089 item 2): `host/path`, lower-cased, from a URL with one of `SCHEMES` or the scp
 * form `[user@]host:path`; the user, a password or token, the port, a query, a fragment, a trailing `/` and one trailing
 * `.git` dropped. The host has a dot and the path at least two segments (`owner/name`, or a group path `group/sub/name`).
 * Undefined for a local path, `file:`, another scheme or anything else.
 */
export function normalizeOrigin(raw: unknown): string | undefined {
  if (!isString(raw) || codePoints(raw) > MAX_PATH) return undefined;
  const value = raw.trim();
  let host: string;
  let path: string;
  const scheme = /^([a-z][a-z0-9+.-]*):\/\//i.exec(value);
  if (scheme) {
    if (!SCHEMES.includes(String(scheme[1]).toLowerCase())) return undefined;
    const rest = String(value.slice(scheme[0].length).split(/[?#]/)[0]);
    const slash = rest.indexOf("/");
    if (slash < 0) return undefined;
    host = rest.slice(0, slash);
    path = rest.slice(slash + 1);
  } else {
    if (value.startsWith("/") || /^[A-Za-z]:[\\/]/.test(value) || value.startsWith(".")) return undefined;
    const scp = /^(?:[^@/\s]+@)?([^:/\s]+):([^\s]+)$/.exec(value);
    if (!scp) return undefined;
    host = String(scp[1]);
    path = String(String(scp[2]).split(/[?#]/)[0]);
  }
  host = host.slice(host.lastIndexOf("@") + 1).replace(/:[0-9]*$/, "").toLowerCase();
  path = path.replace(/^\/+|\/+$/g, "").toLowerCase();
  if (path.endsWith(".git")) path = path.slice(0, -4);
  const segments = path.split("/");
  if (!/^[a-z0-9.-]+$/.test(host) || !host.includes(".") || segments.length < 2 || segments.some((segment) => segment === "" || /\s/.test(segment))) return undefined;
  return `${host}/${segments.join("/")}`;
}
/** The owner of a normalized repository identity: every segment but the last (`host/owner`, `host/group/sub`). */
export const ownerOf = (repository: string): string => repository.slice(0, repository.lastIndexOf("/"));

/** Whether `path` lies in a tool's own folder: a hidden folder directly in home, `Library` or `AppData` (Switchboard SB-131). */
function inToolFolder(path: string, home: string): boolean {
  if (path === home || !under(path, home)) return false;
  const first = String(path.slice(home.length).replace(/^\//, "").split("/")[0]);
  return first.startsWith(".") || first === "Library" || first === "AppData";
}

export type AttributionRule = "explicit" | "folder" | "worktree" | "repository" | "owner" | "work";
export type Attribution =
  | { outcome: "attached"; project: string; rule: AttributionRule }
  | { outcome: "new"; root: string }
  | { outcome: "refused"; reason: "transient" | "tombstoned" | "container" | "tool" }
  | { outcome: "ambiguous"; rule: AttributionRule; projects: string[] }
  | { fault: "input-invalid" };

interface ProjectFolder {
  path: string;
  commonDir: string | undefined;
  repository: string | undefined;
}
interface Project {
  id: string;
  folders: ProjectFolder[];
  sources: string[];
}

/** The snapshot's Projects, or undefined when any is malformed (a fault, never a guess). */
function projectsOf(value: unknown): Project[] | undefined {
  const raw = list(value);
  if (!raw) return undefined;
  const projects: Project[] = [];
  for (const entry of raw) {
    const id = own(entry, "id");
    const folders = list(own(entry, "folders"));
    const sources = own(entry, "sources") === undefined ? [] : list(own(entry, "sources"));
    if (!idOk(id) || !folders || !sources || !sources.every((source) => isString(source) && source.length > 0 && codePoints(source) <= MAX_PATH)) return undefined;
    const parsed: ProjectFolder[] = [];
    for (const folder of folders) {
      const path = own(folder, "path");
      const commonDir = own(folder, "commonDir");
      const origin = own(folder, "origin");
      if (!isPath(path) || (commonDir !== undefined && commonDir !== null && !isPath(commonDir)) || !originOk(origin)) return undefined;
      parsed.push({ path, commonDir: isString(commonDir) ? commonDir : undefined, repository: normalizeOrigin(origin) });
    }
    projects.push({ id, folders: parsed, sources: sources.map((source) => (source as string).toLowerCase().replace(/\/+$/, "")) });
  }
  return new Set(projects.map((project) => project.id)).size === projects.length ? projects : undefined;
}

/** The distinct ids of `projects`, in the snapshot's order. */
const ids = (projects: Project[]) => [...new Set(projects.map((project) => project.id))];
/** One project attached by `rule`, or ambiguous when more than one matches; undefined when none does. */
function decide(matches: Project[], rule: AttributionRule): Attribution | undefined {
  const [first, ...others] = ids(matches);
  if (first === undefined) return undefined;
  return others.length === 0 ? { outcome: "attached", project: first, rule } : { outcome: "ambiguous", rule, projects: [first, ...others] };
}

/**
 * The Project of one folder (DEC-0089 item 1), in the order of attribution.md's AT table. `snapshot` is
 * `{folder, home, tempRoots, git, projects, work?, tombstones?, explicit?}`:
 *
 * - AT-0: a snapshot that is not of the schema's shape, or `explicit` naming no Project: `{fault: "input-invalid"}`;
 * - AT-1: `explicit` names a Project: attached to it (`explicit`), whatever else holds;
 * - AT-2: the folder is at or under a tombstone: refused `tombstoned`;
 * - AT-3: the folder, or its nearest ancestor a Project lists, belongs to that Project (`folder`); a root, home, an
 *   ancestor of home or a folder right under home is never such an ancestor;
 * - AT-4: the folder or its root is under a temporary root: refused `transient`;
 * - AT-5: the root (the main checkout, or the folder without Git) is a container: a root, home, an ancestor of home,
 *   a folder right under home, or a folder that holds another Project's folder: refused `container`;
 * - AT-6: a Project's folder has the same Git common dir, or is the main checkout (`worktree`);
 * - AT-7: the same repository identity (`repository`);
 * - AT-8: the repository's owner is a source of a Project (`owner`);
 * - AT-9: the folder or its root is in a tool's folder: refused `tool`;
 * - AT-10: a work record names the repository (its common dir or its identity) for a Project (`work`);
 * - AT-11: the root is at or under a tombstone: refused `tombstoned`;
 * - AT-12: otherwise a new Project at the root.
 *
 * Two Projects matching at one row answer `ambiguous` with both, and nothing is attached. It never throws.
 */
export function attributeFolder(snapshot: unknown): Attribution {
  const folder = own(snapshot, "folder");
  const home = own(snapshot, "home");
  const tempRoots = list(own(snapshot, "tempRoots"));
  const git = own(snapshot, "git");
  const projects = projectsOf(own(snapshot, "projects"));
  const work = own(snapshot, "work") === undefined ? [] : list(own(snapshot, "work"));
  const tombstones = own(snapshot, "tombstones") === undefined ? [] : list(own(snapshot, "tombstones"));
  const explicit = own(snapshot, "explicit");
  if (!isPath(folder) || !isPath(home) || !tempRoots || !tempRoots.every(isPath) || !projects || !work || !tombstones || !tombstones.every(isPath)) return { fault: "input-invalid" };
  if (git !== null && !isObject(git)) return { fault: "input-invalid" };
  const toplevel = own(git, "toplevel");
  const commonDir = own(git, "commonDir");
  const mainCheckout = own(git, "mainCheckout");
  const origin = own(git, "origin");
  if (git !== null && (!isPath(toplevel) || !isPath(commonDir) || !isPath(mainCheckout) || !under(folder, toplevel) || !originOk(origin))) return { fault: "input-invalid" };
  const records: Array<{ project: string; commonDir: string; repository: string | undefined }> = [];
  for (const record of work) {
    const project = own(record, "project");
    const repo = own(record, "commonDir");
    const recordOrigin = own(record, "origin");
    if (!idOk(project) || !isPath(repo) || !originOk(recordOrigin)) return { fault: "input-invalid" };
    records.push({ project, commonDir: repo, repository: normalizeOrigin(recordOrigin) });
  }
  if (explicit !== undefined) {
    const target = idOk(explicit) ? projects.find((project) => project.id === explicit) : undefined;
    return target ? { outcome: "attached", project: target.id, rule: "explicit" } : { fault: "input-invalid" };
  }

  if (tombstones.some((stone) => under(folder, stone as string))) return { outcome: "refused", reason: "tombstoned" };
  const root = git === null ? folder : (mainCheckout as string);
  /** Never an ancestor a folder joins: a root, home, an ancestor of home, a folder right under home. */
  const broad = (path: string) => isRoot(path) || under(home, path) || parentOf(path) === home;
  // AT-3: the nearest Project folder at or above the folder.
  let nearest = -1;
  let owners: Project[] = [];
  for (const project of projects) {
    for (const entry of project.folders) {
      if (!under(folder, entry.path) || broad(entry.path)) continue;
      if (entry.path.length > nearest) [nearest, owners] = [entry.path.length, [project]];
      else if (entry.path.length === nearest) owners.push(project);
    }
  }
  const byFolder = decide(owners, "folder");
  if (byFolder) return byFolder;
  if (tempRoots.some((temp) => under(folder, temp as string) || under(root, temp as string))) return { outcome: "refused", reason: "transient" };
  if (broad(root) || projects.some((project) => project.folders.some((entry) => entry.path !== root && under(entry.path, root)))) return { outcome: "refused", reason: "container" };
  if (git !== null) {
    const byCommon = decide(projects.filter((project) => project.folders.some((entry) => entry.commonDir === commonDir || entry.path === mainCheckout)), "worktree");
    if (byCommon) return byCommon;
    const repository = normalizeOrigin(origin);
    if (repository !== undefined) {
      const byRepository = decide(projects.filter((project) => project.folders.some((entry) => entry.repository === repository)), "repository");
      if (byRepository) return byRepository;
      const byOwner = decide(projects.filter((project) => project.sources.includes(ownerOf(repository))), "owner");
      if (byOwner) return byOwner;
    }
    if (inToolFolder(folder, home) || inToolFolder(root, home)) return { outcome: "refused", reason: "tool" };
    const worked = (record: (typeof records)[number]) => record.commonDir === commonDir || (repository !== undefined && record.repository === repository);
    const byWork = decide(projects.filter((project) => records.some((record) => record.project === project.id && worked(record))), "work");
    if (byWork) return byWork;
  } else if (inToolFolder(folder, home)) {
    return { outcome: "refused", reason: "tool" };
  }
  if (tombstones.some((stone) => under(root, stone as string))) return { outcome: "refused", reason: "tombstoned" };
  return { outcome: "new", root };
}

// ---- Rules -------------------------------------------------------------------------------------------------------

/**
 * FAC-SEM-121 (kind `folder-attribution`, `{snapshot, answer}`): an implementation's attribution equals
 * `attributeFolder`'s, row for row of the AT table.
 */
export function folderAttributionRules(kind: string, value: JsonObject): Finding[] | undefined {
  if (kind !== "folder-attribution") return undefined;
  const expected = attributeFolder(value.snapshot);
  if (jsonEqual(value.answer, expected)) return [];
  return [{ code: "FAC-SEM-121", instancePath: "/answer", message: `the attribution answers ${JSON.stringify(expected)} as attributeFolder does` }];
}
// #endregion folder-attribution

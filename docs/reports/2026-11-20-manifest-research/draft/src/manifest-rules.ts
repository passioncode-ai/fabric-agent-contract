import { type Finding, type JsonObject, isObject, show } from "../../../../../src/findings.js";
import { secretValue } from "../../../../../src/secret-shape.js";
import { hasHomePath } from "../../../../../src/activity-rules.js";

// Draft (not in the gate): docs/reports/2026-11-20-manifest-research/draft/manifest.md
const CODE = "FAC-SEM-187";
type Flag = (instancePath: string, message: string) => void;
const flagger = (findings: Finding[]): Flag => (instancePath, message) => findings.push({ code: CODE, instancePath, message });
const list = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

/** The nine articles of `fabric-manifest/1` (proposed), in order (MF-1). */
export const ARTICLES = ["M-1", "M-2", "M-3", "M-4", "M-5", "M-6", "M-7", "M-8", "M-9", "M-10", "M-11", "M-12"] as const;
export type Article = (typeof ARTICLES)[number];

/**
 * Which articles a kind may declare `not-applicable` (MF-2, the table "agent or project"): M-3 and M-12 for a project
 * with nothing running; M-6 for either kind, only with an empty `forks` list (checked apart).
 */
export const NOT_APPLICABLE: Readonly<Record<"agent" | "project", readonly Article[]>> = Object.freeze({
  agent: ["M-6"],
  project: ["M-3", "M-6", "M-12"],
});

/** The domain and role of a door name: `room.search` and `room_search` are the domain `room` and the role `search`. */
export function doorParts(name: string): { domain: string; role: string } | undefined {
  const at = /^(.*?)[._]?(search|execute)$/.exec(name);
  if (at === null) return undefined;
  return { domain: at[1] as string, role: at[2] as string };
}

/** Every string in a value with its JSON pointer, keys included as their own place. */
function strings(value: unknown, at = ""): Array<{ at: string; text: string }> {
  if (typeof value === "string") return [{ at: at || "/", text: value }];
  if (Array.isArray(value)) return value.flatMap((item, i) => strings(item, `${at}/${i}`));
  if (isObject(value)) return Object.entries(value).flatMap(([key, item]) => [{ at: `${at}/${key}`, text: key }, ...strings(item, `${at}/${key}`)]);
  return [];
}

/**
 * FAC-SEM-187 (proposed DEC-0190) on a `fabric-manifest/1` document (MF-2, MF-4 to MF-7):
 * - `met` names evidence; `owed` carries `owed` and no `reason`; `not-applicable` carries `reason`, no `owed`, and is
 *   allowed by NOT_APPLICABLE for the kind; `met` and `owed` carry no `reason`, and `met` no `owed`;
 * - M-6 is `not-applicable` only when `forks` is empty;
 * - the two doors are one domain's, one `search` and one `execute`; a direct tool is not one of the doors;
 * - an `agent` has `surface.mcp` and a non-empty `placement`; with M-3 `met` it names `health.tool` or `health.cli`;
 * - no string is shaped like a credential or holds a home folder, named by its place and never repeated.
 * Malformed input answers findings or none, never an exception.
 */
export function fabricManifestRules(value: JsonObject): Finding[] {
  const findings: Finding[] = [];
  const flag = flagger(findings);
  const kind = value.kind === "agent" || value.kind === "project" ? value.kind : undefined;
  const articles = isObject(value.articles) ? value.articles : {};
  const forks = list(value.forks);
  const surface = isObject(value.surface) ? value.surface : {};
  const health = isObject(value.health) ? value.health : {};
  for (const id of ARTICLES) {
    const article = articles[id];
    if (!isObject(article)) continue;
    const at = `/articles/${id}`;
    const status = article.status;
    if (status === "met" && list(article.evidence).length === 0) flag(`${at}/evidence`, `${id} is met: it names at least one evidence path`);
    if (status === "owed" && !isObject(article.owed)) flag(`${at}/owed`, `${id} is owed: it names the backlog row and the date (owed: {row, by})`);
    if (status !== "owed" && article.owed !== undefined) flag(`${at}/owed`, `${id} is ${show(status ?? "")}: owed belongs to an owed article only`);
    if (status === "not-applicable" && typeof article.reason !== "string") flag(`${at}/reason`, `${id} is not-applicable: it names its reason`);
    if (status !== "not-applicable" && article.reason !== undefined) flag(`${at}/reason`, `${id} is ${show(status ?? "")}: reason belongs to a not-applicable article only`);
    if (status === "not-applicable" && kind !== undefined && !NOT_APPLICABLE[kind].includes(id)) flag(`${at}/status`, `${id} applies to every ${kind}: declare it met, or owed with its row and date`);
    if (status === "not-applicable" && id === "M-6" && forks.length > 0) flag(`${at}/status`, "M-6 applies: the manifest lists foreign code in forks");
  }
  const mcp = surface.mcp;
  if (isObject(mcp)) {
    const doors = list(mcp.doors).filter((door): door is string => typeof door === "string");
    if (doors.length === 2) {
      const parts = doors.map(doorParts);
      const roles = parts.map((part) => part?.role).sort();
      if (parts.some((part) => part === undefined) || roles[0] !== "execute" || roles[1] !== "search") flag("/surface/mcp/doors", "the two doors are one search and one execute");
      else if (parts[0]?.domain !== parts[1]?.domain) flag("/surface/mcp/doors", `the two doors are one domain's: ${show(parts[0]?.domain ?? "")} and ${show(parts[1]?.domain ?? "")} differ`);
    }
    list(mcp.direct).forEach((tool, i) => {
      if (isObject(tool) && typeof tool.name === "string" && doors.includes(tool.name)) flag(`/surface/mcp/direct/${i}/name`, "a direct tool is served beside the doors, not as one of them");
    });
  }
  const statusOf = (id: Article) => (isObject(articles[id]) ? (articles[id] as JsonObject).status : undefined);
  if (kind === "agent" && !isObject(mcp)) flag("/surface/mcp", "every agent is MCP: name its two doors (M-1, MF-4)");
  if (kind === "agent" && list(value.placement).length === 0) flag("/placement", "an agent runs somewhere: local, cloud or both (M-1, MF-5)");
  if (kind === "agent" && statusOf("M-3") === "met" && typeof health.tool !== "string" && typeof health.cli !== "string") flag("/health", "an agent that meets M-3 names where agent-health/1 is answered (tool or cli)");
  for (const { at, text } of strings(value)) {
    if (secretValue(text)) flag(at, "this place holds a value shaped like a credential: name its slot in secrets instead (M-5)");
    else if (hasHomePath(text)) flag(at, "this place holds a home folder: paths are relative to the repository root (MF-3)");
  }
  return findings;
}

/** Every path a `fabric-manifest/1` document names, with its JSON pointer: what the folder check looks for (MF-3). */
export function manifestPaths(value: JsonObject): Array<{ at: string; path: string }> {
  const paths: Array<{ at: string; path: string }> = [];
  const add = (at: string, path: unknown) => {
    if (typeof path === "string") paths.push({ at, path });
  };
  add("/rendered", value.rendered);
  add("/decisions", value.decisions);
  if (isObject(value.surface)) add("/surface/inventory", value.surface.inventory);
  if (isObject(value.articles)) {
    for (const id of ARTICLES) {
      const article = value.articles[id];
      if (isObject(article)) list(article.evidence).forEach((path, i) => add(`/articles/${id}/evidence/${i}`, path));
    }
  }
  list(value.forks).forEach((fork, i) => {
    if (!isObject(fork)) return;
    if (fork.path !== ".") add(`/forks/${i}/path`, fork.path);
    add(`/forks/${i}/changes`, fork.changes);
  });
  return paths;
}

/** The heading the rendered text holds for an article: `## M-1.` and so on, at the start of a line. */
const heading = (id: Article) => new RegExp(`^##\\s+${id.replace("-", "\\-")}\\.`, "m");

/**
 * FAC-SEM-187 (proposed DEC-0190) on a folder, as `{manifest, present, rendered}`: the document's own rules; every path it
 * names is among `present` (a path ending in `/` as a folder, the others as written); `rendered`, the text of the
 * rendered file or null when it is absent, names `fabric-manifest/1` and holds a heading for each article.
 */
export function fabricManifestTreeRules(value: JsonObject): Finding[] {
  const findings: Finding[] = [];
  const flag = flagger(findings);
  const manifest = isObject(value.manifest) ? value.manifest : undefined;
  if (manifest === undefined) {
    flag("/manifest", "the folder's fabric.manifest.json is a JSON object");
    return findings;
  }
  findings.push(...fabricManifestRules(manifest).map((finding) => ({ ...finding, instancePath: `/manifest${finding.instancePath}` })));
  const present = new Set(list(value.present).filter((path): path is string => typeof path === "string").map((path) => path.replace(/\/$/, "")));
  for (const { at, path } of manifestPaths(manifest)) {
    if (!present.has(path.replace(/\/$/, ""))) flag(`/manifest${at}`, `${show(path)} is not in the folder`);
  }
  const rendered = value.rendered;
  if (typeof rendered === "string") {
    if (!rendered.includes("fabric-manifest/1")) flag("/rendered", "the rendered manifest names fabric-manifest/1");
    for (const id of ARTICLES) if (!heading(id).test(rendered)) flag("/rendered", `the rendered manifest has no heading for ${id}`);
  }
  return findings;
}

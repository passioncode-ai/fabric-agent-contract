import { type Finding, type JsonObject, isObject } from "./findings.js";
import { credentialName, rawValues, secretValue } from "./secret-shape.js";

// #region page-link-rules — docs: docs/specification/service.md#page-links
/**
 * Links that hand a person one of a service's pages (DEC-0123, PL-1…PL-4). The primary action is Fabric Dashboards'
 * `open_link`, `fabric-dashboards://service/<id>.<instance>`, with `?path=<path>` naming one page of it (FL-7); a raw
 * local address is a diagnostic, never the action. The grammar is Fabric Dashboards' (its ADR-0005, `serviceLink`):
 * this module builds what that builds and reads the service form it reads, one trailing slash included.
 */

/** A service id and an instance, as `service-common.schema.json` defines them. */
export const SERVICE_ID = /^[a-z][a-z0-9-]{1,62}$/;
export const INSTANCE = /^[a-z][a-z0-9-]{0,31}$/;
/** A path on the service origin, as `service-common.schema.json` `originPath` writes it: no whitespace. */
export const ORIGIN_PATH = /^\/(?!\/)\S*$/;
/**
 * What the host's `safePath` refuses anywhere in a path: a backslash (a WHATWG resolver reads `/\\evil.example` as
 * `http://evil.example/`) and a C0 or DEL control character.
 */
const HOST_REFUSED = /[\\\u0000-\u001f\u007f]/;
/**
 * The host's limit on a path. The link around it is bounded only to keep a reader's work finite, above the longest
 * link a 2048-character path encodes to (up to 9 characters per path character, plus the key).
 */
export const MAX_PAGE_PATH_LENGTH = 2048;
export const MAX_PAGE_LINK_LENGTH = 20_000;
const BASE = "http://origin.invalid";

export type DashboardsLink = { service: string; instance: string; path?: string };
export type ParsedDashboardsLink = ({ ok: true } & DashboardsLink) | { ok: false; problems: string[] };

/**
 * The open_link for the service `service.instance`: its dashboard without `path`, or the page at `path` on its origin,
 * encoded as Fabric Dashboards' `serviceLink` encodes it. Refuses what the grammar refuses.
 */
export function dashboardsLink(service: string, instance: string, path?: string): string {
  const problems = linkProblems(service, instance, path);
  if (problems.length) throw new Error(problems.join("; "));
  const base = `fabric-dashboards://service/${service}.${instance}`;
  return path === undefined || path === "" ? base : `${base}?${new URLSearchParams({ path }).toString()}`;
}

const SHAPE = /^fabric-dashboards:\/\/service\/([^/?#]+)\/?(?:\?([^#]*))?$/;

/** Read an open_link: the service key (`id.instance`) and, when it names a page, one `path` on the service origin. */
export function parseDashboardsLink(url: string): ParsedDashboardsLink {
  if (url.length > MAX_PAGE_LINK_LENGTH) return { ok: false, problems: [`an open_link is at most ${MAX_PAGE_LINK_LENGTH} characters`] };
  // The scheme and the host's verb are read without regard to case, as the host reads them.
  const link = url.replace(/^fabric-dashboards:\/\/service\//i, "fabric-dashboards://service/");
  const match = SHAPE.exec(link);
  if (!match) return { ok: false, problems: ["not fabric-dashboards://service/<id>.<instance>[?path=<path>]"] };
  const key = match[1] as string;
  const dot = key.indexOf(".");
  const service = dot < 0 ? key : key.slice(0, dot);
  const instance = dot < 0 ? "" : key.slice(dot + 1);
  if (!match[2]) {
    const problems = linkProblems(service, instance);
    return problems.length ? { ok: false, problems } : { ok: true, service, instance };
  }
  // The parameters as the host's URL parser reads them: a second `?` stays part of a name, and the query is
  // percent-encoded before it is decoded.
  const query = new URL(link).searchParams;
  const paths = query.getAll("path");
  if (paths.length !== 1) return { ok: false, problems: [paths.length ? "path is given more than once" : "an open_link names its path"] };
  if ([...query.keys()].some((name) => name !== "path")) return { ok: false, problems: ["an open_link carries its path and nothing else"] };
  const path = paths[0] as string;
  if (path === "") return { ok: false, problems: ["the path is empty; a link to the dashboard itself names no path"] };
  const problems = linkProblems(service, instance, path);
  return problems.length ? { ok: false, problems } : { ok: true, service, instance, path };
}

function linkProblems(service: string, instance: string, path?: string): string[] {
  const problems: string[] = [];
  if (!SERVICE_ID.test(service)) problems.push("the service is not a service id");
  if (!INSTANCE.test(instance)) problems.push("the instance is not an instance name");
  if (path === undefined || path === "") return problems;
  if (path.length > MAX_PAGE_PATH_LENGTH) problems.push(`the path is at most ${MAX_PAGE_PATH_LENGTH} characters`);
  else if (!ORIGIN_PATH.test(path) || HOST_REFUSED.test(path) || new URL(path, BASE).origin !== BASE) problems.push("the path is not a path on the service origin");
  else if (pathCarriesCredential(path)) problems.push("the path could carry a token or a login code; signing in is the host's");
  return problems;
}

/** A login-code route, or a query or fragment piece that could carry a credential (FL-7: a link carries none). */
function pathCarriesCredential(path: string): boolean {
  // The route as the service resolves it: dot segments and letter case do not hide it.
  if (/^\/fabric\/+v1\/+login(?:\/|$)/i.test(new URL(path, BASE).pathname)) return true;
  // The query and the fragment, a hash route's own query (`#/jobs?token=`) included, as pieces of one query.
  const rest = path.replace(/^[^?#]*/, "").replace(/^[?#]/, "").replace(/[#?]/g, "&");
  if (!rest) return false;
  const pieces = [...new URLSearchParams(rest)];
  const raw = [...rawValues(rest).values()].flat();
  return secretValue(rest) || raw.some(secretValue) || pieces.some(([name, value]) => (value !== "" && credentialName(name)) || secretValue(value));
}

/**
 * The hosts that only this computer reaches, as WHATWG URL writes them (a numeric or IPv4-mapped form is normalised
 * first): 127.0.0.0/8, `[::1]`, `[::ffff:127.x.y.z]`, `localhost` and names under it, and the unspecified addresses
 * `0.0.0.0` and `[::]` a wildcard bind reports. A page there is the host's to show, through its open_link.
 */
const LOOPBACK = /^(?:127(?:\.\d{1,3}){3}|0\.0\.0\.0|\[::1?\]|\[::ffff:7f[0-9a-f]{2}:[0-9a-f]{1,4}\]|localhost|[a-z0-9.-]+\.localhost)$/i;

/** True for an `http` or `https` address on a loopback host: a local service's raw address. */
export function isLoopbackPageUrl(url: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  return (parsed.protocol === "http:" || parsed.protocol === "https:") && LOOPBACK.test(parsed.hostname.replace(/\.$/, ""));
}

/** FAC-SEM-143 for one link a document hands a person: a raw loopback address, or an open_link outside its grammar. */
export function pageLinkFindings(url: unknown, instancePath: string, label: string): Finding[] {
  if (typeof url !== "string") return [];
  if (isLoopbackPageUrl(url)) return [{ code: "FAC-SEM-143", instancePath, message: `${label} hands a person a raw local address; give Fabric Dashboards' open_link (DEC-0123 PL-1)` }];
  // Only what a URL parser strips around a URL: C0 controls and space.
  const bare = url.replace(/^[\u0000-\u0020]+|[\u0000-\u0020]+$/g, "");
  // Recognised behind any whitespace, read as the URL parser would see it: a no-break space before it stays and fails.
  if (/^\s*fabric-dashboards:/i.test(url)) {
    const parsed = parseDashboardsLink(bare);
    if (!parsed.ok) return [{ code: "FAC-SEM-143", instancePath, message: `${label} is not an open_link: ${parsed.problems.join("; ")} (DEC-0123 PL-1)` }];
  }
  return [];
}

/** FAC-SEM-143 on an input request in URL mode (kind `interop-input-requests`): its `url` is a link a person opens. */
export function inputRequestLinkFindings(value: JsonObject): Finding[] {
  const requests = isObject(value.inputRequests) ? value.inputRequests : {};
  return Object.entries(requests).flatMap(([key, request]) => {
    const params = isObject(request) && isObject(request.params) ? request.params : {};
    return params.mode === "url" ? pageLinkFindings(params.url, `/inputRequests/${key}/params/url`, `input request ${key}`) : [];
  });
}

/** Kind `page-link` (`{url}`): a link a service, its tools or its messages hand a person, such as a tool answer's `open_link`. */
export function pageLinkRules(kind: string, value: JsonObject): Finding[] | undefined {
  if (kind !== "page-link") return undefined;
  return pageLinkFindings(value.url, "/url", "the link");
}
// #endregion page-link-rules

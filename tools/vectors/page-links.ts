/**
 * The generator of the page-link vectors (DEC-0123): `fixtures/vectors/page-links.json`, shared by every service and
 * kit that hands a person a service's page and every checker that reads one.
 *
 *   tsx tools/vectors/page-links.ts --check   compare the committed file with what this writes (exit 1 on a difference)
 *   tsx tools/vectors/page-links.ts --write   write it
 *
 * Every vector change is made here and written by `--write`, never by hand. Each expected answer is written below by
 * hand from DEC-0123; nothing here imports `src/page-link-rules.ts`, so the gate checks that the reference agrees.
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { projectRoot } from "../../src/contract.js";

type Json = Record<string, any>;
export const VECTOR_FILE = "fixtures/vectors/page-links.json";

/** dashboardsLink(service, instance, path): the open_link, or null where the grammar refuses the input; a null path is none. */
const builds: Array<[string, [string, string, string | null], string | null]> = [
  ["the dashboard itself, no path", ["example-agent", "default", null], "fabric-dashboards://service/example-agent.default"],
  ["the dashboard's root", ["example-agent", "default", "/dashboard"], "fabric-dashboards://service/example-agent.default?path=%2Fdashboard"],
  ["a job page with a query", ["example-agent", "default", "/dashboard/job_1?tab=log"], "fabric-dashboards://service/example-agent.default?path=%2Fdashboard%2Fjob_1%3Ftab%3Dlog"],
  ["another instance", ["example-agent", "work", "/"], "fabric-dashboards://service/example-agent.work?path=%2F"],
  ["a service id with an upper-case letter", ["Example-Agent", "default", "/dashboard"], null],
  ["a missing instance", ["example-agent", "", "/dashboard"], null],
  ["a full URL instead of a path", ["example-agent", "default", "http://127.0.0.1:4100/dashboard"], null],
  ["a path that starts with two slashes", ["example-agent", "default", "//evil.example/x"], null],
  ["the login-code route", ["example-agent", "default", "/fabric/v1/login?code=abcdefghijklmnop"], null],
  ["a token in the query", ["example-agent", "default", `/dashboard?token=${["sk", "-", "A1".repeat(12)].join("")}`], null],
  ["a backslash that a resolver reads as another host", ["example-agent", "default", "/\\evil.example/x"], null],
  ["the login-code route behind a dot segment", ["example-agent", "default", "/x/../fabric/v1/login"], null],
  ["the login-code route in other letter case", ["example-agent", "default", "/Fabric/v1/login"], null],
  ["a token in a hash route's own query", ["example-agent", "default", "/dashboard#/jobs?token=abc"], null],
  ["a backslash inside the path (the host's safePath refuses it anywhere)", ["example-agent", "default", "/a\\b"], null],
  ["a control character inside the path", ["example-agent", "default", "/a\u0001b"], null],
  ["a space in the path (the contract keeps originPath's no-whitespace, stricter than the host)", ["example-agent", "default", "/a b"], null],
  ["a hash route without a credential", ["example-agent", "default", "/dashboard#/jobs?tab=log"], "fabric-dashboards://service/example-agent.default?path=%2Fdashboard%23%2Fjobs%3Ftab%3Dlog"]
];

/** The kind `page-link` ({url}): the FAC-SEM-143 instance paths it reports. */
const links: Array<[string, string, string[]]> = [
  ["an open_link", "fabric-dashboards://service/example-agent.default?path=%2Fdashboard", []],
  ["the dashboard itself, no path (Fabric Dashboards' link tool)", "fabric-dashboards://service/example-agent.default", []],
  ["one trailing slash is the same link", "fabric-dashboards://service/example-agent.default/", []],
  ["the host's verb in upper case", "fabric-dashboards://SERVICE/example-agent.default?path=%2Fdashboard", []],
  ["an empty path", "fabric-dashboards://service/example-agent.default?path=", ["/url"]],
  ["a second question mark, which the host reads as part of the name", "fabric-dashboards://service/example-agent.default??path=%2Fdashboard", ["/url"]],
  ["a dot segment before the key (read as written, not as a URL parser normalises it)", "fabric-dashboards://service/./example-agent.default", ["/url"]],
  ["a no-break space before the link (not stripped, as a URL parser does not)", "\u00a0fabric-dashboards://service/example-agent.default", ["/url"]],
  ["a path parameter with no value", "fabric-dashboards://service/example-agent.default?path", ["/url"]],
  ["a backslash inside the path", "fabric-dashboards://service/example-agent.default?path=%2Fa%5Cb", ["/url"]],
  ["a control character inside the path", "fabric-dashboards://service/example-agent.default?path=%2Fa%01b", ["/url"]],
  ["a page after the key instead of in path", "fabric-dashboards://service/example-agent.default/dashboard", ["/url"]],
  ["the scheme in upper case", "FABRIC-DASHBOARDS://service/example-agent.default?path=%2Fdashboard", []],
  ["a remote service's https page", "https://agents.example/dashboard", []],
  ["another party's page (a payment step)", "https://pay.example/checkout/123", []],
  ["a raw loopback address", "http://127.0.0.1:4100/dashboard", ["/url"]],
  ["localhost", "http://localhost:4100/dashboard", ["/url"]],
  ["a name under localhost", "http://example-agent.localhost:4100/", ["/url"]],
  ["the IPv6 loopback", "http://[::1]:4100/dashboard", ["/url"]],
  ["https on a loopback host", "https://127.0.0.1:4443/dashboard", ["/url"]],
  ["another loopback address", "http://127.1.2.3/", ["/url"]],
  ["the IPv4-mapped loopback", "http://[::ffff:127.0.0.1]:4100/", ["/url"]],
  ["localhost with a trailing dot", "http://localhost.:4100/dashboard", ["/url"]],
  ["the unspecified IPv4 address of a wildcard bind", "http://0.0.0.0:4100/", ["/url"]],
  ["the unspecified IPv6 address of a wildcard bind", "http://[::]:4100/", ["/url"]],
  ["a raw loopback address with leading space", " http://127.0.0.1:4100/", ["/url"]],
  ["an open_link without its instance", "fabric-dashboards://service/example-agent?path=%2Fdashboard", ["/url"]],
  ["an open_link without its path", "fabric-dashboards://service/example-agent.default?tab=1", ["/url"]],
  ["an open_link with two paths", "fabric-dashboards://service/example-agent.default?path=%2Fa&path=%2Fb", ["/url"]],
  ["an open_link to the login-code route", "fabric-dashboards://service/example-agent.default?path=%2Ffabric%2Fv1%2Flogin%3Fcode%3Dabcdefghijklmnop", ["/url"]],
  ["an open_link of another form", "fabric-dashboards://open?service=example-agent.default", ["/url"]],
  ["an open_link with a second parameter", "fabric-dashboards://service/example-agent.default?path=%2Fdashboard&code=abcdefghijklmnop", ["/url"]],
  ["an open_link with an unknown parameter", "fabric-dashboards://service/example-agent.default?path=%2F&x=1", ["/url"]],
  ["an open_link whose path leaves the origin by a backslash", "fabric-dashboards://service/example-agent.default?path=%2F%5Cevil.example", ["/url"]],
  ["a malformed open_link with leading space", " fabric-dashboards://service/Bad?path=x", ["/url"]],
  ["not a URL", "dashboard", []]
];

/** The kind `interop-input-requests`: an input request in URL mode is a link a person opens. */
const requests: Array<[string, Json, string[]]> = [
  ["URL mode on the service's own page, as its open_link", { approve: { method: "elicitation/create", params: { mode: "url", message: "Approve the draft", url: "fabric-dashboards://service/example-agent.default?path=%2Fdashboard%2Fdrafts%2F7" } } }, []],
  ["URL mode on another party's sign-in page", { connect: { method: "elicitation/create", params: { mode: "url", message: "Sign in to the store", url: "https://store.example/connect" } } }, []],
  ["URL mode on a raw loopback address", { approve: { method: "elicitation/create", params: { mode: "url", message: "Approve the draft", url: "http://127.0.0.1:4100/dashboard/drafts/7" } } }, ["/inputRequests/approve/params/url"]],
  ["form mode carries no link", { pick: { method: "elicitation/create", params: { message: "Pick one", requestedSchema: { type: "object", properties: { choice: { type: "string" } } } } } }, []]
];

export function pageLinkVectors(): Json {
  return {
    about: "Vectors for links that hand a person a service's page (DEC-0123, PL-1 to PL-4), written by tools/vectors/page-links.ts, never by hand. The grammar is Fabric Dashboards' (its ADR-0005): `builds`: dashboardsLink(service, instance, path) answers the open_link fabric-dashboards://service/<id>.<instance>, with ?path=<path> encoded as URLSearchParams encodes it when a page is named (a null path names none: the dashboard itself), or null where it refuses the input (an id or instance outside its grammar, a value that is not a path on the service origin, a backslash a resolver reads as another host included, the login-code route however its dot segments or letter case hide it, a query or fragment, a hash route's own query included, that could carry a credential). `links`: the kind page-link ({url}) answers FAC-SEM-143 at /url for a raw http or https address on a local host as WHATWG URL writes it (127.0.0.0/8, [::1], [::ffff:127.x.y.z], localhost and names under it, a trailing dot ignored, and the unspecified 0.0.0.0 and [::] of a wildcard bind) and for a fabric-dashboards: link outside that grammar, which carries no parameter but one non-empty path, nothing after the key but one slash, and a path the host's safePath accepts (no backslash or control character anywhere, at most 2048 characters) with no whitespace (originPath, stricter than the host), read as written rather than as a URL parser normalises it (a dot segment, an empty port or user part, a tab, an empty fragment are refused); its parameters are read as the host's URL parser reads them (a second ? stays part of the name); any other https address passes. `requests`: the kind interop-input-requests answers FAC-SEM-143 at a URL-mode request's url by the same rule.",
    builds: builds.map(([name, [service, instance, page], expected]) => ({ name, input: { service, instance, path: page }, expected })),
    links: links.map(([name, url, expected]) => ({ name, input: { url }, expected })),
    requests: requests.map(([name, inputRequests, expected]) => ({ name, input: { inputRequests }, expected }))
  };
}

export function buildPageLinkVectors(): string {
  return `${JSON.stringify(pageLinkVectors(), null, 2)}\n`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const target = path.join(projectRoot(), VECTOR_FILE);
  const built = buildPageLinkVectors();
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

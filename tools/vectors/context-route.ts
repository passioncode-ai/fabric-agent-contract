/**
 * The generator of the context-routing vectors (DEC-0082): `fixtures/vectors/context-route.json`.
 *
 *   tsx tools/vectors/context-route.ts --check   compare the committed file with what this writes (exit 1 on a difference)
 *   tsx tools/vectors/context-route.ts --write   write it
 *
 * Every vector change is made here and written by `--write`, never by hand; `test/context-route.test.ts` runs the check.
 * Each case's expected answer is written below by hand from the decision (DEC-0082 item 5), and the context-id cases
 * from `common.schema.json#/$defs/contextId`. Nothing here imports `src/context-route.ts`: the gate then checks that the
 * reference returns what this file expects, and that the schema accepts exactly the contexts this file calls valid.
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { projectRoot } from "../../src/contract.js";

type Json = Record<string, any>;
export const VECTOR_FILE = "fixtures/vectors/context-route.json";

const none = (reason: string) => ({ route: "none", reason });
const to = (org: string, index: number) => ({ route: "enrollment", org, index });

/** The vectors as an object: the contexts, then where an event or a check-in of a session in each goes. */
export function contextRouteVectors(): Json {
  const A = "org_7kq2m4xw", B = "org_3fh9p1zc";
  const both = [{ org: A }, { org: B }];
  const max = "o".repeat(128), over = "o".repeat(129);

  // The context ids: valid exactly as common.schema.json#/$defs/contextId says.
  const contexts: Array<[string, unknown, boolean]> = [
    ["personal", "personal", true],
    ["an organization's id as the first organization server issues it", `org:${A}`, true],
    ["a one-character id (the lower bound)", "org:a", true],
    ["a 128-character id (the upper bound)", `org:${max}`, true],
    ["an id of digits, underscores and hyphens", "org:_-0_9-", true],
    ["an organization whose id is the word personal is an organization, not the personal context", "org:personal", true],
    ["an empty id", "org:", false],
    ["a 129-character id", `org:${over}`, false],
    ["Personal, capitalized", "Personal", false],
    ["PERSONAL", "PERSONAL", false],
    ["personal with a trailing newline", "personal\n", false],
    ["personal with a leading space", " personal", false],
    ["an organization's context with a trailing newline", `org:${A}\n`, false],
    ["ORG: in capitals", `ORG:${A}`, false],
    ["no colon", `org${A}`, false],
    ["a dot in the id", "org:org.example", false],
    ["a colon in the id", "org:a:b", false],
    ["a space in the id", "org:org 1", false],
    ["a non-ASCII letter in the id", "org:orgé", false],
    ["a bare organization id without the prefix", A, false],
    ["the empty string", "", false],
    ["null", null, false],
    ["a number", 7, false],
    ["a boolean", true, false],
    ["an array holding a context", [`org:${A}`], false],
    ["an object", { context: `org:${A}` }, false]
  ];

  const cases: Json[] = [
    { name: "an organization's session goes to that organization's enrollment", session: `org:${A}`, enrollments: both, answer: to(A, 0) },
    { name: "the second organization's session goes to the second enrollment", session: `org:${B}`, enrollments: both, answer: to(B, 1) },
    { name: "a one-character id routes when enrolled", session: "org:a", enrollments: [{ org: "a" }], answer: to("a", 0) },
    { name: "a 128-character id routes when enrolled", session: `org:${max}`, enrollments: [{ org: max }], answer: to(max, 0) },
    { name: "an enrollment may carry other members; only org is read", session: `org:${A}`, enrollments: [{ org: A, serial: "aa01", origin: "https://org.example" }], answer: to(A, 0) },
    { name: "personal never goes to an organization server", session: "personal", enrollments: both, answer: none("personal") },
    { name: "personal never goes to an organization server, with no enrollment", session: "personal", enrollments: [], answer: none("personal") },
    { name: "lax: personal never goes to an organization whose id is personal", session: "personal", enrollments: [{ org: "personal" }], answer: none("personal") },
    { name: "an organization whose id is personal is routed like any other", session: "org:personal", enrollments: [{ org: "personal" }], answer: to("personal", 0) },
    { name: "a session of an organization the device is not enrolled in goes nowhere", session: "org:org_unenrolled", enrollments: both, answer: none("not-enrolled") },
    { name: "a session of an organization goes nowhere with no enrollment", session: `org:${A}`, enrollments: [], answer: none("not-enrolled") },
    { name: "lax: org ids compare as written; ORG_7KQ2M4XW is not org_7kq2m4xw", session: `org:${A.toUpperCase()}`, enrollments: both, answer: none("not-enrolled") },
    { name: "lax: org ids compare as written; an enrollment spelled in capitals is another organization", session: `org:${A}`, enrollments: [{ org: A.toUpperCase() }], answer: none("not-enrolled") },
    { name: "lax: never by prefix; a session's id that is a prefix of an enrolled id", session: "org:org_7kq2", enrollments: both, answer: none("not-enrolled") },
    { name: "lax: never by prefix; an enrolled id that is a prefix of the session's id", session: `org:${A}x`, enrollments: [{ org: A.slice(0, -1) }, { org: A.slice(0, 4) }], answer: none("not-enrolled") },
    { name: "lax: an enrollment with surrounding space is another id", session: `org:${A}`, enrollments: [{ org: ` ${A}` }, { org: `${A} ` }], answer: none("not-enrolled") },
    { name: "lax: an enrollment that names the whole context (org: prefix) is another id", session: `org:${A}`, enrollments: [{ org: `org:${A}` }], answer: none("not-enrolled") },
    { name: "lax: an empty id is no context, even with an empty enrollment", session: "org:", enrollments: [{ org: "" }], answer: none("not-a-context") },
    { name: "lax: a 129-character id is no context, even when enrolled", session: `org:${over}`, enrollments: [{ org: over }], answer: none("not-a-context") },
    { name: "lax: Personal is no context, and goes nowhere", session: "Personal", enrollments: both, answer: none("not-a-context") },
    { name: "lax: personal with a trailing newline is no context", session: "personal\n", enrollments: both, answer: none("not-a-context") },
    { name: "lax: an organization's context with a trailing newline is no context, even when enrolled", session: `org:${A}\n`, enrollments: [{ org: A }, { org: `${A}\n` }], answer: none("not-a-context") },
    { name: "lax: ORG: in capitals is no context", session: `ORG:${A}`, enrollments: both, answer: none("not-a-context") },
    { name: "lax: a bare organization id is no context, even when it is enrolled", session: A, enrollments: both, answer: none("not-a-context") },
    { name: "lax: a dot in the id is no context, even when an enrollment has that id", session: "org:org.example", enrollments: [{ org: "org.example" }], answer: none("not-a-context") },
    { name: "an enrollment whose org.id is outside orgId's set (org.example) cannot be routed: no context names it, so an organization server taking part in contexts issues ids of [A-Za-z0-9_-]{1,128}", session: "org:org_example", enrollments: [{ org: "org.example" }], answer: none("not-enrolled") },
    { name: "non-string: null is no context", session: null, enrollments: both, answer: none("not-a-context") },
    { name: "non-string: a number is no context", session: 7, enrollments: [{ org: "7" }], answer: none("not-a-context") },
    { name: "non-string: a boolean is no context", session: true, enrollments: both, answer: none("not-a-context") },
    { name: "non-string: an array holding a context is no context", session: [`org:${A}`], enrollments: both, answer: none("not-a-context") },
    { name: "non-string: an object is no context", session: { context: `org:${A}` }, enrollments: both, answer: none("not-a-context") },
    { name: "two enrollments in one organization are ambiguous; the event goes to neither", session: `org:${A}`, enrollments: [{ org: A }, { org: B }, { org: A }], answer: none("ambiguous") },
    { name: "malformed enrollments: null", session: `org:${A}`, enrollments: null, answer: none("not-enrolled") },
    { name: "malformed enrollments: one object, not a list", session: `org:${A}`, enrollments: { org: A }, answer: none("not-enrolled") },
    { name: "malformed enrollments: a string", session: `org:${A}`, enrollments: A, answer: none("not-enrolled") },
    { name: "malformed enrollments: entries that are not objects with a string org are skipped", session: `org:${A}`, enrollments: [null, 7, A, [A], { org: 7 }, { org: [A] }, { org: { id: A } }, { id: A }], answer: none("not-enrolled") },
    { name: "malformed entries are skipped, and the index still counts them", session: `org:${A}`, enrollments: [null, A, { org: [A] }, { org: A }], answer: to(A, 3) },
    { name: "lax: an org only inherited through __proto__ is not the entry's own", session: `org:${A}`, enrollments: JSON.parse(`[{"__proto__": {"org": "${A}"}}]`), answer: none("not-enrolled") },
    { name: "lax: an organization whose id is constructor reads no prototype member", session: "org:constructor", enrollments: [{}, { org: "toString" }], answer: none("not-enrolled") },
    { name: "an organization whose id is constructor is routed like any other", session: "org:constructor", enrollments: [{ org: "constructor" }], answer: to("constructor", 0) }
  ];

  // grant.usage events: routed by the grant's own context (routeGrantUsage); grantContext absent = the grant states none.
  const grantUsage: Json[] = [
    { name: "a grant into an organization: its usage goes to that organization's enrollment", grantContext: `org:${B}`, enrollments: both, answer: to(B, 1) },
    { name: "a grant that states no context produces no grant.usage toward any organization", enrollments: both, answer: none("no-context") },
    { name: "a personal grant produces no grant.usage toward any organization", grantContext: "personal", enrollments: both, answer: none("personal") },
    { name: "a grant into an organization the device is not enrolled in: nowhere", grantContext: "org:org_unenrolled", enrollments: both, answer: none("not-enrolled") },
    { name: "lax: the grant's context compares as written; a case-folded one is not enrolled", grantContext: `org:${A.toUpperCase()}`, enrollments: both, answer: none("not-enrolled") },
    { name: "lax: a grant's context of null is not absent; it is no context", grantContext: null, enrollments: both, answer: none("not-a-context") },
    { name: "lax: a grant's context Personal is no context", grantContext: "Personal", enrollments: both, answer: none("not-a-context") },
    { name: "lax: a grant's empty organization id is no context", grantContext: "org:", enrollments: [{ org: "" }], answer: none("not-a-context") },
    { name: "two enrollments in the grant's organization are ambiguous", grantContext: `org:${A}`, enrollments: [{ org: A }, { org: A }], answer: none("ambiguous") }
  ];

  return {
    about: "Vectors for routing by context (DEC-0082, docs/specification/contexts.md#routing). A context is personal or org:<orgId>, orgId 1-128 of [A-Za-z0-9_-], compared as written. contexts: each value and whether it is a context (common.schema.json#/$defs/contextId agrees). cases: routeTarget(session, enrollments) answers where a collector may send an event or a check-in of a session in that context: {route: enrollment, org, index} for the one enrollment whose org is exactly the context's id, else {route: none, reason} with reason personal (always, for a personal session), not-a-context, not-enrolled or ambiguous. Each enrollment is the org.id the device enrolled with (DEC-0031); an entry that is not an object with an own string org is skipped. Malformed input answers none and never throws. grantUsage: routeGrantUsage(grantContext, enrollments) answers where a grant.usage event goes: as routeTarget with the grant's own context, and {route: none, reason: no-context} when the grant states none (grantContext absent). The lax cases are what a careless port gets wrong.",
    contexts: contexts.map(([name, value, valid]) => ({ name, value, valid })),
    cases,
    grantUsage
  };
}

/** What `--write` writes: the vector file's exact text. */
export function buildContextRouteVectors(): string {
  return `${JSON.stringify(contextRouteVectors(), null, 2)}\n`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const target = path.join(projectRoot(), VECTOR_FILE);
  const built = buildContextRouteVectors();
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

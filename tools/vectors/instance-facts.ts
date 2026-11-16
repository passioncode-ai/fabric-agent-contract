/**
 * Vectors for extensions/instance-facts/0.1 (DEC-0173): what a host reads of an instance's facts from its descriptor and
 * its well-known document (`instanceFacts`, IF-5), and what FAC-SEM-180 reports on the pair (IF-6). Every value is
 * synthetic. Run with `--write` to regenerate; `vectors:check` compares the committed file with this generator.
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { projectRoot } from "../../src/contract.js";
import { EXTENSION_KEYS } from "../../src/extensions.js";
import { instanceFacts, instanceFactsRules } from "../../src/instance-facts.js";

type Json = Record<string, any>;
export const VECTOR_FILE = "fixtures/vectors/instance-facts.json";
const KEY = EXTENSION_KEYS.instanceFacts;

const local = (extra: Json = {}): Json => ({ protocol: "fabric-service/0.1", id: "notes", instance: "default", origin: "http://127.0.0.1:47910", ...extra });
const remote = (extra: Json = {}): Json => ({ protocol: "fabric-service/0.1", id: "research", instance: "default", placement: "remote", origin: "https://research.example", ...extra });
const PEER = { peer: { endpoint: "https://notes.example/mcp", custody: "personal", residency: "eu", maxDataClass: "internal" }, runner: { credentialKind: "key" } };
const facts = (value: Json) => ({ extensions: { [KEY]: value } });
const wellKnown = (value?: Json, login?: boolean): Json => ({
  ...(value === undefined ? {} : facts(value)),
  ...(login === undefined ? {} : { surfaces: { dashboard: { path: "/dashboard", login }, events: { path: "/events" } } })
});

function cases(): Array<[string, Json | null, Json | null]> {
  return [
    ["nothing declared in either document", local(), wellKnown()],
    ["a local operator's instance: its own facts in the descriptor", local(facts({ access: { audience: "operator", entry: "own-signin" }, tenancy: { mode: "single" }, space: { kind: "user", account: "agents-1" } })), wellKnown()],
    ["an empty access object declares nothing", local(facts({ access: {} })), null],
    ["the well-known document wins field by field; the descriptor's entry stands where the well-known declares no entry", local(facts({ access: { audience: "operator", entry: "none" }, tenancy: { mode: "single" } })), wellKnown({ access: { audience: "operator" } })],
    ["a dashboard that requires a host's login code reads host-signin whatever is declared", local(facts({ access: { entry: "own-signin" } })), wellKnown(undefined, true)],
    ["a dashboard that takes no host's code refuses host-signin and keeps own-signin", local(facts({ access: { entry: "host-signin" } })), wellKnown({ access: { entry: "own-signin" } }, false)],
    ["organization beside peer: an agent shared into an organization's context", local({ ...PEER, ...facts({ access: { audience: "organization" }, tenancy: { mode: "single" } }) }), wellKnown()],
    ["organization on a local placement without peer is refused", local(facts({ access: { audience: "organization" } })), wellKnown()],
    ["operator beside peer is refused", local({ ...PEER, ...facts({ access: { audience: "operator" } }) }), wellKnown()],
    ["a service offered to others that no grant reaches yet leaves audience out", local({ ...PEER, ...facts({ tenancy: { mode: "single" } }) }), wellKnown()],
    ["a remote service others call with their own keys: public, shared, system", remote(facts({ access: { audience: "public", entry: "own-signin" }, tenancy: { mode: "shared" }, space: { kind: "system" } })), wellKnown(undefined, false)],
    ["a remote service only an organization's members reach with their own keys: organization without peer", remote(facts({ access: { audience: "organization" }, tenancy: { mode: "per-organization" } })), wellKnown()],
    ["public on a local placement is refused", local(facts({ access: { audience: "public" } })), wellKnown()],
    ["public beside a subscription runner is refused", remote({ runner: { credentialKind: "subscription" }, ...facts({ access: { audience: "public" } }) }), wellKnown()],
    ["shared on a local placement is refused", local(facts({ tenancy: { mode: "shared" } })), wellKnown()],
    ["system on a local placement is refused", local(facts({ space: { kind: "system" } })), wellKnown()],
    ["a container behind its own account's forwarder", local(facts({ space: { kind: "container" } })), wellKnown()],
    ["a local well-known document's account label is refused; the descriptor's stands", local(facts({ space: { kind: "user", account: "agents-1" } })), wellKnown({ space: { kind: "user", account: "agents-2" } })],
    ["a remote well-known document may carry the label", remote(), wellKnown({ space: { kind: "system", account: "eu-pool-3" } })],
    ["a label shaped like a credential is refused", local(facts({ space: { kind: "user", account: ["ghp", "_", "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8"].join("") } })), null],
    ["a value that fails the schema: none of that document's facts is read", local(facts({ access: { audience: "everyone" } })), wellKnown({ tenancy: { mode: "single" } })],
    ["a well-known document read alone: no clause on peer or placement applies", null, wellKnown({ access: { audience: "organization" }, tenancy: { mode: "shared" }, space: { kind: "system", account: "agents-2" } })],
    ["a descriptor read alone: no clause on the dashboard applies", local(facts({ access: { entry: "host-signin" } })), null],
    ["a tenancy without its mode fails the schema: none of that document's facts is read", local(facts({ access: { audience: "operator" }, tenancy: {} })), wellKnown()],
    ["a remote descriptor may carry the label", remote(facts({ space: { kind: "system", account: "eu-pool-3" } })), wellKnown()],
    ["a dashboard login beside a well-known extension that fails its schema and no other fact declares nothing", local(), wellKnown({ access: { audience: "everyone" } }, true)],
    ["a remote container", remote(facts({ space: { kind: "container" } })), wellKnown()],
    ["a dashboard that requires a host's login code alone declares nothing", local(), wellKnown(undefined, true)],
    ["a dashboard login names the entry of a service that declares another fact", local(facts({ tenancy: { mode: "single" } })), wellKnown(undefined, true)],
    ["the well-known document's value wins over a differing descriptor value", remote(facts({ access: { audience: "organization" }, space: { kind: "vm" } })), wellKnown({ access: { audience: "public" } })],
    ["a well-known audience the local descriptor's setting refuses: the descriptor's own value is read", local(facts({ access: { audience: "operator" } })), wellKnown({ access: { audience: "organization" } })],
    ["a local virtual machine", local(facts({ space: { kind: "vm", account: "vm-1" } })), wellKnown()],
    ["a well-known document that answers as another service gives nothing; the descriptor is read alone", local(facts({ access: { entry: "own-signin" } })), { ...wellKnown({ access: { audience: "public" } }, true), service: { id: "other", instance: "default" } }],
    ["a dashboard login beside a well-known extension that fails its schema and a declared descriptor fact reads host-signin", local(facts({ tenancy: { mode: "single" } })), wellKnown({ access: { audience: "everyone" } }, true)],
    ["a credential-shaped label in a local well-known document: each reading reports its own problem", local(), wellKnown({ space: { kind: "user", account: ["ghp", "_", "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8"].join("") } })]
  ];
}

/** Every well-known document answers as its case's descriptor (FAC-SEM-009 reads the pair as one service), unless it names its own service. */
function paired(descriptor: Json | null, wk: Json | null): Json | null {
  if (wk === null || Object.hasOwn(wk, "service")) return wk;
  const of = descriptor ?? local();
  return { service: { id: of.id, instance: of.instance }, ...wk };
}

export function instanceFactsVectors(): Json {
  return {
    about: "Vectors for extensions/instance-facts/0.1 (DEC-0173), written by tools/vectors/instance-facts.ts, never by hand. Each case gives a descriptor and a well-known document (null: not read). Every well-known document answers as its descriptor's service (FAC-SEM-009 reads the pair as one) unless the case names another. `read` is instanceFacts(descriptor, wellKnown): the five facts, field by field, the well-known document first; a refused value is never read, the field then read from the other document; a dashboard that requires a host's login code reads host-signin for a service that declares any fact. `findings` are FAC-SEM-180's as code and path, per kind: `descriptor` (kind service-descriptor), `wellKnown` (service-well-known) and `pair` (service-observation, `{descriptor, wellKnown}`, only what neither document alone shows), null where a document is not given.",
    key: KEY,
    cases: cases().map(([name, descriptor, given]) => {
      const wk = paired(descriptor, given);
      const codes = (kind: string, input: Json) => instanceFactsRules(kind, input).map((finding) => `${finding.code} ${finding.instancePath}`);
      return {
        name,
        descriptor,
        wellKnown: wk,
        read: instanceFacts(descriptor ?? undefined, wk ?? undefined),
        findings: {
          descriptor: descriptor === null ? null : codes("service-descriptor", descriptor),
          wellKnown: wk === null ? null : codes("service-well-known", wk),
          pair: descriptor === null || wk === null ? null : codes("service-observation", { descriptor, wellKnown: wk })
        }
      };
    })
  };
}

export function buildInstanceFactsVectors(): string {
  return `${JSON.stringify(instanceFactsVectors(), null, 2)}\n`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const target = path.join(projectRoot(), VECTOR_FILE);
  const built = buildInstanceFactsVectors();
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
